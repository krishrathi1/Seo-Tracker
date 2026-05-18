'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
  Play,
  RefreshCw,
  FileSearch,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  EyeOff,
  Loader2,
  Bug,
  FileCode,
  Layout,
  Zap,
  Smartphone,
  Database,
  Lock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react'
import { format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import { useSeoStore } from '@/lib/seo-store'

// ─── Types ────────────────────────────────────────────────────────────────
interface AuditIssue {
  id: string
  category: string
  severity: string
  title: string
  description: string | null
  url: string | null
  status: string
  createdAt: string
}

interface LatestAudit {
  id: string
  score: number
  totalPages: number
  status: string
  createdAt: string
  issues: AuditIssue[]
  issuesByCategory: Record<string, { count: number; critical: number; high: number; medium: number; low: number; info: number }>
  issuesBySeverity: { critical: number; high: number; medium: number; low: number; info: number }
  issueStatusBreakdown: { open: number; inProgress: number; resolved: number }
}

interface ScoreTrendItem {
  date: string
  score: number
  totalIssues?: number
  criticalIssues?: number
}

interface AuditsResponse {
  audits: Array<{
    id: string
    score: number
    totalPages: number
    status: string
    createdAt: string
    issueCount: number
    criticalCount: number
  }>
  latestAudit: LatestAudit | null
  comparison: {
    scoreChange: number | null
    issuesChange: number | null
    previousScore: number | null
  }
  overallBreakdown: {
    byCategory: Record<string, { count: number; critical: number; high: number; medium: number; low: number; info: number }>
    bySeverity: { critical: number; high: number; medium: number; low: number; info: number }
  }
  scoreTrend: ScoreTrendItem[]
}

// ─── Constants ────────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500', fill: '#ef4444', icon: AlertCircle },
  high: { label: 'High', color: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500', fill: '#f97316', icon: AlertTriangle },
  medium: { label: 'Medium', color: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500', fill: '#f59e0b', icon: AlertTriangle },
  low: { label: 'Low', color: 'text-sky-500', bg: 'bg-sky-500', border: 'border-sky-500', fill: '#0ea5e9', icon: Info },
  info: { label: 'Info', color: 'text-slate-400', bg: 'bg-slate-400', border: 'border-slate-400', fill: '#94a3b8', icon: Info },
} as const

const STATUS_CONFIG = {
  open: { label: 'Open', className: 'border-red-500 text-red-600 dark:text-red-400', icon: XCircle },
  'in-progress': { label: 'In Progress', className: 'border-amber-500 text-amber-600 dark:text-amber-400', icon: RefreshCw },
  resolved: { label: 'Fixed', className: 'border-emerald-500 text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  ignored: { label: 'Ignored', className: 'border-slate-400 text-slate-500 dark:text-slate-400', icon: EyeOff },
} as const

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  crawlability: { label: 'Crawlability', icon: Bug, color: '#ef4444' },
  indexability: { label: 'Indexability', icon: FileSearch, color: '#f97316' },
  'on-page': { label: 'On-Page', icon: FileCode, color: '#f59e0b' },
  performance: { label: 'Performance', icon: Zap, color: '#eab308' },
  mobile: { label: 'Mobile', icon: Smartphone, color: '#22c55e' },
  'structured-data': { label: 'Structured Data', icon: Database, color: '#06b6d4' },
  security: { label: 'Security', icon: Lock, color: '#8b5cf6' },
}

const SCORE_TREND_CONFIG: ChartConfig = {
  score: { label: 'Audit Score', color: '#10b981' },
}

const CATEGORY_CHART_CONFIG: ChartConfig = {
  count: { label: 'Issues', color: '#10b981' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function getScoreColor(score: number): string {
  if (score < 40) return '#ef4444'
  if (score < 70) return '#f59e0b'
  return '#10b981'
}

function getScoreLabel(score: number): string {
  if (score < 40) return 'Poor'
  if (score < 70) return 'Fair'
  return 'Good'
}

function normalizeStatus(status: string): string {
  if (status === 'in-progress' || status === 'in_progress') return 'in-progress'
  if (status === 'resolved' || status === 'fixed') return 'resolved'
  return status
}

function formatCategoryKey(key: string): string {
  return CATEGORY_CONFIG[key]?.label ?? key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

function getCategoryWorstSeverity(cat: { critical: number; high: number; medium: number; low: number; info: number }): string {
  if (cat.critical > 0) return 'critical'
  if (cat.high > 0) return 'high'
  if (cat.medium > 0) return 'medium'
  if (cat.low > 0) return 'low'
  return 'info'
}

// ─── Circular Score Gauge ─────────────────────────────────────────────────
function ScoreGauge({ score, size = 160 }: { score: number; size?: number }) {
  const [animatedScore, setAnimatedScore] = React.useState(0)
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (animatedScore / 100) * circumference
  const color = getScoreColor(score)

  React.useEffect(() => {
    let frame: number
    const start = animatedScore
    const duration = 1200
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
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
        <span className="text-4xl font-bold tabular-nums" style={{ color }}>{animatedScore}</span>
        <span className="text-xs font-medium text-muted-foreground mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────
function MiniSparkline({ data }: { data: ScoreTrendItem[] }) {
  if (data.length < 2) return null
  const min = Math.min(...data.map(d => d.score)) - 5
  const max = Math.max(...data.map(d => d.score)) + 5
  const range = max - min || 1
  const w = 80
  const h = 28
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((d.score - min) / range) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke="#10b981"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * w
        const y = h - ((d.score - min) / range) * h
        return <circle key={i} cx={x} cy={y} r={2.5} fill="#10b981" />
      })}
    </svg>
  )
}

// ─── Severity Card ────────────────────────────────────────────────────────
function SeverityCard({
  severity,
  count,
  isActive,
  onClick,
}: {
  severity: keyof typeof SEVERITY_CONFIG
  count: number
  isActive: boolean
  onClick: () => void
}) {
  const config = SEVERITY_CONFIG[severity]
  const Icon = config.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border p-4 transition-all cursor-pointer',
        'hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive ? 'border-2 shadow-sm' : 'border',
        isActive ? config.border : 'border-border',
      )}
    >
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', config.bg + '/10')}>
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>
      <span className={cn('text-2xl font-bold tabular-nums', isActive ? config.color : 'text-foreground')}>
        {count}
      </span>
      <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
    </button>
  )
}

// ─── Severity Badge ───────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG]
  if (!config) return <Badge variant="outline">{severity}</Badge>
  return (
    <Badge variant="outline" className={cn('border', config.border, config.color)}>
      {config.label}
    </Badge>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const normalized = normalizeStatus(status)
  const config = STATUS_CONFIG[normalized as keyof typeof STATUS_CONFIG]
  if (!config) return <Badge variant="outline">{status}</Badge>
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}

// ─── Category Badge ───────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: string }) {
  const config = CATEGORY_CONFIG[category]
  if (!config) return <Badge variant="secondary">{formatCategoryKey(category)}</Badge>
  const Icon = config.icon
  return (
    <Badge variant="secondary" className="gap-1">
      <Icon className="h-3 w-3" style={{ color: config.color }} />
      {config.label}
    </Badge>
  )
}

// ─── Status Cycle Button ──────────────────────────────────────────────────
function StatusCycleButton({ status, onToggle }: { status: string; onToggle: (e: React.MouseEvent) => void }) {
  const normalized = normalizeStatus(status)
  const config = STATUS_CONFIG[normalized as keyof typeof STATUS_CONFIG]
  const Icon = config?.icon ?? XCircle

  return (
    <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={onToggle}>
      <Icon className="h-3.5 w-3.5" />
      {config?.label ?? status}
    </Button>
  )
}

// ─── Fetch Hook ───────────────────────────────────────────────────────────
function useAuditData(projectId: string) {
  return useQuery<AuditsResponse>({
    queryKey: ['audits', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/seo/audits?projectId=${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch audit data')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })
}

// ─── Main Component ───────────────────────────────────────────────────────
export function SiteAuditModule() {
  const activeProjectId = useSeoStore((s) => s.activeProjectId)
  const projectId = activeProjectId ?? 'first'

  const { data, isLoading, error } = useAuditData(projectId)
  const [isRunningAudit, setIsRunningAudit] = React.useState(false)

  // Filters
  const [severityFilter, setSeverityFilter] = React.useState<string>('all')
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())

  // Local issue status overrides
  const [statusOverrides, setStatusOverrides] = React.useState<Record<string, string>>({})

  const latestAudit = data?.latestAudit
  const allIssues = latestAudit?.issues ?? []
  const scoreTrend = data?.scoreTrend ?? []
  const comparison = data?.comparison

  // Apply filters
  const filteredIssues = React.useMemo(() => {
    return allIssues.filter((issue) => {
      if (severityFilter !== 'all' && issue.severity !== severityFilter) return false
      if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false
      const effectiveStatus = statusOverrides[issue.id] ?? normalizeStatus(issue.status)
      if (statusFilter !== 'all' && effectiveStatus !== statusFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          issue.title.toLowerCase().includes(q) ||
          (issue.url ?? '').toLowerCase().includes(q) ||
          issue.category.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [allIssues, severityFilter, categoryFilter, statusFilter, searchQuery, statusOverrides])

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const cycleStatus = (issueId: string, currentStatus: string) => {
    const effective = normalizeStatus(currentStatus)
    const nextMap: Record<string, string> = {
      open: 'in-progress',
      'in-progress': 'resolved',
      resolved: 'ignored',
      ignored: 'open',
    }
    setStatusOverrides((prev) => ({ ...prev, [issueId]: nextMap[effective] ?? 'open' }))
  }

  const handleRunAudit = () => {
    setIsRunningAudit(true)
    setTimeout(() => setIsRunningAudit(false), 3000)
  }

  // ─── Loading State ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Loading audit data...</p>
        </div>
      </div>
    )
  }

  if (error || !latestAudit) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-muted-foreground">Failed to load audit data. Please try again.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  const severityBreakdown = latestAudit.issuesBySeverity
  const categoryBreakdown = latestAudit.issuesByCategory

  // Build category chart data
  const categoryChartData = Object.entries(categoryBreakdown).map(([key, val]) => ({
    category: formatCategoryKey(key),
    categoryKey: key,
    count: val.count,
    worstSeverity: getCategoryWorstSeverity(val),
    fill: SEVERITY_CONFIG[getCategoryWorstSeverity(val) as keyof typeof SEVERITY_CONFIG]?.fill ?? '#10b981',
  })).sort((a, b) => b.count - a.count)

  // Score trend chart data
  const scoreTrendChartData = scoreTrend.map(item => ({
    ...item,
    dateLabel: format(new Date(item.date), 'MMM d'),
  }))

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">

        {/* ── 1. Audit Score Hero Section ─────────────────────────────── */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              {/* Score Gauge */}
              <div className="flex flex-col items-center gap-2">
                <ScoreGauge score={latestAudit.score} size={160} />
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      latestAudit.score < 40 ? 'text-red-500' : latestAudit.score < 70 ? 'text-amber-500' : 'text-emerald-500'
                    )}
                  >
                    {getScoreLabel(latestAudit.score)}
                  </span>
                  {comparison?.scoreChange !== null && comparison?.scoreChange !== undefined && (
                    <span className={cn(
                      'flex items-center gap-0.5 text-xs font-medium',
                      comparison.scoreChange > 0 ? 'text-emerald-500' : comparison.scoreChange < 0 ? 'text-red-500' : 'text-muted-foreground'
                    )}>
                      {comparison.scoreChange > 0 ? <TrendingUp className="h-3 w-3" /> : comparison.scoreChange < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                      {comparison.scoreChange > 0 ? '+' : ''}{comparison.scoreChange}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <span className="text-xs font-medium">Pages Crawled</span>
                  </div>
                  <span className="text-2xl font-bold tabular-nums">{latestAudit.totalPages}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Bug className="h-4 w-4" />
                    <span className="text-xs font-medium">Total Issues</span>
                  </div>
                  <span className="text-2xl font-bold tabular-nums">{allIssues.length}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Critical</span>
                  </div>
                  <span className="text-2xl font-bold tabular-nums text-red-500">{severityBreakdown.critical}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-medium">Last Audit</span>
                  </div>
                  <span className="text-sm font-semibold">{format(new Date(latestAudit.createdAt), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-xs font-medium">Score Trend</span>
                  </div>
                  <MiniSparkline data={scoreTrend} />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleRunAudit}
                    disabled={isRunningAudit}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    {isRunningAudit ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Run New Audit
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── 2. Issue Severity Overview ──────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {(Object.entries(SEVERITY_CONFIG) as [keyof typeof SEVERITY_CONFIG, typeof SEVERITY_CONFIG[keyof typeof SEVERITY_CONFIG]][]).map(
            ([key, _config]) => (
              <SeverityCard
                key={key}
                severity={key}
                count={severityBreakdown[key] ?? 0}
                isActive={severityFilter === key}
                onClick={() => setSeverityFilter(severityFilter === key ? 'all' : key)}
              />
            )
          )}
        </div>

        {/* ── Charts Row ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── 3. Issues by Category Chart ───────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Issues by Category</CardTitle>
              <CardDescription>Distribution of issues across SEO categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={CATEGORY_CHART_CONFIG} className="h-[280px] w-full">
                <BarChart data={categoryChartData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tickLine={false}
                    axisLine={false}
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as typeof categoryChartData[number]
                      return (
                        <div className="border-border/50 bg-background rounded-lg border px-3 py-2 shadow-xl text-xs">
                          <p className="font-semibold mb-1">{d.category}</p>
                          <p className="text-muted-foreground">{d.count} issues</p>
                          <p className="text-muted-foreground">Worst: {SEVERITY_CONFIG[d.worstSeverity as keyof typeof SEVERITY_CONFIG]?.label}</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24}>
                    {categoryChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* ── 5. Score Trend Chart ──────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Score Trend</CardTitle>
              <CardDescription>Score progression over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={SCORE_TREND_CONFIG} className="h-[280px] w-full">
                <LineChart data={scoreTrendChartData} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── 4. Issues Table ──────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Issues</CardTitle>
                <CardDescription>
                  {filteredIssues.length} of {allIssues.length} issues shown
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search issues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-[180px] pl-8 text-xs"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 w-[140px] text-xs" size="sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-[120px] text-xs" size="sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Fixed</SelectItem>
                    <SelectItem value="ignored">Ignored</SelectItem>
                  </SelectContent>
                </Select>
                {(severityFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setSeverityFilter('all')
                      setCategoryFilter('all')
                      setStatusFilter('all')
                      setSearchQuery('')
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <ScrollArea className="max-h-[480px]">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[100px]">Severity</TableHead>
                    <TableHead className="w-[130px]">Category</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-[180px] hidden md:table-cell">URL</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[40px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No issues match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIssues.map((issue) => {
                      const isExpanded = expandedRows.has(issue.id)
                      const effectiveStatus = statusOverrides[issue.id] ?? normalizeStatus(issue.status)
                      return (
                        <React.Fragment key={issue.id}>
                          <TableRow
                            className="cursor-pointer"
                            onClick={() => toggleRow(issue.id)}
                          >
                            <TableCell>
                              <SeverityBadge severity={issue.severity} />
                            </TableCell>
                            <TableCell>
                              <CategoryBadge category={issue.category} />
                            </TableCell>
                            <TableCell className="font-medium max-w-[300px] truncate" title={issue.title}>
                              {issue.title}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-[180px] truncate" title={issue.url ?? ''}>
                              {issue.url ? (
                                <span className="flex items-center gap-1">
                                  <ArrowRight className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{issue.url.replace('https://techventure.com', '')}</span>
                                </span>
                              ) : '—'}
                            </TableCell>
                            <TableCell>
                              <StatusCycleButton
                                status={effectiveStatus}
                                onToggle={(e: React.MouseEvent) => {
                                  e.stopPropagation()
                                  cycleStatus(issue.id, effectiveStatus)
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableCell colSpan={6} className="p-4">
                                <div className="space-y-3 max-w-2xl">
                                  <div>
                                    <h4 className="text-sm font-semibold mb-1">Description</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {issue.description ?? 'No description available.'}
                                    </p>
                                  </div>
                                  <Separator />
                                  <div>
                                    <h4 className="text-sm font-semibold mb-1">Fix Recommendation</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {getFixRecommendation(issue)}
                                    </p>
                                  </div>
                                  {issue.url && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Globe className="h-3.5 w-3.5" />
                                      <span className="truncate">{issue.url}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 pt-1">
                                    <StatusBadge status={effectiveStatus} />
                                    <SeverityBadge severity={issue.severity} />
                                    <CategoryBadge category={issue.category} />
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* ── 6. Category Detail Panels ───────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Details</CardTitle>
            <CardDescription>Issues grouped by category with progress tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {Object.entries(categoryBreakdown)
                .sort(([, a], [, b]) => b.count - a.count)
                .map(([key, catData]) => {
                  const catConfig = CATEGORY_CONFIG[key]
                  const CatIcon = catConfig?.icon ?? Layout
                  const catLabel = catConfig?.label ?? formatCategoryKey(key)
                  const catColor = catConfig?.color ?? '#10b981'
                  const catIssues = allIssues.filter((i) => i.category === key)
                  const fixedCount = catIssues.filter((i) => {
                    const s = normalizeStatus(statusOverrides[i.id] ?? i.status)
                    return s === 'resolved'
                  }).length
                  const openCount = catIssues.length - fixedCount
                  const progressPercent = catIssues.length > 0 ? Math.round((fixedCount / catIssues.length) * 100) : 0

                  return (
                    <AccordionItem key={key} value={key}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1 pr-4">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: catColor + '15' }}>
                            <CatIcon className="h-4 w-4" style={{ color: catColor }} />
                          </div>
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{catLabel}</span>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {catData.count}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={progressPercent} className="h-1.5 flex-1" />
                              <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
                                {fixedCount}/{catIssues.length} fixed
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {openCount > 0 && (
                              <Badge variant="outline" className="border-red-500/30 text-red-500 text-[10px]">
                                {openCount} open
                              </Badge>
                            )}
                            {catData.critical > 0 && (
                              <Badge variant="outline" className="border-red-500 text-red-500 text-[10px]">
                                {catData.critical} critical
                              </Badge>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          {catIssues.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">No issues in this category.</p>
                          ) : (
                            catIssues.map((issue) => {
                              const effectiveStatus = normalizeStatus(statusOverrides[issue.id] ?? issue.status)
                              return (
                                <div
                                  key={issue.id}
                                  className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                                >
                                  <div className="mt-0.5">
                                    <SeverityBadge severity={issue.severity} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{issue.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                      {issue.description}
                                    </p>
                                  </div>
                                  <StatusBadge status={effectiveStatus} />
                                </div>
                              )
                            })
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Fix Recommendations ──────────────────────────────────────────────────
function getFixRecommendation(issue: AuditIssue): string {
  const recommendations: Record<string, string> = {
    // Crawlability
    'Robots.txt blocking important pages': 'Review your robots.txt file and remove disallow directives for pages that should be indexed. Use Google Search Console\'s robots.txt tester to validate changes.',
    'Broken internal links detected': 'Update or remove broken internal links. Set up 301 redirects for pages that have moved. Implement regular link checking as part of your publishing workflow.',
    'Redirect chains detected': 'Replace redirect chains with direct 301 redirects to the final destination URL. Each redirect hop adds latency and dilutes link equity.',
    'Orphan pages found': 'Add internal links from relevant pages to orphan pages. Ensure they are included in your XML sitemap and have at least one internal link pointing to them.',
    'Excessive crawl budget usage': 'Block parameter-based URLs in robots.txt, implement canonical tags, and use the URL Parameters tool in Google Search Console to control crawling.',
    'XML sitemap format notice': 'Update your XML sitemap to the latest sitemap.org protocol. Ensure all URLs use consistent formatting and the sitemap is submitted to Google Search Console.',
    // Indexability
    'Noindex on key landing pages': 'Remove the noindex meta tag from high-value landing pages. Check your CMS settings as some platforms add noindex to draft or preview pages.',
    'Canonical tag conflicts': 'Ensure each page has a single, self-referencing canonical tag. Remove duplicate canonical tags and verify that cross-domain canonicals are intentional.',
    'Duplicate meta descriptions': 'Write unique, compelling meta descriptions for each page. Keep them between 150-160 characters and include relevant keywords naturally.',
    'Pages blocked by x-robots-tag': 'Remove or modify the x-robots-tag HTTP header for pages that should be indexed. Check your server configuration and CDN settings.',
    'Missing canonical tags': 'Add self-referencing canonical tags to all pages. This helps prevent duplicate content issues and consolidates link signals.',
    'Pagination indexation notice': 'Implement proper pagination handling using rel=prev/next or noindex on paginated pages beyond page 1. Consider infinite scroll with proper pushState.',
    // On-page
    'Missing H1 tags': 'Add a unique, descriptive H1 tag to each page. The H1 should contain the primary target keyword and clearly describe the page content.',
    'Title tags too long': 'Shorten title tags to 50-60 characters to avoid truncation in search results. Place important keywords near the beginning of the title.',
    'Thin content pages': 'Expand thin content pages with comprehensive, valuable information. Aim for at least 300 words of unique, relevant content per page.',
    'Missing meta descriptions': 'Add compelling meta descriptions to all pages. Include a call-to-action and primary keyword. Keep between 150-160 characters.',
    'Image alt text missing': 'Add descriptive alt text to all images. Describe the image content and include relevant keywords where natural. Alt text improves accessibility and image SEO.',
    'Keyword cannibalization detected': 'Consolidate competing pages or differentiate their intent. Use canonical tags to signal the preferred page, or merge content into a single comprehensive resource.',
    'Heading hierarchy issues': 'Fix heading hierarchy to follow a logical order (H1 > H2 > H3). Never skip heading levels. Use H2s for main sections and H3s for subsections.',
    'Internal link anchor text optimization': 'Replace generic anchor text like "click here" with descriptive text that includes relevant keywords. This helps both users and search engines understand the linked page.',
    // Performance
    'Largest Contentful Paint > 4s': 'Optimize LCP by preloading the LCP image, using next-gen formats, implementing a CDN, and optimizing server response times. Target under 2.5 seconds.',
    'Unoptimized images': 'Convert PNG images to WebP format, implement responsive images with srcset, and add width/height attributes. Consider using an image CDN for automatic optimization.',
    'Render-blocking resources': 'Defer non-critical JavaScript, inline critical CSS, and use media attributes on stylesheet links. Consider using a build tool to extract critical CSS.',
    'No lazy loading for images': 'Add loading="lazy" attribute to below-fold images. Implement native lazy loading or use Intersection Observer for more control.',
    'Cumulative Layout Shift > 0.25': 'Add width and height dimensions to images and embeds, avoid inserting content above existing content, and use CSS contain for dynamic elements.',
    'Unused CSS detected': 'Remove unused CSS rules using tools like PurgeCSS. Consider code-splitting CSS by route and using CSS-in-JS for component-scoped styles.',
    'CDN configuration note': 'Set up a CDN like Cloudflare or Fastly to serve static assets from edge locations. Configure proper cache headers and consider using a multi-CDN strategy.',
    // Mobile
    'Mobile viewport not configured': 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the <head> of all pages.',
    'Tap targets too small': 'Increase the size of interactive elements to at least 48x48px with adequate spacing. Use CSS padding to expand the touch target area beyond the visual element.',
    'Horizontal scroll on mobile': 'Fix elements causing horizontal overflow. Use overflow-x: hidden as a quick fix, but identify and fix the root cause (often fixed-width elements or negative margins).',
    'Font size too small': 'Increase font sizes to at least 16px for body text and 12px for labels. Use relative units (rem/em) for better scalability across devices.',
    'Mobile interstitials': 'Remove or reduce full-page interstitials on mobile. Use smaller, non-obstructive banners or bottom sheets instead. Ensure content is immediately accessible.',
    // Structured Data
    'Invalid Schema.org markup': 'Fix Schema.org validation errors using Google\'s Rich Results Test. Ensure all required properties are present and values match the expected types.',
    'Missing FAQ schema': 'Add FAQPage schema markup to FAQ pages using JSON-LD format. Include all question-answer pairs to potentially earn rich results in search.',
    'BreadcrumbList schema missing': 'Add BreadcrumbList schema to help search engines understand your site hierarchy. Implement using JSON-LD and match your visual breadcrumb navigation.',
    'Organization schema incomplete': 'Complete Organization schema with social profile links (sameAs property), logo, contact info, and address. Use JSON-LD format on the homepage.',
    'Schema enhancement opportunities': 'Add HowTo schema for tutorial content and VideoObject schema for video content. These can enhance search appearance with rich results.',
    // Security
    'Mixed content warnings': 'Replace all HTTP resources with HTTPS equivalents. Update internal links, image sources, scripts, and stylesheets. Use CSP upgrade-insecure-requests as a temporary fix.',
    'Missing security headers': 'Add X-Content-Type-Options: nosniff, X-Frame-Options: DENY, and other recommended security headers. Use Helmet.js or configure your server/web server.',
    'Outdated TLS configuration': 'Disable TLS 1.0 and 1.1 on your server. Configure TLS 1.2+ with strong cipher suites. Use SSL Labs to verify your configuration.',
    'Cookies without Secure flag': 'Add the Secure flag to all cookies to ensure they are only transmitted over HTTPS. Also add HttpOnly and SameSite flags for additional security.',
  }

  return recommendations[issue.title] ?? 'Review this issue and implement appropriate fixes based on SEO best practices. Consult Google\'s Search Central documentation for detailed guidance.'
}
