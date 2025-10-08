import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose";
import Song from "@/models/Song"
import { addSongSchema } from "@/lib/validations/song"

// Helper function to escape regex metacharacters and prevent ReDoS
function sanitizeSearchInput(input: string): string {
  // Truncate to prevent overly long input (max 100 chars)
  const truncated = input.slice(0, 100)
  
  // Escape all regex metacharacters
  return truncated.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

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
     // Check if user is admin
    //  if (!session.user.isAdmin) {
    //   return NextResponse.json(
    //     { error: "Forbidden. Only administrators can add songs." },
    //     { status: 403 }
    //   )
    // }
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
        // Sanitize search input to prevent ReDoS attacks
        const sanitizedSearch = sanitizeSearchInput(search)
        
        try {
          // Safely create regex pattern
          const searchRegex = new RegExp(sanitizedSearch, 'i')
          
          query.$or = [
            { title: { $regex: sanitizedSearch, $options: 'i' } },
            { artist: { $regex: sanitizedSearch, $options: 'i' } },
            { writer: { $regex: sanitizedSearch, $options: 'i' } },
            { tags: { $in: [searchRegex] } }
          ]
        } catch (regexError) {
          // If regex creation fails, fall back to simple string matching
          console.warn('Invalid regex pattern, using fallback search:', regexError)
          query.$or = [
            { title: { $regex: sanitizedSearch, $options: 'i' } },
            { artist: { $regex: sanitizedSearch, $options: 'i' } },
            { writer: { $regex: sanitizedSearch, $options: 'i' } }
          ]
        }
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