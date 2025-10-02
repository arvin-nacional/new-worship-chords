import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"

if (!process.env.S3_REGION || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY || !process.env.S3_BUCKET) {
  throw new Error("Missing required S3 environment variables")
}

const s3Client = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
})

export async function uploadToS3(
  file: Buffer,
  fileName: string,
  contentType: string = "audio/wav"
): Promise<string> {
  const key = `vocals/${Date.now()}-${fileName}`

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file,
    ContentType: contentType,
    // Removed ACL: "public-read" - using bucket policy instead
  })

  await s3Client.send(command)

  // Return public URL
  return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`
}

export async function deleteFromS3(fileUrl: string): Promise<void> {
  try {
    // Extract key from URL
    const url = new URL(fileUrl)
    const key = url.pathname.substring(1) // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    })

    await s3Client.send(command)
  } catch (error) {
    console.error("Error deleting from S3:", error)
    throw error
  }
}

export { s3Client }