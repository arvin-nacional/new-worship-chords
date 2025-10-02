import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { AddSongForm } from "@/components/forms/add-song-form"
import dbConnect from "@/lib/mongoose"
import Song from "@/models/Song"
import { Types } from "mongoose"
import { musicalKeys, timeSignatures, difficulties } from "@/lib/validations/song"

export const dynamic = 'force-dynamic'

export default async function EditSongPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session) {
    const { id } = await params
    redirect(`/login?callbackUrl=/songs/${id}/edit`)
  }

  const { id } = await params

  // Validate ObjectId
  if (!Types.ObjectId.isValid(id)) {
    notFound()
  }

  await dbConnect()

  const song = await Song.findById(id).lean()

  if (!song) {
    notFound()
  }

  // Check if user is the creator
  if (song.createdBy.toString() !== session?.user?.id) {
    redirect(`/songs/${id}`)
  }

  // Prepare initial values for the form
const initialValues = {
    title: song.title,
    artist: song.artist || "",
    writer: song.writer,
    originalKey: song.originalKey as typeof musicalKeys[number],
    tempo: song.tempo,
    timeSignature: song.timeSignature as typeof timeSignatures[number] | undefined,
    capo: song.capo,
    difficulty: song.difficulty as typeof difficulties[number] | undefined,
    lyricsText: song.lyricsText || "",
    videoId: song.videoId || "",
    spotifyId: song.spotifyId || "",
    imageUrl: song.imageUrl || "",
    tags: song.tags || [],
    vocalsUrl: song.vocalsUrl || "",
    instrumentalUrl: song.instrumentalUrl || "",
  }

  return (
    <AddSongForm 
      mode="edit" 
      initialValues={initialValues} 
      songId={id}
      initialVocalsUrl={song.vocalsUrl}
      initialInstrumentalUrl={song.instrumentalUrl}
    />
  )
}