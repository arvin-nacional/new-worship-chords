import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add to lib/utils.ts after the cn function



// Music key utilities for audio transposition
const KEY_ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const KEY_ENHARMONICS: Record<string, string> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
}

/**
 * Normalize enharmonic keys to their sharp equivalents
 */
export function normalizeKey(key: string): string {
  return KEY_ENHARMONICS[key] || key
}

/**
 * Calculate semitone difference between two keys
 * @param fromKey - Original key
 * @param toKey - Target key
 * @returns Number of semitones (positive = up, negative = down)
 */
/**
 * Calculate the semitone difference between two musical keys
 * @param fromKey - The original key (e.g., "C", "D#", "Bb")
 * @param toKey - The target key to transpose to
 * @returns The number of semitones to transpose (positive = up, negative = down)
 */
export function calculateSemitones(fromKey: string, toKey: string): number {
  // Chromatic scale - maps keys to their position (0-11)
  const keyMap: Record<string, number> = {
    'C': 0,
    'C#': 1, 'Db': 1,
    'D': 2,
    'D#': 3, 'Eb': 3,
    'E': 4,
    'F': 5,
    'F#': 6, 'Gb': 6,
    'G': 7,
    'G#': 8, 'Ab': 8,
    'A': 9,
    'A#': 10, 'Bb': 10,
    'B': 11,
  }

    // Trim whitespace and normalize: uppercase first char, keep # or b lowercase
    const normalizeKey = (key: string): string => {
      const trimmed = key.trim()
      if (trimmed.length === 0) return trimmed
      // First character uppercase, rest as-is (to preserve 'b' and '#')
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
    }
    
    const normalizedFrom = normalizeKey(fromKey)
    const normalizedTo = normalizeKey(toKey)

  const fromPosition = keyMap[normalizedFrom]
  const toPosition = keyMap[normalizedTo]

  // Debug logging
  console.log('calculateSemitones:', { fromKey, toKey, normalizedFrom, normalizedTo, fromPosition, toPosition })

  if (fromPosition === undefined || toPosition === undefined) {
    console.error(`Invalid key: fromKey="${fromKey}" (${normalizedFrom}), toKey="${toKey}" (${normalizedTo})`)
    return 0
  }

  // Calculate semitone difference
  let semitones = toPosition - fromPosition
  
  // Normalize to range -6 to +6 (prefer smaller intervals)
  if (semitones > 6) {
    semitones -= 12
  } else if (semitones < -6) {
    semitones += 12
  }

  console.log(`Transposing from ${normalizedFrom} to ${normalizedTo}: ${semitones} semitones`)

  return semitones
}