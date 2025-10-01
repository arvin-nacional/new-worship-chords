import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { musicalKeys } from '@/lib/validations/song'

const songDetailsSchema = z.object({
  artist: z.string().optional(),
  writer: z.string(),
  originalKey: z.enum(musicalKeys),
  tempo: z.number().min(40).max(240).optional(),
  timeSignature: z.enum(['2/4', '3/4', '4/4', '5/4', '6/8', '9/8', '12/8']).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  tags: z.array(z.string()).max(10),
  lyricsText: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const { title } = await request.json()

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Song title is required' },
        { status: 400 }
      )
    }

    const { object } = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: songDetailsSchema,
        prompt: `You are a worship song expert. Given the song title "${title}", provide ALL of the following information:
  
  1. **artist**: The performing artist/worship leader (e.g., "Hillsong Worship", "Chris Tomlin"). Leave empty if truly unknown.
  
  2. **writer**: The songwriter/composer (REQUIRED - make best guess if needed, e.g., "Traditional", "Unknown")
  
  3. **originalKey**: One of these exact keys: C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B
  
  4. **tempo**: BPM number between 40-240 (make educated guess based on song style)
  
  5. **timeSignature**: One of: 2/4, 3/4, 4/4, 5/4, 6/8, 9/8, 12/8
  
  6. **difficulty**: beginner, intermediate, or advanced
  
  7. **tags**: Array of 3-8 relevant tags (e.g., ["worship", "contemporary", "praise", "ballad"])
  
  8. **lyricsText**: Full lyrics with chord notation in this EXACT format:
     - Section labels in brackets: [Verse 1], [Chorus], [Bridge]
     - Chords on line above lyrics, aligned with syllables
     - Use spaces to align chords properly
     - Example:
     
  [Verse 1]
         G              D/F#         Em7
  Amazing grace, how sweet the sound
       C              G/B          Am7      D
  That saved a wretch like me
  
  [Chorus]
      G                D              Em7
  I once was lost, but now am found
       C           D           G
  Was blind but now I see
  
  IMPORTANT: 
  - Provide values for ALL fields (artist can be empty if unknown)
  - Do NOT just return lyrics - fill in ALL the musical details
  - Format lyrics exactly as shown with chords aligned above words
  - Include at least verse and chorus sections
  
  If known song: provide accurate info. If unknown: make reasonable worship song suggestions.`,
    })

    return NextResponse.json(object)
  } catch (error) {
    console.error('Error generating song details:', error)
    return NextResponse.json(
      { error: 'Failed to generate song details' },
      { status: 500 }
    )
  }
}