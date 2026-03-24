"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Play, Pause, RotateCcw, Volume2, VolumeX, Rewind, FastForward } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import * as Tone from "tone"

interface Track {
  id: string
  name: string
  src: string
  color: string
  icon: string
}

interface MultiTrackPlayerProps {
  tracks: Track[]
  transposeSemitones: number
}

interface TrackState {
  player: Tone.Player | null
  pitchShift: Tone.PitchShift | null
  volume: Tone.Volume | null
  loaded: boolean
  muted: boolean
  volumeLevel: number
}

export function MultiTrackPlayer({ tracks, transposeSemitones }: MultiTrackPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [trackStates, setTrackStates] = useState<Record<string, { muted: boolean; volumeLevel: number }>>({})

  const trackRefsMap = useRef<Record<string, TrackState>>({})
  const animationFrameRef = useRef<number | undefined>(undefined)
  const startTimeRef = useRef<number>(0)
  const offsetRef = useRef<number>(0)
  const isSeekingRef = useRef<boolean>(false)

  // Initialize all tracks
  useEffect(() => {
    const initTracks = async () => {
      setIsLoading(true)
      let maxDuration = 0
      const initialStates: Record<string, { muted: boolean; volumeLevel: number }> = {}

      for (const track of tracks) {
        try {
          const volume = new Tone.Volume(0).toDestination()
          const pitchShift = new Tone.PitchShift({
            pitch: transposeSemitones,
            windowSize: 0.1,
            delayTime: 0,
          }).connect(volume)

          const player = new Tone.Player({
            url: track.src,
            onload: () => {
              if (player.buffer.duration > maxDuration) {
                maxDuration = player.buffer.duration
                setDuration(maxDuration)
              }
              trackRefsMap.current[track.id].loaded = true
              
              // Check if all tracks are loaded
              const allLoaded = Object.values(trackRefsMap.current).every(t => t.loaded)
              if (allLoaded) {
                setIsLoading(false)
              }
            },
          }).connect(pitchShift)

          trackRefsMap.current[track.id] = {
            player,
            pitchShift,
            volume,
            loaded: false,
            muted: false,
            volumeLevel: 80,
          }

          initialStates[track.id] = { muted: false, volumeLevel: 80 }
        } catch (error) {
          console.error(`Error initializing track ${track.name}:`, error)
        }
      }

      setTrackStates(initialStates)
    }

    initTracks()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      Object.values(trackRefsMap.current).forEach(track => {
        track.player?.dispose()
        track.pitchShift?.dispose()
        track.volume?.dispose()
      })
      trackRefsMap.current = {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks])

  // Update pitch when transpose changes
  useEffect(() => {
    Object.values(trackRefsMap.current).forEach(track => {
      if (track.pitchShift) {
        track.pitchShift.pitch = transposeSemitones
      }
    })
  }, [transposeSemitones, tracks])

  // Update current time during playback
  useEffect(() => {
    const updateTime = () => {
      if (isPlaying) {
        const elapsed = Tone.now() - startTimeRef.current
        const newTime = offsetRef.current + elapsed

        if (newTime >= duration) {
          // Stop all tracks
          Object.values(trackRefsMap.current).forEach(track => {
            track.player?.stop()
          })
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
    try {
      await Tone.start()

      if (isPlaying) {
        // Pause all tracks
        Object.values(trackRefsMap.current).forEach(track => {
          track.player?.stop()
        })
        offsetRef.current = currentTime
        setIsPlaying(false)
      } else {
        // Play all tracks from current offset
        startTimeRef.current = Tone.now()
        Object.values(trackRefsMap.current).forEach(track => {
          if (track.player && track.loaded) {
            track.player.start("+0", offsetRef.current)
          }
        })
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Error toggling playback:", error)
    }
  }

  const handleReset = () => {
    Object.values(trackRefsMap.current).forEach(track => {
      track.player?.stop()
    })
    setIsPlaying(false)
    setCurrentTime(0)
    offsetRef.current = 0
  }

  const handleSeek = useCallback((value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    offsetRef.current = newTime

    isSeekingRef.current = true

    Object.values(trackRefsMap.current).forEach(track => {
      if (track.player) {
        track.player.stop()
        if (isPlaying) {
          startTimeRef.current = Tone.now()
          track.player.start("+0", newTime)
        }
      }
    })

    setTimeout(() => {
      isSeekingRef.current = false
    }, 50)
  }, [isPlaying])

  const handleSkip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
    handleSeek([newTime])
  }

  const handleVolumeChange = (trackId: string, value: number[]) => {
    const volumeLevel = value[0]
    const trackRef = trackRefsMap.current[trackId]
    
    if (trackRef?.volume) {
      // Convert 0-100 to dB (-60 to 0)
      const db = volumeLevel === 0 ? -Infinity : (volumeLevel / 100) * 60 - 60
      trackRef.volume.volume.value = db
    }

    setTrackStates(prev => ({
      ...prev,
      [trackId]: { ...prev[trackId], volumeLevel }
    }))
  }

  const handleMuteToggle = (trackId: string) => {
    const trackRef = trackRefsMap.current[trackId]
    const currentState = trackStates[trackId]
    
    if (trackRef?.volume) {
      if (currentState?.muted) {
        // Unmute - restore previous volume
        const db = currentState.volumeLevel === 0 ? -Infinity : (currentState.volumeLevel / 100) * 60 - 60
        trackRef.volume.volume.value = db
      } else {
        // Mute
        trackRef.volume.volume.value = -Infinity
      }
    }

    setTrackStates(prev => ({
      ...prev,
      [trackId]: { ...prev[trackId], muted: !currentState?.muted }
    }))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      {/* Track Rows */}
      <div className="divide-y divide-border">
        {tracks.map((track) => {
          const state = trackStates[track.id] || { muted: false, volumeLevel: 80 }
          
          return (
            <div key={track.id} className="flex items-center">
              {/* Track Label & Volume */}
              <div className="w-32 sm:w-40 p-3 flex flex-col gap-2 bg-muted/30 border-r">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{track.icon}</span>
                  <span className="text-sm font-medium truncate">{track.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => handleMuteToggle(track.id)}
                  >
                    {state.muted ? (
                      <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Slider
                    value={[state.muted ? 0 : state.volumeLevel]}
                    max={100}
                    step={1}
                    className="w-full"
                    onValueChange={(value) => handleVolumeChange(track.id, value)}
                  />
                </div>
              </div>

              {/* Track Visualization Bar */}
              <div className="flex-1 h-16 relative overflow-hidden" style={{ backgroundColor: `${track.color}20` }}>
                {/* Progress fill */}
                <div 
                  className="absolute inset-y-0 left-0 opacity-60"
                  style={{ 
                    width: `${progressPercent}%`,
                    backgroundColor: track.color,
                  }}
                />
                {/* Waveform placeholder pattern */}
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    background: `repeating-linear-gradient(90deg, transparent, transparent 2px, ${track.color}40 2px, ${track.color}40 4px)`,
                    maskImage: 'linear-gradient(to right, black, black)',
                  }}
                >
                  <div 
                    className="h-8 w-full"
                    style={{
                      background: `linear-gradient(90deg, ${track.color}60 0%, ${track.color}80 25%, ${track.color}40 50%, ${track.color}70 75%, ${track.color}50 100%)`,
                      maskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,10 Q5,${Math.random() * 15 + 2} 10,10 T20,10 T30,10 T40,10 T50,10 T60,10 T70,10 T80,10 T90,10 T100,10' stroke='black' fill='none' stroke-width='8'/%3E%3C/svg%3E")`,
                      maskSize: '100px 100%',
                      maskRepeat: 'repeat-x',
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Playback Controls */}
      <div className="p-4 bg-muted/20 border-t space-y-3">
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-muted-foreground w-12 text-right">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration || 1}
            step={0.1}
            className="flex-1"
            onValueChange={handleSeek}
            disabled={isLoading}
          />
          <span className="text-sm font-mono text-muted-foreground w-12">
            {formatTime(duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleSkip(-15)}
            disabled={isLoading}
            className="h-10 w-10"
          >
            <Rewind className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            onClick={handlePlayPause}
            disabled={isLoading}
            className="h-12 w-12 rounded-full"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleSkip(15)}
            disabled={isLoading}
            className="h-10 w-10"
          >
            <FastForward className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleReset}
            disabled={isLoading}
            className="h-10 w-10"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        {isLoading && (
          <p className="text-center text-sm text-muted-foreground">Loading tracks...</p>
        )}

        {transposeSemitones !== 0 && (
          <p className="text-center text-xs text-muted-foreground">
            Pitch shifted: {transposeSemitones > 0 ? '+' : ''}{transposeSemitones} semitones
          </p>
        )}
      </div>
    </div>
  )
}
