import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import dbConnect from "@/lib/mongoose"
import Song from "@/models/Song"

const validTrackTypes = ["vocals", "instrumental", "drums", "guitar", "bass", "piano", "others"]

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { songId, trackType, fileUrl } = await req.json()

    if (!songId || !trackType || !fileUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

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

    if (song.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update the appropriate URL field based on track type
    switch (trackType) {
      case "vocals":
        song.vocalsUrl = fileUrl
        break
      case "instrumental":
        song.instrumentalUrl = fileUrl
        break
      case "drums":
        song.drumsUrl = fileUrl
        break
      case "guitar":
        song.guitarUrl = fileUrl
        break
      case "bass":
        song.bassUrl = fileUrl
        break
      case "piano":
        song.pianoUrl = fileUrl
        break
      case "others":
        song.othersUrl = fileUrl
        break
    }
    await song.save()

    return NextResponse.json({
      success: true,
      message: `${trackType} track updated successfully`,
    })
  } catch (error) {
    console.error("Update track URL error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update track URL" },
      { status: 500 }
    )
  }
}
