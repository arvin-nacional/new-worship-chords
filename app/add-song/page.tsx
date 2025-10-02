import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AddSongForm } from "@/components/forms/add-song-form"

export default async function AddSongPage() {
  const session = await auth()

  if (!session) {
    redirect("/login?callbackUrl=/add-song")
  }

  return <AddSongForm />
}