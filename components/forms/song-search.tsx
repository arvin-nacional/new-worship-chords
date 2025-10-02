"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

export function SongSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')

  // Sync state with URL params
  useEffect(() => {
    setSearchValue(searchParams.get('search') || '')
  }, [searchParams])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (searchValue) {
        params.set('search', searchValue)
      } else {
        params.delete('search')
      }

      startTransition(() => {
        router.push(`/songs?${params.toString()}`, { scroll: false })
      })
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [searchValue, router, searchParams])

  return (
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search songs, artists, or tags..."
        className="pl-10"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        disabled={isPending}
      />
    </div>
  )
}