"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import * as Tone from "tone"

interface TransposableAudioPlayerProps {
  src: string
  title: string
  description: string
  transposeSemitones: number
  isPlaying: boolean
  onPlayPause: () => void
}

export function TransposableAudioPlayer({
  src,
  title,
  description,
  transposeSemitones,
  isPlaying,
  onPlayPause,
}: TransposableAudioPlayerProps) {
  const [volume, setVolume] = useState(0.8)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  
  const playerRef = useRef<Tone.Player | null>(null)
  const pitchShiftRef = useRef<Tone.PitchShift | null>(null)
  const gainNodeRef = useRef<Tone.Gain | null>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)
  const startTimeRef = useRef<number>(0)
  const offsetRef = useRef<number>(0)
  const isSeekingRef = useRef<boolean>(false)

  // Initialize Tone.js player
  useEffect(() => {
    const initPlayer = async () => {
      try {
        setIsLoading(true)
        
        // Create gain node for volume control
        gainNodeRef.current = new Tone.Gain(volume).toDestination()
        
        // Create pitch shift effect
        pitchShiftRef.current = new Tone.PitchShift({
          pitch: transposeSemitones,
          windowSize: 0.1,
          delayTime: 0,
        }).connect(gainNodeRef.current)

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
          if (!isSeekingRef.current) {
            onPlayPause()
          }
        }

      } catch (error) {
        console.error("Error initializing audio player:", error)
        setIsLoading(false)
      }
    }

    initPlayer()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      playerRef.current?.dispose()
      pitchShiftRef.current?.dispose()
      gainNodeRef.current?.dispose()
    }
  }, [src, onPlayPause])

  // Update pitch when transpose changes
  useEffect(() => {
    if (pitchShiftRef.current) {
      pitchShiftRef.current.pitch = transposeSemitones
    }
  }, [transposeSemitones])

  // Update volume when volume changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.rampTo(isMuted ? 0 : volume, 0.1)
    }
  }, [volume, isMuted])

  // Handle play/pause based on isPlaying prop
  useEffect(() => {
    if (!playerRef.current) return

    const updateTime = () => {
      if (isPlaying && playerRef.current?.state === "started") {
        const elapsed = Tone.now() - startTimeRef.current
        const newTime = offsetRef.current + elapsed
        
        if (newTime >= duration) {
          // End of track
          offsetRef.current = 0
          startTimeRef.current = Tone.now()
          setCurrentTime(0)
          playerRef.current.start(0, 0)
        } else {
          setCurrentTime(newTime)
        }
        
        animationFrameRef.current = requestAnimationFrame(updateTime)
      }
    }

    if (isPlaying) {
      if (playerRef.current.state === "stopped") {
        playerRef.current.start(0, offsetRef.current % duration)
      } 
      
      // else if (playerRef.current.state === "paused") {
      //   playerRef.current.start(0, offsetRef.current % duration)
      // }
      startTimeRef.current = Tone.now() - offsetRef.current
      animationFrameRef.current = requestAnimationFrame(updateTime)
    } else {
      if (playerRef.current?.state === "started") {
        playerRef.current.stop()
        offsetRef.current = (offsetRef.current + (Tone.now() - startTimeRef.current)) % duration
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, duration])

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !e.currentTarget) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const seekPosition = (e.clientX - rect.left) / rect.width
    const newTime = Math.max(0, Math.min(seekPosition * duration, duration))
    
    setCurrentTime(newTime)
    offsetRef.current = newTime
    
    if (isPlaying) {
      playerRef.current.start(0, newTime % duration)
      startTimeRef.current = Tone.now()
    }
  }

  const toggleMute = () => {
    setIsMuted(prev => !prev)
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0])
    if (value[0] > 0 && isMuted) {
      setIsMuted(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-muted"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <div className="w-24">
            <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={handleVolumeChange}
              max={1}
              step={0.01}
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
      
      <div 
        className="h-2 bg-muted rounded-full overflow-hidden cursor-pointer relative"
        onClick={handleSeek}
      >
        <div 
          className="h-full bg-primary/50"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>
      
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}