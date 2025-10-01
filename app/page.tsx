import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Music } from "lucide-react";

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="flex items-center gap-3">
          <Music className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold">Worship Chords</h1>
        </div>
        
        <p className="max-w-md text-muted-foreground">
          Your platform for managing and viewing worship song chords
        </p>

        {session ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg">
              Welcome back, <span className="font-semibold">{session.user?.name}</span>!
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/songs">Browse Songs</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/api/auth/signout">Sign Out</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">Create Account</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}