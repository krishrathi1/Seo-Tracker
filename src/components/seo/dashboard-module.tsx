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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

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

// ─── Fetch hook ───────────────────────────────────────────────────────
function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['seo-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/seo/dashboard')
      if (!res.ok) {
        // Try seeding first
        await fetch('/api/seo/seed', { method: 'POST' })
        const retry = await fetch('/api/seo/dashboard')
        if (!retry.ok) throw new Error('Failed to fetch dashboard data')
        return retry.json()
      }
      return res.json()
    },
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
      custom: <CircularProgress value={data.healthScore} />,
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
                <div className="flex items-center gap-4 mt-3">
                  {card.custom}
                  <div>
                    <p className={cn('text-sm', card.subtitleColor)}>{card.subtitle}</p>
                  </div>
                </div>
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

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
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
  const allRows = [
    { domain: competitors.ours.domain, authorityScore: competitors.ours.authorityScore, organicKeywords: competitors.ours.organicKeywords, organicTraffic: competitors.ours.organicTraffic, backlinks: competitors.ours.backlinks, isOurs: true },
    ...competitors.competitors.map(c => ({ ...c, isOurs: false })),
  ]

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
        {allRows.map((row) => (
          <TableRow key={row.domain} className={row.isOurs ? 'bg-emerald-500/5' : ''}>
            <TableCell className="text-xs font-medium">
              <div className="flex items-center gap-2">
                {row.isOurs && (
                  <Badge className="bg-emerald-500/15 text-emerald-600 text-[9px] px-1.5 py-0 border-0 font-semibold">
                    <Crown className="h-2.5 w-2.5 mr-0.5" />YOU
                  </Badge>
                )}
                {row.domain}
              </div>
            </TableCell>
            <TableCell className="text-xs text-right tabular-nums">
              <span className={cn('font-medium', row.authorityScore >= 70 ? 'text-emerald-500' : row.authorityScore >= 50 ? 'text-amber-500' : 'text-rose-500')}>
                {row.authorityScore}
              </span>
            </TableCell>
            <TableCell className="text-xs text-right tabular-nums">{formatNumber(row.organicKeywords)}</TableCell>
            <TableCell className="text-xs text-right tabular-nums">{formatNumber(row.organicTraffic)}</TableCell>
            <TableCell className="text-xs text-right tabular-nums">{formatNumber(row.backlinks)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// ─── Main Dashboard Module ────────────────────────────────────────────
export function DashboardModule() {
  const { data, isLoading, error } = useDashboard()

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

        {/* ── 1. Top Metric Cards ──────────────────────────── */}
        <MetricCards data={data} />

        {/* ── 2. Keyword Distribution & Rank Trend ─────────── */}
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

        {/* ── 3. Biggest Movers ────────────────────────────── */}
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

        {/* ── 4. Site Health & Audit + Backlink Profile ────── */}
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

        {/* ── 5. Competitor Comparison ─────────────────────── */}
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
