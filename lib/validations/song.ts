import * as z from "zod"

// Musical keys enum
export const musicalKeys = [
  'C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 
  'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'
] as const

export const timeSignatures = [
  '2/4', '3/4', '4/4', '5/4', '6/8', '9/8', '12/8'
] as const

export const difficulties = ['beginner', 'intermediate', 'advanced'] as const

// Chord line schema
export const chordLineSchema = z.object({
  lyrics: z.string(),
  chords: z.array(z.object({
    chord: z.string(),
    position: z.number().min(0),
  })).optional(),
})

// Section schema (Verse, Chorus, etc.)
export const sectionSchema = z.object({
  name: z.string().min(1, "Section name is required"),
  lines: z.array(chordLineSchema).min(1, "At least one line required"),
})

// Main song form validation schema
export const addSongSchema = z.object({
  // Basic Information
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  
  artist: z.string()
    .max(100, "Artist name cannot exceed 100 characters")
    .optional(),
  
  writer: z.string()
    .min(1, "Writer/composer is required")
    .max(200, "Writer name cannot exceed 200 characters"),
  
  // Musical Details
  originalKey: z.enum(musicalKeys, {
    error: "Please select a valid musical key",
  }),
  
  tempo: z.number()
    .min(40, "Tempo must be at least 40 BPM")
    .max(240, "Tempo cannot exceed 240 BPM")
    .optional()
    .nullable(),
  
    timeSignature: z.enum(timeSignatures).optional(),
    capo: z.number()
      .min(0, "Capo cannot be negative")
      .max(12, "Capo cannot exceed 12")
      .optional(),
    difficulty: z.enum(difficulties).optional(),
  
  // Lyrics & Chords
  sections: z.array(sectionSchema).optional(),
  
  lyricsText: z.string()
    .max(10000, "Lyrics text is too long")
    .optional(),
  
  // Media
  imageUrl: z.string()
    .url("Please enter a valid URL")
    .regex(/\.(jpg|jpeg|png|webp|gif)$/i, "Must be a valid image URL")
    .optional()
    .or(z.literal('')),
  
  videoId: z.string()
    .regex(/^[a-zA-Z0-9_-]{11}$/, "Invalid YouTube video ID (must be 11 characters)")
    .optional()
    .or(z.literal('')),
  
  spotifyId: z.string()
    .optional()
    .or(z.literal('')),
  
  // Tags
  tags: z.array(z.string())
    .max(10, "Cannot have more than 10 tags")
    .optional(),

})

// Type inference
export type AddSongFormValues = z.infer<typeof addSongSchema>
export type ChordLine = z.infer<typeof chordLineSchema>
export type SongSection = z.infer<typeof sectionSchema>

// Edit song schema (similar but with optional fields)
export const editSongSchema = addSongSchema.partial({
  title: true,
  writer: true,
  originalKey: true,
})

export type EditSongFormValues = z.infer<typeof editSongSchema>