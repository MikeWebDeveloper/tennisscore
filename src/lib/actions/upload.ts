"use server"

import { ID } from "node-appwrite"
import { createAdminClient } from "@/lib/appwrite-server"
import { getCurrentUser } from "@/lib/auth"

export async function uploadProfilePicture(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  const file = formData.get("file") as File
  if (!file) {
    return { error: "No file provided" }
  }

  // Basic validation for file type and size
  if (!file.type.startsWith("image/")) {
    return { error: "Invalid file type. Please upload an image." }
  }

  const MAX_SIZE_MB = 10
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return { error: `File size cannot exceed ${MAX_SIZE_MB}MB.` }
  }

  // Log and check the bucket ID env var
  const bucketId = process.env.APPWRITE_PROFILE_PICTURES_BUCKET_ID
  console.log("[UPLOAD] APPWRITE_PROFILE_PICTURES_BUCKET_ID:", bucketId)
  if (!bucketId) {
    throw new Error("Missing APPWRITE_PROFILE_PICTURES_BUCKET_ID environment variable on server.")
  }

  const { storage } = await createAdminClient()

  try {
    const uploadedFile = await storage.createFile(
      bucketId,
      ID.unique(),
      file
    )

    return { success: true, fileId: uploadedFile.$id }
  } catch (error) {
    console.error("Error uploading file:", error)
    return { error: "Failed to upload file. Please try again." }
  }
} 