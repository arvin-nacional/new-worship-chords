import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongoose"
import Song from "@/models/Song"
import { deleteFromS3 } from "@/lib/s3"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { songId, trackType } = await request.json()

    if (!songId || !trackType) {
      return NextResponse.json(
        { error: "Missing songId or trackType" },
        { status: 400 }
      )
    }

    const validTrackTypes = ["vocals", "instrumental", "drums", "guitar", "bass", "piano", "others"]
    if (!validTrackTypes.includes(trackType)) {
      return NextResponse.json(
        { error: "Invalid track type" },
        { status: 400 }
      )
    }

    await dbConnect()

    const song = await Song.findById(songId)
    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 })
    }

    // Get the file URL and delete based on track type
    let fileUrl: string | undefined
    switch (trackType) {
      case "vocals":
        fileUrl = song.vocalsUrl
        if (fileUrl) song.vocalsUrl = undefined
        break
      case "instrumental":
        fileUrl = song.instrumentalUrl
        if (fileUrl) song.instrumentalUrl = undefined
        break
      case "drums":
        fileUrl = song.drumsUrl
        if (fileUrl) song.drumsUrl = undefined
        break
      case "guitar":
        fileUrl = song.guitarUrl
        if (fileUrl) song.guitarUrl = undefined
        break
      case "bass":
        fileUrl = song.bassUrl
        if (fileUrl) song.bassUrl = undefined
        break
      case "piano":
        fileUrl = song.pianoUrl
        if (fileUrl) song.pianoUrl = undefined
        break
      case "others":
        fileUrl = song.othersUrl
        if (fileUrl) song.othersUrl = undefined
        break
      default:
        return NextResponse.json({ error: "Invalid track type" }, { status: 400 })
    }

    if (!fileUrl) {
      return NextResponse.json(
        { error: "No track found to delete" },
        { status: 400 }
      )
    }

    // Delete from S3
    try {
      await deleteFromS3(fileUrl)
    } catch (s3Error) {
      console.error("Error deleting from S3:", s3Error)
      // Continue even if S3 delete fails - we still want to remove the reference
    }

    // Save the song with the URL removed
    await song.save()

    return NextResponse.json({
      success: true,
      message: `${trackType} track deleted successfully`,
    })
  } catch (error) {
    console.error("Error deleting track:", error)
    return NextResponse.json(
      { error: "Failed to delete track" },
      { status: 500 }
    )
  }
}
