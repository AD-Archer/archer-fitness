import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";

const MASTER_KEY_B64 = process.env.PHOTO_ENCRYPTION_MASTER_KEY;
const MASTER_KEYS_B64 = process.env.PHOTO_ENCRYPTION_MASTER_KEYS;

const parseMasterKey = (b64: string): Buffer | null => {
  try {
    const key = Buffer.from(b64, "base64");
    return key.length === 32 ? key : null;
  } catch {
    return null;
  }
};

/**
 * Returns master keys in priority order.
 * - `PHOTO_ENCRYPTION_MASTER_KEYS` (comma-separated) takes precedence.
 * - Falls back to `PHOTO_ENCRYPTION_MASTER_KEY`.
 */
const getMasterKeys = (): Buffer[] => {
  const keys: Buffer[] = [];

  if (MASTER_KEYS_B64 && MASTER_KEYS_B64.trim().length > 0) {
    for (const part of MASTER_KEYS_B64.split(",")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const parsed = parseMasterKey(trimmed);
      if (parsed) keys.push(parsed);
    }
    return keys;
  }

  if (!MASTER_KEY_B64) return [];
  const parsed = parseMasterKey(MASTER_KEY_B64);
  return parsed ? [parsed] : [];
};

const encryptWithKey = (plaintext: Buffer, key: Buffer) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv,
    data: Buffer.concat([encrypted, tag]),
  };
};

const decryptWithKey = (ciphertext: Buffer, iv: Buffer, key: Buffer) => {
  const tag = ciphertext.subarray(ciphertext.length - 16);
  const data = ciphertext.subarray(0, ciphertext.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
};

export const getOrCreateUserPhotoKey = async (
  userId: string,
): Promise<Buffer> => {
  const masterKeys = getMasterKeys();
  if (masterKeys.length === 0) {
    throw new Error(
      "Photo encryption is not configured (missing/invalid PHOTO_ENCRYPTION_MASTER_KEY or PHOTO_ENCRYPTION_MASTER_KEYS)",
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      progressPhotoKeyEnc: true,
      progressPhotoKeyIv: true,
    },
  });

  if (user?.progressPhotoKeyEnc && user.progressPhotoKeyIv) {
    const wrapped = Buffer.from(user.progressPhotoKeyEnc, "base64");
    const iv = Buffer.from(user.progressPhotoKeyIv, "base64");
    let lastError: unknown = null;
    for (let i = 0; i < masterKeys.length; i++) {
      try {
        const rawKey = decryptWithKey(wrapped, iv, masterKeys[i]);

        // If we decrypted with a non-primary key, re-wrap with the primary key
        // to migrate forward (best-effort; does not block).
        if (i > 0) {
          try {
            const rewrapped = encryptWithKey(rawKey, masterKeys[0]);
            await prisma.user.update({
              where: { id: userId },
              data: {
                progressPhotoKeyEnc: rewrapped.data.toString("base64"),
                progressPhotoKeyIv: rewrapped.iv.toString("base64"),
              },
            });
            logger.info("Re-wrapped progress photo key with primary master key", {
              userId,
            });
          } catch (rewrapError) {
            logger.warn("Failed to re-wrap progress photo key (non-blocking)", {
              userId,
              rewrapError,
            });
          }
        }

        return rawKey;
      } catch (error) {
        lastError = error;
      }
    }

    logger.error("Failed to unwrap progress photo key", {
      userId,
      error: lastError,
    });
    throw new Error(
      "Unable to decrypt progress photo key. If you recently rotated PHOTO_ENCRYPTION_MASTER_KEY, set PHOTO_ENCRYPTION_MASTER_KEYS to include both the current and previous keys.",
    );
  }

  const rawKey = randomBytes(32);
  const wrapped = encryptWithKey(rawKey, masterKeys[0]);

  // Use atomic upsert to prevent race conditions
  const result = await prisma.user.updateMany({
    where: {
      id: userId,
      progressPhotoKeyEnc: null, // Only update if key doesn't exist
    },
    data: {
      progressPhotoKeyEnc: wrapped.data.toString("base64"),
      progressPhotoKeyIv: wrapped.iv.toString("base64"),
      progressPhotoKeyVersion: 1,
    },
  });

  // If the update didn't affect any rows, another request already created the key
  if (result.count === 0) {
    logger.info("Key already exists, fetching existing key", { userId });
    // Retry to get the existing key
    return getOrCreateUserPhotoKey(userId);
  }

  logger.info("Generated new progress photo key", { userId });
  return rawKey;
};

export const encryptPhotoBuffer = async (buffer: Buffer, userId: string) => {
  const key = await getOrCreateUserPhotoKey(userId);
  const encrypted = encryptWithKey(buffer, key);
  return {
    ciphertext: encrypted.data,
    iv: encrypted.iv.toString("base64"),
  };
};

export const decryptPhotoBuffer = async (
  buffer: Buffer,
  ivBase64: string,
  userId: string,
) => {
  const key = await getOrCreateUserPhotoKey(userId);
  const iv = Buffer.from(ivBase64, "base64");
  try {
    return decryptWithKey(buffer, iv, key);
  } catch (error) {
    logger.error("Failed to decrypt photo buffer", { userId, error });
    throw new Error("Unable to decrypt photo data");
  }
};
