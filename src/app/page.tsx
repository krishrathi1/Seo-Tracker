"use client"

import { useEffect, useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { AppShell } from "@/components/seo/app-shell"
import { Activity } from "lucide-react"

function seedDatabase() {
  return fetch("/api/seo/seed", { method: "POST" }).then((res) => {
    if (!res.ok) throw new Error("Failed to seed database")
    return res.json()
  })
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground animate-pulse">
          <Activity className="h-7 w-7" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Initializing RankPulse</h2>
          <p className="text-sm text-muted-foreground">Setting up your workspace...</p>
        </div>
        <div className="flex gap-1 mt-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [isReady, setIsReady] = useState(false)
  const hasSeededRef = useRef(false)

  const seedMutation = useMutation({
    mutationFn: seedDatabase,
    onSuccess: () => {
      setTimeout(() => setIsReady(true), 600)
    },
    onError: () => {
      setIsReady(true)
    },
  })

  useEffect(() => {
    if (!hasSeededRef.current) {
      hasSeededRef.current = true
      seedMutation.mutate()
    }
  }, [seedMutation])

  if (!isReady) {
    return <LoadingScreen />
  }

  return <AppShell />
}
