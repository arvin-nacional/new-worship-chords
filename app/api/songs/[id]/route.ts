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