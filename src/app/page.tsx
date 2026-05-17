"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/seo/app-shell"
import { OnboardingFlow } from "@/components/seo/onboarding-flow"
import { useSeoStore } from "@/lib/seo-store"
import { Activity } from "lucide-react"

interface AnalysisResult {
  projectId: string
  projectName: string
  domain: string
  seoScore: number
  keywordsFound: number
  issuesFound: number
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white animate-pulse">
          <Activity className="h-7 w-7" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">Initializing RankPulse</h2>
          <p className="text-sm text-muted-foreground">Checking your workspace...</p>
        </div>
        <div className="flex gap-1 mt-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasProject, setHasProject] = useState(false)
  const setActiveProjectId = useSeoStore((s) => s.setActiveProjectId)
  const setAnalyzedUrl = useSeoStore((s) => s.setAnalyzedUrl)
  const showOnboarding = useSeoStore((s) => s.showOnboarding)
  const setShowOnboarding = useSeoStore((s) => s.setShowOnboarding)

  // Check if a project exists on mount
  useEffect(() => {
    async function checkProject() {
      try {
        const res = await fetch("/api/seo/projects")
        if (res.ok) {
          const data = await res.json()
          if (data.projects && data.projects.length > 0) {
            setHasProject(true)
            setActiveProjectId(data.projects[0].id)
          } else {
            setHasProject(false)
          }
        } else {
          setHasProject(false)
        }
      } catch {
        setHasProject(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkProject()
  }, [setActiveProjectId])

  // Handle onboarding complete
  const handleOnboardingComplete = (result: AnalysisResult) => {
    setActiveProjectId(result.projectId)
    setAnalyzedUrl(result.domain)
    setHasProject(true)
    setShowOnboarding(false)
  }

  // Loading state
  if (isLoading) {
    return <LoadingScreen />
  }

  // Show onboarding if no project exists OR user requested new analysis
  if (!hasProject || showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />
  }

  // Show main app shell
  return <AppShell />
}
