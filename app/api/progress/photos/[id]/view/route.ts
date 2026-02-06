import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getAppwriteFileView } from "@/lib/appwrite";
import { logger } from "@/lib/logger";
import { decryptPhotoBuffer } from "@/lib/photo-encryption";
import { existsSync } from "fs";
import { join } from "path";
import { readFile } from "fs/promises";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const photo = await prisma.progressPhoto.findUnique({
      where: { id },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    if (photo.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (photo.storageProvider !== "appwrite" || !photo.storageFileId) {
      if (photo.storageProvider !== "local") {
        return NextResponse.json(
          { error: "Unsupported storage provider" },
          { status: 400 },
        );
      }
    }

    let fileBuffer: Buffer | null = null;
    let mimeType = photo.fileMimeType || "application/octet-stream";

    if (photo.storageProvider === "appwrite" && photo.storageFileId) {
      const file = await getAppwriteFileView(photo.storageFileId);
      if (!file) {
        return NextResponse.json(
          { error: "Failed to fetch file" },
          { status: 500 },
        );
      }
      fileBuffer = file.buffer;
      mimeType = file.mimeType || mimeType;
    }

    if (photo.storageProvider === "local") {
      const filename = photo.imageUrl.split("/").pop();
      const filepath = join(
        process.cwd(),
        "public",
        "uploads",
        "progress-photos",
        filename || "",
      );
      if (!filename || !existsSync(filepath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      fileBuffer = await readFile(filepath);
    }

    if (!fileBuffer) {
      return NextResponse.json(
        { error: "Failed to load file" },
        { status: 500 },
      );
    }

    if (photo.fileIv) {
      fileBuffer = await decryptPhotoBuffer(fileBuffer, photo.fileIv, user.id);
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    logger.error("Failed to serve progress photo view", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to load photo", detail: message },
      { status: 500 },
    );
  }
}
