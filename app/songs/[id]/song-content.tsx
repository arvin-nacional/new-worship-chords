"use client"

import { useState, useMemo } from "react"
import { ChordTransposer } from "@/components/chord-transposer"
import { MultiTrackPlayer } from "@/components/multi-track-player"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SongContentData {
    vocalsUrl?: string
    instrumentalUrl?: string
    drumsUrl?: string
    othersUrl?: string
    guitarUrl?: string
    bassUrl?: string
    pianoUrl?: string
    lyricsText?: string
    originalKey: string
}

interface SongContentProps {
    song: SongContentData
}

export function SongContent({ song }: SongContentProps) {
  const [transposeSemitones, setTransposeSemitones] = useState(0)

  const handleTransposeChange = (semitones: number) => {
    setTransposeSemitones(semitones)
  }

  // Build tracks array from available audio URLs
  const tracks = useMemo(() => {
    const availableTracks = []
    
    if (song.vocalsUrl) {
      availableTracks.push({
        id: 'vocals',
        name: 'Vocal',
        src: song.vocalsUrl,
        color: '#4ade80', // green
        icon: '🎤'
      })
    }
    
    if (song.instrumentalUrl) {
      availableTracks.push({
        id: 'instrumental',
        name: 'Instrumental',
        src: song.instrumentalUrl,
        color: '#a78bfa', // purple
        icon: '🎸'
      })
    }
    
    if (song.drumsUrl) {
      availableTracks.push({
        id: 'drums',
        name: 'Drum',
        src: song.drumsUrl,
        color: '#60a5fa', // blue
        icon: '🥁'
      })
    }
    
    if (song.othersUrl) {
      availableTracks.push({
        id: 'others',
        name: 'Others',
        src: song.othersUrl,
        color: '#9ca3af', // gray
        icon: '📁'
      })
    }

    if (song.guitarUrl) {
      availableTracks.push({
        id: 'guitar',
        name: 'Guitar',
        src: song.guitarUrl,
        color: '#fb923c', // orange
        icon: '🎸'
      })
    }

    if (song.bassUrl) {
      availableTracks.push({
        id: 'bass',
        name: 'Bass',
        src: song.bassUrl,
        color: '#22d3ee', // cyan
        icon: '🎸'
      })
    }

    if (song.pianoUrl) {
      availableTracks.push({
        id: 'piano',
        name: 'Piano',
        src: song.pianoUrl,
        color: '#6b7280', // gray
        icon: '🎹'
      })
    }
    
    return availableTracks
  }, [song.vocalsUrl, song.instrumentalUrl, song.drumsUrl, song.othersUrl, song.guitarUrl, song.bassUrl, song.pianoUrl])

  const hasAnyTracks = tracks.length > 0

  return (
    <div className="space-y-6">
      {/* Multi-Track Audio Player */}
      {hasAnyTracks && (
        <Card>
          <CardHeader>
            <CardTitle>� Audio Tracks</CardTitle>
          </CardHeader>
          <CardContent>
            <MultiTrackPlayer
              tracks={tracks}
              transposeSemitones={transposeSemitones}
            />
          </CardContent>
        </Card>
      )}

      {/* Lyrics and Chords */}
      {song.lyricsText && (
        <ChordTransposer
          lyricsText={song.lyricsText}
          originalKey={song.originalKey}
          onTransposeChange={handleTransposeChange}
        />
      )}
    </div>
  )
}