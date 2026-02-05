import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { unlink } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Find the progress photo
    const photo = await prisma.progressPhoto.findUnique({
      where: { id: params.id },
    })

    if (!photo) {
      return NextResponse.json(
        { error: "Photo not found" },
        { status: 404 }
      )
    }

    // Check if the photo belongs to the user
    if (photo.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Delete the file from storage
    try {
      const filename = photo.imageUrl.split("/").pop()
      const filepath = join(
        process.cwd(),
        "public",
        "uploads",
        "progress-photos",
        filename || ""
      )

      if (existsSync(filepath)) {
        await unlink(filepath)
      }
    } catch (err) {
      console.error("Error deleting file from storage:", err)
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await prisma.progressPhoto.delete({
      where: { id: params.id },
    })

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting progress photo:", error)
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    )
  }
}
