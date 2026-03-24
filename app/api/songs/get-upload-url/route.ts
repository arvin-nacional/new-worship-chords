import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getPresignedUploadUrl } from "@/lib/s3"
import dbConnect from "@/lib/mongoose"
import Song from "@/models/Song"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { songId, fileName, contentType, trackType } = await req.json()

    if (!songId || !fileName || !contentType || !trackType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    await dbConnect()
    const song = await Song.findById(songId)

    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 })
    }

    if (song.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const sanitizedTitle = song.title.replace(/[^a-z0-9]/gi, "_")
    const finalFileName = `${sanitizedTitle}-${trackType}.${fileName.split('.').pop()}`

    const { uploadUrl, fileUrl } = await getPresignedUploadUrl(
      finalFileName,
      contentType,
      trackType
    )

    return NextResponse.json({
      success: true,
      uploadUrl,
      fileUrl,
    })
  } catch (error) {
    console.error("Get upload URL error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get upload URL" },
      { status: 500 }
    )
  }
}
