/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Music, Star, Eye, Heart, Clock, User, Pencil } from "lucide-react"
import dbConnect from "@/lib/mongoose"
import Song, { ISong } from "@/models/Song"
import { Types } from "mongoose"
import { notFound } from "next/navigation"
import { ChordTransposer } from "@/components/chord-transposer"
import { YouTubeVideo } from "@/components/youtube-video"

// Type for song with populated createdBy field
type PopulatedSong = Omit<ISong, 'createdBy'> & {
    createdBy?: {
      _id: Types.ObjectId;
      name: string;
      email: string;
    } | Types.ObjectId;
  }
export const dynamic = 'force-dynamic'

export default async function SongDetailPage({
    params,
  }: {
    params: Promise<{ id: string }>
  }) {
    const session = await auth()
    
    if (!session) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <div className="text-center space-y-4">
            <Music className="h-16 w-16 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold">Please Sign In</h1>
            <p className="text-muted-foreground">You need to be signed in to view songs</p>
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      )
    }
  
    const { id } = await params
  
    // Validate ObjectId before querying to prevent Mongoose CastError
    if (!Types.ObjectId.isValid(id)) {
      notFound()
    }
  
    await dbConnect()
  
    const song = await Song.findById(id)
      .populate('createdBy', 'name email')
      .lean() as PopulatedSong | null
  
    if (!song) {
      notFound()
    }
  
    // Increment view count (in a real app, you'd do this in an API route to avoid bots)
    await Song.findByIdAndUpdate(id, { $inc: { viewCount: 1 } })

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6 max-w-5xl">
        {/* Back Button */}
        <Button variant="ghost" asChild>
          <Link href="/songs">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Songs
          </Link>
        </Button>

        {/* Song Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
                <Music className="h-10 w-10 text-primary" />
                {song.title}
              </h1>
              <p className="text-xl text-muted-foreground mt-2">
                {song.artist || 'Unknown Artist'}
              </p>
            </div>
            {session?.user?.id === song.createdBy?._id?.toString() && (
              <Button variant="outline" asChild>
                <Link href={`/songs/${song._id}/edit`}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            )}
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Written by {song.writer}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>{song.averageRating?.toFixed(1) || '0.0'} ({song.ratingsCount || 0} ratings)</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>{song.viewCount || 0} views</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span>{song.favoritesCount || 0} favorites</span>
            </div>
          </div>
        </div>

        {/* Song Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
                        {/* Lyrics and Chords */}
                        {song.sections && song.sections.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Lyrics & Chords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {song.sections.map((section: any, idx: number) => (
                      <div key={idx} className="space-y-2">
                        <h3 className="font-semibold text-lg text-primary">
                          [{section.name}]
                        </h3>
                        <div className="font-mono text-sm space-y-1 bg-muted/30 p-4 rounded-lg">
                          {section.lines.map((line: any, lineIdx: number) => (
                            <div key={lineIdx} className="relative">
                              {/* Chords line */}
                              {line.chords && line.chords.length > 0 && (
                                <div className="text-primary font-semibold mb-1">
                                  {line.lyrics.split('').map((char: string, charIdx: number) => {
                                    const chord = line.chords.find((c: any) => c.position === charIdx)
                                    return chord ? (
                                      <span key={charIdx} className="inline-block min-w-[2ch]">
                                        {chord.chord}
                                      </span>
                                    ) : (
                                      <span key={charIdx} className="inline-block w-[1ch]"> </span>
                                    )
                                  })}
                                </div>
                              )}
                              {/* Lyrics line */}
                              <div>{line.lyrics || ' '}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : song.lyricsText ? (
              <ChordTransposer 
                lyricsText={song.lyricsText} 
                originalKey={song.originalKey} 
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Lyrics & Chords</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No lyrics available</p>
                </CardContent>
              </Card>
            )}
            {/* YouTube Video */}
            {song.videoId && (
              <YouTubeVideo videoId={song.videoId} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Song Info */}
            <Card>
              <CardHeader>
                <CardTitle>Song Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Original Key</p>
                  <Badge variant="secondary" className="mt-1 text-lg">
                    {song.originalKey}
                  </Badge>
                </div>

                {song.tempo && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tempo</p>
                    <p className="mt-1 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {song.tempo} BPM
                    </p>
                  </div>
                )}

                {song.timeSignature && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Time Signature</p>
                    <p className="mt-1">{song.timeSignature}</p>
                  </div>
                )}

                {song.capo !== undefined && song.capo > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Capo</p>
                    <p className="mt-1">Fret {song.capo}</p>
                  </div>
                )}

                {song.difficulty && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Difficulty</p>
                    <Badge 
                      variant={
                        song.difficulty === 'beginner' ? 'default' :
                        song.difficulty === 'intermediate' ? 'secondary' :
                        'destructive'
                      }
                      className="mt-1 capitalize"
                    >
                      {song.difficulty}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            {song.tags && song.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {song.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Added by */}
            <Card>
              <CardHeader>
                <CardTitle>Added By</CardTitle>
              </CardHeader>
              <CardContent>
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-expect-error */}
                <p className="text-sm">{song.createdBy?.name || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(song.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}