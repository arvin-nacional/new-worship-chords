"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface YouTubeVideoProps {
  videoId: string
}

// Extract YouTube video ID from various URL formats or return the ID if it's already just an ID
function extractVideoId(input: string): string {
  // If it's already just a video ID (11 characters), return it
  if (input.length === 11 && !input.includes('/') && !input.includes('?')) {
    return input
  }

  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ]

  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  // If no pattern matches, return the input as-is
  return input
}

export function YouTubeVideo({ videoId }: YouTubeVideoProps) {
  const extractedId = extractVideoId(videoId)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Video</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src={`https://www.youtube.com/embed/${extractedId}`}
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </CardContent>
    </Card>
  )
}