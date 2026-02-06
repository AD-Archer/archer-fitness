import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as OTPAuth from "otpauth";
import { z } from "zod";

const verifySchema = z.object({
  code: z.string().min(6).max(6),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code } = verifySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: "Two-factor authentication not setup" },
        { status: 400 },
      );
    }

    // Create TOTP instance
    const totp = new OTPAuth.TOTP({
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
    });

    // Verify the code
    const delta = totp.validate({ token: code, window: 1 });

    if (delta === null) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication enabled successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid code format", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 },
    );
  }
}
