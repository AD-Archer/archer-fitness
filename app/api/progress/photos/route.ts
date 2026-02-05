import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
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

    // Fetch all progress photos for the user, ordered by upload date descending
    const photos = await prisma.progressPhoto.findMany({
      where: { userId: user.id },
      orderBy: { uploadDate: "desc" },
      select: {
        id: true,
        imageUrl: true,
        notes: true,
        uploadDate: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        success: true,
        photos: photos.map((photo) => ({
          id: photo.id,
          url: photo.imageUrl,
          notes: photo.notes,
          uploadDate: photo.uploadDate,
          createdAt: photo.createdAt,
        })),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching progress photos:", error)
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    )
  }
}
