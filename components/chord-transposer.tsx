"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ChordTransposerProps {
  lyricsText: string
  originalKey: string
}

const keys = [
  { id: 0, name: "Original Key", key: "" },
  { id: 1, name: "A", key: "A" },
  { id: 2, name: "A#", key: "A#" },
  { id: 3, name: "Bb", key: "Bb" },
  { id: 4, name: "B", key: "B" },
  { id: 5, name: "C", key: "C" },
  { id: 6, name: "C#", key: "C#" },
  { id: 7, name: "Db", key: "Db" },
  { id: 8, name: "D", key: "D" },
  { id: 9, name: "D#", key: "D#" },
  { id: 10, name: "Eb", key: "Eb" },
  { id: 11, name: "E", key: "E" },
  { id: 12, name: "F", key: "F" },
  { id: 13, name: "F#", key: "F#" },
  { id: 14, name: "Gb", key: "Gb" },
  { id: 15, name: "G", key: "G" },
  { id: 16, name: "G#", key: "G#" },
  { id: 17, name: "Ab", key: "Ab" },
]

export function ChordTransposer({ lyricsText, originalKey }: ChordTransposerProps) {
  const [transpose, setTranspose] = useState(false)
  const [lyricChords, setLyricChords] = useState("")
  const [selectedKey, setSelectedKey] = useState("ORIGINAL")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [transposerLib, setTransposerLib] = useState<any>(null)

  // Dynamically load the chord-transposer library on client side only
  useEffect(() => {
    import("chord-transposer").then((module) => {
      setTransposerLib(module)
    }).catch((error) => {
      console.error("Failed to load chord-transposer:", error)
    })
  }, [])

  const handleKeyChange = (keyValue: string) => {
    setSelectedKey(keyValue)
    // Skip transposition if "Original Key" is selected
    if (keyValue && keyValue !== "" && keyValue !== "ORIGINAL" && transposerLib) {
      try {
        const transposed = transposerLib.transpose(lyricsText).toKey(keyValue).toString()
        setLyricChords(transposed)
        setTranspose(true)
      } catch (error) {
        console.error("Error transposing:", error)
        setTranspose(false)
      }
    } else {
      setTranspose(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lyrics & Chords</CardTitle>
          <div className="flex items-center gap-2">
            <label htmlFor="transpose-key" className="text-sm font-medium">
              Transpose:
            </label>
            <Select value={selectedKey} onValueChange={handleKeyChange} disabled={!transposerLib}>
              <SelectTrigger className="w-[180px]" id="transpose-key">
                <SelectValue placeholder={`Original Key (${originalKey})`} />
              </SelectTrigger>
              <SelectContent>
                {keys.map((keyChord) => (
                  <SelectItem 
                    key={keyChord.id} 
                    value={keyChord.key || "ORIGINAL"}
                  >
                    {keyChord.name === "Original Key" 
                      ? `Original Key (${originalKey})` 
                      : keyChord.name
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="font-mono text-sm whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
          {transpose ? lyricChords : lyricsText}
        </pre>
      </CardContent>
    </Card>
  )
}