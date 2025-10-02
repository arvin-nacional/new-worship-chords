"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Music, Plus, X, Sparkles, Loader2, Wand2, Mic, CheckCircle2, AlertCircle, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Import validation schemas
import {
  addSongSchema,
  type AddSongFormValues,
  musicalKeys,
  timeSignatures,
} from "@/lib/validations/song"

interface SongFormProps {
  mode?: "add" | "edit"
  initialValues?: Partial<AddSongFormValues>
  songId?: string
  initialVocalsUrl?: string
  initialInstrumentalUrl?: string
}

export function AddSongForm({ mode = "add", initialValues, songId, initialVocalsUrl, initialInstrumentalUrl }: SongFormProps) {
  const [tags, setTags] = useState<string[]>(initialValues?.tags || [])
  const [tagInput, setTagInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [isExtractingVocals, setIsExtractingVocals] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [extractionSuccess, setExtractionSuccess] = useState<string | null>(null)
  const [vocalsUrl, setVocalsUrl] = useState<string | null>(initialVocalsUrl || null)
  const [isUploadingVocals, setIsUploadingVocals] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploadingInstrumental, setIsUploadingInstrumental] = useState(false)
  const [instrumentalUploadError, setInstrumentalUploadError] = useState<string | null>(null)
  const [instrumentalSuccess, setInstrumentalSuccess] = useState<string | null>(null)
  const [instrumentalUrl, setInstrumentalUrl] = useState<string | null>(initialInstrumentalUrl || null)
  

  const form = useForm<AddSongFormValues>({
    resolver: zodResolver(addSongSchema),
    defaultValues: {
      title: initialValues?.title || "",
      artist: initialValues?.artist || "",
      writer: initialValues?.writer || "",
      originalKey: initialValues?.originalKey || "C",
      tempo: initialValues?.tempo || undefined,
      timeSignature: initialValues?.timeSignature || "4/4",
      capo: initialValues?.capo || 0,
      difficulty: initialValues?.difficulty || "intermediate",
      tags: initialValues?.tags || [],
      lyricsText: initialValues?.lyricsText || "",
      videoId: initialValues?.videoId || "",
      spotifyId: initialValues?.spotifyId || "",
      imageUrl: initialValues?.imageUrl || "",
    },
  })

  const title = form.watch("title")
  const videoId = form.watch("videoId")
  const generateSongDetails = async () => {
    if (!title || title.trim().length < 2) {
      setGenerateError("Please enter a song title first")
      return
    }

    setIsGenerating(true)
    setGenerateError(null)

    try {
      const response = await fetch("/api/songs/generate-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: title.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate song details")
      }

      const data = await response.json()

      // Auto-fill form fields with generated data
      if (data.artist) form.setValue("artist", data.artist)
      if (data.writer) form.setValue("writer", data.writer)
      if (data.originalKey) form.setValue("originalKey", data.originalKey)
      if (data.tempo) form.setValue("tempo", data.tempo)
      if (data.timeSignature) form.setValue("timeSignature", data.timeSignature)
      if (data.difficulty) form.setValue("difficulty", data.difficulty)
      if (data.lyricsText) form.setValue("lyricsText", data.lyricsText)
      
      if (data.tags && data.tags.length > 0) {
        setTags(data.tags)
        form.setValue("tags", data.tags)
      }

    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : "Failed to generate details")
    } finally {
      setIsGenerating(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && tags.length < 10 && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()]
      setTags(newTags)
      form.setValue("tags", newTags)
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
    form.setValue("tags", newTags)
  }

  const uploadVocals = async (file: File) => {
    if (!songId) {
      setUploadError("Please save the song first before uploading vocals")
      return
    }

    setIsUploadingVocals(true)
    setUploadError(null)
    setExtractionSuccess(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("songId", songId)

      const response = await fetch("/api/songs/upload-vocals", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload vocals")
      }

      setVocalsUrl(data.vocalsUrl)
      setExtractionSuccess("Vocals uploaded successfully!")
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload vocals")
    } finally {
      setIsUploadingVocals(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ["audio/wav", "audio/mp3", "audio/mpeg", "audio/m4a"]
      if (!validTypes.includes(file.type)) {
        setUploadError("Please upload a valid audio file (WAV, MP3, or M4A)")
        return
      }
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setUploadError("File size must be less than 50MB")
        return
      }

      uploadVocals(file)
    }
  }

  const uploadInstrumental = async (file: File) => {
    if (!songId) {
      setInstrumentalUploadError("Please save the song first before uploading instrumental")
      return
    }

    setIsUploadingInstrumental(true)
    setInstrumentalUploadError(null)
    setInstrumentalSuccess(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("songId", songId)

      const response = await fetch("/api/songs/upload-instrumental", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload instrumental")
      }

      setInstrumentalUrl(data.instrumentalUrl)
      setInstrumentalSuccess("Instrumental uploaded successfully!")
    } catch (error) {
      setInstrumentalUploadError(error instanceof Error ? error.message : "Failed to upload instrumental")
    } finally {
      setIsUploadingInstrumental(false)
    }
  }

  const handleInstrumentalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ["audio/wav", "audio/mp3", "audio/mpeg", "audio/m4a"]
      if (!validTypes.includes(file.type)) {
        setInstrumentalUploadError("Please upload a valid audio file (WAV, MP3, or M4A)")
        return
      }
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setInstrumentalUploadError("File size must be less than 50MB")
        return
      }

      uploadInstrumental(file)
    }
  }

  const onSubmit = async (data: AddSongFormValues) => {
    setIsSubmitting(true)
    setSubmitError(null)
  
    try {
      const url = mode === "edit" ? `/api/songs/${songId}` : "/api/songs"
      const method = mode === "edit" ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
  
      const result = await response.json()
  
      if (!response.ok) {
        throw new Error(result.error || `Failed to ${mode} song`)
      }
  
      // Success! Redirect to the song page
      window.location.href = `/songs/${result.song._id}`
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : `Failed to ${mode} song`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
      <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
  <Music className="h-10 w-10 text-primary" />
  {mode === "edit" ? "Edit Song" : "Add New Song"}
</h1>
<p className="text-muted-foreground text-lg">
  {mode === "edit" ? "Update song details and lyrics" : "Share a worship song with chord progressions and lyrics"}
</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential details about the song</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Song Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Amazing Grace" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="artist"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Artist / Performer</FormLabel>
                      <FormControl>
                        <Input placeholder="Hillsong Worship" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="writer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Writer / Composer *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Newton" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
                            {/* AI Auto-fill Button */}
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 shadow-sm">
            <div className="flex-1">
              <p className="text-sm font-medium">🪄 AI-Powered Auto-fill</p>
              <p className="text-xs text-muted-foreground">
                Fill in the song details above, then let AI complete the rest (musical details, lyrics with chords, tags)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateSongDetails}
              disabled={!title || title.trim().length < 2 || isGenerating}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 border-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Auto-fill with AI
                </>
              )}
            </Button>
          </div>

          {generateError && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
              {generateError}
            </div>
          )}
          {/* Musical Details */}
          <Card>
            <CardHeader>
              <CardTitle>Musical Details</CardTitle>
              <CardDescription>Key, tempo, and musical characteristics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="originalKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Original Key *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select key" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {musicalKeys.map((key) => (
                            <SelectItem key={key} value={key}>
                              {key}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tempo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempo (BPM)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={40}
                          max={240}
                          placeholder="120"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeSignature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Signature</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeSignatures.map((sig) => (
                            <SelectItem key={sig} value={sig}>
                              {sig}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capo</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={12}
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full md:w-[250px]">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">🟢 Beginner</SelectItem>
                        <SelectItem value="intermediate">🟡 Intermediate</SelectItem>
                        <SelectItem value="advanced">🔴 Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Lyrics & Chords */}
          <Card>
            <CardHeader>
              <CardTitle>Lyrics & Chords</CardTitle>
              <CardDescription>Add the song lyrics with chords</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="lyricsText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lyrics</FormLabel>
                    <FormControl>
                    <Textarea
                        placeholder={`Lyrics will be auto-filled with chord notation like this:

[Verse 1]
       G              D/F#         Em7
Amazing grace, how sweet the sound
     C              G/B          Am7      D
That saved a wretch like me

Or enter your own lyrics with chords above the words.`}
                        className="min-h-[300px] font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Use chord notation in brackets or above lyrics
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Media Links */}
          <Card>
            <CardHeader>
              <CardTitle>Media & Resources</CardTitle>
              <CardDescription>Optional media links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <FormField
                control={form.control}
                name="videoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube Video ID</FormLabel>
                    <FormControl>
                      <Input placeholder="dQw4w9WgXcQ" {...field} />
                    </FormControl>
                    <FormDescription>
                      11-character ID from YouTube URL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vocals File Upload */}
              {mode === "edit" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Upload Vocals Audio File</label>
                    <div className="mt-2">
                      <label 
                        htmlFor="vocals-upload"
                        className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                      >
                        {isUploadingVocals ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5" />
                            <span>Click to upload vocals audio file (WAV, MP3, M4A)</span>
                          </>
                        )}
                      </label>
                      <input
                        id="vocals-upload"
                        type="file"
                        accept="audio/*"
                        onChange={handleFileChange}
                        disabled={isUploadingVocals}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Max file size: 50MB
                    </p>
                  </div>

                  {/* Upload Status Messages */}
                  {uploadError && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {extractionSuccess && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 p-3 rounded-md border border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{extractionSuccess}</span>
                    </div>
                  )}

                  {/* Audio Player for Uploaded Vocals */}
                  {vocalsUrl && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Uploaded Vocals:</p>
                      <audio 
                        controls 
                        className="w-full"
                        src={vocalsUrl}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                                {/* Instrumental File Upload */}
              {mode === "edit" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Upload Instrumental Audio File</label>
                    <div className="mt-2">
                      <label 
                        htmlFor="instrumental-upload"
                        className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                      >
                        {isUploadingInstrumental ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5" />
                            <span>Click to upload instrumental audio file (WAV, MP3, M4A)</span>
                          </>
                        )}
                      </label>
                      <input
                        id="instrumental-upload"
                        type="file"
                        accept="audio/*"
                        onChange={handleInstrumentalFileChange}
                        disabled={isUploadingInstrumental}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Max file size: 50MB
                    </p>
                  </div>

                  {/* Upload Status Messages */}
                  {instrumentalUploadError && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{instrumentalUploadError}</span>
                    </div>
                  )}

                  {instrumentalSuccess && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 p-3 rounded-md border border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{instrumentalSuccess}</span>
                    </div>
                  )}

                  {/* Audio Player for Uploaded Instrumental */}
                  {instrumentalUrl && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Uploaded Instrumental:</p>
                      <audio 
                        controls 
                        className="w-full"
                        src={instrumentalUrl}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </div>
              )}
                </div>
              )}

              <FormField
                control={form.control}
                name="spotifyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spotify ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Spotify track ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormDescription>
                      Album art or song-related image
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Add up to 10 tags to categorize this song</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={addTag}
                  disabled={tags.length >= 10}
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

                    {/* Submit Button */}
                    <div className="flex gap-4 justify-end sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
            {submitError && (
              <div className="flex-1 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                {submitError}
              </div>
            )}
            <Button 
              type="button" 
              variant="outline" 
              size="lg"
              onClick={() => window.history.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
  type="submit" 
  size="lg" 
  className="gap-2"
  disabled={isSubmitting}
>
  {isSubmitting ? (
    <>
      <Loader2 className="h-4 w-4 animate-spin" />
      {mode === "edit" ? "Updating..." : "Publishing..."}
    </>
  ) : (
    <>
      <Sparkles className="h-4 w-4" />
      {mode === "edit" ? "Update Song" : "Publish Song"}
    </>
  )}
</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}