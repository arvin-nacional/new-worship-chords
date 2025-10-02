import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Replicate from "replicate"
import { uploadToS3 } from "@/lib/s3"
import dbConnect from "@/lib/mongoose"
import Song from "@/models/Song"

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { songId } = await req.json()

    if (!songId) {
      return NextResponse.json({ error: "Song ID is required" }, { status: 400 })
    }

    await dbConnect()
    const song = await Song.findById(songId)

    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 })
    }

    if (!song.videoId) {
      return NextResponse.json(
        { error: "Song must have a YouTube video" },
        { status: 400 }
      )
    }

    // Check if vocals already extracted
    if (song.vocalsUrl) {
      return NextResponse.json({
        success: true,
        vocalsUrl: song.vocalsUrl,
        message: "Vocals already extracted",
      })
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${String(song.videoId)}`

    // Use Replicate to extract vocals
    console.log("Extracting vocals with Replicate...")
    const output = await replicate.run(
      "ryan5453/demucs:5a7041cc9b82e5a558fea6b3d7b12dea89625e89da33f0447bd727c2d0ab9e77",
      {
        input: {
          audio: youtubeUrl, // Can accept YouTube URL directly
        },
      }
    ) as unknown

    // Demucs returns an object with stems: { vocals: "url", bass: "url", drums: "url", other: "url" }
    if (!output || typeof output !== "object" || !("vocals" in output)) {
      console.error("Unexpected output format:", output)
      throw new Error("Replicate returned unexpected output format")
    }

    const vocalsFileUrl = (output as { vocals: string }).vocals

    // Download and upload to your S3
    const response = await fetch(vocalsFileUrl)
    const buffer = Buffer.from(await response.arrayBuffer())
    
    const s3Url = await uploadToS3(
      buffer,
      `${song.title.replace(/[^a-z0-9]/gi, "_")}-vocals.wav`,
      "audio/wav"
    )

    // Update song with vocals URL
    song.vocalsUrl = s3Url
    await song.save()

    return NextResponse.json({
      success: true,
      vocalsUrl: s3Url,
      message: "Vocals extracted and uploaded successfully",
    })
  } catch (error) {
    console.error("Vocal extraction error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to extract vocals",
      },
      { status: 500 }
    )
  }
}