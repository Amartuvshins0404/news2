"use client"

import { useEffect } from "react"
import { TopNav } from "@/components/top-nav"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Error occurred:", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container max-w-2xl text-center">
          <div className="rounded-full bg-destructive/10 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
          <p className="text-lg text-muted-foreground mb-8">An unexpected error occurred. Please try again.</p>
          <Button onClick={reset} size="lg">
            Try Again
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
