'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import {
  Code2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,
  FileJson,
  Globe,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Lightbulb,
  ExternalLink,
  Layers,
  Braces,
  TreePine,
  Award,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { useSeoStore } from '@/lib/seo-store'

// ─── Types ────────────────────────────────────────────────────────────────
interface SchemaData {
  project: { id: string; name: string; domain: string }
  score: number
  grade: string
  detectedSchemas: Array<{
    type: string
    count: number
    valid: boolean
    properties: string[]
    errors: string[]
    warnings: string[]
  }>
  richResultEligibility: Array<{
    type: string
    eligible: boolean
    reason: string
  }>
  validationSummary: {
    totalChecks: number
    passed: number
    warnings: number
    errors: number
  }
  recommendations: string[]
  schemaCode: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────
const SCHEMA_ICONS: Record<string, React.ElementType> = {
  Article: FileJson,
  Organization: Globe,
  WebSite: Globe,
  BreadcrumbList: ChevronRight,
  FAQPage: BookOpen,
  Product: Layers,
  LocalBusiness: Globe,
  Person: Award,
  Event: Sparkles,
  Review: ThumbsUp,
  VideoObject: Code2,
  ImageObject: Code2,
  HowTo: Lightbulb,
  JobPosting: Code2,
  Course: BookOpen,
  Recipe: Code2,
  SoftwareApplication: Code2,
  AggregateRating: Award,
}

const SCHEMA_COLORS: Record<string, string> = {
  Article: '#10b981',
  Organization: '#06b6d4',
  WebSite: '#8b5cf6',
  BreadcrumbList: '#f59e0b',
  FAQPage: '#ec4899',
  Product: '#f97316',
  LocalBusiness: '#14b8a6',
  Person: '#6366f1',
  Event: '#ef4444',
  Review: '#22c55e',
  VideoObject: '#a855f7',
  ImageObject: '#0ea5e9',
  HowTo: '#eab308',
  JobPosting: '#64748b',
  Course: '#0d9488',
  Recipe: '#f43f5e',
  SoftwareApplication: '#3b82f6',
  AggregateRating: '#d946ef',
}

const RICH_RESULT_TYPES: Array<{ type: string; description: string; icon: React.ElementType }> = [
  { type: 'Rich Snippet', description: 'Enhanced search result with extra info', icon: Sparkles },
  { type: 'Knowledge Panel', description: 'Side panel with entity details', icon: Globe },
  { type: 'FAQ Rich Result', description: 'Expandable Q&A in search results', icon: BookOpen },
  { type: 'Breadcrumbs', description: 'Navigation trail in search results', icon: ChevronRight },
  { type: 'Product Rich Result', description: 'Price, availability, and reviews', icon: Layers },
  { type: 'Event Rich Result', description: 'Event date and location info', icon: Code2 },
  { type: 'How-To Rich Result', description: 'Step-by-step guide preview', icon: Lightbulb },
  { type: 'Review Stars', description: 'Star ratings in search results', icon: Award },
]

const SCHEMA_REFERENCE: Array<{
  type: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: string
}> = [
  { type: 'Organization', description: 'Define your company/brand info for knowledge panels', priority: 'high', category: 'Identity' },
  { type: 'WebSite', description: 'Enable sitelinks search box in Google results', priority: 'high', category: 'Identity' },
  { type: 'Article', description: 'Rich snippets for news/blog content with author & date', priority: 'high', category: 'Content' },
  { type: 'BreadcrumbList', description: 'Show navigation breadcrumbs in search results', priority: 'high', category: 'Navigation' },
  { type: 'FAQPage', description: 'Expandable Q&A pairs directly in search results', priority: 'medium', category: 'Content' },
  { type: 'Product', description: 'Pricing, availability, and review stars for products', priority: 'medium', category: 'Commerce' },
  { type: 'HowTo', description: 'Step-by-step instructions with rich preview', priority: 'medium', category: 'Content' },
  { type: 'LocalBusiness', description: 'NAP info, hours, and map for local businesses', priority: 'medium', category: 'Local' },
  { type: 'VideoObject', description: 'Video thumbnail, duration, and description', priority: 'medium', category: 'Media' },
  { type: 'Review', description: 'Star ratings and review snippets in results', priority: 'low', category: 'Content' },
  { type: 'Event', description: 'Event date, location, and ticket info', priority: 'low', category: 'Content' },
  { type: 'Person', description: 'Author profile and knowledge panel', priority: 'low', category: 'Identity' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' as const },
  }),
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function getScoreColor(score: number): string {
  if (score < 40) return '#ef4444'
  if (score < 70) return '#f59e0b'
  return '#10b981'
}

function getScoreColorClass(score: number): string {
  if (score < 40) return 'text-red-500'
  if (score < 70) return 'text-amber-500'
  return 'text-emerald-500'
}

function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#10b981'
  if (grade.startsWith('B')) return '#22c55e'
  if (grade.startsWith('C')) return '#f59e0b'
  if (grade.startsWith('D')) return '#f97316'
  return '#ef4444'
}

function getGradeBgClass(grade: string): string {
  if (grade.startsWith('A')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
  if (grade.startsWith('B')) return 'bg-green-500/10 text-green-600 dark:text-green-400'
  if (grade.startsWith('C')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
  if (grade.startsWith('D')) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
  return 'bg-red-500/10 text-red-600 dark:text-red-400'
}

function getSchemaIcon(type: string): React.ElementType {
  return SCHEMA_ICONS[type] ?? Code2
}

function getSchemaColor(type: string): string {
  return SCHEMA_COLORS[type] ?? '#10b981'
}

// ─── Fetch hook ───────────────────────────────────────────────────────────
function useSchemaData(projectId: string) {
  return useQuery<SchemaData>({
    queryKey: ['seo-schema', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/seo/schema?projectId=${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch schema data')
      return res.json()
    },
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  })
}

// ─── Schema Score Gauge ──────────────────────────────────────────────────
function SchemaScoreGauge({ score, grade }: { score: number; grade: string }) {
  const [animatedScore, setAnimatedScore] = React.useState(0)
  const size = 180
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (animatedScore / 100) * circumference
  const color = getScoreColor(score)
  const gradeColor = getGradeColor(grade)

  React.useEffect(() => {
    let frame: number
    const start = animatedScore
    const duration = 1200
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimatedScore(Math.round(start + (score - start) * eased))
      if (t < 1) frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [score])

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-5xl font-bold tabular-nums" style={{ color }}>{animatedScore}</span>
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className="text-sm font-bold px-2 py-0.5 rounded"
            style={{ color: gradeColor, backgroundColor: gradeColor + '15' }}
          >
            Grade {grade}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Schema Type Card ────────────────────────────────────────────────────
function SchemaTypeCard({ schema }: { schema: SchemaData['detectedSchemas'][number] }) {
  const color = getSchemaColor(schema.type)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
              style={{ backgroundColor: color + '15' }}
            >
              {React.createElement(getSchemaIcon(schema.type), { className: 'h-5 w-5', style: { color } })}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold">{schema.type}</h4>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  ×{schema.count}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {schema.properties.length} properties detected
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] shrink-0',
              schema.valid
                ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'border-red-500/30 text-red-600 dark:text-red-400'
            )}
          >
            {schema.valid ? (
              <><CheckCircle2 className="h-3 w-3 mr-1" />Valid</>
            ) : (
              <><XCircle className="h-3 w-3 mr-1" />Invalid</>
            )}
          </Badge>
        </div>

        {/* Properties */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {schema.properties.slice(0, 8).map((prop) => (
            <span
              key={prop}
              className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {prop}
            </span>
          ))}
          {schema.properties.length > 8 && (
            <span className="inline-flex items-center rounded-md bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              +{schema.properties.length - 8} more
            </span>
          )}
        </div>

        {/* Errors & Warnings */}
        {(schema.errors.length > 0 || schema.warnings.length > 0) && (
          <div className="mt-3 space-y-1.5">
            {schema.errors.slice(0, 2).map((err, i) => (
              <div key={`err-${i}`} className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                <span className="line-clamp-1">{err}</span>
              </div>
            ))}
            {schema.warnings.slice(0, 2).map((warn, i) => (
              <div key={`warn-${i}`} className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                <span className="line-clamp-1">{warn}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Schema Tree Node ────────────────────────────────────────────────────
interface SchemaChildNode {
  name: string
  properties?: string[]
  childNodes?: SchemaChildNode[]
}

function SchemaTreeNode({
  name,
  properties,
  childNodes,
  depth = 0,
}: {
  name: string
  properties?: string[]
  childNodes?: SchemaChildNode[]
  depth?: number
}) {
  const [expanded, setExpanded] = React.useState(depth < 2)
  const hasChildren = childNodes && childNodes.length > 0

  return (
    <div style={{ marginLeft: depth > 0 ? 20 : 0 }}>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-2 py-1.5 text-sm w-full text-left hover:bg-muted/50 rounded px-2 transition-colors',
          depth === 0 && 'font-semibold',
        )}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <Braces className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
        <span className="font-medium" style={{ color: getSchemaColor(name) }}>{name}</span>
        {properties && properties.length > 0 && (
          <span className="text-[10px] text-muted-foreground ml-1">
            ({properties.length} props)
          </span>
        )}
      </button>
      {expanded && (
        <div className="border-l border-border/50 ml-2 pl-1">
          {/* Show properties */}
          {properties && properties.length > 0 && (
            <div className="ml-5 space-y-0.5 py-1">
              {properties.map((prop) => (
                <div key={prop} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Minus className="h-2.5 w-2.5 shrink-0" />
                  <span className="font-mono">{prop}</span>
                </div>
              ))}
            </div>
          )}
          {/* Show child nodes */}
          {hasChildren && childNodes.map((child, i) => (
            <SchemaTreeNode
              key={`${child.name}-${i}`}
              name={child.name}
              properties={child.properties}
              childNodes={child.childNodes}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Validation Summary Bar ──────────────────────────────────────────────
function ValidationSummaryBar({ summary }: { summary: SchemaData['validationSummary'] }) {
  const { totalChecks, passed, warnings, errors } = summary
  const passPercent = totalChecks > 0 ? (passed / totalChecks) * 100 : 0
  const warnPercent = totalChecks > 0 ? (warnings / totalChecks) * 100 : 0
  const errorPercent = totalChecks > 0 ? (errors / totalChecks) * 100 : 0

  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted/50">
        <div
          className="rounded-l-full transition-all duration-700"
          style={{ width: `${passPercent}%`, backgroundColor: '#10b981' }}
        />
        <div
          className="transition-all duration-700"
          style={{ width: `${warnPercent}%`, backgroundColor: '#f59e0b' }}
        />
        <div
          className="rounded-r-full transition-all duration-700"
          style={{ width: `${errorPercent}%`, backgroundColor: '#ef4444' }}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <div>
            <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{passed}</p>
            <p className="text-[10px] text-muted-foreground">Passed</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <div>
            <p className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400">{warnings}</p>
            <p className="text-[10px] text-muted-foreground">Warnings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <div>
            <p className="text-sm font-bold tabular-nums text-red-600 dark:text-red-400">{errors}</p>
            <p className="text-[10px] text-muted-foreground">Errors</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Schema Code Viewer ──────────────────────────────────────────────────
function SchemaCodeViewer({ code }: { code: string | null }) {
  const [copied, setCopied] = React.useState(false)

  if (!code) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        No JSON-LD code detected
      </div>
    )
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-7 gap-1.5 text-xs z-10"
        onClick={handleCopy}
      >
        {copied ? (
          <><Check className="h-3 w-3" />Copied</>
        ) : (
          <><Copy className="h-3 w-3" />Copy</>
        )}
      </Button>
      <ScrollArea className="max-h-[400px]">
        <pre className="text-xs font-mono leading-relaxed p-4 rounded-lg bg-muted/30 overflow-x-auto">
          <code>{code}</code>
        </pre>
      </ScrollArea>
    </div>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────────────────
function SchemaSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Score section skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Skeleton className="h-[180px] w-[180px] rounded-full" />
              <div className="flex-1 w-full space-y-4">
                <Skeleton className="h-6 w-40" />
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Schema cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-5 w-14 rounded-md" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Table skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────
export function SchemaAnalyzerModule() {
  const activeProjectId = useSeoStore((s) => s.activeProjectId)
  const projectId = activeProjectId ?? 'first'
  const { data, isLoading, error } = useSchemaData(projectId)

  // ─── Loading State ────────────────────────────────────────────────────
  if (isLoading) {
    return <SchemaSkeleton />
  }

  // ─── Error State ──────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold">Unable to Load Schema Data</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {error?.message || 'An unexpected error occurred while analyzing structured data. Please try again.'}
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // ─── Derived Data ─────────────────────────────────────────────────────
  const validCount = data.detectedSchemas.filter((s) => s.valid).length
  const invalidCount = data.detectedSchemas.length - validCount
  const totalInstances = data.detectedSchemas.reduce((sum, s) => sum + s.count, 0)

  // Pie chart data for schema distribution
  const schemaDistData = data.detectedSchemas.map((s) => ({
    name: s.type,
    value: s.count,
    color: getSchemaColor(s.type),
  }))

  // Build schema tree from detected schemas
  const schemaTree: SchemaChildNode[] = data.detectedSchemas.map((s) => ({
    name: s.type,
    properties: s.properties.slice(0, 10),
    childNodes: s.properties.length > 10
      ? [{ name: 'Additional Properties', properties: s.properties.slice(10, 20) }]
      : undefined,
  }))

  // Rich result eligibility with additional metadata
  const richResultData = RICH_RESULT_TYPES.map((rt) => {
    const found = data.richResultEligibility.find((r) => r.type === rt.type)
    return {
      ...rt,
      eligible: found?.eligible ?? false,
      reason: found?.reason ?? 'Not applicable',
    }
  })

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">

        {/* ── 1. Schema Score Hero Section ─────────────────────────────── */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                {/* Score Gauge */}
                <div className="flex flex-col items-center gap-2">
                  <SchemaScoreGauge score={data.score} grade={data.grade} />
                  <p className={cn('text-sm font-medium', getScoreColorClass(data.score))}>
                    {data.score >= 85 ? 'Excellent' : data.score >= 70 ? 'Good' : data.score >= 50 ? 'Fair' : 'Needs Improvement'}
                  </p>
                </div>

                {/* Stats + Validation Summary */}
                <div className="flex-1 w-full space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">Schema Markup Score</h2>
                      <p className="text-sm text-muted-foreground">{data.project.domain}</p>
                    </div>
                    <Badge className={cn('text-sm font-bold px-3 py-1', getGradeBgClass(data.grade))}>
                      {data.grade}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Code2 className="h-4 w-4" />
                        <span className="text-xs font-medium">Schema Types</span>
                      </div>
                      <span className="text-2xl font-bold tabular-nums">{data.detectedSchemas.length}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Layers className="h-4 w-4" />
                        <span className="text-xs font-medium">Instances</span>
                      </div>
                      <span className="text-2xl font-bold tabular-nums">{totalInstances}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-xs font-medium">Valid</span>
                      </div>
                      <span className="text-2xl font-bold tabular-nums">
                        <span className="text-emerald-500">{validCount}</span>
                        {invalidCount > 0 && (
                          <span className="text-sm text-red-500 ml-1">/ {invalidCount} invalid</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <ValidationSummaryBar summary={data.validationSummary} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 2. Detected Schema Types ──────────────────────────────────── */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold">Detected Schema Types</h3>
              <p className="text-sm text-muted-foreground">
                {data.detectedSchemas.length} structured data types found on {data.project.domain}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.detectedSchemas.map((schema, i) => (
            <motion.div key={schema.type} custom={2 + i} variants={fadeUp} initial="hidden" animate="visible">
              <SchemaTypeCard schema={schema} />
            </motion.div>
          ))}
        </div>

        {/* ── 3. Schema Distribution & Tree ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution Chart */}
          <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-500" />
                  Schema Distribution
                </CardTitle>
                <CardDescription>Instance count per schema type</CardDescription>
              </CardHeader>
              <CardContent>
                {schemaDistData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={schemaDistData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {schemaDistData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number, name: string) => [`${value} instances`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                    No schema data to display
                  </div>
                )}
                {/* Legend */}
                {schemaDistData.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-center">
                    {schemaDistData.map((entry) => (
                      <span key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.name} ({entry.value})
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Schema Tree */}
          <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TreePine className="h-4 w-4 text-emerald-500" />
                  Schema Hierarchy
                </CardTitle>
                <CardDescription>Visual tree of detected structured data</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[340px]">
                  {schemaTree.length > 0 ? (
                    <div className="space-y-1">
                      {schemaTree.map((node, i) => (
                        <SchemaTreeNode
                          key={`${node.name}-${i}`}
                          name={node.name}
                          properties={node.properties}
                          childNodes={node.childNodes}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                      No schema tree to display
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── 4. Validation Results ─────────────────────────────────────── */}
        <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Validation Results
              </CardTitle>
              <CardDescription>
                {data.validationSummary.totalChecks} total checks · {data.validationSummary.passed} passed · {data.validationSummary.errors} errors · {data.validationSummary.warnings} warnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[180px]">Schema Type</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.detectedSchemas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                        No schema data to validate
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.detectedSchemas.map((schema) => {
                      const hasErrors = schema.errors.length > 0
                      const hasWarnings = schema.warnings.length > 0
                      const allIssues = [
                        ...schema.errors.map((e) => ({ type: 'error' as const, msg: e })),
                        ...schema.warnings.map((w) => ({ type: 'warning' as const, msg: w })),
                      ]
                      return (
                        <TableRow key={schema.type}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div
                                className="flex h-7 w-7 items-center justify-center rounded"
                                style={{ backgroundColor: getSchemaColor(schema.type) + '15' }}
                              >
                                {React.createElement(getSchemaIcon(schema.type), {
                                  className: 'h-3.5 w-3.5',
                                  style: { color: getSchemaColor(schema.type) },
                                })}
                              </div>
                              {schema.type}
                            </div>
                          </TableCell>
                          <TableCell>
                            {schema.valid && !hasErrors ? (
                              <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px]">
                                <CheckCircle2 className="h-3 w-3 mr-1" />Passed
                              </Badge>
                            ) : hasErrors ? (
                              <Badge variant="outline" className="border-red-500/30 text-red-600 dark:text-red-400 text-[10px]">
                                <XCircle className="h-3 w-3 mr-1" />Failed
                              </Badge>
                            ) : hasWarnings ? (
                              <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px]">
                                <AlertTriangle className="h-3 w-3 mr-1" />Warning
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                <Info className="h-3 w-3 mr-1" />Info
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {allIssues.length === 0 ? (
                              <span className="text-xs text-muted-foreground">No issues found</span>
                            ) : (
                              <div className="space-y-1">
                                {allIssues.map((issue, i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      'flex items-start gap-1.5 text-xs',
                                      issue.type === 'error'
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-amber-600 dark:text-amber-400'
                                    )}
                                  >
                                    {issue.type === 'error' ? (
                                      <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                    ) : (
                                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                                    )}
                                    <span>{issue.msg}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 5. Rich Result Eligibility ────────────────────────────────── */}
        <motion.div custom={11} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                Rich Result Eligibility
              </CardTitle>
              <CardDescription>
                Which Google rich results your site qualifies for based on detected schema markup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {richResultData.map((rt) => (
                  <div
                    key={rt.type}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                      rt.eligible
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-border bg-background'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
                        rt.eligible ? 'bg-emerald-500/15' : 'bg-muted/50'
                      )}
                    >
                      <rt.icon className={cn('h-4 w-4', rt.eligible ? 'text-emerald-600' : 'text-muted-foreground')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{rt.type}</span>
                        {rt.eligible ? (
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[9px] px-1.5 py-0">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Eligible
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-red-500/30 text-red-600 dark:text-red-400 text-[9px] px-1.5 py-0">
                            <XCircle className="h-2.5 w-2.5 mr-0.5" />Not Eligible
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{rt.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 6. Recommendations ────────────────────────────────────────── */}
        <motion.div custom={12} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-emerald-500" />
                Recommendations
              </CardTitle>
              <CardDescription>
                {data.recommendations.length} suggestions to improve your structured data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.recommendations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
                  <p className="text-sm font-medium">All good!</p>
                  <p className="text-xs text-muted-foreground mt-1">No recommendations — your schema markup is well optimized.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-emerald-600">{i + 1}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 7. Schema Code Viewer ─────────────────────────────────────── */}
        <motion.div custom={13} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Braces className="h-4 w-4 text-emerald-500" />
                Detected JSON-LD Code
              </CardTitle>
              <CardDescription>Raw structured data markup found on the page</CardDescription>
            </CardHeader>
            <CardContent>
              <SchemaCodeViewer code={data.schemaCode} />
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 8. Schema Type Reference ──────────────────────────────────── */}
        <motion.div custom={14} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-500" />
                Schema Type Reference
              </CardTitle>
              <CardDescription>
                Common schema.org types to consider adding to your site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {['high', 'medium', 'low'].map((priority) => {
                  const items = SCHEMA_REFERENCE.filter((r) => r.priority === priority)
                  const priorityLabel = priority === 'high' ? 'High Priority' : priority === 'medium' ? 'Medium Priority' : 'Low Priority'
                  const priorityColor = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#6b7280'

                  return (
                    <AccordionItem key={priority} value={priority}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: priorityColor }}
                          />
                          <span className="text-sm font-semibold">{priorityLabel}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {items.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-1">
                          {items.map((ref) => {
                            const isAlreadyDetected = data.detectedSchemas.some((s) => s.type === ref.type)
                            return (
                              <div
                                key={ref.type}
                                className={cn(
                                  'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                                  isAlreadyDetected
                                    ? 'border-emerald-500/20 bg-emerald-500/5'
                                    : 'hover:bg-muted/30'
                                )}
                              >
                                <div
                                  className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                                  style={{ backgroundColor: getSchemaColor(ref.type) + '15' }}
                                >
                                  {React.createElement(getSchemaIcon(ref.type), {
                                    className: 'h-4 w-4',
                                    style: { color: getSchemaColor(ref.type) },
                                  })}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{ref.type}</span>
                                    <Badge
                                      variant="secondary"
                                      className="text-[9px] px-1.5 py-0"
                                    >
                                      {ref.category}
                                    </Badge>
                                    {isAlreadyDetected && (
                                      <Badge
                                        variant="outline"
                                        className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[9px] px-1.5 py-0"
                                      >
                                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Detected
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">{ref.description}</p>
                                </div>
                                <a
                                  href={`https://schema.org/${ref.type}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 text-muted-foreground hover:text-emerald-500 transition-colors"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            )
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
