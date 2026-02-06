import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import {
  isAppwriteConfigured,
  uploadProgressPhotoToAppwrite,
} from "@/lib/appwrite";
import { logger } from "@/lib/logger";
// @ts-ignore
import heicConvert from "heic-convert";
import { encryptPhotoBuffer } from "@/lib/photo-encryption";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const notes = formData.get("notes") as string;
    const uploadDate = (formData.get("uploadDate") as string) || "";
    const bodyPartsValue = formData.get("bodyParts") as string | null;
    let bodyParts: string[] = [];
    if (bodyPartsValue) {
      try {
        const parsed = JSON.parse(bodyPartsValue);
        if (Array.isArray(parsed)) {
          bodyParts = parsed;
        }
      } catch {
        bodyParts = [];
      }
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    // Sanitize filename to prevent path traversal attacks
    const safeName = path.basename(file.name).replace(/[^a-zA-Z0-9.-]/g, "_");
    let filename = `${user.id}-${timestamp}-${safeName}`;
    let publicUrl = "";
    let storageProvider: "local" | "appwrite" = "local";
    let storageFileId: string | null = null;
    let fileIv: string | null = null;
    let fileMimeType: string | null = file.type || null;

    const isHeic =
      file.type === "image/heic" ||
      file.type === "image/heif" ||
      /\.heic$/i.test(file.name) ||
      /\.heif$/i.test(file.name);

    let uploadBuffer = buffer;
    if (isHeic) {
      try {
        const converted = await heicConvert({
          buffer,
          format: "JPEG",
          quality: 0.82,
        });
        uploadBuffer = Buffer.from(converted);
        filename = filename.replace(/\.(heic|heif)$/i, ".jpg");
        fileMimeType = "image/jpeg";
      } catch (error) {
        logger.error("Failed to convert HEIC image", error);
        return NextResponse.json(
          { error: "Failed to convert HEIC image" },
          { status: 500 },
        );
      }
    }

    const encrypted = await encryptPhotoBuffer(uploadBuffer, user.id);
    uploadBuffer = encrypted.ciphertext;
    fileIv = encrypted.iv;

    if (isAppwriteConfigured()) {
      logger.info("Uploading progress photo to Appwrite", {
        filename,
        size: uploadBuffer.length,
        mime: file.type,
      });
      const uploaded = await uploadProgressPhotoToAppwrite({
        buffer: uploadBuffer,
        filename,
      });

      if (!uploaded?.fileId) {
        logger.error("Appwrite upload returned no fileId", {
          filename,
          size: uploadBuffer.length,
        });
        return NextResponse.json(
          { error: "Failed to upload photo to Appwrite", detail: "No fileId" },
          { status: 500 },
        );
      }

      publicUrl = "";
      storageProvider = "appwrite";
      storageFileId = uploaded.fileId;
    } else {
      logger.info("Uploading progress photo to local storage", {
        filename,
        size: uploadBuffer.length,
        mime: file.type,
      });
      // Create uploads directory if it doesn't exist
      const uploadsDir = join(
        process.cwd(),
        "public",
        "uploads",
        "progress-photos",
      );
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      const filepath = join(uploadsDir, filename);
      publicUrl = `/uploads/progress-photos/${filename}`;

      // Save file
      await writeFile(filepath, uploadBuffer);
    }

    logger.info("Saving progress photo metadata", {
      userId: user.id,
      storageProvider,
      storageFileId,
    });
    // Save to database
    const progressPhoto = await prisma.progressPhoto.create({
      data: {
        userId: user.id,
        imageUrl: publicUrl,
        storageProvider,
        storageFileId,
        notes: notes || null,
        bodyParts: Array.isArray(bodyParts) ? bodyParts : [],
        fileIv,
        fileMimeType,
        encryptionVersion: 1,
        uploadDate: uploadDate
          ? (() => {
              // If the value is a bare date like "2026-02-05" or "2026-02-05T12:00:00" (no Z/offset),
              // parse it as local server time so the calendar day is preserved.
              const isPlainDate =
                /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/.test(uploadDate);
              if (isPlainDate) {
                const [datePart] = uploadDate.split("T");
                const [y, m, d] = datePart.split("-").map(Number);
                return new Date(y, m - 1, d, 12, 0, 0, 0);
              }
              return new Date(uploadDate);
            })()
          : new Date(),
      },
    });

    logger.info("Progress photo saved", { id: progressPhoto.id });
    return NextResponse.json(
      {
        success: true,
        photo: {
          id: progressPhoto.id,
          url: progressPhoto.fileIv
            ? `/api/progress/photos/${progressPhoto.id}/view`
            : progressPhoto.storageProvider === "appwrite"
              ? `/api/progress/photos/${progressPhoto.id}/view`
              : progressPhoto.imageUrl,
          notes: progressPhoto.notes,
          bodyParts: progressPhoto.bodyParts,
          uploadDate: progressPhoto.uploadDate,
          createdAt: progressPhoto.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error("Failed to upload progress photo", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to upload photo", detail: message },
      { status: 500 },
    );
  }
}
