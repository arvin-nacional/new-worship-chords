"use client"

import { useState, useCallback } from "react"
import { ChordTransposer } from "@/components/chord-transposer"
import { TransposableAudioPlayer } from "@/components/transposable-audio-player"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"

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
    const [isPlaying, setIsPlaying] = useState(false)

    const handleTransposeChange = (semitones: number) => {
        setTransposeSemitones(semitones)
    }

    const togglePlayPause = useCallback(() => {
        setIsPlaying(prev => !prev)
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex gap-4 mb-4">
                <Button onClick={togglePlayPause} className="gap-2">
                    {isPlaying ? (
                        <>
                            <Pause className="h-4 w-4" />
                            Pause All
                        </>
                    ) : (
                        <>
                            <Play className="h-4 w-4" />
                            Play All
                        </>
                    )}
                </Button>
            </div>

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
                            isPlaying={isPlaying}
                            onPlayPause={togglePlayPause}
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
                            isPlaying={isPlaying}
                            onPlayPause={togglePlayPause}
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