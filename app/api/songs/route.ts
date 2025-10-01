import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose";
import Song from "@/models/Song"
import { addSongSchema } from "@/lib/validations/song"

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = addSongSchema.parse(body)

    // Connect to database
    await dbConnect()

    // Create new song
    const song = await Song.create({
      ...validatedData,
      createdBy: session.user.id,
      ratings: [],
      favorites: [],
      comments: [],
      viewCount: 0,
    })

    return NextResponse.json(
      { 
        success: true, 
        song: {
          _id: song._id,
          title: song.title,
          artist: song.artist,
          writer: song.writer,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating song:", error)

    // Handle validation errors
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid song data", details: error },
        { status: 400 }
      )
    }

    // Handle duplicate title errors
    if (error instanceof Error && error.message.includes("duplicate")) {
      return NextResponse.json(
        { error: "A song with this title already exists" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create song. Please try again." },
      { status: 500 }
    )
  }
}
export async function GET(request: Request) {
    try {
      await dbConnect()
  
      const { searchParams } = new URL(request.url)
      const search = searchParams.get('search')
      const key = searchParams.get('key')
      const difficulty = searchParams.get('difficulty')
      const sort = searchParams.get('sort') || '-createdAt'
      const limit = parseInt(searchParams.get('limit') || '20')
      const page = parseInt(searchParams.get('page') || '1')
  
      // Build query
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const query: any = {}
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { artist: { $regex: search, $options: 'i' } },
          { writer: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      }
      
      if (key) query.originalKey = key
      if (difficulty) query.difficulty = difficulty
  
      // Get total count
      const total = await Song.countDocuments(query)
  
      // Get songs with pagination
      const songs = await Song.find(query)
        .sort(sort)
        .limit(limit)
        .skip((page - 1) * limit)
        .populate('createdBy', 'name email')
        .select('-comments') // Exclude comments from listing
        .lean()
  
      return NextResponse.json({
        songs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error("Error fetching songs:", error)
      return NextResponse.json(
        { error: "Failed to fetch songs" },
        { status: 500 }
      )
    }
  }