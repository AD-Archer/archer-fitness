import crypto from "crypto"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

const TOKEN_BYTES = 32
const TOKEN_EXPIRATION_MINUTES = 60

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function createPasswordResetToken(userId: string) {
  const rawToken = crypto.randomBytes(TOKEN_BYTES).toString("hex")
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MINUTES * 60 * 1000)

  await prisma.passwordResetToken.deleteMany({
    where: { userId }
  })

  await prisma.passwordResetToken.create({
    data: {
      userId,
      token: tokenHash,
      expiresAt,
    },
  })

  return { token: rawToken, expiresAt }
}

export async function verifyPasswordResetToken(rawToken: string) {
  const tokenHash = hashToken(rawToken)

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: tokenHash },
    include: { user: true },
  })

  if (!record) {
    return null
  }

  if (record.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token: tokenHash } })
    return null
  }

  return record
}

export async function consumePasswordResetToken(rawToken: string, newPassword: string) {
  const record = await verifyPasswordResetToken(rawToken)

  if (!record) {
    return null
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        password: hashedPassword,
      },
    }),
    prisma.passwordResetToken.delete({ where: { token: record.token } }),
  ])

  return record.user
}
