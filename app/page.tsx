import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Music, ArrowRight } from "lucide-react";
import { ImageCarousel } from "@/components/image-carousel";

const carouselImages = [
  "/images/acoustic-guitar-snare-drum-black-background-isolated.jpg",
  "/images/bass-drum-with-pedal-musical-instrument-black-background.jpg",
  "/images/drum-musical-keys-black-background-close-up.jpg",
  "/images/wide-closeup-shot-brown-piano-keyboard.jpg",
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Carousel Section */}
      <ImageCarousel images={carouselImages} interval={4000}>
      <div className="max-w-4xl 2xl:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 py-16">
          <div className="flex items-center justify-center gap-3">
            <Music className="h-16 w-16 text-white drop-shadow-lg" />
            <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg">
              Worship Chords
            </h1>
          </div>
          
          <h2 className="text-2xl md:text-4xl font-semibold text-white drop-shadow-md">
            Your Ultimate Worship Song Resource
          </h2>
          
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
            Discover, learn, and master worship songs with our comprehensive collection 
            of chords, transposition tools, and audio playback features. Perfect for worship 
            leaders, musicians, and anyone passionate about worship music.
          </p>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button asChild size="lg" className="text-lg px-8 bg-white text-primary hover:bg-white/90">
              <Link href="/songs">
                Browse Songs
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="text-lg px-8 bg-white/10 text-white border-white/30 hover:bg-white/20">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </ImageCarousel>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-background to-muted/20 py-16">
      <div className="max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3 p-6 rounded-lg bg-card border">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Extensive Library</h3>
              <p className="text-muted-foreground">
                Access a growing collection of worship songs with accurate chords and lyrics
              </p>
            </div>

            <div className="text-center space-y-3 p-6 rounded-lg bg-card border">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Transpose & Play</h3>
              <p className="text-muted-foreground">
                Easily transpose songs to any key and play along with audio playback
              </p>
            </div>

            <div className="text-center space-y-3 p-6 rounded-lg bg-card border">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Community Driven</h3>
              <p className="text-muted-foreground">
                Contribute your favorite songs and help the worship community grow
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}