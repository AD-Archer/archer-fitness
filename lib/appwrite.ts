import { Client, ID, Storage } from "node-appwrite"
import { InputFile } from "node-appwrite/file"
import { logger } from "@/lib/logger"

const rawAppwriteEndpoint = process.env.APPWRITE_ENDPOINT
const appwriteProjectId = process.env.APPWRITE_PROJECT_ID
const appwriteApiKey = process.env.APPWRITE_API_KEY
const appwriteBucketId = process.env.APPWRITE_BUCKET_ID

const normalizeEndpoint = (endpoint?: string) => {
  if (!endpoint) return undefined
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint
  }
  return `https://${endpoint}`
}

const appwriteEndpoint = normalizeEndpoint(rawAppwriteEndpoint)

export const isAppwriteConfigured = () =>
  Boolean(
    appwriteEndpoint && appwriteProjectId && appwriteApiKey && appwriteBucketId,
  )

const getAppwriteStorage = () => {
  if (!isAppwriteConfigured()) return null

  const client = new Client()
    .setEndpoint(appwriteEndpoint as string)
    .setProject(appwriteProjectId as string)
    .setKey(appwriteApiKey as string)

  return new Storage(client)
}

export const uploadProgressPhotoToAppwrite = async ({
  buffer,
  filename,
}: {
  buffer: Buffer
  filename: string
}) => {
  const storage = getAppwriteStorage()
  if (!storage || !appwriteBucketId) return null

  try {
    const file = InputFile.fromBuffer(buffer, filename)
    const created = await storage.createFile(
      appwriteBucketId,
      ID.unique(),
      file,
    )

    return {
      fileId: created.$id,
    }
  } catch (error) {
    logger.error("Appwrite upload failed", error)
    return null
  }
}

export const getAppwriteFileView = async (fileId: string) => {
  const storage = getAppwriteStorage()
  if (!storage || !appwriteBucketId) return null

  try {
    const file = await storage.getFile(appwriteBucketId, fileId)
    const arrayBuffer = await storage.getFileView(appwriteBucketId, fileId)
    const buffer = Buffer.from(arrayBuffer)
    return {
      buffer,
      mimeType: file.mimeType || "application/octet-stream",
    }
  } catch (error) {
    logger.error("Failed to fetch Appwrite file view", error)
    return null
  }
}

export const deleteProgressPhotoFromAppwrite = async (fileId?: string) => {
  if (!fileId) return
  const storage = getAppwriteStorage()
  if (!storage || !appwriteBucketId) return

  try {
    await storage.deleteFile(appwriteBucketId, fileId)
  } catch (error) {
    logger.warn("Failed to delete Appwrite progress photo", { error, fileId })
  }
}
