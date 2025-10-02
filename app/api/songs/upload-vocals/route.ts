import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { uploadToS3 } from "@/lib/s3"
import dbConnect from "@/lib/mongoose"
import Song from "@/models/Song"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const songId = formData.get("songId") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!songId) {
      return NextResponse.json({ error: "Song ID is required" }, { status: 400 })
    }

    // Validate file type
    const validTypes = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/m4a"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload WAV, MP3, or M4A" },
        { status: 400 }
      )
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 50MB limit" },
        { status: 400 }
      )
    }

    await dbConnect()
    const song = await Song.findById(songId)

    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 })
    }

    // Check if user owns the song
    if (song.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to S3
    const fileExtension = file.name.split('.').pop() || 'wav'
    const s3Url = await uploadToS3(
      buffer,
      `${song.title.replace(/[^a-z0-9]/gi, "_")}-vocals.${fileExtension}`,
      file.type
    )

    // Update song with vocals URL
    song.vocalsUrl = s3Url
    await song.save()

    return NextResponse.json({
      success: true,
      vocalsUrl: s3Url,
      message: "Vocals uploaded successfully",
    })
  } catch (error) {
    console.error("Vocal upload error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload vocals",
      },
      { status: 500 }
    )
  }
}