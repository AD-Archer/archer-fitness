import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const notes = formData.get("notes") as string;
    const uploadDate = formData.get("uploadDate") as string;

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

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${user.id}-${timestamp}-${file.name}`;
    const filepath = join(uploadsDir, filename);
    const publicUrl = `/uploads/progress-photos/${filename}`;

    // Save file
    await writeFile(filepath, buffer);

    // Save to database
    const progressPhoto = await prisma.progressPhoto.create({
      data: {
        userId: user.id,
        imageUrl: publicUrl,
        notes: notes || null,
        uploadDate: new Date(uploadDate),
      },
    });

    return NextResponse.json(
      {
        success: true,
        photo: {
          id: progressPhoto.id,
          url: progressPhoto.imageUrl,
          notes: progressPhoto.notes,
          uploadDate: progressPhoto.uploadDate,
          createdAt: progressPhoto.createdAt,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 },
    );
  }
}
