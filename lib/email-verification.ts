import crypto from "crypto"
import { prisma } from "@/lib/prisma"

const TOKEN_BYTES = 32
const TOKEN_EXPIRATION_MINUTES = 60

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

function generateVerificationCode(): string {
  // Generate a 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createEmailVerificationToken(userId: string, email: string) {
  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("hex")
  const tokenHash = hashToken(rawToken)
  const code = generateVerificationCode()
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MINUTES * 60 * 1000)

  // Delete any existing verification tokens for this user and email
  await prisma.emailVerificationToken.deleteMany({
    where: { 
      userId,
      email 
    }
  })

  // Create new verification token
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      email,
      token: tokenHash,
      code,
      expiresAt,
    },
  })

  return { token: rawToken, code, expiresAt }
}

export async function verifyEmailWithToken(rawToken: string) {
  const tokenHash = hashToken(rawToken)

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token: tokenHash },
    include: { user: true },
  })

  if (!record) {
    return { success: false, error: "Invalid verification link" }
  }

  if (record.expiresAt < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { token: tokenHash } })
    return { success: false, error: "Verification link has expired" }
  }

  if (record.verifiedAt) {
    return { success: false, error: "This email has already been verified" }
  }

  // Mark as verified
  await prisma.emailVerificationToken.update({
    where: { token: tokenHash },
    data: { verifiedAt: new Date() }
  })

  // Update user's email and mark as verified
  await prisma.user.update({
    where: { id: record.userId },
    data: {
      email: record.email,
      emailVerified: new Date(),
    },
  })

  return { success: true, email: record.email }
}

export async function verifyEmailWithCode(userId: string, code: string) {
  // Find the most recent non-expired, non-verified token for this user with matching code
  const record = await prisma.emailVerificationToken.findFirst({
    where: {
      userId,
      code,
      expiresAt: { gt: new Date() },
      verifiedAt: null,
    },
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  })

  if (!record) {
    return { success: false, error: "Invalid or expired verification code" }
  }

  // Mark as verified
  await prisma.emailVerificationToken.update({
    where: { id: record.id },
    data: { verifiedAt: new Date() }
  })

  // Update user's email and mark as verified
  await prisma.user.update({
    where: { id: record.userId },
    data: {
      email: record.email,
      emailVerified: new Date(),
    },
  })

  return { success: true, email: record.email }
}

export async function resendVerificationEmail(userId: string) {
  // Find the most recent pending verification
  const existingToken = await prisma.emailVerificationToken.findFirst({
    where: {
      userId,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!existingToken) {
    return { success: false, error: "No pending verification found" }
  }

  // Check if we can reuse the existing token (not too old)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  if (existingToken.createdAt > fiveMinutesAgo) {
    return { 
      success: false, 
      error: "Please wait a few minutes before requesting another verification email" 
    }
  }

  // Create a new verification token
  const { token, code, expiresAt } = await createEmailVerificationToken(userId, existingToken.email)

  return { 
    success: true, 
    email: existingToken.email,
    token,
    code,
    expiresAt
  }
}

export async function getPendingVerification(userId: string) {
  const record = await prisma.emailVerificationToken.findFirst({
    where: {
      userId,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) {
    return null
  }

  return {
    email: record.email,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt,
  }
}
