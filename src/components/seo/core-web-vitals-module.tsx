'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts'
import {
  Gauge,
  Clock,
  MousePointer,
  Eye,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Zap,
  Globe,
  ArrowRight,
  BarChart3,
  FileSearch,
  Server,
  HardDrive,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'
import { useSeoStore } from '@/lib/seo-store'

// ─── Types ────────────────────────────────────────────────────────────────
interface VitalsData {
  project: { id: string; name: string; domain: string }
  performanceScore: number
  grade: string
  coreVitals: {
    lcp: { value: number; unit: string; status: 'good' | 'needs-improvement' | 'poor'; trend: 'up' | 'down' | 'stable' }
    fid: { value: number; unit: string; status: 'good' | 'needs-improvement' | 'poor'; trend: 'up' | 'down' | 'stable' }
    cls: { value: number; unit: string; status: 'good' | 'needs-improvement' | 'poor'; trend: 'up' | 'down' | 'stable' }
  }
  additionalMetrics: {
    fcp: { value: number; unit: string; status: string }
    ttfb: { value: number; unit: string; status: string }
    tbt: { value: number; unit: string; status: string }
    speedIndex: { value: number; unit: string; status: string }
    totalPageSize: { value: number; unit: string }
    totalRequests: { value: number; unit: string }
  }
  trend: Array<{ date: string; score: number; lcp: number; cls: number }>
  pagePerformance: Array<{
    url: string
    score: number
    lcp: number
    cls: number
    fid: number
  }>
  recommendations: string[]
}

// ─── Constants ────────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' as const },
  }),
}

const STATUS_COLORS = {
  good: { text: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500', fill: '#10b981' },
  'needs-improvement': { text: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500', fill: '#f59e0b' },
  poor: { text: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500', fill: '#ef4444' },
} as const

const STATUS_LABELS = {
  good: 'Good',
  'needs-improvement': 'Needs Improvement',
  poor: 'Poor',
} as const

const TREND_CHART_CONFIG: ChartConfig = {
  score: { label: 'Performance Score', color: '#10b981' },
  lcp: { label: 'LCP (s)', color: '#06b6d4' },
  cls: { label: 'CLS', color: '#f59e0b' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function getScoreColor(score: number): string {
  if (score < 40) return '#ef4444'
  if (score < 70) return '#f59e0b'
  return '#10b981'
}

function getScoreGrade(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 50) return 'D'
  return 'F'
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Fair'
  return 'Poor'
}

function getStatusConfig(status: string) {
  if (status === 'good') return STATUS_COLORS.good
  if (status === 'needs-improvement' || status === 'needs_improvement' || status === 'average') return STATUS_COLORS['needs-improvement']
  if (status === 'poor' || status === 'bad') return STATUS_COLORS.poor
  return STATUS_COLORS['needs-improvement']
}

// ─── Performance Score Gauge ──────────────────────────────────────────────
function PerformanceScoreGauge({ score, size = 180 }: { score: number; size?: number }) {
  const [animatedScore, setAnimatedScore] = React.useState(0)
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (animatedScore / 100) * circumference
  const color = getScoreColor(score)
  const grade = getScoreGrade(score)

  React.useEffect(() => {
    let frame: number
    const start = animatedScore
    const duration = 1400
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
          className="text-muted/20"
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
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-5xl font-bold tabular-nums" style={{ color }}>
          {animatedScore}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-lg font-bold px-2 py-0.5 rounded"
            style={{ color, backgroundColor: color + '15' }}
          >
            {grade}
          </span>
        </div>
        <span className="text-[10px] font-medium text-muted-foreground mt-1">/ 100</span>
      </div>
    </div>
  )
}

// ─── Metric Mini Gauge ────────────────────────────────────────────────────
function MetricGauge({
  value,
  max,
  status,
  size = 60,
}: {
  value: number
  max: number
  status: 'good' | 'needs-improvement' | 'poor'
  size?: number
}) {
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min(value / max, 1)
  const progress = percentage * circumference
  const colorConfig = STATUS_COLORS[status]
  const color = colorConfig.fill

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
          className="text-muted/20"
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
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute flex items-center justify-center">
        <span className="text-xs font-bold tabular-nums" style={{ color }}>
          {status === 'good' ? '✓' : status === 'poor' ? '!' : '~'}
        </span>
      </div>
    </div>
  )
}

// ─── Core Vital Card ──────────────────────────────────────────────────────
function CoreVitalCard({
  label,
  value,
  unit,
  status,
  trend,
  target,
  icon: Icon,
  gaugeMax,
  delay = 0,
}: {
  label: string
  value: number
  unit: string
  status: 'good' | 'needs-improvement' | 'poor'
  trend: 'up' | 'down' | 'stable'
  target: string
  icon: React.ElementType
  gaugeMax: number
  delay?: number
}) {
  const colorConfig = STATUS_COLORS[status]
  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : ArrowUpDown
  const TrendIcon = trendIcon

  // For LCP/FID, "down" is improving (lower is better). For CLS, "down" is also improving.
  const isImproving = trend === 'down'
  const trendColor = trend === 'stable' ? 'text-muted-foreground' : isImproving ? 'text-emerald-500' : 'text-red-500'

  return (
    <motion.div custom={delay} variants={fadeUp} initial="hidden" animate="visible">
      <Card className={cn(
        'relative overflow-hidden border-2 transition-colors',
        colorConfig.border + '/30',
      )}>
        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: colorConfig.fill }} />
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', colorConfig.bg + '/10')}>
                <Icon className={cn('h-5 w-5', colorConfig.text)} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground">Target: {target}</p>
              </div>
            </div>
            <MetricGauge value={value} max={gaugeMax} status={status} size={52} />
          </div>

          <div className="flex items-end gap-2 mb-3">
            <span className={cn('text-4xl font-bold tabular-nums', colorConfig.text)}>
              {value}
            </span>
            <span className="text-sm font-medium text-muted-foreground mb-1">{unit}</span>
          </div>

          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className={cn('text-[11px] font-medium', colorConfig.border, colorConfig.text)}
            >
              {STATUS_LABELS[status]}
            </Badge>
            <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
              <TrendIcon className="h-3.5 w-3.5" />
              <span>{trend === 'stable' ? 'Stable' : isImproving ? 'Improving' : 'Declining'}</span>
            </div>
          </div>

          {/* Progress bar showing how close to threshold */}
          <div className="mt-3">
            <Progress
              value={status === 'good' ? 100 : status === 'needs-improvement' ? 55 : 25}
              className={cn('h-1.5')}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Additional Metric Row ────────────────────────────────────────────────
function AdditionalMetricRow({
  label,
  value,
  unit,
  status,
  icon: Icon,
}: {
  label: string
  value: number
  unit: string
  status: string
  icon: React.ElementType
}) {
  const colorConfig = getStatusConfig(status)

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', colorConfig.bg + '/10')}>
          <Icon className={cn('h-4 w-4', colorConfig.text)} />
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={cn('text-sm font-bold tabular-nums', colorConfig.text)}>
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{unit}</span>
        <Badge
          variant="outline"
          className={cn('text-[10px] min-w-[70px] justify-center', colorConfig.border, colorConfig.text)}
        >
          {status === 'good' ? 'Good' : status === 'poor' ? 'Poor' : 'Avg'}
        </Badge>
      </div>
    </div>
  )
}

// ─── Waterfall Bar ────────────────────────────────────────────────────────
const WATERFALL_DATA = [
  { name: 'DNS Lookup', duration: 45, color: '#06b6d4', offset: 0 },
  { name: 'TCP Connect', duration: 35, color: '#0ea5e9', offset: 45 },
  { name: 'TLS Handshake', duration: 55, color: '#3b82f6', offset: 80 },
  { name: 'TTFB', duration: 210, color: '#f59e0b', offset: 135 },
  { name: 'Content Download', duration: 320, color: '#10b981', offset: 345 },
  { name: 'DOM Processing', duration: 180, color: '#8b5cf6', offset: 665 },
  { name: 'Render', duration: 120, color: '#ec4899', offset: 845 },
]

// ─── Fetch Hook ───────────────────────────────────────────────────────────
function useVitalsData(projectId: string) {
  return useQuery<VitalsData>({
    queryKey: ['vitals', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/seo/vitals?projectId=${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch vitals data')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })
}

// ─── Main Component ───────────────────────────────────────────────────────
export function CoreWebVitalsModule() {
  const activeProjectId = useSeoStore((s) => s.activeProjectId)
  const projectId = activeProjectId ?? 'first'
  const { data, isLoading, error, refetch } = useVitalsData(projectId)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    refetch().finally(() => setIsRefreshing(false))
  }

  // ─── Loading State ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-muted-foreground">Failed to load vitals data. Please try again.</p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    )
  }

  const { coreVitals, additionalMetrics, trend, pagePerformance, recommendations, performanceScore } = data

  // Trend chart data
  const trendChartData = trend.map((item) => ({
    ...item,
    dateLabel: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  // Waterfall max for scaling
  const waterfallMax = WATERFALL_DATA.reduce((acc, d) => Math.max(acc, d.offset + d.duration), 0)

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">

        {/* ── 1. Performance Score Hero ─────────────────────────────────── */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                {/* Gauge */}
                <div className="flex flex-col items-center gap-2">
                  <PerformanceScoreGauge score={performanceScore} size={180} />
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        performanceScore < 40 ? 'text-red-500' : performanceScore < 70 ? 'text-amber-500' : 'text-emerald-500'
                      )}
                    >
                      {getScoreLabel(performanceScore)}
                    </span>
                  </div>
                </div>

                {/* Project Info & Quick Stats */}
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        <Gauge className="h-5 w-5 text-emerald-500" />
                        Core Web Vitals
                      </h2>
                      <p className="text-sm text-muted-foreground">{data.project.domain}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} />
                      Refresh
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-medium">LCP</span>
                      </div>
                      <span className={cn(
                        'text-xl font-bold tabular-nums',
                        STATUS_COLORS[coreVitals.lcp.status].text
                      )}>
                        {coreVitals.lcp.value}{coreVitals.lcp.unit}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MousePointer className="h-4 w-4" />
                        <span className="text-xs font-medium">INP</span>
                      </div>
                      <span className={cn(
                        'text-xl font-bold tabular-nums',
                        STATUS_COLORS[coreVitals.fid.status].text
                      )}>
                        {coreVitals.fid.value}{coreVitals.fid.unit}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span className="text-xs font-medium">CLS</span>
                      </div>
                      <span className={cn(
                        'text-xl font-bold tabular-nums',
                        STATUS_COLORS[coreVitals.cls.status].text
                      )}>
                        {coreVitals.cls.value}{coreVitals.cls.unit}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Zap className="h-4 w-4" />
                        <span className="text-xs font-medium">Grade</span>
                      </div>
                      <span className="text-xl font-bold tabular-nums text-emerald-500">
                        {data.grade}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 2. Core Web Vitals Cards ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CoreVitalCard
            label="Largest Contentful Paint"
            value={coreVitals.lcp.value}
            unit={coreVitals.lcp.unit}
            status={coreVitals.lcp.status}
            trend={coreVitals.lcp.trend}
            target="< 2.5s"
            icon={Clock}
            gaugeMax={5}
            delay={1}
          />
          <CoreVitalCard
            label="Interaction to Next Paint"
            value={coreVitals.fid.value}
            unit={coreVitals.fid.unit}
            status={coreVitals.fid.status}
            trend={coreVitals.fid.trend}
            target="< 100ms"
            icon={MousePointer}
            gaugeMax={300}
            delay={2}
          />
          <CoreVitalCard
            label="Cumulative Layout Shift"
            value={coreVitals.cls.value}
            unit={coreVitals.cls.unit}
            status={coreVitals.cls.status}
            trend={coreVitals.cls.trend}
            target="< 0.1"
            icon={Eye}
            gaugeMax={0.5}
            delay={3}
          />
        </div>

        {/* ── 3. Additional Performance Metrics ──────────────────────────── */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-500" />
                <div>
                  <CardTitle className="text-base">Additional Performance Metrics</CardTitle>
                  <CardDescription>Supplementary metrics affecting overall page performance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
                <div className="space-y-0">
                  <AdditionalMetricRow
                    label="First Contentful Paint"
                    value={additionalMetrics.fcp.value}
                    unit={additionalMetrics.fcp.unit}
                    status={additionalMetrics.fcp.status}
                    icon={Eye}
                  />
                  <AdditionalMetricRow
                    label="Time to First Byte"
                    value={additionalMetrics.ttfb.value}
                    unit={additionalMetrics.ttfb.unit}
                    status={additionalMetrics.ttfb.status}
                    icon={Server}
                  />
                  <AdditionalMetricRow
                    label="Total Blocking Time"
                    value={additionalMetrics.tbt.value}
                    unit={additionalMetrics.tbt.unit}
                    status={additionalMetrics.tbt.status}
                    icon={Zap}
                  />
                </div>
                <div className="space-y-0">
                  <AdditionalMetricRow
                    label="Speed Index"
                    value={additionalMetrics.speedIndex.value}
                    unit={additionalMetrics.speedIndex.unit}
                    status={additionalMetrics.speedIndex.status}
                    icon={Gauge}
                  />
                  <AdditionalMetricRow
                    label="Total Page Size"
                    value={additionalMetrics.totalPageSize.value}
                    unit={additionalMetrics.totalPageSize.unit}
                    status="good"
                    icon={HardDrive}
                  />
                  <AdditionalMetricRow
                    label="Total Requests"
                    value={additionalMetrics.totalRequests.value}
                    unit={additionalMetrics.totalRequests.unit}
                    status="good"
                    icon={Globe}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 4. Performance Trend Chart ─────────────────────────────────── */}
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <div>
                  <CardTitle className="text-base">Performance Trend</CardTitle>
                  <CardDescription>Score and Core Web Vitals over the past 30 days</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={TREND_CHART_CONFIG} className="h-[300px] w-full">
                <AreaChart data={trendChartData} margin={{ left: 10, right: 20, top: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="lcpGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="clsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateLabel" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="score" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="lcp" orientation="right" domain={[0, 6]} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    yAxisId="score"
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#scoreGradient)"
                    dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  />
                  <Area
                    yAxisId="lcp"
                    type="monotone"
                    dataKey="lcp"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#lcpGradient)"
                    dot={{ r: 3, fill: '#06b6d4', strokeWidth: 2, stroke: '#fff' }}
                  />
                  <Area
                    yAxisId="lcp"
                    type="monotone"
                    dataKey="cls"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#clsGradient)"
                    dot={{ r: 3, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 5. Page Load Waterfall ─────────────────────────────────────── */}
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSearch className="h-5 w-5 text-emerald-500" />
                <div>
                  <CardTitle className="text-base">Page Load Waterfall</CardTitle>
                  <CardDescription>Breakdown of page load phases and their durations</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  duration: { label: 'Duration (ms)', color: '#10b981' },
                }}
                className="h-[280px] w-full"
              >
                <BarChart data={WATERFALL_DATA} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v}ms`}
                    domain={[0, waterfallMax]}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload as (typeof WATERFALL_DATA)[number]
                      return (
                        <div className="border-border/50 bg-background rounded-lg border px-3 py-2 shadow-xl text-xs">
                          <p className="font-semibold mb-1">{d.name}</p>
                          <p className="text-muted-foreground">Duration: {d.duration}ms</p>
                          <p className="text-muted-foreground">Start: {d.offset}ms</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="duration" radius={[0, 4, 4, 0]} barSize={20}>
                    {WATERFALL_DATA.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>

              {/* Waterfall visual bars as a custom display */}
              <div className="mt-4 space-y-2">
                {WATERFALL_DATA.map((phase, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="w-[120px] text-right text-muted-foreground font-medium shrink-0">
                      {phase.name}
                    </span>
                    <div className="flex-1 h-5 relative bg-muted/20 rounded">
                      <div
                        className="absolute top-0 h-full rounded"
                        style={{
                          left: `${(phase.offset / waterfallMax) * 100}%`,
                          width: `${(phase.duration / waterfallMax) * 100}%`,
                          backgroundColor: phase.color,
                          opacity: 0.8,
                        }}
                      />
                    </div>
                    <span className="w-[60px] text-muted-foreground tabular-nums shrink-0">
                      {phase.duration}ms
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 6. Performance by Page URL ─────────────────────────────────── */}
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-500" />
                <div>
                  <CardTitle className="text-base">Performance by Page</CardTitle>
                  <CardDescription>Core Web Vitals comparison across your top pages</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <ScrollArea className="max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6">Page URL</TableHead>
                      <TableHead className="w-[90px] text-center">Score</TableHead>
                      <TableHead className="w-[90px] text-center">LCP</TableHead>
                      <TableHead className="w-[90px] text-center">FID</TableHead>
                      <TableHead className="w-[90px] text-center pr-6">CLS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagePerformance.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No page performance data available.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagePerformance.map((page, index) => (
                        <TableRow key={index}>
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-2 max-w-[300px]">
                              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-sm truncate" title={page.url}>{page.url}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs font-bold tabular-nums',
                                page.score >= 90
                                  ? 'border-emerald-500 text-emerald-600'
                                  : page.score >= 50
                                    ? 'border-amber-500 text-amber-600'
                                    : 'border-red-500 text-red-600',
                              )}
                            >
                              {page.score}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={cn(
                                'text-sm font-medium tabular-nums',
                                page.lcp <= 2.5 ? 'text-emerald-500' : page.lcp <= 4 ? 'text-amber-500' : 'text-red-500',
                              )}
                            >
                              {page.lcp}s
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={cn(
                                'text-sm font-medium tabular-nums',
                                page.fid <= 100 ? 'text-emerald-500' : page.fid <= 300 ? 'text-amber-500' : 'text-red-500',
                              )}
                            >
                              {page.fid}ms
                            </span>
                          </TableCell>
                          <TableCell className="text-center pr-6">
                            <span
                              className={cn(
                                'text-sm font-medium tabular-nums',
                                page.cls <= 0.1 ? 'text-emerald-500' : page.cls <= 0.25 ? 'text-amber-500' : 'text-red-500',
                              )}
                            >
                              {page.cls}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 7. Optimization Recommendations ────────────────────────────── */}
        <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                  <CardTitle className="text-base">Optimization Recommendations</CardTitle>
                  <CardDescription>Actionable steps to improve your Core Web Vitals scores</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
                    <p className="text-sm font-medium text-emerald-600">All metrics are performing well!</p>
                    <p className="text-xs text-muted-foreground mt-1">No critical optimizations needed at this time.</p>
                  </div>
                ) : (
                  recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-relaxed">{rec}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  )
}
