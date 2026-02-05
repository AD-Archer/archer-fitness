import { randomBytes, createCipheriv, createDecipheriv } from "crypto"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

const MASTER_KEY_B64 = process.env.PHOTO_ENCRYPTION_MASTER_KEY

const getMasterKey = () => {
  if (!MASTER_KEY_B64) return null
  const key = Buffer.from(MASTER_KEY_B64, "base64")
  return key.length === 32 ? key : null
}

const encryptWithKey = (plaintext: Buffer, key: Buffer) => {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    iv,
    data: Buffer.concat([encrypted, tag]),
  }
}

const decryptWithKey = (ciphertext: Buffer, iv: Buffer, key: Buffer) => {
  const tag = ciphertext.subarray(ciphertext.length - 16)
  const data = ciphertext.subarray(0, ciphertext.length - 16)
  const decipher = createDecipheriv("aes-256-gcm", key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()])
}

export const getOrCreateUserPhotoKey = async (userId: string) => {
  const masterKey = getMasterKey()
  if (!masterKey) {
    throw new Error("PHOTO_ENCRYPTION_MASTER_KEY is missing or invalid")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      progressPhotoKeyEnc: true,
      progressPhotoKeyIv: true,
    },
  })

  if (user?.progressPhotoKeyEnc && user.progressPhotoKeyIv) {
    const wrapped = Buffer.from(user.progressPhotoKeyEnc, "base64")
    const iv = Buffer.from(user.progressPhotoKeyIv, "base64")
    const rawKey = decryptWithKey(wrapped, iv, masterKey)
    return rawKey
  }

  const rawKey = randomBytes(32)
  const wrapped = encryptWithKey(rawKey, masterKey)

  await prisma.user.update({
    where: { id: userId },
    data: {
      progressPhotoKeyEnc: wrapped.data.toString("base64"),
      progressPhotoKeyIv: wrapped.iv.toString("base64"),
      progressPhotoKeyVersion: 1,
    },
  })

  logger.info("Generated new progress photo key", { userId })
  return rawKey
}

export const encryptPhotoBuffer = async (buffer: Buffer, userId: string) => {
  const key = await getOrCreateUserPhotoKey(userId)
  const encrypted = encryptWithKey(buffer, key)
  return {
    ciphertext: encrypted.data,
    iv: encrypted.iv.toString("base64"),
  }
}

export const decryptPhotoBuffer = async (
  buffer: Buffer,
  ivBase64: string,
  userId: string,
) => {
  const key = await getOrCreateUserPhotoKey(userId)
  const iv = Buffer.from(ivBase64, "base64")
  return decryptWithKey(buffer, iv, key)
}
