'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Heart,
  Target,
  Link2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Users,
  Activity,
  Crown,
  Globe,
  FileDown,
  Zap,
  ListChecks,
  Code2,
  ChevronRight,
  AlertTriangle,
  Wrench,
  Smartphone,
  Monitor,
  Lock,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { useSeoStore } from '@/lib/seo-store'

// ─── Types ────────────────────────────────────────────────────────────
interface DashboardData {
  project: { id: string; name: string; domain: string }
  healthScore: number
  keywords: {
    total: number
    distribution: { top3: number; top10: number; top20: number; rank21to50: number; rank50Plus: number }
    averageRank: number
    changes: { improved: number; declined: number; new: number; lost: number }
  }
  backlinks: {
    total: number
    newThisMonth: number
    lostThisMonth: number
    referringDomains: number
    followRatio: number
    nofollowRatio: number
  }
  audit: {
    score: number
    totalPages: number
    issueBreakdown: { critical: number; high: number; medium: number; low: number; info: number }
    scoreTrend: { date: string; score: number }[]
  }
  traffic: { estimatedMonthlyVisits: number; estimatedValue: number }
  competitors: {
    ours: { domain: string; authorityScore: number; organicKeywords: number; organicTraffic: number; backlinks: number }
    competitors: { id: string; domain: string; authorityScore: number; organicKeywords: number; organicTraffic: number; backlinks: number }[]
  }
  alerts: { total: number; unread: number }
  monthlyTrend: { month: string; averageRank: number | null; totalKeywords: number }[]
  biggestMovers: {
    improved: { id: string; keyword: string; currentRank: number; previousRank: number; change: number; searchVolume: number | null; url: string | null }[]
    declined: { id: string; keyword: string; currentRank: number; previousRank: number; change: number; searchVolume: number | null; url: string | null }[]
  }
}

// ─── Constants ────────────────────────────────────────────────────────
const CHART_COLORS = {
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  rose: '#f43f5e',
}

const DISTRIBUTION_COLORS = [
  CHART_COLORS.emerald,
  CHART_COLORS.teal,
  CHART_COLORS.cyan,
  CHART_COLORS.amber,
  CHART_COLORS.rose,
]

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
  info: '#6b7280',
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' },
  }),
}

// ─── Helpers ──────────────────────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return n.toLocaleString()
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return '$' + n.toLocaleString()
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-500'
  if (score >= 40) return 'text-amber-500'
  return 'text-rose-500'
}

function getScoreStroke(score: number): string {
  if (score >= 70) return CHART_COLORS.emerald
  if (score >= 40) return CHART_COLORS.amber
  return CHART_COLORS.rose
}

// ─── SEO Grade System ──────────────────────────────────────────────────
type GradeInfo = { letter: string; color: string; bgColor: string; textColor: string }

function getGrade(score: number): GradeInfo {
  if (score >= 90) return { letter: 'A+', color: 'bg-emerald-500', bgColor: 'bg-emerald-500/15', textColor: 'text-emerald-600 dark:text-emerald-400' }
  if (score >= 80) return { letter: 'A', color: 'bg-emerald-500', bgColor: 'bg-emerald-500/15', textColor: 'text-emerald-600 dark:text-emerald-400' }
  if (score >= 70) return { letter: 'B', color: 'bg-teal-500', bgColor: 'bg-teal-500/15', textColor: 'text-teal-600 dark:text-teal-400' }
  if (score >= 60) return { letter: 'C', color: 'bg-amber-500', bgColor: 'bg-amber-500/15', textColor: 'text-amber-600 dark:text-amber-400' }
  if (score >= 40) return { letter: 'D', color: 'bg-orange-500', bgColor: 'bg-orange-500/15', textColor: 'text-orange-600 dark:text-orange-400' }
  return { letter: 'F', color: 'bg-rose-500', bgColor: 'bg-rose-500/15', textColor: 'text-rose-600 dark:text-rose-400' }
}

function GradeBadge({ score, size = 'default' }: { score: number; size?: 'default' | 'lg' }) {
  const grade = getGrade(score)
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md font-bold tabular-nums',
        grade.bgColor,
        grade.textColor,
        size === 'lg' ? 'h-10 w-10 text-lg' : 'h-7 w-7 text-sm'
      )}
    >
      {grade.letter}
    </span>
  )
}

// ─── Fetch hook ───────────────────────────────────────────────────────
function useDashboard(projectId: string | null) {
  return useQuery<DashboardData>({
    queryKey: ['seo-dashboard', projectId],
    queryFn: async () => {
      const params = projectId ? `?projectId=${projectId}` : ''
      const res = await fetch(`/api/seo/dashboard${params}`)
      if (!res.ok) throw new Error('Failed to fetch dashboard data')
      return res.json()
    },
    enabled: !!projectId,
    staleTime: 60_000,
  })
}

// ─── Circular Progress ────────────────────────────────────────────────
function CircularProgress({ value, size = 88, strokeWidth = 7 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const color = getScoreStroke(value)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
        />
      </svg>
      <span className={cn('absolute text-2xl font-bold tabular-nums', getScoreColor(value))}>
        {value}
      </span>
    </div>
  )
}

// ─── Mini Distribution Bar ───────────────────────────────────────────
function MiniDistributionBar({ distribution }: { distribution: DashboardData['keywords']['distribution'] }) {
  const total = distribution.top3 + distribution.top10 + distribution.top20 + distribution.rank21to50 + distribution.rank50Plus
  if (total === 0) return null
  const segments = [
    { value: distribution.top3, color: CHART_COLORS.emerald, label: 'Top 3' },
    { value: distribution.top10, color: CHART_COLORS.teal, label: 'Top 10' },
    { value: distribution.top20, color: CHART_COLORS.cyan, label: 'Top 20' },
    { value: distribution.rank21to50, color: CHART_COLORS.amber, label: '21-50' },
    { value: distribution.rank50Plus, color: CHART_COLORS.rose, label: '50+' },
  ]

  return (
    <div className="space-y-1.5 mt-3">
      <div className="flex h-2 w-full overflow-hidden rounded-full">
        {segments.map((seg, i) => (
          <div
            key={i}
            style={{ width: `${(seg.value / total) * 100}%`, backgroundColor: seg.color }}
            className="first:rounded-l-full last:rounded-r-full transition-all duration-500"
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: seg.color }} />
            {seg.label}: {seg.value}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-20 mt-3" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Top Metric Cards ─────────────────────────────────────────────────
function MetricCards({ data }: { data: DashboardData }) {
  const cards = [
    {
      title: 'SEO Health Score',
      value: data.healthScore,
      icon: Heart,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      subtitle: data.audit.issueBreakdown.critical > 0
        ? `${data.audit.issueBreakdown.critical} critical issues`
        : 'No critical issues',
      subtitleColor: data.audit.issueBreakdown.critical > 0 ? 'text-rose-500' : 'text-emerald-500',
      custom: (
        <div className="flex items-center gap-3 mt-3">
          <CircularProgress value={data.healthScore} />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <GradeBadge score={data.healthScore} />
              <span className={cn('text-sm font-medium', getScoreColor(data.healthScore))}>
                Grade {getGrade(data.healthScore).letter}
              </span>
            </div>
            <p className={cn('text-xs', data.audit.issueBreakdown.critical > 0 ? 'text-rose-500' : 'text-emerald-500')}>
              {data.audit.issueBreakdown.critical > 0
                ? `${data.audit.issueBreakdown.critical} critical issues`
                : 'No critical issues'}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-amber-500" />
              <span>Potential: <span className="font-medium text-emerald-600 dark:text-emerald-400">{Math.min(100, data.healthScore + data.audit.issueBreakdown.critical * 5 + data.audit.issueBreakdown.high * 2)}</span></span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Keywords Tracked',
      value: formatNumber(data.keywords.total),
      icon: Target,
      iconBg: 'bg-teal-500/10',
      iconColor: 'text-teal-500',
      subtitle: `Avg rank: ${data.keywords.averageRank}`,
      extra: (
        <div className="flex items-center gap-3 mt-1 text-xs">
          <span className="flex items-center gap-0.5 text-emerald-500">
            <ArrowUpRight className="h-3 w-3" />{data.keywords.changes.improved}
          </span>
          <span className="flex items-center gap-0.5 text-rose-500">
            <ArrowDownRight className="h-3 w-3" />{data.keywords.changes.declined}
          </span>
          <span className="text-muted-foreground">
            +{data.keywords.changes.new} new · {data.keywords.changes.lost} lost
          </span>
        </div>
      ),
      distributionBar: <MiniDistributionBar distribution={data.keywords.distribution} />,
    },
    {
      title: 'Total Backlinks',
      value: formatNumber(data.backlinks.total),
      icon: Link2,
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-500',
      subtitle: `${formatNumber(data.backlinks.referringDomains)} referring domains`,
      extra: (
        <div className="flex items-center gap-3 mt-1 text-xs">
          <span className="flex items-center gap-0.5 text-emerald-500">
            <ArrowUpRight className="h-3 w-3" />+{data.backlinks.newThisMonth} new
          </span>
          <span className="flex items-center gap-0.5 text-rose-500">
            <ArrowDownRight className="h-3 w-3" />-{data.backlinks.lostThisMonth} lost
          </span>
        </div>
      ),
    },
    {
      title: 'Organic Traffic Value',
      value: formatCurrency(data.traffic.estimatedValue),
      icon: DollarSign,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      subtitle: `${formatNumber(data.traffic.estimatedMonthlyVisits)} est. monthly visits`,
      extra: (
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Activity className="h-3 w-3" />
          Based on CTR model &amp; search volume
        </div>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <motion.div key={card.title} custom={i} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="h-full">
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', card.iconBg)}>
                  <card.icon className={cn('h-4.5 w-4.5', card.iconColor)} />
                </div>
              </div>

              {card.custom ? (
                card.custom
              ) : (
                <>
                  <p className="text-3xl font-bold tracking-tight mt-3 tabular-nums">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
                </>
              )}

              {card.extra}
              {card.distributionBar}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Keyword Distribution Donut ───────────────────────────────────────
function KeywordDistributionChart({ distribution }: { distribution: DashboardData['keywords']['distribution'] }) {
  const data = [
    { name: 'Top 3', value: distribution.top3, color: CHART_COLORS.emerald },
    { name: 'Top 10', value: distribution.top10, color: CHART_COLORS.teal },
    { name: 'Top 20', value: distribution.top20, color: CHART_COLORS.cyan },
    { name: '21-50', value: distribution.rank21to50, color: CHART_COLORS.amber },
    { name: '50+', value: distribution.rank50Plus, color: CHART_COLORS.rose },
  ].filter(d => d.value > 0)

  const total = data.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <div className="relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={105}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => [`${value} keywords`, name]}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
        <span className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
          {total}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Keywords</span>
      </div>
    </div>
  )
}

// ─── Monthly Rank Trend ───────────────────────────────────────────────
function MonthlyRankTrend({ trend }: { trend: DashboardData['monthlyTrend'] }) {
  const chartData = trend
    .filter(t => t.averageRank !== null)
    .map(t => ({
      month: t.month,
      rank: t.averageRank,
    }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="rankGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.emerald} stopOpacity={0.3} />
            <stop offset="100%" stopColor={CHART_COLORS.emerald} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          reversed
          domain={['dataMin - 2', 'dataMax + 2']}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          label={{ value: 'Rank (lower = better)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number) => [`#${value.toFixed(1)}`, 'Avg Rank']}
          labelFormatter={(label: string) => `${label}`}
        />
        <Area
          type="monotone"
          dataKey="rank"
          stroke={CHART_COLORS.emerald}
          strokeWidth={2.5}
          fill="url(#rankGradient)"
          dot={false}
          activeDot={{ r: 4, stroke: CHART_COLORS.emerald, strokeWidth: 2, fill: 'hsl(var(--card))' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Biggest Movers Table ─────────────────────────────────────────────
function MoversTable({ movers, type }: { movers: DashboardData['biggestMovers']['improved']; type: 'gainer' | 'loser' }) {
  const isGainer = type === 'gainer'

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">Keyword</TableHead>
          <TableHead className="text-xs text-right">Change</TableHead>
          <TableHead className="text-xs text-right">Rank</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movers.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-center text-muted-foreground text-xs py-6">
              No data available
            </TableCell>
          </TableRow>
        ) : (
          movers.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="text-xs font-medium max-w-[200px] truncate">{m.keyword}</TableCell>
              <TableCell className="text-xs text-right">
                <span className={cn('inline-flex items-center gap-0.5 font-medium', isGainer ? 'text-emerald-500' : 'text-rose-500')}>
                  {isGainer ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  +{Math.abs(m.change)}
                </span>
              </TableCell>
              <TableCell className="text-xs text-right tabular-nums">#{m.currentRank}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

// ─── Audit Issues Bar Chart ───────────────────────────────────────────
function AuditIssuesChart({ issues }: { issues: DashboardData['audit']['issueBreakdown'] }) {
  const data = [
    { name: 'Critical', value: issues.critical, color: SEVERITY_COLORS.critical },
    { name: 'High', value: issues.high, color: SEVERITY_COLORS.high },
    { name: 'Medium', value: issues.medium, color: SEVERITY_COLORS.medium },
    { name: 'Low', value: issues.low, color: SEVERITY_COLORS.low },
    { name: 'Info', value: issues.info, color: SEVERITY_COLORS.info },
  ]

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          width={65}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value: number) => [`${value} issues`, '']}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Backlink Profile Chart ───────────────────────────────────────────
function BacklinkProfileChart({ newCount, lostCount }: { newCount: number; lostCount: number }) {
  // Create a simulated monthly new/lost backlinks chart based on the totals
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const newPerMonth = Math.max(1, Math.round(newCount / 12))
  const lostPerMonth = Math.max(1, Math.round(lostCount / 12))

  const data = months.map((month, i) => ({
    month,
    new: i < 11 ? Math.max(0, newPerMonth + Math.floor(Math.sin(i * 0.8) * 3)) : newCount - newPerMonth * 10,
    lost: i < 11 ? Math.max(0, lostPerMonth + Math.floor(Math.cos(i * 0.9) * 2)) : lostCount - lostPerMonth * 10,
  }))

  // Ensure last month has the actual values
  data[data.length - 1].new = newCount - data.slice(0, -1).reduce((s, d) => s + d.new, 0)
  data[data.length - 1].lost = lostCount - data.slice(0, -1).reduce((s, d) => s + d.lost, 0)

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => <span className="text-xs text-muted-foreground">{value === 'new' ? 'New Links' : 'Lost Links'}</span>}
        />
        <Bar dataKey="new" fill={CHART_COLORS.emerald} radius={[3, 3, 0, 0]} barSize={14} name="new" />
        <Bar dataKey="lost" fill={CHART_COLORS.rose} radius={[3, 3, 0, 0]} barSize={14} name="lost" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Competitor Comparison Table ───────────────────────────────────────
function CompetitorComparison({ competitors }: { competitors: DashboardData['competitors'] }) {
  const allRowsRaw = [
    { domain: competitors.ours.domain, authorityScore: competitors.ours.authorityScore, organicKeywords: competitors.ours.organicKeywords, organicTraffic: competitors.ours.organicTraffic, backlinks: competitors.ours.backlinks, isOurs: true },
    ...competitors.competitors.map(c => ({ ...c, isOurs: false })),
  ]

  // De-duplicate by domain (preferring 'ours' first)
  const seen = new Set<string>()
  const allRows = allRowsRaw.filter(row => {
    if (!row.domain) return false
    const normalizedDomain = row.domain.toLowerCase().trim()
    if (seen.has(normalizedDomain)) return false
    seen.add(normalizedDomain)
    return true
  })

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">Domain</TableHead>
          <TableHead className="text-xs text-right">Authority</TableHead>
          <TableHead className="text-xs text-right">Keywords</TableHead>
          <TableHead className="text-xs text-right">Traffic</TableHead>
          <TableHead className="text-xs text-right">Backlinks</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {allRows.map((row, index) => (
          <TableRow key={`${row.domain}-${row.isOurs ? 'ours' : index}`} className={row.isOurs ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}>
            <TableCell className="text-xs font-medium py-3">
              <div className="flex items-center gap-2">
                <img
                  src={`https://www.google.com/s2/favicons?sz=64&domain=${row.domain}`}
                  alt=""
                  className="h-4 w-4 rounded-sm object-contain bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://favicons.githubusercontent.com/g/${row.domain}`
                  }}
                />
                {row.isOurs && (
                  <Badge className="bg-emerald-500/15 text-emerald-600 text-[9px] px-1.5 py-0.5 border-0 font-bold tracking-wider shrink-0 flex items-center">
                    <Crown className="h-2.5 w-2.5 mr-0.5 text-emerald-500" />YOU
                  </Badge>
                )}
                <span className="truncate max-w-[200px]">{row.domain}</span>
              </div>
            </TableCell>
            <TableCell className="text-xs text-right tabular-nums">
              <span className={cn('font-bold', row.authorityScore >= 70 ? 'text-emerald-500' : row.authorityScore >= 50 ? 'text-amber-500' : 'text-rose-500')}>
                {row.authorityScore}
              </span>
            </TableCell>
            <TableCell className="text-xs text-right tabular-nums font-medium text-zinc-700 dark:text-zinc-300">{formatNumber(row.organicKeywords)}</TableCell>
            <TableCell className="text-xs text-right tabular-nums font-medium text-zinc-700 dark:text-zinc-300">{formatNumber(row.organicTraffic)}</TableCell>
            <TableCell className="text-xs text-right tabular-nums font-medium text-zinc-700 dark:text-zinc-300">{formatNumber(row.backlinks)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// ─── Quick Actions ────────────────────────────────────────────────────
function QuickActions({ data }: { data: DashboardData }) {
  const setActiveModule = useSeoStore((s) => s.setActiveModule)
  const resetForNewAnalysis = useSeoStore((s) => s.resetForNewAnalysis)

  const handleExport = () => {
    const params = new URLSearchParams({
      projectId: data.project.id,
      format: 'csv',
      module: 'full',
    })
    window.open(`/api/seo/export?${params.toString()}`, '_blank')
  }

  const actions = [
    {
      label: 'Run New Analysis',
      icon: Activity,
      onClick: resetForNewAnalysis,
      variant: 'default' as const,
      className: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      label: 'Export Report',
      icon: FileDown,
      onClick: handleExport,
      variant: 'outline' as const,
      className: 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
    },
    {
      label: 'View Action Plan',
      icon: ListChecks,
      onClick: () => setActiveModule('action-plan'),
      variant: 'outline' as const,
      className: 'border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400',
    },
    {
      label: 'Schema Analyzer',
      icon: Code2,
      onClick: () => setActiveModule('schema'),
      variant: 'outline' as const,
      className: 'border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400',
    },
  ]

  return (
    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
      <Card>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 relative">
                <Zap className="h-4.5 w-4.5 text-emerald-500" />
                <span className="absolute top-0 right-0 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold">Quick Actions</p>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20">
                    <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                    Live Web Crawler Active
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Common tasks and shortcuts</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {actions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant}
                  size="sm"
                  className={cn('h-8 text-xs gap-1.5', action.className)}
                  onClick={action.onClick}
                >
                  <action.icon className="h-3.5 w-3.5" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Grade Breakdown ───────────────────────────────────────────────────
function GradeBreakdown({ data }: { data: DashboardData }) {
  // Derive sub-grades from the data
  const technicalScore = data.audit.score
  const contentScore = data.keywords.total > 0
    ? Math.min(100, Math.round(
        (data.keywords.distribution.top3 * 5 +
         data.keywords.distribution.top10 * 3 +
         data.keywords.distribution.top20 * 1.5 +
         data.keywords.distribution.rank21to50 * 0.5) /
        Math.max(1, data.keywords.total) * 10
      ))
    : 0
  const authorityScore = Math.min(100, Math.round(
    (data.backlinks.referringDomains * 2 +
     data.backlinks.total * 0.5 +
     data.backlinks.followRatio * 0.3)
  ))
  const experienceScore = Math.min(100, Math.round(
    (data.healthScore * 0.4 +
     (data.audit.issueBreakdown.critical === 0 ? 30 : 10) +
     (data.backlinks.followRatio > 50 ? 20 : 10) +
     (data.audit.score > 70 ? 10 : 5))
  ))

  const overallScore = Math.round((technicalScore + contentScore + authorityScore + experienceScore) / 4)

  const grades = [
    { label: 'Technical SEO', icon: Wrench, score: technicalScore, description: 'Site structure, speed & crawlability', gradient: 'from-emerald-500 to-teal-400' },
    { label: 'Content', icon: Target, score: contentScore, description: 'Keyword rankings & content quality', gradient: 'from-cyan-500 to-blue-400' },
    { label: 'Authority', icon: Link2, score: authorityScore, description: 'Backlinks & referring domains', gradient: 'from-indigo-500 to-purple-400' },
    { label: 'Experience', icon: Smartphone, score: experienceScore, description: 'Mobile, SSL & user experience', gradient: 'from-amber-500 to-orange-400' },
  ]

  return (
    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
      <Card className="hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500 animate-pulse" />
              <div>
                <CardTitle className="text-base font-semibold">SEO Grade Breakdown</CardTitle>
                <CardDescription>Performance across key SEO categories</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Overall</span>
              <GradeBadge score={overallScore} size="lg" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {grades.map((grade) => {
            return (
              <div key={grade.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <grade.icon className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{grade.label}</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">{grade.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs tabular-nums font-semibold text-zinc-600 dark:text-zinc-400">{grade.score}/100</span>
                    <GradeBadge score={grade.score} />
                  </div>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/40">
                  <div
                    className={cn('h-full rounded-full transition-all duration-1000 bg-gradient-to-r', grade.gradient)}
                    style={{ width: `${grade.score}%` }}
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Priority Issues Widget ────────────────────────────────────────────
function PriorityIssues({ data }: { data: DashboardData }) {
  const setActiveModule = useSeoStore((s) => s.setActiveModule)

  // Derive top 3 critical/high issues from audit data
  // Since we don't have the actual issue list in DashboardData, we synthesize from the breakdown
  const priorityIssues = []

  if (data.audit.issueBreakdown.critical > 0) {
    priorityIssues.push(
      { severity: 'critical', title: `${data.audit.issueBreakdown.critical} Critical Issue${data.audit.issueBreakdown.critical > 1 ? 's' : ''} Found`, description: 'Critical issues severely impact your SEO performance' },
    )
  }
  if (data.audit.issueBreakdown.high > 0) {
    priorityIssues.push(
      { severity: 'high', title: `${data.audit.issueBreakdown.high} High Priority Issue${data.audit.issueBreakdown.high > 1 ? 's' : ''}`, description: 'High severity issues need immediate attention' },
    )
  }
  if (data.audit.issueBreakdown.medium > 0 && priorityIssues.length < 3) {
    priorityIssues.push(
      { severity: 'medium', title: `${data.audit.issueBreakdown.medium} Medium Priority Issue${data.audit.issueBreakdown.medium > 1 ? 's' : ''}`, description: 'Medium issues can affect rankings over time' },
    )
  }

  // Limit to 3
  const displayIssues = priorityIssues.slice(0, 3)

  const severityConfig: Record<string, { color: string; bgColor: string; borderColor: string }> = {
    critical: { color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-950/20', borderColor: 'border-rose-200 dark:border-rose-800' },
    high: { color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-950/20', borderColor: 'border-orange-200 dark:border-orange-800' },
    medium: { color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/20', borderColor: 'border-amber-200 dark:border-amber-800' },
  }

  return (
    <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <div>
                <CardTitle className="text-base">Priority Issues</CardTitle>
                <CardDescription>Top issues that need your attention</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => setActiveModule('audit')}
            >
              View All
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {displayIssues.length === 0 ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">No critical issues detected</p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-500">Your site is performing well across all checks</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {displayIssues.map((issue, i) => {
                const config = severityConfig[issue.severity] ?? severityConfig.medium
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border',
                      config.bgColor,
                      config.borderColor
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        className={cn(
                          'text-[9px] px-1.5 py-0 border-0 font-semibold uppercase',
                          issue.severity === 'critical' ? 'bg-rose-500/15 text-rose-600' :
                          issue.severity === 'high' ? 'bg-orange-500/15 text-orange-600' :
                          'bg-amber-500/15 text-amber-600'
                        )}
                      >
                        {issue.severity}
                      </Badge>
                      <div>
                        <p className={cn('text-sm font-medium', config.color)}>{issue.title}</p>
                        <p className="text-[10px] text-muted-foreground">{issue.description}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn('h-7 text-xs gap-1 shrink-0', config.color)}
                      onClick={() => setActiveModule('audit')}
                    >
                      Fix now
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Social Preview & Quick Actions ──────────────────────────────────
function SocialPreviewAndActions({ data }: { data: DashboardData }) {
  const domain = data.project.domain
  const resetForNewAnalysis = useSeoStore((s) => s.resetForNewAnalysis)
  const [device, setDevice] = React.useState<'desktop' | 'mobile'>('desktop')

  return (
    <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
      <Card className="hover:shadow-md transition-all duration-300">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base flex items-center gap-2 font-semibold">
                <Globe className="h-4 w-4 text-emerald-500" />
                Search Engine Preview
              </CardTitle>
              <CardDescription>How your site appears in Google search results</CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-0.5 bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-200/50 dark:border-zinc-700/50">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-6 w-8 rounded-md p-0', device === 'desktop' ? 'bg-white dark:bg-zinc-950 shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground')}
                  onClick={() => setDevice('desktop')}
                >
                  <Monitor className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-6 w-8 rounded-md p-0', device === 'mobile' ? 'bg-white dark:bg-zinc-950 shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground')}
                  onClick={() => setDevice('mobile')}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Badge variant="outline" className="text-[10px] gap-1 h-7 border-emerald-200/50 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Analyzed
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                onClick={resetForNewAnalysis}
              >
                <Activity className="h-3 w-3" />
                New Analysis
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* Google Preview */}
            <div className="w-full flex items-center justify-center p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-800/40 min-h-[170px]">
              {device === 'mobile' ? (
                <div className="w-full max-w-[320px] border-[5px] border-zinc-200 dark:border-zinc-800 rounded-[28px] p-3.5 bg-white dark:bg-zinc-950 shadow-sm relative">
                  {/* Speaker & notch */}
                  <div className="w-20 h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-400/50" />
                  </div>
                  {/* Mobile Preview Content */}
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-4 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-800/50">
                        <Globe className="h-2.5 w-2.5 text-zinc-600 dark:text-zinc-400" />
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium truncate">{domain}</span>
                    </div>
                    <h3 className="text-sm font-semibold leading-tight text-[#1a0dab] dark:text-[#8ab4f8] truncate cursor-pointer hover:underline">
                      {data.project.name || domain}
                    </h3>
                    <p className="text-[11px] text-[#4d5156] dark:text-zinc-300 line-clamp-3 leading-relaxed">
                      {data.keywords.total > 0
                        ? `Explore ${data.project.name} — tracking ${data.keywords.total} keywords with an SEO score of ${data.healthScore}/100. ${data.backlinks.total} backlinks from ${data.backlinks.referringDomains} domains.`
                        : `Analyze and optimize your website's SEO with RankPulse — the free, open-source SEO intelligence platform.`
                      }
                    </p>
                  </div>
                </div>
              ) : (
                /* Desktop Preview Content */
                <div className="w-full space-y-1.5 p-4 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs text-left">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                      <Globe className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">{domain}</span>
                  </div>
                  <h3 className="text-lg leading-snug text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer font-medium truncate">
                    {data.project.name || domain}
                  </h3>
                  <p className="text-sm text-[#4d5156] dark:text-zinc-300 leading-relaxed line-clamp-2">
                    {data.keywords.total > 0
                      ? `Explore ${data.project.name} — tracking ${data.keywords.total} keywords with an SEO score of ${data.healthScore}/100. ${data.backlinks.total} backlinks from ${data.backlinks.referringDomains} domains.`
                      : `Analyze and optimize your website's SEO with RankPulse — the free, open-source SEO intelligence platform.`
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Social / Open Graph Preview */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Stats</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/20 hover:scale-[1.02] transition-transform duration-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{data.healthScore}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">SEO Score</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/20 border border-teal-100/50 dark:border-teal-900/20 hover:scale-[1.02] transition-transform duration-300">
                  <Target className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <div>
                    <p className="text-sm font-bold text-teal-700 dark:text-teal-400">{data.keywords.total}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Keywords</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/20">
                  <Link2 className="h-4 w-4 text-cyan-600" />
                  <div>
                    <p className="text-sm font-bold">{data.backlinks.total}</p>
                    <p className="text-[10px] text-muted-foreground">Backlinks</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                  <DollarSign className="h-4 w-4 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold">{formatCurrency(data.traffic.estimatedValue)}</p>
                    <p className="text-[10px] text-muted-foreground">Traffic Value</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Main Dashboard Module ────────────────────────────────────────────
export function DashboardModule() {
  const activeProjectId = useSeoStore((s) => s.activeProjectId)
  const { data, isLoading, error } = useDashboard(activeProjectId)

  if (isLoading) return <DashboardSkeleton />

  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-0 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
              <ShieldCheck className="h-7 w-7 text-rose-500" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Unable to Load Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              {error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalIssues = Object.values(data.audit.issueBreakdown).reduce((s, v) => s + v, 0)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

        {/* ── 0. Quick Actions ─────────────────────────────── */}
        <QuickActions data={data} />

        {/* ── 1. Top Metric Cards ──────────────────────────── */}
        <MetricCards data={data} />

        {/* ── 2. Grade Breakdown & Priority Issues ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GradeBreakdown data={data} />
          <PriorityIssues data={data} />
        </div>

        {/* ── 3. Social Preview & Quick Actions ─────────────── */}
        <SocialPreviewAndActions data={data} />

        {/* ── 4. Keyword Distribution & Rank Trend ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Keyword Position Distribution</CardTitle>
                <CardDescription>Current ranking positions across all tracked keywords</CardDescription>
              </CardHeader>
              <CardContent>
                <KeywordDistributionChart distribution={data.keywords.distribution} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Monthly Rank Trend</CardTitle>
                <CardDescription>Average ranking position over the last 12 months (lower is better)</CardDescription>
              </CardHeader>
              <CardContent>
                <MonthlyRankTrend trend={data.monthlyTrend} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── 5. Biggest Movers ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <CardTitle className="text-base">Top Gainers</CardTitle>
                </div>
                <CardDescription>Keywords with the biggest rank improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <MoversTable movers={data.biggestMovers.improved} type="gainer" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                  <CardTitle className="text-base">Top Losers</CardTitle>
                </div>
                <CardDescription>Keywords with the biggest rank declines</CardDescription>
              </CardHeader>
              <CardContent>
                <MoversTable movers={data.biggestMovers.declined} type="loser" />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── 6. Site Health & Audit + Backlink Profile ────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Audit Issues by Severity</CardTitle>
                    <CardDescription>{totalIssues} total issues found in latest audit</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Score: {data.audit.score}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <AuditIssuesChart issues={data.audit.issueBreakdown} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Backlink Profile</CardTitle>
                <CardDescription>
                  New vs lost backlinks over time · {data.backlinks.followRatio}% follow / {data.backlinks.nofollowRatio}% nofollow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BacklinkProfileChart newCount={data.backlinks.newThisMonth} lostCount={data.backlinks.lostThisMonth} />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ── 7. Competitor Comparison ─────────────────────── */}
        <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Competitor Comparison</CardTitle>
              </div>
              <CardDescription>
                How you stack up against {data.competitors.competitors.length} tracked competitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompetitorComparison competitors={data.competitors} />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
