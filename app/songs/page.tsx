/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Music, Plus, Star, Eye, Heart } from "lucide-react"
import dbConnect from "@/lib/mongoose"
import Song from "@/models/Song"
import { SongSearch } from "@/components/forms/song-search"

export const dynamic = 'force-dynamic'

export default async function SongsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; key?: string; difficulty?: string }>
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

  await dbConnect()

  // Build query
  const query: any = {}
  const params = await searchParams
if (params.search) {
  query.$or = [
    { title: { $regex: params.search, $options: 'i' } },
    { artist: { $regex: params.search, $options: 'i' } },
    { writer: { $regex: params.search, $options: 'i' } },
    { tags: { $in: [new RegExp(params.search, 'i')] } }
  ]
}
if (params.key) query.originalKey = params.key
if (params.difficulty) query.difficulty = params.difficulty

  const songs = await Song.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('createdBy', 'name')
    .select('-comments -sections')
    .lean()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Music className="h-10 w-10 text-primary" />
              Worship Songs
            </h1>
            <p className="text-muted-foreground mt-2">
              Browse and discover worship songs with chords
            </p>
          </div>
          <Button asChild>
            <Link href="/add-song">
              <Plus className="h-4 w-4 mr-2" />
              Add Song
            </Link>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <SongSearch />
          </CardContent>
        </Card>

        {/* Songs Grid */}
        {songs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Music className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No songs found</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to add a song!
              </p>
              <Button asChild>
                <Link href="/add-song">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Song
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {songs.map((song: any) => (
              <Link key={song._id.toString()} href={`/songs/${song._id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2">{song.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {song.artist || 'Unknown Artist'}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{song.originalKey}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        By {song.writer}
                      </p>
                      
                      {/* Tags */}
                      {song.tags && song.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {song.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {song.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{song.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {song.averageRating?.toFixed(1) || '0.0'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {song.viewCount || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {song.favoritesCount || 0}
                        </div>
                      </div>

                      {/* Difficulty Badge */}
                      {song.difficulty && (
                        <Badge 
                          variant={
                            song.difficulty === 'beginner' ? 'default' :
                            song.difficulty === 'intermediate' ? 'secondary' :
                            'destructive'
                          }
                          className="capitalize"
                        >
                          {song.difficulty}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}