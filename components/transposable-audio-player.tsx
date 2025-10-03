"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Pause, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import * as Tone from "tone"

interface TransposableAudioPlayerProps {
  src: string
  title: string
  description: string
  transposeSemitones: number
}

export function TransposableAudioPlayer({
  src,
  title,
  description,
  transposeSemitones,
}: TransposableAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  
  const playerRef = useRef<Tone.Player | null>(null)
  const pitchShiftRef = useRef<Tone.PitchShift | null>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const startTimeRef = useRef<number>(0) // When playback started
  const offsetRef = useRef<number>(0) // Current playback offset in the audio

  const isSeekingRef = useRef<boolean>(false) // Track if we're currently seeking


  // Initialize Tone.js player
  useEffect(() => {
    const initPlayer = async () => {
      try {
        setIsLoading(true)
        
        // Create pitch shift effect
        pitchShiftRef.current = new Tone.PitchShift({
          pitch: transposeSemitones,
          windowSize: 0.1,
          delayTime: 0,
        }).toDestination()

        // Create player
        playerRef.current = new Tone.Player({
          url: src,
          onload: () => {
            if (playerRef.current) {
              setDuration(playerRef.current.buffer.duration)
            }
            setIsLoading(false)
          },
        }).connect(pitchShiftRef.current)

        // Handle when playback ends
      playerRef.current.onstop = () => {
        // Only change state if not seeking
        if (!isSeekingRef.current) {
          setIsPlaying(false)
        }
      }

      } catch (error) {
        console.error("Error initializing audio player:", error)
        setIsLoading(false)
      }
    }

    initPlayer()

    return () => {
      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      playerRef.current?.dispose()
      pitchShiftRef.current?.dispose()
    }
  }, [src])

  // Update pitch when transpose changes
  useEffect(() => {
    if (pitchShiftRef.current) {
      pitchShiftRef.current.pitch = transposeSemitones
    }
  }, [transposeSemitones])

  // Update current time during playback
  useEffect(() => {
    const updateTime = () => {
      if (isPlaying && playerRef.current?.state === "started") {
        const elapsed = Tone.now() - startTimeRef.current
        const newTime = offsetRef.current + elapsed
        
        // Stop if we've reached the end
        if (newTime >= duration) {
          playerRef.current?.stop()
          setCurrentTime(duration)
          setIsPlaying(false)
          offsetRef.current = 0
        } else {
          setCurrentTime(newTime)
          animationFrameRef.current = requestAnimationFrame(updateTime)
        }
      }
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, duration])

  const handlePlayPause = async () => {
    if (!playerRef.current) return

    try {
      await Tone.start() // Required for audio context

      if (isPlaying) {
        // Pause
        playerRef.current.stop()
        // Save current position
        offsetRef.current = currentTime
        setIsPlaying(false)
      } else {
        // Play from current offset
        startTimeRef.current = Tone.now()
        playerRef.current.start("+0", offsetRef.current)
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Error toggling playback:", error)
    }
  }

  const handleReset = () => {
    if (playerRef.current) {
      playerRef.current.stop()
      setIsPlaying(false)
      setCurrentTime(0)
      offsetRef.current = 0
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    offsetRef.current = newTime
    
    if (playerRef.current) {
      const wasPlaying = isPlaying
      
      // Set seeking flag to prevent onstop from changing play state
      isSeekingRef.current = true
      
      // Stop current playback
      playerRef.current.stop()
      
      // If was playing, restart from new position
      if (wasPlaying) {
        startTimeRef.current = Tone.now()
        playerRef.current.start("+0", newTime)
      }
      
      // Clear seeking flag after a brief delay
      setTimeout(() => {
        isSeekingRef.current = false
      }, 50)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {transposeSemitones !== 0 && (
          <span className="text-xs text-muted-foreground">
            {transposeSemitones > 0 ? '+' : ''}{transposeSemitones} semitones
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={handlePlayPause}
          disabled={isLoading}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReset}
          disabled={isLoading}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <div className="flex-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground min-w-[40px]">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="flex-1"
            disabled={isLoading}
          />
          <span className="text-xs text-muted-foreground min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}