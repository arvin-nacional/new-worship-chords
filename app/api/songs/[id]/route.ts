import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import Song from "@/models/Song"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await dbConnect()

    const song = await Song.findById(id)
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name')

    if (!song) {
      return NextResponse.json(
        { error: "Song not found" },
        { status: 404 }
      )
    }

    // Increment view count
    song.viewCount += 1
    await song.save()

    return NextResponse.json({ song })
  } catch (error) {
    console.error("Error fetching song:", error)
    return NextResponse.json(
      { error: "Failed to fetch song" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    await dbConnect()

    const song = await Song.findById(id)

    if (!song) {
      return NextResponse.json(
        { error: "Song not found" },
        { status: 404 }
      )
    }

    // Check if user is the creator
    if (song.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only edit your own songs" },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Update song fields
    const updatedSong = await Song.findByIdAndUpdate(
      id,
      {
        title: body.title,
        artist: body.artist,
        writer: body.writer,
        originalKey: body.originalKey,
        tempo: body.tempo,
        timeSignature: body.timeSignature,
        capo: body.capo,
        difficulty: body.difficulty,
        lyricsText: body.lyricsText,
        videoId: body.videoId,
        spotifyId: body.spotifyId,
        imageUrl: body.imageUrl,
        tags: body.tags,
      },
      { 
        new: true, // Return the updated document
        runValidators: true // Run schema validators
      }
    )

    return NextResponse.json({ 
      song: updatedSong,
      message: "Song updated successfully" 
    })
  } catch (error) {
    console.error("Error updating song:", error)
    return NextResponse.json(
      { error: "Failed to update song" },
      { status: 500 }
    )
  }
}