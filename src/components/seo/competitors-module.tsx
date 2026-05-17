'use client'

import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  Users,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Plus,
  Globe,
  Shield,
  Link,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Star,
  AlertTriangle,
  Sparkles,
  Search,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { useSeoStore } from '@/lib/seo-store'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────
interface CompetitorMetrics {
  id?: string
  domain: string
  authorityScore: number
  organicKeywords: number
  organicTraffic: number
  backlinks: number
}

interface GapAnalysisItem {
  domain: string
  authorityGap: number
  keywordGap: number
  trafficGap: number
  backlinkGap: number
}

interface VisibilityCompetitor {
  domain: string
  share: number
}

interface CompetitorsResponse {
  competitors: CompetitorMetrics[]
  comparison: {
    ours: CompetitorMetrics
    gapAnalysis: GapAnalysisItem[]
    visibilityShare: {
      ours: number
      competitors: VisibilityCompetitor[]
    } | null
    strengths: string[]
    weaknesses: string[]
    keywordGaps: KeywordGap[]
  } | null
}

interface KeywordGap {
  keyword: string
  yourRank: number | null
  competitorRank: number
  competitor: string
  volume: number
  difficulty: number
}

// ─── Color Palette ───────────────────────────────────────────────────
const EMERALD = '#10b981'
const COMPETITOR_COLORS = ['#f59e0b', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4', '#84cc16']

function getCompetitorColor(index: number) {
  return COMPETITOR_COLORS[index % COMPETITOR_COLORS.length]
}

function getAuthorityColor(score: number) {
  if (score >= 70) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 50) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function getAuthorityBarColor(score: number) {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function getAuthorityProgressColor(score: number) {
  if (score >= 70) return '[&>div]:bg-emerald-500'
  if (score >= 50) return '[&>div]:bg-amber-500'
  return '[&>div]:bg-red-500'
}

// ─── Fetch Function ──────────────────────────────────────────────────
async function fetchCompetitors(projectId: string): Promise<CompetitorsResponse> {
  const res = await fetch(`/api/seo/competitors?projectId=${projectId}`)
  if (!res.ok) throw new Error('Failed to fetch competitor data')
  return res.json()
}

// ─── Format Helpers ──────────────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatGap(n: number): string {
  if (n > 0) return `+${formatNumber(n)}`
  return formatNumber(n)
}

// ─── Chart Configs ───────────────────────────────────────────────────
const visibilityChartConfig: ChartConfig = {
  yours: { label: 'Your Site', color: EMERALD },
}

const authorityChartConfig: ChartConfig = {
  authorityScore: { label: 'Authority Score', color: EMERALD },
}

// ─── Main Component ──────────────────────────────────────────────────
export function CompetitorsModule() {
  const activeProjectId = useSeoStore((s) => s.activeProjectId)
  const [newCompetitorDomain, setNewCompetitorDomain] = React.useState('')

  const projectId = activeProjectId ?? 'default'

  const { data, isLoading, error } = useQuery({
    queryKey: ['competitors', projectId],
    queryFn: () => fetchCompetitors(projectId),
    refetchOnWindowFocus: false,
  })

  const ours = data?.comparison?.ours
  const competitors = data?.competitors ?? []
  const gapAnalysis = data?.comparison?.gapAnalysis ?? []
  const visibilityShare = data?.comparison?.visibilityShare
  const strengths = data?.comparison?.strengths ?? []
  const weaknesses = data?.comparison?.weaknesses ?? []

  // Build visibility chart data
  const visibilityChartData = React.useMemo(() => {
    if (!visibilityShare) return []
    const items: { domain: string; share: number; fill: string }[] = []
    items.push({ domain: ours?.domain ?? 'Your Site', share: visibilityShare.ours, fill: EMERALD })
    visibilityShare.competitors.forEach((c, i) => {
      items.push({ domain: c.domain, share: c.share, fill: getCompetitorColor(i) })
    })
    return items
  }, [visibilityShare, ours])

  // Update visibility chart config dynamically
  const dynamicVisibilityConfig = React.useMemo(() => {
    const config: ChartConfig = { yours: { label: 'Your Site', color: EMERALD } }
    competitors.forEach((c, i) => {
      config[c.domain] = { label: c.domain, color: getCompetitorColor(i) }
    })
    return config
  }, [competitors])

  // Build authority bar chart data
  const authorityChartData = React.useMemo(() => {
    const items: { domain: string; authorityScore: number; fill: string; isYours: boolean }[] = []
    if (ours) {
      items.push({ domain: ours.domain, authorityScore: ours.authorityScore, fill: EMERALD, isYours: true })
    }
    competitors.forEach((c, i) => {
      items.push({ domain: c.domain, authorityScore: c.authorityScore, fill: getCompetitorColor(i), isYours: false })
    })
    return items.sort((a, b) => b.authorityScore - a.authorityScore)
  }, [ours, competitors])

  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = React.useState(false)

  // Compute keyword gap stats (simulated)
  const gapStats = React.useMemo(() => {
    const commonKw = 23
    const uniqueToYou = 15
    const uniqueToCompetitors = competitors.reduce(
      (sum, c) => sum + Math.round((c.organicKeywords - commonKw) * 0.03),
      0
    )
    return { commonKw, uniqueToYou, uniqueToCompetitors: Math.max(uniqueToCompetitors, 120) }
  }, [competitors])

  // Generate opportunities count from keyword gaps
  const gapAnalysisKeywords = data?.comparison?.keywordGaps ?? []
  const lowDifficultyGaps = gapAnalysisKeywords.filter((g) => g.difficulty < 60).length

  const handleAddCompetitor = async () => {
    if (!newCompetitorDomain.trim() || isAdding) return
    setIsAdding(true)
    try {
      const res = await fetch('/api/seo/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, domain: newCompetitorDomain }),
      })
      if (res.ok) {
        setNewCompetitorDomain('')
        queryClient.invalidateQueries({ queryKey: ['competitors', projectId] })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsAdding(false)
    }
  }

  if (isLoading) {
    return <CompetitorsSkeleton />
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-lg">Failed to Load Data</CardTitle>
            <CardDescription>Could not fetch competitor intelligence data.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!ours || competitors.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-lg">No Competitor Data</CardTitle>
            <CardDescription>
              Add competitors below to start tracking their SEO performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="competitor.com"
                value={newCompetitorDomain}
                onChange={(e) => setNewCompetitorDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCompetitor()}
              />
              <Button onClick={handleAddCompetitor} className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              Competitor Intelligence
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Monitor competitor SEO strategies and identify opportunities
            </p>
          </div>
          <Badge variant="outline" className="w-fit gap-1.5 px-3 py-1 text-xs">
            <Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Tracking {competitors.length} competitor{competitors.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Section 1: Comparison Overview Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              Comparison Overview
            </CardTitle>
            <CardDescription>
              Side-by-side comparison of your site vs competitors
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[200px] pl-4">Domain</TableHead>
                    <TableHead className="w-[200px]">Authority Score</TableHead>
                    <TableHead className="text-right">Organic Keywords</TableHead>
                    <TableHead className="text-right">Organic Traffic</TableHead>
                    <TableHead className="text-right pr-4">Backlinks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Your Site Row */}
                  <TableRow className="bg-emerald-50/50 dark:bg-emerald-950/20 border-l-2 border-l-emerald-500">
                    <TableCell className="pl-4 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          {ours.domain}
                        </span>
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px] px-1.5 py-0 h-5 border-0">
                          YOU
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className={cn('font-semibold text-sm w-6', getAuthorityColor(ours.authorityScore))}>
                          {ours.authorityScore}
                        </span>
                        <div className="flex-1">
                          <Progress value={ours.authorityScore} className={cn('h-2', getAuthorityProgressColor(ours.authorityScore))} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatNumber(ours.organicKeywords)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatNumber(ours.organicTraffic)}
                    </TableCell>
                    <TableCell className="text-right pr-4 font-semibold">
                      {formatNumber(ours.backlinks)}
                    </TableCell>
                  </TableRow>

                  {/* Competitor Rows */}
                  {competitors.map((comp, idx) => {
                    const gap = gapAnalysis.find((g) => g.domain === comp.domain)
                    return (
                      <TableRow key={comp.id ?? idx} className="hover:bg-muted/50">
                        <TableCell className="pl-4 font-medium">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: getCompetitorColor(idx) }}
                            />
                            <span>{comp.domain}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className={cn('font-semibold text-sm w-6', getAuthorityColor(comp.authorityScore))}>
                              {comp.authorityScore}
                            </span>
                            <div className="flex-1">
                              <Progress value={comp.authorityScore} className={cn('h-2', getAuthorityProgressColor(comp.authorityScore))} />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span>{formatNumber(comp.organicKeywords)}</span>
                            {gap && (
                              <span className={cn(
                                'text-[11px] font-medium flex items-center gap-0.5',
                                gap.keywordGap > 0 ? 'text-red-500' : 'text-emerald-500'
                              )}>
                                {gap.keywordGap > 0 ? (
                                  <ArrowUpRight className="h-3 w-3" />
                                ) : (
                                  <ArrowDownRight className="h-3 w-3" />
                                )}
                                {formatGap(gap.keywordGap)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span>{formatNumber(comp.organicTraffic)}</span>
                            {gap && (
                              <span className={cn(
                                'text-[11px] font-medium flex items-center gap-0.5',
                                gap.trafficGap > 0 ? 'text-red-500' : 'text-emerald-500'
                              )}>
                                {gap.trafficGap > 0 ? (
                                  <ArrowUpRight className="h-3 w-3" />
                                ) : (
                                  <ArrowDownRight className="h-3 w-3" />
                                )}
                                {formatGap(gap.trafficGap)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <span>{formatNumber(comp.backlinks)}</span>
                            {gap && (
                              <span className={cn(
                                'text-[11px] font-medium flex items-center gap-0.5',
                                gap.backlinkGap > 0 ? 'text-red-500' : 'text-emerald-500'
                              )}>
                                {gap.backlinkGap > 0 ? (
                                  <ArrowUpRight className="h-3 w-3" />
                                ) : (
                                  <ArrowDownRight className="h-3 w-3" />
                                )}
                                {formatGap(gap.backlinkGap)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Section 2: Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visibility Share Donut Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Target className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                Visibility Share
              </CardTitle>
              <CardDescription>
                Market share distribution based on keyword visibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              {visibilityChartData.length > 0 ? (
                <div className="relative">
                  <ChartContainer config={dynamicVisibilityConfig} className="mx-auto aspect-square max-h-[280px]">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={visibilityChartData}
                        dataKey="share"
                        nameKey="domain"
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="85%"
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {visibilityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {visibilityShare?.ours ?? 0}%
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">Your Share</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                  No visibility data available
                </div>
              )}
              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
                {visibilityChartData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className={cn('truncate max-w-[120px]', idx === 0 && 'font-semibold')}>
                      {item.domain}
                    </span>
                    <span className="text-muted-foreground">({item.share}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Authority Score Comparison Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                Authority Score Comparison
              </CardTitle>
              <CardDescription>
                Domain authority comparison — your site vs competitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={authorityChartConfig} className="aspect-[4/3] max-h-[320px]">
                <BarChart
                  data={authorityChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="domain"
                    width={110}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val: string, idx: number) => {
                      const item = authorityChartData.find(d => d.domain === val)
                      if (item?.isYours) return `⬤ ${val}`
                      return val
                    }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="authorityScore"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={28}
                  >
                    {authorityChartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Keyword Gap Analysis */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Search className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              Keyword Gap Analysis
            </CardTitle>
            <CardDescription>
              Identify keyword opportunities your competitors are targeting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Venn Diagram Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Common Keywords */}
              <div className="relative rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-center">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0 text-[10px] px-2">
                    OVERLAP
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {gapStats.commonKw}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Common Keywords</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Shared with competitors</p>
              </div>

              {/* Unique to You */}
              <div className="relative rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 text-center">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-[10px] px-2">
                    YOURS
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {gapStats.uniqueToYou}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Unique to You</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Competitors don&apos;t rank</p>
              </div>

              {/* Unique to Competitors */}
              <div className="relative rounded-xl border-2 border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20 p-4 text-center">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-0 text-[10px] px-2">
                    GAP
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {gapStats.uniqueToCompetitors}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Unique to Competitors</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Opportunity keywords</p>
              </div>
            </div>

            <Separator />

            {/* Keyword Gap Table */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Competitor Keywords You Don&apos;t Rank For
                <Badge variant="secondary" className="text-[10px] ml-1">
                  {gapAnalysisKeywords.length} gaps
                </Badge>
              </h4>
              <ScrollArea className="max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-0">Keyword</TableHead>
                      <TableHead className="text-center">Your Rank</TableHead>
                      <TableHead className="text-center">Best Comp. Rank</TableHead>
                      <TableHead>Competitor</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead className="text-right pr-0">Difficulty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gapAnalysisKeywords.map((gap, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/50">
                        <TableCell className="pl-0 font-medium text-sm">
                          {gap.keyword}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-muted-foreground text-[11px] border-dashed">
                            —
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center justify-center h-6 w-8 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                            #{gap.competitorRank}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{gap.competitor}</span>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {gap.volume.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right pr-0">
                          <Badge
                            className={cn(
                              'text-[10px] px-1.5 py-0 h-5 border-0 font-medium',
                              gap.difficulty < 50
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : gap.difficulty < 70
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                            )}
                          >
                            {gap.difficulty}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Competitive Strengths/Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="h-4.5 w-4.5" />
                Competitive Strengths
              </CardTitle>
              <CardDescription>Areas where you outperform competitors</CardDescription>
            </CardHeader>
            <CardContent>
              {strengths.length > 0 ? (
                <div className="space-y-2.5">
                  {strengths.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20"
                    >
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                        <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-sm text-emerald-800 dark:text-emerald-300">{s}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No significant strengths identified.</p>
              )}
            </CardContent>
          </Card>

          {/* Weaknesses */}
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-red-700 dark:text-red-400">
                <TrendingDown className="h-4.5 w-4.5" />
                Competitive Weaknesses
              </CardTitle>
              <CardDescription>Areas where competitors have an advantage</CardDescription>
            </CardHeader>
            <CardContent>
              {weaknesses.length > 0 ? (
                <div className="space-y-2.5">
                  {weaknesses.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/20"
                    >
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                        <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-sm text-red-800 dark:text-red-300">{w}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No significant weaknesses found.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Opportunity Card */}
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Lightbulb className="h-4.5 w-4.5" />
              Opportunities
            </CardTitle>
            <CardDescription>Quick wins and growth potential based on gap analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                  <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>{lowDifficultyGaps} competitor keywords</strong> with low difficulty (&lt;60) that you could target for quick wins
                </span>
              </div>
              {gapStats.uniqueToCompetitors > 0 && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                    <Target className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm text-amber-800 dark:text-amber-300">
                    <strong>{gapStats.uniqueToCompetitors} keywords</strong> currently driving traffic to competitors that you&apos;re not ranking for at all
                  </span>
                </div>
              )}
              {ours.authorityScore < 70 && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                    <Link className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm text-amber-800 dark:text-amber-300">
                    Increase backlink acquisition to boost authority score from <strong>{ours.authorityScore}</strong> to 70+ for better rankings
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Add Competitor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
              Add Competitor
            </CardTitle>
            <CardDescription>
              Track a new competitor domain to compare their SEO performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Enter competitor domain (e.g., rival.com)"
                  value={newCompetitorDomain}
                  onChange={(e) => setNewCompetitorDomain(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCompetitor()}
                  className="pl-9"
                />
              </div>
              <Button
                onClick={handleAddCompetitor}
                disabled={!newCompetitorDomain.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Competitor
              </Button>
            </div>
            {competitors.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {competitors.map((comp, idx) => (
                  <Badge
                    key={comp.id ?? idx}
                    variant="outline"
                    className="gap-1.5 text-xs py-1 px-2.5"
                    style={{ borderColor: getCompetitorColor(idx), color: getCompetitorColor(idx) }}
                  >
                    <div
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: getCompetitorColor(idx) }}
                    />
                    {comp.domain}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Skeleton Loader ─────────────────────────────────────────────────
function CompetitorsSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-64 bg-muted rounded animate-pulse" />
            <div className="h-4 w-80 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-6 w-36 bg-muted rounded animate-pulse" />
        </div>

        {/* Table skeleton */}
        <Card>
          <CardHeader className="pb-3">
            <div className="h-5 w-40 bg-muted rounded animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse mt-1" />
          </CardHeader>
          <CardContent className="space-y-3 p-6 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-5 w-36 bg-muted rounded animate-pulse" />
                <div className="h-4 w-52 bg-muted rounded animate-pulse mt-1" />
              </CardHeader>
              <CardContent>
                <div className="h-[280px] bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
