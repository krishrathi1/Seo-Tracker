'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  Globe,
  Search,
  Target,
  ShieldCheck,
  Link,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

// ─── Types ──────────────────────────────────────────────────────────
type OnboardingStep = 'input' | 'analyzing' | 'complete' | 'error'

interface AnalysisResult {
  projectId: string
  projectName: string
  domain: string
  seoScore: number
  keywordsFound: number
  issuesFound: number
}

interface OnboardingFlowProps {
  onComplete: (result: AnalysisResult) => void
}

// ─── Analysis Steps (mapped from backend step names) ────────────────
const ANALYSIS_STEPS = [
  { id: 'reading_website', label: 'Reading website content...' },
  { id: 'searching_backlinks', label: 'Searching for backlinks & mentions...' },
  { id: 'analyzing_seo', label: 'Running SEO analysis...' },
  { id: 'saving_results', label: 'Saving results...' },
]

// Map backend step names to our step indices
const STEP_MAP: Record<string, number> = {
  reading_website: 0,
  searching_backlinks: 1,
  analyzing_seo: 2,
  saving_results: 3,
  complete: 3,
}

// ─── Example URLs ───────────────────────────────────────────────────
const EXAMPLE_URLS = [
  { label: 'stripe.com', url: 'stripe.com' },
  { label: 'vercel.com', url: 'vercel.com' },
  { label: 'shopify.com', url: 'shopify.com' },
  { label: 'notion.so', url: 'notion.so' },
]

// ─── Feature Cards Data ─────────────────────────────────────────────
const FEATURES = [
  { icon: Target, title: 'Keyword Tracking', description: 'AI-powered keyword discovery & tracking' },
  { icon: ShieldCheck, title: 'Site Audit', description: 'Comprehensive technical SEO analysis' },
  { icon: Link, title: 'Backlink Analysis', description: 'Monitor your link profile health' },
  { icon: Users, title: 'Competitor Intel', description: 'Analyze & outrank competition' },
  { icon: Search, title: 'AI Research', description: 'LLM-powered keyword research' },
  { icon: Activity, title: 'AI Chat Assistant', description: 'Ask any SEO question to our AI' },
  { icon: CheckCircle2, title: 'Content Optimizer', description: 'Score & optimize your content' },
  { icon: Globe, title: 'Social Preview', description: 'See how your site looks in search' },
]

// ─── Step Indicator Component ───────────────────────────────────────
function StepIndicator({
  step,
  isComplete,
  isActive,
}: {
  step: string
  isComplete: boolean
  isActive: boolean
}) {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-shrink-0">
        {isComplete ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </motion.div>
        ) : isActive ? (
          <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/20" />
        )}
      </div>
      <span
        className={`text-sm transition-colors duration-300 ${
          isComplete
            ? 'text-emerald-600 dark:text-emerald-400 font-medium'
            : isActive
            ? 'text-foreground font-medium'
            : 'text-muted-foreground'
        }`}
      >
        {step}
      </span>
    </motion.div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────
export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = React.useState<OnboardingStep>('input')
  const [url, setUrl] = React.useState('')
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0)
  const [progressPercent, setProgressPercent] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const abortControllerRef = React.useRef<AbortController | null>(null)
  const pollingIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  // Validate URL
  const isValidUrl = (value: string): boolean => {
    if (!value.trim()) return false
    const withProtocol = value.match(/^https?:\/\//) ? value : `https://${value}`
    try {
      const urlObj = new URL(withProtocol)
      return !!urlObj.hostname && urlObj.hostname.includes('.')
    } catch {
      return false
    }
  }

  // Normalize URL
  const normalizeUrl = (value: string): string => {
    let normalized = value.trim()
    if (!normalized.match(/^https?:\/\//)) {
      normalized = `https://${normalized}`
    }
    return normalized
  }

  // Extract domain from URL
  const extractDomain = (value: string): string => {
    try {
      const urlObj = new URL(normalizeUrl(value))
      return urlObj.hostname.replace(/^www\./, '')
    } catch {
      return value
    }
  }

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
      if (abortControllerRef.current) abortControllerRef.current.abort()
    }
  }, [])

  // Handle analysis
  const handleAnalyze = React.useCallback(async (targetUrl?: string) => {
    const urlToAnalyze = targetUrl || url
    if (!isValidUrl(urlToAnalyze)) {
      setError('Please enter a valid URL (e.g., example.com)')
      return
    }

    const domain = extractDomain(urlToAnalyze)
    setError(null)
    setStep('analyzing')
    setCurrentStepIndex(0)
    setProgressPercent(0)

    const normalizedTarget = normalizeUrl(urlToAnalyze)
    abortControllerRef.current = new AbortController()

    // Start polling for progress from the analyze-status endpoint
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/seo/analyze-status?url=${encodeURIComponent(normalizedTarget)}`)
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          if (statusData.step && STEP_MAP[statusData.step] !== undefined) {
            setCurrentStepIndex(STEP_MAP[statusData.step])
          }
          if (statusData.progress) {
            setProgressPercent(statusData.progress)
          }
        }
      } catch {
        // Ignore polling errors - they're non-critical
      }
    }, 1500)

    try {
      const response = await fetch('/api/seo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedTarget }),
        signal: abortControllerRef.current.signal,
      })

      const data = await response.json()

      // Stop polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Analysis failed. Please try again.')
      }

      // Complete all steps visually
      setCurrentStepIndex(ANALYSIS_STEPS.length - 1)
      setProgressPercent(100)

      // Small delay for visual satisfaction
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Handle the Task 2 detailed response format
      const resultData: AnalysisResult = {
        projectId: data.projectId || '',
        projectName: data.siteOverview?.title || domain,
        domain: data.domain || domain,
        seoScore: data.overallScore || data.technicalAudit?.score || 0,
        keywordsFound: data.keywords?.length || 0,
        issuesFound: data.technicalAudit?.issues?.length || 0,
      }

      setAnalysisResult(resultData)
      setStep('complete')

      // Auto-transition after 4 seconds
      setTimeout(() => {
        onComplete(resultData)
      }, 4000)
    } catch (err) {
      // Stop polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }

      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled, go back to input
        setStep('input')
        return
      }

      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.')
      setStep('error')
    }
  }, [url, onComplete])

  // Handle example URL click
  const handleExampleClick = (exampleUrl: string) => {
    setUrl(exampleUrl)
    setError(null)
    // Auto-submit after a brief visual update
    setTimeout(() => {
      handleAnalyze(exampleUrl)
    }, 200)
  }

  // Handle retry
  const handleRetry = () => {
    setStep('input')
    setError(null)
    setCurrentStepIndex(0)
    setProgressPercent(0)
    setAnalysisResult(null)
  }

  // Handle cancel during analysis
  const handleCancel = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setStep('input')
    setError(null)
    setCurrentStepIndex(0)
    setProgressPercent(0)
  }

  // Calculate progress for display
  const displayProgress = Math.max(
    progressPercent,
    ((currentStepIndex + 1) / ANALYSIS_STEPS.length) * 100
  )

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-background to-emerald-50/40 dark:from-emerald-950/30 dark:via-background dark:to-emerald-950/10" />
      
      {/* Decorative dots pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
        backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <AnimatePresence mode="wait">
          {/* ─── Step 1: URL Input ─── */}
          {step === 'input' && (
            <motion.div
              key="input"
              className="w-full max-w-2xl flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {/* Logo */}
              <motion.div
                className="flex items-center gap-3 mb-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                  <Activity className="h-6 w-6" />
                </div>
                <span className="text-2xl font-bold tracking-tight">RankPulse</span>
              </motion.div>

              {/* Tagline */}
              <motion.p
                className="text-muted-foreground text-base mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Free & Open Source SEO Intelligence Platform
              </motion.p>

              {/* Search Input */}
              <motion.div
                className="w-full mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="relative group">
                  <div className="absolute inset-0 rounded-xl bg-emerald-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -m-1" />
                  <div className="relative flex items-center">
                    <Globe className="absolute left-4 h-5 w-5 text-muted-foreground group-focus-within:text-emerald-600 transition-colors" />
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder="Enter your website URL..."
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value)
                        setError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAnalyze()
                      }}
                      className="h-14 pl-12 pr-4 text-base rounded-xl border-2 border-border focus:border-emerald-500 focus:ring-emerald-500/20 bg-background/80 backdrop-blur-sm shadow-sm"
                      autoFocus
                    />
                  </div>
                </div>
              </motion.div>

              {/* Error Message */}
              {error && (
                <motion.div
                  className="w-full mb-4 flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-2.5 rounded-lg"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Example URLs */}
              <motion.div
                className="flex flex-wrap items-center justify-center gap-2 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span className="text-xs text-muted-foreground mr-1">Try:</span>
                {EXAMPLE_URLS.map((example) => (
                  <button
                    key={example.url}
                    onClick={() => handleExampleClick(example.url)}
                    className="px-3 py-1.5 text-xs font-medium rounded-full border border-border bg-background/60 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-all duration-200 cursor-pointer"
                  >
                    {example.label}
                  </button>
                ))}
              </motion.div>

              {/* Analyze Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={() => handleAnalyze()}
                  disabled={!url.trim()}
                  size="lg"
                  className="h-12 px-8 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-200 gap-2"
                >
                  <Search className="h-4 w-4" />
                  Analyze Website
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>

              {/* Open Source Badge */}
              <motion.div
                className="flex items-center gap-2 mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25 gap-1.5 px-3 py-1 text-xs">
                  <Activity className="h-3.5 w-3.5" />
                  100% Free & Open Source · MIT License
                </Badge>
              </motion.div>

              {/* Feature Cards */}
              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                {FEATURES.map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.08 }}
                  >
                    <Card className="border-border/50 bg-background/40 backdrop-blur-sm hover:border-emerald-300/50 dark:hover:border-emerald-700/50 transition-colors duration-200">
                      <CardContent className="p-3 flex flex-col items-center text-center gap-1.5">
                        <feature.icon className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500" />
                        <span className="text-[11px] font-semibold">{feature.title}</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">{feature.description}</span>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ─── Step 2: Analysis Progress ─── */}
          {step === 'analyzing' && (
            <motion.div
              key="analyzing"
              className="w-full max-w-md flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              {/* Logo */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="text-xl font-bold tracking-tight">RankPulse</span>
              </div>

              {/* URL being analyzed */}
              <div className="flex items-center gap-2 mb-8 text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">{normalizeUrl(url)}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full mb-8">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-emerald-500"
                    animate={{ width: `${displayProgress}%` }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    Step {currentStepIndex + 1} of {ANALYSIS_STEPS.length}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(displayProgress)}%
                  </span>
                </div>
              </div>

              {/* Step Indicators */}
              <div className="w-full space-y-4 mb-8">
                {ANALYSIS_STEPS.map((analysisStep, index) => (
                  <StepIndicator
                    key={analysisStep.id}
                    step={analysisStep.label}
                    isComplete={index < currentStepIndex}
                    isActive={index === currentStepIndex}
                  />
                ))}
              </div>

              {/* Cancel Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="text-muted-foreground hover:text-foreground gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </motion.div>
          )}

          {/* ─── Step 3: Complete ─── */}
          {step === 'complete' && analysisResult && (
            <motion.div
              key="complete"
              className="w-full max-w-md flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {/* Success Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              >
                <div className="relative mb-6">
                  <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.3 }}
                    >
                      <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                    </motion.div>
                  </div>
                  {/* Ring animation */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-emerald-500/30"
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                  />
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                className="text-2xl font-bold tracking-tight mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Analysis Complete!
              </motion.h2>

              <motion.p
                className="text-muted-foreground text-sm mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {analysisResult.projectName} ({analysisResult.domain})
              </motion.p>

              {/* Summary Cards */}
              <motion.div
                className="grid grid-cols-3 gap-3 w-full mb-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="border-emerald-200/50 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {analysisResult.seoScore}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">
                      SEO Score
                    </span>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <span className="text-2xl font-bold">{analysisResult.keywordsFound}</span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">
                      Keywords
                    </span>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <span className="text-2xl font-bold">{analysisResult.issuesFound}</span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">
                      Issues
                    </span>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Enter Dashboard Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  onClick={() => onComplete(analysisResult)}
                  size="lg"
                  className="h-12 px-8 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all duration-200 gap-2"
                >
                  Enter Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>

              <motion.p
                className="text-xs text-muted-foreground mt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                Auto-entering in a few seconds...
              </motion.p>
            </motion.div>
          )}

          {/* ─── Error State ─── */}
          {step === 'error' && (
            <motion.div
              key="error"
              className="w-full max-w-md flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Error Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              >
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
              </motion.div>

              <h2 className="text-xl font-bold tracking-tight mb-2">Analysis Failed</h2>
              <p className="text-muted-foreground text-sm text-center mb-6 max-w-sm">
                {error || 'Something went wrong while analyzing the website. This could be due to the site being unreachable or blocking automated requests.'}
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRetry}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Try Different URL
                </Button>
                <Button
                  onClick={() => handleAnalyze()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <Search className="h-4 w-4" />
                  Retry Analysis
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-4">
        <div className="flex items-center justify-center gap-4">
          <p className="text-xs text-muted-foreground/60">
            RankPulse &middot; Open Source SEO Platform
          </p>
          <span className="text-xs text-muted-foreground/40">|</span>
          <p className="text-xs text-muted-foreground/60">
            MIT License &middot; No Sign Up Required
          </p>
        </div>
      </div>
    </div>
  )
}
