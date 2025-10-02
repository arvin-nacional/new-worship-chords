import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, artist } = await req.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Try Genius API first for metadata
    const geniusToken = process.env.GENIUS_API_TOKEN
    let geniusData = null

    if (geniusToken) {
      try {
        const searchQuery = artist ? `${title} ${artist}` : title
        const searchResponse = await fetch(
          `https://api.genius.com/search?q=${encodeURIComponent(searchQuery)}`,
          {
            headers: {
              Authorization: `Bearer ${geniusToken}`,
            },
          }
        )

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          if (searchData.response.hits.length > 0) {
            const hit = searchData.response.hits[0].result
            
            const songResponse = await fetch(
              `https://api.genius.com/songs/${hit.id}`,
              {
                headers: {
                  Authorization: `Bearer ${geniusToken}`,
                },
              }
            )

            if (songResponse.ok) {
              const songData = await songResponse.json()
              geniusData = songData.response.song
            }
          }
        }
      } catch (error) {
        console.error("Genius API error:", error)
        // Continue to lyrics.ovh fallback
      }
    }

    // Try lyrics.ovh for actual lyrics text
    let lyrics = null
    if (artist) {
      try {
        const ovhResponse = await fetch(
          `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
        )

        if (ovhResponse.ok) {
          const ovhData = await ovhResponse.json()
          lyrics = ovhData.lyrics
        }
      } catch (error) {
        console.error("Lyrics.ovh error:", error)
      }
    }

    // Return combined data
    if (geniusData || lyrics) {
      return NextResponse.json({
        success: true,
        title: geniusData?.title || title,
        artist: geniusData?.primary_artist?.name || artist,
        imageUrl: geniusData?.song_art_image_url,
        lyricsUrl: geniusData?.url,
        lyrics: lyrics,
        message: lyrics 
          ? "Lyrics fetched successfully!" 
          : "Song found on Genius. Please visit the link or add lyrics manually.",
      })
    }

    return NextResponse.json(
      { error: "Song not found. Please enter lyrics manually." },
      { status: 404 }
    )
  } catch (error) {
    console.error("Fetch lyrics error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch lyrics",
      },
      { status: 500 }
    )
  }
}