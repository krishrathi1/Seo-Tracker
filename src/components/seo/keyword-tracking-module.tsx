'use client'

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Search,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  MoreHorizontal,
  History,
  Pencil,
  Pause,
  Trash2,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Upload,
  X,
  Eye,
  Minus,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useSeoStore } from '@/lib/seo-store'

// ─── Types ──────────────────────────────────────────────────────────────
interface KeywordData {
  id: string
  keyword: string
  searchEngine: string
  device: string
  location: string
  currentRank: number | null
  previousRank: number | null
  bestRank: number | null
  worstRank: number | null
  searchVolume: number | null
  difficulty: number | null
  cpc: number | null
  url: string | null
  tag: string | null
  group: string | null
  change: number | null
  changeType: string
  sparkline: number[]
}

interface KeywordsResponse {
  keywords: KeywordData[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  filters: {
    groups: string[]
    tags: string[]
  }
}

interface HistoryData {
  keyword: {
    id: string
    keyword: string
    currentRank: number | null
    previousRank: number | null
    bestRank: number | null
    worstRank: number | null
    searchVolume: number | null
    difficulty: number | null
    url: string | null
  }
  history: { date: string; rank: number }[]
}

// ─── Helpers ────────────────────────────────────────────────────────────
function formatNumber(n: number | null): string {
  if (n == null) return '—'
  return n.toLocaleString('en-US')
}

function formatCurrency(n: number | null): string {
  if (n == null) return '—'
  return `$${n.toFixed(2)}`
}

function getRankColor(rank: number | null): string {
  if (rank == null) return 'bg-muted-foreground/30'
  if (rank <= 3) return 'bg-emerald-500'
  if (rank <= 10) return 'bg-amber-500'
  if (rank <= 20) return 'bg-orange-500'
  return 'bg-red-500'
}

function getDifficultyColor(d: number | null): string {
  if (d == null) return 'bg-muted-foreground/30'
  if (d <= 30) return 'bg-emerald-500'
  if (d <= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

function getTagBadgeVariant(tag: string | null): 'default' | 'secondary' | 'outline' {
  if (tag === 'commercial') return 'default'
  if (tag === 'transactional') return 'secondary'
  return 'outline'
}

function truncateUrl(url: string | null, maxLen = 28): string {
  if (!url) return '—'
  return url.length > maxLen ? url.slice(0, maxLen) + '…' : url
}

// ─── Sparkline Component ────────────────────────────────────────────────
function SparklineChart({ data }: { data: number[] }) {
  if (!data || data.length < 2) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  const chartData = data.map((rank, i) => ({ i, rank }))
  const isImproving = data[data.length - 1] <= data[0]
  const lineColor = isImproving ? '#10b981' : '#ef4444'

  return (
    <div className="w-[72px] h-[28px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="rank"
            stroke={lineColor}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Rank History Chart Component ───────────────────────────────────────
function RankHistoryChart({ keywordId, keywordName }: { keywordId: string; keywordName: string }) {
  const [days, setDays] = React.useState<30 | 60 | 90>(90)

  const { data, isLoading } = useQuery<HistoryData>({
    queryKey: ['keyword-history', keywordId, days],
    queryFn: async () => {
      const res = await fetch(`/api/seo/keyword-history?keywordId=${keywordId}&days=${days}`)
      if (!res.ok) throw new Error('Failed to fetch history')
      return res.json()
    },
    enabled: !!keywordId,
  })

  const chartData = React.useMemo(() => {
    if (!data?.history) return []
    return data.history.map((h) => ({
      date: h.date,
      rank: h.rank,
      label: new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))
  }, [data])

  const maxRank = React.useMemo(() => {
    if (!chartData.length) return 10
    return Math.max(...chartData.map((d) => d.rank)) + 2
  }, [chartData])

  return (
    <div className="p-4 bg-muted/30 border-t">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-600" />
          <span className="text-sm font-semibold">{keywordName}</span>
          <span className="text-xs text-muted-foreground">Rank History</span>
        </div>
        <div className="flex items-center gap-1">
          {([30, 60, 90] as const).map((d) => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                'h-7 px-2.5 text-xs',
                days === d && 'bg-emerald-600 hover:bg-emerald-700 text-white'
              )}
              onClick={() => setDays(d)}
            >
              {d}D
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[220px]">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !chartData.length ? (
        <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
          No rank history data available
        </div>
      ) : (
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="rankGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[1, maxRank]}
                reversed
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--popover))',
                  color: 'hsl(var(--popover-foreground))',
                }}
                formatter={(value: number) => [`#${value}`, 'Position']}
                labelFormatter={(label: string) => label}
              />
              <Area
                type="monotone"
                dataKey="rank"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#rankGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ─── Difficulty Bar ─────────────────────────────────────────────────────
function DifficultyBar({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-muted-foreground">—</span>
  const color = getDifficultyColor(value)
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums w-6 text-right">{value}</span>
    </div>
  )
}

// ─── Add Keywords Dialog ────────────────────────────────────────────────
function AddKeywordsDialog() {
  const [open, setOpen] = React.useState(false)
  const [keywordsText, setKeywordsText] = React.useState('')
  const [group, setGroup] = React.useState('')
  const [tag, setTag] = React.useState('')
  const [searchEngine, setSearchEngine] = React.useState('google')
  const [device, setDevice] = React.useState('desktop')
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: async (keywords: string[]) => {
      const results = await Promise.allSettled(
        keywords.map((kw) =>
          fetch('/api/seo/keywords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: 'techventure',
              keyword: kw.trim(),
              searchEngine,
              device,
              location: 'us',
              tag: tag || undefined,
              group: group || undefined,
            }),
          })
        )
      )
      return results
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keywords'] })
      setOpen(false)
      setKeywordsText('')
      setGroup('')
      setTag('')
    },
  })

  const handleSubmit = () => {
    const keywords = keywordsText
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean)
    if (keywords.length === 0) return
    addMutation.mutate(keywords)
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setKeywordsText(text)
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Add Keywords
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Keywords</DialogTitle>
          <DialogDescription>
            Enter keywords to track, one per line. You can also import from a CSV file.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="keywords-input" className="text-xs font-medium">
              Keywords
            </Label>
            <Textarea
              id="keywords-input"
              placeholder="best project management software&#10;project management tools&#10;team collaboration app"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              rows={6}
              className="text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {keywordsText.split('\n').filter((l) => l.trim()).length} keyword(s) entered
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium">Group</Label>
              <Select value={group} onValueChange={setGroup}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Brand">Brand</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium">Tag</Label>
              <Select value={tag} onValueChange={setTag}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="informational">Informational</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium">Search Engine</Label>
              <Select value={searchEngine} onValueChange={setSearchEngine}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="bing">Bing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-medium">Device</Label>
              <Select value={device} onValueChange={setDevice}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-xs font-medium">Import from CSV</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" asChild>
                <label>
                  <Upload className="h-3.5 w-3.5" />
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv,.txt"
                    className="sr-only"
                    onChange={handleCsvUpload}
                  />
                </label>
              </Button>
              <span className="text-xs text-muted-foreground">One keyword per line</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleSubmit}
            disabled={!keywordsText.trim() || addMutation.isPending}
          >
            {addMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                Adding...
              </>
            ) : (
              'Add Keywords'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Module ────────────────────────────────────────────────────────
export function KeywordTrackingModule() {
  const activeProjectId = useSeoStore((s) => s.activeProjectId)
  const projectId = activeProjectId || 'techventure'

  // Filter state
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [groupFilter, setGroupFilter] = React.useState('all')
  const [tagFilter, setTagFilter] = React.useState('all')
  const [deviceFilter, setDeviceFilter] = React.useState('all')
  const [searchEngineFilter, setSearchEngineFilter] = React.useState('all')
  const [page, setPage] = React.useState(1)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [expandedKeywordId, setExpandedKeywordId] = React.useState<string | null>(null)

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [groupFilter, tagFilter, deviceFilter, searchEngineFilter])

  // Fetch keywords
  const { data, isLoading } = useQuery<KeywordsResponse>({
    queryKey: ['keywords', projectId, debouncedSearch, groupFilter, tagFilter, deviceFilter, searchEngineFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        projectId,
        limit: '50',
        page: page.toString(),
      })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (groupFilter && groupFilter !== 'all') params.set('group', groupFilter)
      if (tagFilter && tagFilter !== 'all') params.set('tag', tagFilter)
      if (deviceFilter && deviceFilter !== 'all') params.set('device', deviceFilter)
      if (searchEngineFilter && searchEngineFilter !== 'all') params.set('searchEngine', searchEngineFilter)

      const res = await fetch(`/api/seo/keywords?${params}`)
      if (!res.ok) throw new Error('Failed to fetch keywords')
      return res.json()
    },
    enabled: !!projectId,
  })

  const keywords = data?.keywords ?? []
  const pagination = data?.pagination
  const groups = data?.filters.groups ?? []
  const tags = data?.filters.tags ?? []

  // Summary stats
  const totalKeywords = pagination?.total ?? 0
  const avgPosition = React.useMemo(() => {
    const ranked = keywords.filter((k) => k.currentRank != null)
    if (!ranked.length) return 0
    return Math.round(ranked.reduce((sum, k) => sum + (k.currentRank ?? 0), 0) / ranked.length)
  }, [keywords])
  const improved = keywords.filter((k) => k.changeType === 'improved').length
  const declined = keywords.filter((k) => k.changeType === 'declined').length
  const top10 = keywords.filter((k) => k.currentRank != null && k.currentRank <= 10).length

  // Table columns
  const columns = React.useMemo<ColumnDef<KeywordData>[]>(
    () => [
      {
        accessorKey: 'keyword',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-7 text-xs font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Keyword
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 min-w-[180px]">
            <span className="font-medium text-sm truncate max-w-[240px]">{row.original.keyword}</span>
            <div className="flex items-center gap-1.5">
              {row.original.group && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium">
                  {row.original.group}
                </Badge>
              )}
              {row.original.tag && (
                <Badge variant={getTagBadgeVariant(row.original.tag)} className="text-[10px] px-1.5 py-0 h-4">
                  {row.original.tag}
                </Badge>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'currentRank',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-7 text-xs font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Position
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const rank = row.original.currentRank
          return (
            <div className="flex items-center gap-2">
              <span className={cn('h-2 w-2 rounded-full shrink-0', getRankColor(rank))} />
              <span className="font-semibold text-sm tabular-nums">{rank ?? '—'}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'change',
        header: 'Change',
        cell: ({ row }) => {
          const change = row.original.change
          if (change == null || change === 0)
            return (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Minus className="h-3 w-3" />
                0
              </span>
            )
          const isImproved = change > 0
          return (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                isImproved ? 'text-emerald-600' : 'text-red-500'
              )}
            >
              {isImproved ? (
                <ArrowUp className="h-3 w-3 animate-pulse" />
              ) : (
                <ArrowDown className="h-3 w-3 animate-pulse" />
              )}
              {Math.abs(change)}
            </span>
          )
        },
      },
      {
        id: 'bestWorst',
        header: 'Best / Worst',
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-xs tabular-nums">
            <span className="text-emerald-600 font-medium">{row.original.bestRank ?? '—'}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-red-500 font-medium">{row.original.worstRank ?? '—'}</span>
          </div>
        ),
      },
      {
        accessorKey: 'searchVolume',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-7 text-xs font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Volume
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">{formatNumber(row.original.searchVolume)}</span>
        ),
      },
      {
        accessorKey: 'difficulty',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-7 text-xs font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Difficulty
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => <DifficultyBar value={row.original.difficulty} />,
      },
      {
        accessorKey: 'cpc',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-7 text-xs font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            CPC
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">{formatCurrency(row.original.cpc)}</span>
        ),
      },
      {
        accessorKey: 'url',
        header: 'URL',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground font-mono">
            {truncateUrl(row.original.url)}
          </span>
        ),
      },
      {
        id: 'sparkline',
        header: 'Trend',
        cell: ({ row }) => <SparklineChart data={row.original.sparkline} />,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() =>
                  setExpandedKeywordId(
                    expandedKeywordId === row.original.id ? null : row.original.id
                  )
                }
              >
                <History className="mr-2 h-3.5 w-3.5" />
                View history
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Pause className="mr-2 h-3.5 w-3.5" />
                Pause tracking
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [expandedKeywordId]
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: keywords,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pagination?.totalPages ?? -1,
  })

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 md:p-6 space-y-4">
        {/* ─── Filter Bar ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {tags.map((t) => (
                  <SelectItem key={t} value={t!}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={deviceFilter} onValueChange={setDeviceFilter}>
              <SelectTrigger className="h-8 w-[110px] text-xs">
                <SelectValue placeholder="Device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="mobile">Mobile</SelectItem>
              </SelectContent>
            </Select>

            <Select value={searchEngineFilter} onValueChange={setSearchEngineFilter}>
              <SelectTrigger className="h-8 w-[110px] text-xs">
                <SelectValue placeholder="Engine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Engines</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="bing">Bing</SelectItem>
              </SelectContent>
            </Select>

            <AddKeywordsDialog />
          </div>
        </div>

        {/* ─── Summary Stats ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="py-3 shadow-none">
            <CardContent className="pb-0 pt-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/10">
                  <Target className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Keywords</p>
                  <p className="text-xl font-bold tabular-nums">{totalKeywords}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 shadow-none">
            <CardContent className="pb-0 pt-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                  <BarChart3 className="h-4.5 w-4.5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Avg Position</p>
                  <p className="text-xl font-bold tabular-nums">#{avgPosition}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 shadow-none">
            <CardContent className="pb-0 pt-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/10">
                  <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Improved / Declined</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tabular-nums text-emerald-600">{improved}</span>
                    <span className="text-xs text-muted-foreground">/</span>
                    <span className="text-xl font-bold tabular-nums text-red-500">{declined}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="py-3 shadow-none">
            <CardContent className="pb-0 pt-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/10">
                  <Eye className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">In Top 10</p>
                  <p className="text-xl font-bold tabular-nums">
                    {top10}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      ({totalKeywords ? Math.round((top10 / totalKeywords) * 100) : 0}%)
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Data Table ──────────────────────────────────────────── */}
        <div className="rounded-lg border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : keywords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Target className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No keywords found</p>
              <p className="text-xs text-muted-foreground/70">
                Try adjusting your filters or add new keywords to track
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-xs h-9">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row, rowIdx) => (
                  <React.Fragment key={row.original.id}>
                    <TableRow
                      className={cn(
                        'cursor-pointer transition-colors',
                        rowIdx % 2 === 1 && 'bg-muted/30',
                        expandedKeywordId === row.original.id && 'bg-emerald-50/50 dark:bg-emerald-950/20'
                      )}
                      onClick={() =>
                        setExpandedKeywordId(
                          expandedKeywordId === row.original.id ? null : row.original.id
                        )
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {expandedKeywordId === row.original.id && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={row.getVisibleCells().length} className="p-0 border-0">
                          <RankHistoryChart
                            keywordId={row.original.id}
                            keywordName={row.original.keyword}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}

          {/* ─── Pagination ──────────────────────────────────────── */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * pagination.limit + 1}–
                {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} keywords
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={page === p ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'h-7 w-7 text-xs p-0',
                      page === p && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    )}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
