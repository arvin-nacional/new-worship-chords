"use client"

import Link from "next/link"
import { Music, Menu, X, User, LogOut, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"

interface NavbarProps {
  session?: {
    user?: {
      name?: string | null
      email?: string | null
    }
  } | null
}

export function Navbar({ session }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
           <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Music className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Worship Chords</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Home
            </Link>
            <Link 
              href="/songs" 
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Songs
            </Link>
            
            {session ? (
              <>
                <Link 
                  href="/add-song" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Add Song
                </Link>
                
                <div className="flex items-center gap-3 ml-4 pl-4 border-l">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span className="text-muted-foreground">{session.user?.name}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => signOut()}
                    >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                    </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 ml-4 pl-4 border-l">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-accent rounded-md transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
            mobileMenuOpen ? "max-h-96 pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col space-y-3 pt-4 border-t">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/songs"
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Songs
            </Link>

            {session ? (
              <>
                <Link
                  href="/add-song"
                  className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Plus className="h-4 w-4" />
                  Add Song
                </Link>
                
                <div className="px-4 py-2 border-t mt-2 pt-4">
                  <div className="flex items-center gap-2 text-sm mb-3 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{session.user?.name}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm" 
                    onClick={() => {
                        setMobileMenuOpen(false);
                        signOut();
                    }}
                    >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                    </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-4 pt-2 border-t mt-2">
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button className="w-full" size="sm" asChild>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}