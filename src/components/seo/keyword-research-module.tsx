'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  X,
  Download,
  ListPlus,
  Lightbulb,
  Target,
  BarChart3,
  Filter,
  ChevronDown,
  RotateCcw,
  Zap,
  Star,
  Crosshair,
  Mountain,
  Trash2,
} from 'lucide-react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  ReferenceArea,
  ZAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useSeoStore } from '@/lib/seo-store'
import { Globe } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────
interface KeywordSuggestion {
  keyword: string
  searchVolume: number
  difficulty: number
  cpc: number
  intent: 'informational' | 'navigational' | 'commercial' | 'transactional'
  trend?: 'up' | 'down' | 'stable'
}

interface ResearchResponse {
  seed: string
  suggestions: KeywordSuggestion[]
  count: number
  fallback?: boolean
}

type SortField = 'keyword' | 'searchVolume' | 'difficulty' | 'cpc' | 'intent'
type SortDirection = 'asc' | 'desc'

// ─── Constants ────────────────────────────────────────────────────────
const INTENT_COLORS: Record<string, { bg: string; text: string; hex: string }> = {
  informational: { bg: 'bg-sky-500/10', text: 'text-sky-600', hex: '#0ea5e9' },
  navigational: { bg: 'bg-violet-500/10', text: 'text-violet-600', hex: '#8b5cf6' },
  commercial: { bg: 'bg-amber-500/10', text: 'text-amber-600', hex: '#f59e0b' },
  transactional: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', hex: '#10b981' },
}

const DIFFICULTY_CONFIG = {
  easy: { color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Easy' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-500', label: 'Medium' },
  hard: { color: 'text-rose-500', bg: 'bg-rose-500', label: 'Hard' },
}

const TRENDING_SEEDS = [
  'project management',
  'seo tools',
  'content marketing',
  'artificial intelligence',
  'web development',
  'digital marketing',
  'remote work',
  'data analytics',
]

// ─── Helpers ──────────────────────────────────────────────────────────
function formatVolume(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return n.toLocaleString()
}

function getDifficultyConfig(d: number) {
  if (d <= 30) return DIFFICULTY_CONFIG.easy
  if (d <= 60) return DIFFICULTY_CONFIG.medium
  return DIFFICULTY_CONFIG.hard
}

function getDifficultyBarColor(d: number): string {
  if (d <= 30) return '#10b981'
  if (d <= 60) return '#f59e0b'
  return '#f43f5e'
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' },
  }),
}

// ─── Fetch hook ───────────────────────────────────────────────────────
function useKeywordResearch(seed: string | null) {
  return useQuery<ResearchResponse>({
    queryKey: ['keyword-research', seed],
    queryFn: async () => {
      const res = await fetch(`/api/seo/research?seed=${encodeURIComponent(seed!)}`)
      if (!res.ok) throw new Error('Failed to fetch keyword suggestions')
      return res.json()
    },
    enabled: !!seed,
    staleTime: 5 * 60_000,
  })
}

// ─── Custom Scatter Tooltip ───────────────────────────────────────────
function ScatterTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: KeywordSuggestion & { intentColor: string } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="border-border/50 bg-background rounded-lg border px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-sm mb-1">{d.keyword}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span className="text-muted-foreground">Volume:</span>
        <span className="font-medium tabular-nums">{formatVolume(d.searchVolume)}</span>
        <span className="text-muted-foreground">Difficulty:</span>
        <span className="font-medium tabular-nums">{d.difficulty}</span>
        <span className="text-muted-foreground">CPC:</span>
        <span className="font-medium tabular-nums">${d.cpc.toFixed(2)}</span>
        <span className="text-muted-foreground">Intent:</span>
        <span className="font-medium capitalize">{d.intent}</span>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────
function EmptyState({ onSearch }: { onSearch: (seed: string) => void }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10">
          <Search className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">Discover Keyword Opportunities</h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          Enter a seed keyword and our AI will generate comprehensive keyword suggestions
          with search volume, difficulty, CPC, and intent analysis.
        </p>
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Try these trending topics
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {TRENDING_SEEDS.map((seed) => (
              <button
                key={seed}
                onClick={() => onSearch(seed)}
                className="inline-flex items-center rounded-full border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30"
              >
                {seed}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────
function ResearchLoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-0">
              <Skeleton className="h-3.5 w-20 mb-2" />
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
          <CardContent><Skeleton className="h-72 w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
          <CardContent><Skeleton className="h-72 w-full" /></CardContent>
        </Card>
      </div>
      {/* Table */}
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Search Bar ───────────────────────────────────────────────────────
function SearchBar({
  seed,
  onSeedChange,
  onSearch,
  isSearching,
  recentSearches,
  onRecentClick,
  onRemoveRecent,
  projectDomain,
}: {
  seed: string
  onSeedChange: (v: string) => void
  onSearch: () => void
  isSearching: boolean
  recentSearches: string[]
  onRecentClick: (s: string) => void
  onRemoveRecent: (s: string) => void
  projectDomain?: string | null
}) {
  return (
    <div className="space-y-3">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
          <Input
            value={seed}
            onChange={(e) => onSeedChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Enter a seed keyword..."
            className="pl-10 h-11 text-base"
          />
        </div>
        <Button
          onClick={onSearch}
          disabled={isSearching || !seed.trim()}
          className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isSearching ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Research
            </>
          )}
        </Button>
        {projectDomain && (
          <Button
            variant="outline"
            onClick={() => { onSeedChange(projectDomain); setTimeout(onSearch, 50) }}
            disabled={isSearching}
            className="h-11 px-4 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 gap-1.5"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Your Site</span>
          </Button>
        )}
      </div>
      {recentSearches.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Recent:</span>
          {recentSearches.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium cursor-pointer hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
            >
              <button onClick={() => onRecentClick(s)}>{s}</button>
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveRecent(s) }}
                className="ml-0.5 hover:text-rose-500 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Difficulty Bar ───────────────────────────────────────────────────
function DifficultyBar({ value }: { value: number }) {
  const cfg = getDifficultyConfig(value)
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', cfg.bg)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={cn('text-xs font-medium tabular-nums w-6 text-right', cfg.color)}>
        {value}
      </span>
    </div>
  )
}

// ─── Intent Badge ─────────────────────────────────────────────────────
function IntentBadge({ intent }: { intent: string }) {
  const cfg = INTENT_COLORS[intent]
  if (!cfg) return <Badge variant="secondary">{intent}</Badge>
  return (
    <Badge variant="secondary" className={cn('border-0 font-medium capitalize', cfg.bg, cfg.text)}>
      {intent}
    </Badge>
  )
}

// ─── Trend Icon ───────────────────────────────────────────────────────
function TrendIcon({ trend }: { trend?: string }) {
  if (trend === 'up') return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
  if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
}

// ─── Summary Stats ────────────────────────────────────────────────────
function SummaryStats({ suggestions }: { suggestions: KeywordSuggestion[] }) {
  const totalVolume = suggestions.reduce((a, s) => a + s.searchVolume, 0)
  const avgDifficulty = Math.round(suggestions.reduce((a, s) => a + s.difficulty, 0) / suggestions.length)
  const avgCpc = (suggestions.reduce((a, s) => a + s.cpc, 0) / suggestions.length).toFixed(2)
  const easyCount = suggestions.filter(s => s.difficulty <= 30).length

  const stats = [
    { label: 'Total Volume', value: formatVolume(totalVolume), icon: BarChart3, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
    { label: 'Avg Difficulty', value: avgDifficulty, icon: Target, iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500' },
    { label: 'Avg CPC', value: `$${avgCpc}`, icon: Lightbulb, iconBg: 'bg-sky-500/10', iconColor: 'text-sky-500' },
    { label: 'Easy Keywords', value: easyCount, icon: Zap, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div key={stat.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', stat.iconBg)}>
                  <stat.icon className={cn('h-3.5 w-3.5', stat.iconColor)} />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight tabular-nums">{stat.value}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Results Table ────────────────────────────────────────────────────
function SortIndicator({ field, sortField, sortDirection }: { field: SortField; sortField: SortField; sortDirection: SortDirection }) {
  if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/50" />
  return sortDirection === 'asc'
    ? <ArrowUp className="h-3 w-3 ml-1 text-emerald-500" />
    : <ArrowDown className="h-3 w-3 ml-1 text-emerald-500" />
}

function ResultsTable({
  suggestions,
  savedKeywords,
  onAddKeyword,
  onRemoveKeyword,
  sortField,
  sortDirection,
  onSort,
}: {
  suggestions: KeywordSuggestion[]
  savedKeywords: string[]
  onAddKeyword: (kw: KeywordSuggestion) => void
  onRemoveKeyword: (kw: string) => void
  sortField: SortField
  sortDirection: SortDirection
  onSort: (field: SortField) => void
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[520px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs cursor-pointer select-none" onClick={() => onSort('keyword')}>
                  <span className="inline-flex items-center">Keyword <SortIndicator field="keyword" sortField={sortField} sortDirection={sortDirection} /></span>
                </TableHead>
                <TableHead className="text-xs cursor-pointer select-none text-right" onClick={() => onSort('searchVolume')}>
                  <span className="inline-flex items-center justify-end">Volume <SortIndicator field="searchVolume" sortField={sortField} sortDirection={sortDirection} /></span>
                </TableHead>
                <TableHead className="text-xs cursor-pointer select-none" onClick={() => onSort('difficulty')}>
                  <span className="inline-flex items-center">Difficulty <SortIndicator field="difficulty" sortField={sortField} sortDirection={sortDirection} /></span>
                </TableHead>
                <TableHead className="text-xs cursor-pointer select-none text-right" onClick={() => onSort('cpc')}>
                  <span className="inline-flex items-center justify-end">CPC <SortIndicator field="cpc" sortField={sortField} sortDirection={sortDirection} /></span>
                </TableHead>
                <TableHead className="text-xs cursor-pointer select-none" onClick={() => onSort('intent')}>
                  <span className="inline-flex items-center">Intent <SortIndicator field="intent" sortField={sortField} sortDirection={sortDirection} /></span>
                </TableHead>
                <TableHead className="text-xs text-center">Trend</TableHead>
                <TableHead className="text-xs text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((kw, i) => {
                const isSaved = savedKeywords.includes(kw.keyword)
                return (
                  <TableRow key={kw.keyword} className={cn(i % 2 === 1 && 'bg-muted/20')}>
                    <TableCell className="text-xs font-medium max-w-[220px] truncate">{kw.keyword}</TableCell>
                    <TableCell className="text-xs text-right tabular-nums font-medium">
                      {formatVolume(kw.searchVolume)}
                    </TableCell>
                    <TableCell>
                      <DifficultyBar value={kw.difficulty} />
                    </TableCell>
                    <TableCell className="text-xs text-right tabular-nums font-medium">
                      ${kw.cpc.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <IntentBadge intent={kw.intent} />
                    </TableCell>
                    <TableCell className="text-center">
                      <TrendIcon trend={kw.trend} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {isSaved ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                            onClick={() => onRemoveKeyword(kw.keyword)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            <span className="text-[10px]">Remove</span>
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                            onClick={() => onAddKeyword(kw)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            <span className="text-[10px]">Add</span>
                          </Button>
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
  )
}

// ─── Keyword Clustering ───────────────────────────────────────────────
function KeywordClustering({ suggestions }: { suggestions: KeywordSuggestion[] }) {
  const groups = React.useMemo(() => {
    const map: Record<string, KeywordSuggestion[]> = {}
    for (const kw of suggestions) {
      if (!map[kw.intent]) map[kw.intent] = []
      map[kw.intent].push(kw)
    }
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length)
  }, [suggestions])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-emerald-500" />
          Keyword Clustering by Intent
        </CardTitle>
        <CardDescription>Keywords grouped by search intent type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(([intent, keywords]) => {
            const cfg = INTENT_COLORS[intent]
            return (
              <div
                key={intent}
                className={cn(
                  'rounded-lg border p-3 space-y-2',
                  cfg ? `border-l-4 border-l-[${cfg.hex}]` : ''
                )}
                style={{ borderLeftColor: cfg?.hex }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IntentBadge intent={intent} />
                    <span className="text-xs text-muted-foreground">{keywords.length} keywords</span>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    Vol: {formatVolume(keywords.reduce((a, k) => a + k.searchVolume, 0))}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map((kw) => (
                    <span
                      key={kw.keyword}
                      className={cn(
                        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium',
                        cfg?.bg, cfg?.text
                      )}
                    >
                      {kw.keyword}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Volume vs Difficulty Scatter Plot ────────────────────────────────
function VolumeDifficultyScatter({ suggestions }: { suggestions: KeywordSuggestion[] }) {
  const data = React.useMemo(() =>
    suggestions.map(kw => ({
      ...kw,
      intentColor: INTENT_COLORS[kw.intent]?.hex || '#6b7280',
    })),
    [suggestions]
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-500" />
          Volume vs Difficulty
        </CardTitle>
        <CardDescription>
          Bubble size represents CPC · Color indicates intent · Look for high volume, low difficulty
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
            <XAxis
              type="number"
              dataKey="difficulty"
              name="Difficulty"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'Difficulty', position: 'insideBottom', offset: -5, style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' } }}
            />
            <YAxis
              type="number"
              dataKey="searchVolume"
              name="Volume"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatVolume(v)}
              label={{ value: 'Search Volume', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' } }}
            />
            <ZAxis
              type="number"
              dataKey="cpc"
              range={[60, 500]}
              name="CPC"
            />
            <Tooltip content={<ScatterTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span className="text-xs text-muted-foreground capitalize">{value}</span>
              )}
            />
            <Scatter name="keywords" data={data}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.intentColor} fillOpacity={0.75} stroke={entry.intentColor} strokeWidth={1} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        {/* Legend for intent colors */}
        <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t">
          {Object.entries(INTENT_COLORS).map(([intent, cfg]) => (
            <span key={intent} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cfg.hex }} />
              <span className="capitalize">{intent}</span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Prioritization Matrix ────────────────────────────────────────────
function PrioritizationMatrix({ suggestions }: { suggestions: KeywordSuggestion[] }) {
  const data = React.useMemo(() =>
    suggestions.map(kw => ({
      ...kw,
      intentColor: INTENT_COLORS[kw.intent]?.hex || '#6b7280',
    })),
    [suggestions]
  )

  const maxVolume = Math.max(...suggestions.map(s => s.searchVolume), 1)
  const midVolume = maxVolume / 2

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-emerald-500" />
          Prioritization Matrix
        </CardTitle>
        <CardDescription>
          Find &quot;Quick Wins&quot; — high volume with low difficulty
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            {/* Quadrant backgrounds */}
            <ReferenceArea x1={0} y1={midVolume} x2={50} y2={maxVolume * 1.1} fill="#10b981" fillOpacity={0.04} />
            <ReferenceArea x1={50} y1={midVolume} x2={100} y2={maxVolume * 1.1} fill="#f59e0b" fillOpacity={0.04} />
            <ReferenceArea x1={0} y1={0} x2={50} y2={midVolume} fill="#06b6d4" fillOpacity={0.04} />
            <ReferenceArea x1={50} y1={0} x2={100} y2={midVolume} fill="#f43f5e" fillOpacity={0.04} />

            {/* Dividing lines */}
            <ReferenceLine x={50} stroke="hsl(var(--border))" strokeDasharray="5 5" />
            <ReferenceLine y={midVolume} stroke="hsl(var(--border))" strokeDasharray="5 5" />

            <XAxis
              type="number"
              dataKey="difficulty"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'Difficulty →', position: 'insideBottom', offset: -10, style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' } }}
            />
            <YAxis
              type="number"
              dataKey="searchVolume"
              domain={[0, maxVolume * 1.1]}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatVolume(v)}
              label={{ value: 'Volume →', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' } }}
            />
            <Tooltip content={<ScatterTooltip />} />
            <Scatter name="keywords" data={data}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.intentColor} fillOpacity={0.7} stroke={entry.intentColor} strokeWidth={1} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        {/* Quadrant Labels */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="flex items-center gap-2 rounded-md bg-emerald-500/8 px-3 py-2">
            <Star className="h-3.5 w-3.5 text-emerald-500" />
            <div>
              <p className="text-xs font-semibold text-emerald-600">Quick Wins</p>
              <p className="text-[10px] text-muted-foreground">High volume, Low difficulty</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-amber-500/8 px-3 py-2">
            <Mountain className="h-3.5 w-3.5 text-amber-500" />
            <div>
              <p className="text-xs font-semibold text-amber-600">High Value</p>
              <p className="text-[10px] text-muted-foreground">High volume, High difficulty</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-sky-500/8 px-3 py-2">
            <Zap className="h-3.5 w-3.5 text-sky-500" />
            <div>
              <p className="text-xs font-semibold text-sky-600">Low Hanging Fruit</p>
              <p className="text-[10px] text-muted-foreground">Low volume, Low difficulty</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-rose-500/8 px-3 py-2">
            <Target className="h-3.5 w-3.5 text-rose-500" />
            <div>
              <p className="text-xs font-semibold text-rose-600">Hard Won</p>
              <p className="text-[10px] text-muted-foreground">Low volume, High difficulty</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Filter Bar ───────────────────────────────────────────────────────
function FilterBar({
  difficultyRange,
  onDifficultyChange,
  intentFilter,
  onIntentFilterChange,
  minVolume,
  onMinVolumeChange,
  onReset,
  totalResults,
  filteredCount,
}: {
  difficultyRange: number[]
  onDifficultyChange: (v: number[]) => void
  intentFilter: string
  onIntentFilterChange: (v: string) => void
  minVolume: number
  onMinVolumeChange: (v: number) => void
  onReset: () => void
  totalResults: number
  filteredCount: number
}) {
  return (
    <Card>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            <span className="font-medium">Filters</span>
          </div>

          {/* Difficulty Range */}
          <div className="flex items-center gap-2 min-w-[180px]">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">Diff:</span>
            <Slider
              value={difficultyRange}
              onValueChange={onDifficultyChange}
              min={0}
              max={100}
              step={5}
              className="flex-1"
            />
            <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
              {difficultyRange[0]}-{difficultyRange[1]}
            </span>
          </div>

          {/* Intent Filter */}
          <Select value={intentFilter} onValueChange={onIntentFilterChange}>
            <SelectTrigger className="h-7 w-[130px] text-xs">
              <SelectValue placeholder="All Intents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Intents</SelectItem>
              <SelectItem value="informational">Informational</SelectItem>
              <SelectItem value="navigational">Navigational</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="transactional">Transactional</SelectItem>
            </SelectContent>
          </Select>

          {/* Min Volume */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">Vol ≥</span>
            <Input
              type="number"
              value={minVolume || ''}
              onChange={(e) => onMinVolumeChange(parseInt(e.target.value) || 0)}
              className="h-7 w-[72px] text-xs"
              placeholder="0"
            />
          </div>

          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onReset}>
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>

          <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
            Showing {filteredCount} of {totalResults}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Keyword List Builder (Sheet) ─────────────────────────────────────
function KeywordListBuilder({
  savedKeywords,
  savedKeywordsData,
  onRemoveKeyword,
  onClearAll,
}: {
  savedKeywords: string[]
  savedKeywordsData: KeywordSuggestion[]
  onRemoveKeyword: (kw: string) => void
  onClearAll: () => void
}) {
  const exportCsv = () => {
    const header = 'Keyword,Search Volume,Difficulty,CPC,Intent,Trend'
    const rows = savedKeywordsData.map(kw =>
      `"${kw.keyword}",${kw.searchVolume},${kw.difficulty},${kw.cpc},${kw.intent},${kw.trend || 'stable'}`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'keyword-list.csv')
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative h-9">
          <ListPlus className="h-4 w-4 mr-2" />
          Saved Keywords
          {savedKeywords.length > 0 && (
            <Badge className="ml-2 bg-emerald-500 text-white text-[10px] px-1.5 py-0 min-w-[18px] h-[18px]">
              {savedKeywords.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[440px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ListPlus className="h-5 w-5 text-emerald-500" />
            Keyword List Builder
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {savedKeywords.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <ListPlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No keywords saved yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click &quot;Add&quot; on any keyword to save it here
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {savedKeywords.length} keyword{savedKeywords.length !== 1 ? 's' : ''} saved
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-rose-500 hover:text-rose-600"
                    onClick={onClearAll}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={exportCsv}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export CSV
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-2">
                  {savedKeywordsData.map((kw) => {
                    const cfg = getDifficultyConfig(kw.difficulty)
                    return (
                      <div
                        key={kw.keyword}
                        className="flex items-start gap-2 rounded-lg border p-3 group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{kw.keyword}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] text-muted-foreground">
                              Vol: <span className="font-medium text-foreground tabular-nums">{formatVolume(kw.searchVolume)}</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              Diff: <span className={cn('font-medium tabular-nums', cfg.color)}>{kw.difficulty}</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              CPC: <span className="font-medium text-foreground tabular-nums">${kw.cpc.toFixed(2)}</span>
                            </span>
                          </div>
                          <div className="mt-1.5">
                            <IntentBadge intent={kw.intent} />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onRemoveKeyword(kw.keyword)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Main Module ──────────────────────────────────────────────────────
export function KeywordResearchModule() {
  const [seed, setSeed] = React.useState('')
  const [activeSeed, setActiveSeed] = React.useState<string | null>(null)
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])
  const [savedKeywords, setSavedKeywords] = React.useState<string[]>([])
  const [savedKeywordsData, setSavedKeywordsData] = React.useState<KeywordSuggestion[]>([])
  const [sortField, setSortField] = React.useState<SortField>('searchVolume')
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc')
  const [difficultyRange, setDifficultyRange] = React.useState<number[]>([0, 100])
  const [intentFilter, setIntentFilter] = React.useState('all')
  const [minVolume, setMinVolume] = React.useState(0)

  const activeProjectId = useSeoStore((s) => s.activeProjectId)
  const [projectDomain, setProjectDomain] = React.useState<string | null>(null)

  // Fetch project domain from API
  React.useEffect(() => {
    if (!activeProjectId) return
    fetch('/api/seo/projects')
      .then(res => res.ok ? res.json() : { projects: [] })
      .then(data => {
        const project = data.projects?.find((p: { id: string; domain: string }) => p.id === activeProjectId)
        if (project) setProjectDomain(project.domain)
      })
      .catch(() => {})
  }, [activeProjectId])

  const { data, isLoading, isFetching } = useKeywordResearch(activeSeed)

  const handleSearch = React.useCallback(() => {
    const trimmed = seed.trim()
    if (!trimmed) return
    setActiveSeed(trimmed)
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== trimmed)
      return [trimmed, ...filtered].slice(0, 8)
    })
  }, [seed])

  const handleRecentClick = React.useCallback((s: string) => {
    setSeed(s)
    setActiveSeed(s)
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item !== s)
      return [s, ...filtered].slice(0, 8)
    })
  }, [])

  const handleRemoveRecent = React.useCallback((s: string) => {
    setRecentSearches(prev => prev.filter(item => item !== s))
  }, [])

  const handleAddKeyword = React.useCallback((kw: KeywordSuggestion) => {
    setSavedKeywords(prev => [...prev, kw.keyword])
    setSavedKeywordsData(prev => [...prev, kw])
  }, [])

  const handleRemoveKeyword = React.useCallback((kw: string) => {
    setSavedKeywords(prev => prev.filter(k => k !== kw))
    setSavedKeywordsData(prev => prev.filter(k => k.keyword !== kw))
  }, [])

  const handleClearAll = React.useCallback(() => {
    setSavedKeywords([])
    setSavedKeywordsData([])
  }, [])

  const handleSort = React.useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection(field === 'keyword' || field === 'intent' ? 'asc' : 'desc')
    }
  }, [sortField])

  const handleResetFilters = React.useCallback(() => {
    setDifficultyRange([0, 100])
    setIntentFilter('all')
    setMinVolume(0)
  }, [])

  // Add trend data to suggestions (LLM might not provide it)
  const suggestionsWithTrend = React.useMemo(() => {
    if (!data?.suggestions) return []
    return data.suggestions.map(kw => ({
      ...kw,
      trend: kw.trend || (
        kw.searchVolume > 10000 ? 'up' :
        kw.searchVolume > 3000 ? 'stable' :
        Math.random() > 0.5 ? 'up' : 'stable'
      ) as 'up' | 'down' | 'stable',
    }))
  }, [data])

  // Filter and sort
  const filteredSuggestions = React.useMemo(() => {
    let result = suggestionsWithTrend

    // Difficulty filter
    result = result.filter(kw => kw.difficulty >= difficultyRange[0] && kw.difficulty <= difficultyRange[1])

    // Intent filter
    if (intentFilter !== 'all') {
      result = result.filter(kw => kw.intent === intentFilter)
    }

    // Min volume filter
    if (minVolume > 0) {
      result = result.filter(kw => kw.searchVolume >= minVolume)
    }

    // Sort
    result = [...result].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1
      switch (sortField) {
        case 'keyword': return dir * a.keyword.localeCompare(b.keyword)
        case 'searchVolume': return dir * (a.searchVolume - b.searchVolume)
        case 'difficulty': return dir * (a.difficulty - b.difficulty)
        case 'cpc': return dir * (a.cpc - b.cpc)
        case 'intent': return dir * a.intent.localeCompare(b.intent)
        default: return 0
      }
    })

    return result
  }, [suggestionsWithTrend, difficultyRange, intentFilter, minVolume, sortField, sortDirection])

  // Empty state - no search done yet
  if (!activeSeed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-[1600px] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl mb-8"
        >
          <SearchBar
            seed={seed}
            onSeedChange={setSeed}
            onSearch={handleSearch}
            isSearching={false}
            recentSearches={recentSearches}
            onRecentClick={handleRecentClick}
            onRemoveRecent={handleRemoveRecent}
            projectDomain={projectDomain}
          />
        </motion.div>
        <EmptyState onSearch={(s) => { setSeed(s); setActiveSeed(s) }} />
      </div>
    )
  }

  // Loading state
  if (isLoading || (isFetching && !data)) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[1600px] mx-auto space-y-4">
          <SearchBar
            seed={seed}
            onSeedChange={setSeed}
            onSearch={handleSearch}
            isSearching={true}
            recentSearches={recentSearches}
            onRecentClick={handleRecentClick}
            onRemoveRecent={handleRemoveRecent}
            projectDomain={projectDomain}
          />
          <ResearchLoadingSkeleton />
        </div>
      </div>
    )
  }

  // Error state
  if (!data) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[1600px] mx-auto space-y-4">
          <SearchBar
            seed={seed}
            onSeedChange={setSeed}
            onSearch={handleSearch}
            isSearching={false}
            recentSearches={recentSearches}
            onRecentClick={handleRecentClick}
            onRemoveRecent={handleRemoveRecent}
            projectDomain={projectDomain}
          />
          <Card>
            <CardContent className="pt-0 text-center py-12">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
                <Search className="h-7 w-7 text-rose-500" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Research Failed</h3>
              <p className="text-sm text-muted-foreground">Unable to generate keyword suggestions. Please try again.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleSearch}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* ── Search Bar ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <SearchBar
                seed={seed}
                onSeedChange={setSeed}
                onSearch={handleSearch}
                isSearching={isFetching}
                recentSearches={recentSearches}
                onRecentClick={handleRecentClick}
                onRemoveRecent={handleRemoveRecent}
                projectDomain={projectDomain}
              />
            </div>
            <KeywordListBuilder
              savedKeywords={savedKeywords}
              savedKeywordsData={savedKeywordsData}
              onRemoveKeyword={handleRemoveKeyword}
              onClearAll={handleClearAll}
            />
          </div>
        </motion.div>

        {/* ── Seed indicator ──────────────────────── */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing results for:
          </span>
          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-0 font-medium">
            <Search className="h-3 w-3 mr-1" />
            {data.seed}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {data.suggestions.length} keywords found
            {data.fallback && ' (fallback data)'}
          </span>
        </div>

        {/* ── Summary Stats ───────────────────────── */}
        <SummaryStats suggestions={suggestionsWithTrend} />

        {/* ── Charts Row ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
            <VolumeDifficultyScatter suggestions={suggestionsWithTrend} />
          </motion.div>
          <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
            <PrioritizationMatrix suggestions={suggestionsWithTrend} />
          </motion.div>
        </div>

        {/* ── Keyword Clustering ──────────────────── */}
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
          <KeywordClustering suggestions={suggestionsWithTrend} />
        </motion.div>

        {/* ── Filters ─────────────────────────────── */}
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
          <FilterBar
            difficultyRange={difficultyRange}
            onDifficultyChange={setDifficultyRange}
            intentFilter={intentFilter}
            onIntentFilterChange={setIntentFilter}
            minVolume={minVolume}
            onMinVolumeChange={setMinVolume}
            onReset={handleResetFilters}
            totalResults={suggestionsWithTrend.length}
            filteredCount={filteredSuggestions.length}
          />
        </motion.div>

        {/* ── Results Table ───────────────────────── */}
        <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible">
          <ResultsTable
            suggestions={filteredSuggestions}
            savedKeywords={savedKeywords}
            onAddKeyword={handleAddKeyword}
            onRemoveKeyword={handleRemoveKeyword}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </motion.div>
      </div>
    </div>
  )
}
