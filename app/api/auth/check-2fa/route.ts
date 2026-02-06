import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const checkSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = checkSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        password: true,
        twoFactorEnabled: true,
      },
    });

    if (!user || !user.password) {
      // Don't reveal if user exists
      return NextResponse.json({
        requiresTwoFactor: false,
        credentialsValid: false,
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({
        requiresTwoFactor: false,
        credentialsValid: false,
      });
    }

    return NextResponse.json({
      requiresTwoFactor: user.twoFactorEnabled,
      credentialsValid: true,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to check credentials" },
      { status: 500 },
    );
  }
}
