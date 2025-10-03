"use client"

import { useState } from "react"
import { ChordTransposer } from "@/components/chord-transposer"
import { TransposableAudioPlayer } from "@/components/transposable-audio-player"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SongContentData {
    vocalsUrl?: string
    instrumentalUrl?: string
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

  return (
    <div className="space-y-6">
      {/* Vocals Audio Player */}
      {song.vocalsUrl && (
        <Card>
          <CardHeader>
            <CardTitle>🎤 Vocals Track</CardTitle>
          </CardHeader>
          <CardContent>
            <TransposableAudioPlayer
              src={song.vocalsUrl}
              title="Vocals"
              description="Isolated vocals audio track - Practice singing along!"
              transposeSemitones={transposeSemitones}
            />
          </CardContent>
        </Card>
      )}

      {/* Instrumental Audio Player */}
      {song.instrumentalUrl && (
        <Card>
          <CardHeader>
            <CardTitle>🎸 Instrumental Track</CardTitle>
          </CardHeader>
          <CardContent>
            <TransposableAudioPlayer
              src={song.instrumentalUrl}
              title="Instrumental"
              description="Instrumental track - Play along without vocals!"
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