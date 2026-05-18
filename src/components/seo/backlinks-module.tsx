"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  Globe,
  Link2,
  Minus,
  Search,
  ShieldCheck,
  TrendingUp,
  XCircle,
  CheckCircle2,
  Image as ImageIcon,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Link,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSeoStore } from "@/lib/seo-store"

// ─── Types ──────────────────────────────────────────────────────────────
interface Backlink {
  id: string
  sourceDomain: string
  sourceUrl: string
  targetUrl: string
  anchorText: string | null
  linkType: string
  isFollow: boolean
  authorityScore: number | null
  spamScore: number | null
  status: string
  firstSeen: string
  lastSeen: string
}

interface TopDomain {
  domain: string
  backlinkCount: number
  avgAuthority: number
}

interface BacklinkStats {
  total: number
  active: number
  lost: number
  follow: number
  nofollow: number
  followRatio: number
  referringDomains: number
  newThisMonth: number
  lostThisMonth: number
  avgAuthority: number
  avgSpamScore: number
  authorityDistribution: Record<string, number>
  topDomains: TopDomain[]
}

interface BacklinkResponse {
  backlinks: Backlink[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: BacklinkStats
}

// ─── Color Helpers ──────────────────────────────────────────────────────
function getAuthorityColor(score: number | null): string {
  if (score === null) return "text-muted-foreground"
  if (score <= 20) return "text-red-500"
  if (score <= 40) return "text-orange-500"
  if (score <= 60) return "text-amber-500"
  if (score <= 80) return "text-lime-500"
  return "text-emerald-500"
}

function getAuthorityBg(score: number | null): string {
  if (score === null) return "bg-muted"
  if (score <= 20) return "bg-red-500"
  if (score <= 40) return "bg-orange-500"
  if (score <= 60) return "bg-amber-500"
  if (score <= 80) return "bg-lime-500"
  return "bg-emerald-500"
}

function getSpamColor(score: number | null): string {
  if (score === null) return "text-muted-foreground"
  if (score <= 30) return "text-emerald-500"
  if (score <= 60) return "text-amber-500"
  return "text-red-500"
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
          Active
        </Badge>
      )
    case "lost":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800">
          Lost
        </Badge>
      )
    case "new":
      return (
        <Badge className="bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-400 dark:border-sky-800">
          New
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getLinkTypeIcon(linkType: string) {
  switch (linkType) {
    case "text":
      return <Link2 className="h-3.5 w-3.5" />
    case "image":
      return <ImageIcon className="h-3.5 w-3.5" />
    case "redirect":
      return <ArrowRightLeft className="h-3.5 w-3.5" />
    default:
      return <Link2 className="h-3.5 w-3.5" />
  }
}

// ─── Fetch Hook ─────────────────────────────────────────────────────────
function useBacklinksData(
  projectId: string,
  params: {
    status: string
    linkType: string
    isFollow: string
    page: number
    limit: number
    sortBy: string
    sortOrder: string
    search: string
  }
) {
  const queryParams = new URLSearchParams()
  queryParams.set("projectId", projectId)
  if (params.status) queryParams.set("status", params.status)
  if (params.linkType) queryParams.set("linkType", params.linkType)
  if (params.isFollow) queryParams.set("isFollow", params.isFollow)
  queryParams.set("page", String(params.page))
  queryParams.set("limit", String(params.limit))
  queryParams.set("sortBy", params.sortBy)
  queryParams.set("sortOrder", params.sortOrder)

  return useQuery<BacklinkResponse>({
    queryKey: ["backlinks", projectId, params],
    queryFn: async () => {
      const res = await fetch(`/api/seo/backlinks?${queryParams.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch backlinks")
      return res.json()
    },
    enabled: !!projectId,
  })
}

// ─── Stats Cards ────────────────────────────────────────────────────────
function StatsCards({ stats }: { stats: BacklinkStats | undefined }) {
  if (!stats) return null

  const toxicCount = Math.max(
    1,
    Math.round(stats.total * (stats.avgSpamScore / 100) * 0.3)
  )

  const cards = [
    {
      title: "Total Backlinks",
      value: stats.total.toLocaleString(),
      icon: Link,
      trend: stats.newThisMonth > stats.lostThisMonth ? "up" : stats.newThisMonth < stats.lostThisMonth ? "down" : "neutral",
      trendValue: stats.newThisMonth > stats.lostThisMonth
        ? `+${stats.newThisMonth - stats.lostThisMonth}`
        : stats.newThisMonth < stats.lostThisMonth
          ? `-${stats.lostThisMonth - stats.newThisMonth}`
          : "0",
      accent: "text-emerald-600 dark:text-emerald-400",
      bgAccent: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      title: "Referring Domains",
      value: stats.referringDomains.toLocaleString(),
      icon: Globe,
      trend: "up",
      trendValue: `${stats.referringDomains} domains`,
      accent: "text-emerald-600 dark:text-emerald-400",
      bgAccent: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      title: "Follow / Nofollow",
      value: `${stats.followRatio}%`,
      subtitle: `${stats.follow} follow / ${stats.nofollow} nofollow`,
      icon: ShieldCheck,
      accent: "text-emerald-600 dark:text-emerald-400",
      bgAccent: "bg-emerald-50 dark:bg-emerald-950/50",
      miniDonut: true,
      followRatio: stats.followRatio,
    },
    {
      title: "New This Month",
      value: `+${stats.newThisMonth}`,
      icon: TrendingUp,
      trend: "up",
      trendValue: "new links",
      accent: "text-emerald-600 dark:text-emerald-400",
      bgAccent: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      title: "Lost This Month",
      value: `-${stats.lostThisMonth}`,
      icon: XCircle,
      trend: "down",
      trendValue: "lost links",
      accent: "text-red-600 dark:text-red-400",
      bgAccent: "bg-red-50 dark:bg-red-950/50",
    },
    {
      title: "Toxic Links",
      value: String(toxicCount),
      icon: AlertTriangle,
      trend: toxicCount > 5 ? "down" : "neutral",
      trendValue: toxicCount > 5 ? "High risk" : "Low risk",
      accent: toxicCount > 5 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400",
      bgAccent: toxicCount > 5 ? "bg-red-50 dark:bg-red-950/50" : "bg-amber-50 dark:bg-amber-950/50",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="relative overflow-hidden py-4 gap-3">
          <CardHeader className="pb-0 pt-0 px-4">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">{card.title}</CardDescription>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.bgAccent}`}>
                <card.icon className={`h-3.5 w-3.5 ${card.accent}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-0 px-4">
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold tracking-tight">{card.value}</span>
              {card.trend && card.trend !== "neutral" && (
                <span className={`flex items-center text-xs font-medium mb-1 ${
                  card.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                }`}>
                  {card.trend === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {card.trendValue}
                </span>
              )}
              {card.trend === "neutral" && (
                <span className="flex items-center text-xs text-muted-foreground mb-1">
                  <Minus className="h-3 w-3" />
                  {card.trendValue}
                </span>
              )}
            </div>
            {card.subtitle && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{card.subtitle}</p>
            )}
            {card.miniDonut && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${card.followRatio}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{card.followRatio}%</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Authority Distribution Chart ───────────────────────────────────────
function AuthorityDistributionChart({ distribution }: { distribution: Record<string, number> | undefined }) {
  if (!distribution) return null

  const rangeOrder = ["0-29", "30-49", "50-69", "70-89", "90-100"]
  const rangeColors: Record<string, string> = {
    "0-29": "#ef4444",
    "30-49": "#f97316",
    "50-69": "#f59e0b",
    "70-89": "#84cc16",
    "90-100": "#10b981",
  }

  const data = rangeOrder.map((range) => ({
    range,
    count: distribution[range] ?? 0,
    fill: rangeColors[range] ?? "#888888",
  }))

  return (
    <Card className="py-4 gap-3">
      <CardHeader className="pb-0 px-4">
        <CardTitle className="text-sm font-semibold">Authority Distribution</CardTitle>
        <CardDescription className="text-xs">Backlinks by authority score range</CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <XAxis
              dataKey="range"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                background: "hsl(var(--popover))",
                color: "hsl(var(--popover-foreground))",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value} backlinks`, "Count"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ─── Follow vs Nofollow Pie Chart ───────────────────────────────────────
function FollowNofollowChart({ stats }: { stats: BacklinkStats | undefined }) {
  if (!stats) return null

  const data = [
    { name: "Follow", value: stats.follow, color: "#10b981" },
    { name: "Nofollow", value: stats.nofollow, color: "#ef4444" },
  ]

  const total = stats.follow + stats.nofollow

  return (
    <Card className="py-4 gap-3">
      <CardHeader className="pb-0 px-4">
        <CardTitle className="text-sm font-semibold">Follow vs Nofollow</CardTitle>
        <CardDescription className="text-xs">Link type distribution</CardDescription>
      </CardHeader>
      <CardContent className="px-4 flex items-center gap-4">
        <div className="relative" style={{ width: 140, height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
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
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--popover))",
                  color: "hsl(var(--popover-foreground))",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-lg font-bold">{stats.followRatio}%</span>
              <span className="block text-[10px] text-muted-foreground">Follow</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <div>
              <p className="text-xs font-medium">Follow</p>
              <p className="text-[11px] text-muted-foreground">
                {stats.follow} ({total > 0 ? Math.round((stats.follow / total) * 100) : 0}%)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div>
              <p className="text-xs font-medium">Nofollow</p>
              <p className="text-[11px] text-muted-foreground">
                {stats.nofollow} ({total > 0 ? Math.round((stats.nofollow / total) * 100) : 0}%)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Top Referring Domains ──────────────────────────────────────────────
function TopDomainsTable({ domains }: { domains: TopDomain[] | undefined }) {
  if (!domains) return null

  return (
    <Card className="py-4 gap-3">
      <CardHeader className="pb-0 px-4">
        <CardTitle className="text-sm font-semibold">Top Referring Domains</CardTitle>
        <CardDescription className="text-xs">Highest authority domains linking to you</CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs h-8">Domain</TableHead>
              <TableHead className="text-xs h-8 text-right">Links</TableHead>
              <TableHead className="text-xs h-8 text-right">Avg Authority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.slice(0, 10).map((d) => (
              <TableRow key={d.domain}>
                <TableCell className="py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[9px] font-bold text-muted-foreground shrink-0">
                      {d.domain.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium truncate max-w-[120px]">{d.domain}</span>
                  </div>
                </TableCell>
                <TableCell className="py-1.5 text-right text-xs font-medium">{d.backlinkCount}</TableCell>
                <TableCell className="py-1.5 text-right">
                  <span className={`text-xs font-bold ${getAuthorityColor(d.avgAuthority)}`}>
                    {d.avgAuthority}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ─── Anchor Text Cloud ──────────────────────────────────────────────────
function AnchorTextCloud({ backlinks }: { backlinks: Backlink[] }) {
  const anchorMap = new Map<string, number>()
  for (const bl of backlinks) {
    if (bl.anchorText) {
      anchorMap.set(bl.anchorText, (anchorMap.get(bl.anchorText) ?? 0) + 1)
    }
  }

  const anchors = [...anchorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)

  if (anchors.length === 0) return null

  const maxCount = anchors[0][1]
  const minCount = anchors[anchors.length - 1][1]

  const getSize = (count: number) => {
    if (maxCount === minCount) return "text-sm"
    const ratio = (count - minCount) / (maxCount - minCount)
    if (ratio > 0.8) return "text-xl font-bold"
    if (ratio > 0.6) return "text-lg font-semibold"
    if (ratio > 0.4) return "text-base font-medium"
    if (ratio > 0.2) return "text-sm"
    return "text-xs"
  }

  const getOpacity = (count: number) => {
    if (maxCount === minCount) return "opacity-80"
    const ratio = (count - minCount) / (maxCount - minCount)
    if (ratio > 0.6) return "opacity-100"
    if (ratio > 0.3) return "opacity-80"
    return "opacity-60"
  }

  return (
    <Card className="py-4 gap-3">
      <CardHeader className="pb-0 px-4">
        <CardTitle className="text-sm font-semibold">Anchor Text Cloud</CardTitle>
        <CardDescription className="text-xs">Most common anchor texts by frequency</CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex flex-wrap gap-2 items-center justify-center min-h-[100px] py-2">
          {anchors.map(([text, count]) => (
            <TooltipProvider key={text}>
              <UITooltip>
                <TooltipTrigger asChild>
                  <span
                    className={`inline-block cursor-default rounded-md px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-950 ${getSize(count)} ${getOpacity(count)}`}
                  >
                    {text}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">&quot;{text}&quot; — {count} backlink{count > 1 ? "s" : ""}</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Backlinks Data Table ───────────────────────────────────────────────
function BacklinksTable({
  data,
  filters,
  setFilters,
}: {
  data: BacklinkResponse | undefined
  filters: {
    status: string
    linkType: string
    isFollow: string
    page: number
    limit: number
    sortBy: string
    sortOrder: string
    search: string
  }
  setFilters: React.Dispatch<
    React.SetStateAction<{
      status: string
      linkType: string
      isFollow: string
      page: number
      limit: number
      sortBy: string
      sortOrder: string
      search: string
    }>
  >
}) {
  const backlinks = data?.backlinks ?? []
  const pagination = data?.pagination

  const toggleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === "desc" ? "asc" : "desc",
      page: 1,
    }))
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  const truncateUrl = (url: string, maxLen = 35) => {
    if (url.length <= maxLen) return url
    return url.substring(0, maxLen) + "…"
  }

  return (
    <Card className="py-4 gap-3">
      <CardHeader className="pb-0 px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold">Backlinks</CardTitle>
            <CardDescription className="text-xs">
              {pagination ? `${pagination.total} total backlinks` : "Loading..."}
            </CardDescription>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <div className="relative flex-1 min-w-[180px] max-w-[280px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search domain or anchor..."
              className="h-8 pl-8 text-xs"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
              }
            />
          </div>
          <Select
            value={filters.status || "all"}
            onValueChange={(v) =>
              setFilters((prev) => ({ ...prev, status: v === "all" ? "" : v, page: 1 }))
            }
          >
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="new">New</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.linkType || "all"}
            onValueChange={(v) =>
              setFilters((prev) => ({ ...prev, linkType: v === "all" ? "" : v, page: 1 }))
            }
          >
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="Link Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="redirect">Redirect</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.isFollow || "all"}
            onValueChange={(v) =>
              setFilters((prev) => ({ ...prev, isFollow: v === "all" ? "" : v, page: 1 }))
            }
          >
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue placeholder="Follow" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Links</SelectItem>
              <SelectItem value="true">Follow</SelectItem>
              <SelectItem value="false">Nofollow</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="px-2">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs h-8">
                  <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => toggleSort("sourceDomain")}
                  >
                    Source Domain
                    <ArrowUpDown className={`h-3 w-3 ${filters.sortBy === "sourceDomain" ? "text-emerald-500" : "text-muted-foreground/50"}`} />
                  </button>
                </TableHead>
                <TableHead className="text-xs h-8">Source URL</TableHead>
                <TableHead className="text-xs h-8">Target</TableHead>
                <TableHead className="text-xs h-8">Anchor Text</TableHead>
                <TableHead className="text-xs h-8">Type</TableHead>
                <TableHead className="text-xs h-8">Follow</TableHead>
                <TableHead className="text-xs h-8">
                  <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => toggleSort("authorityScore")}
                  >
                    Authority
                    <ArrowUpDown className={`h-3 w-3 ${filters.sortBy === "authorityScore" ? "text-emerald-500" : "text-muted-foreground/50"}`} />
                  </button>
                </TableHead>
                <TableHead className="text-xs h-8">
                  <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => toggleSort("spamScore")}
                  >
                    Spam
                    <ArrowUpDown className={`h-3 w-3 ${filters.sortBy === "spamScore" ? "text-emerald-500" : "text-muted-foreground/50"}`} />
                  </button>
                </TableHead>
                <TableHead className="text-xs h-8">Status</TableHead>
                <TableHead className="text-xs h-8">
                  <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => toggleSort("firstSeen")}
                  >
                    First Seen
                    <ArrowUpDown className={`h-3 w-3 ${filters.sortBy === "firstSeen" ? "text-emerald-500" : "text-muted-foreground/50"}`} />
                  </button>
                </TableHead>
                <TableHead className="text-xs h-8">
                  <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => toggleSort("lastSeen")}
                  >
                    Last Seen
                    <ArrowUpDown className={`h-3 w-3 ${filters.sortBy === "lastSeen" ? "text-emerald-500" : "text-muted-foreground/50"}`} />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backlinks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center text-muted-foreground text-sm">
                    No backlinks found.
                  </TableCell>
                </TableRow>
              ) : (
                backlinks.map((bl) => (
                  <TableRow key={bl.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-[9px] font-bold text-muted-foreground shrink-0">
                          {bl.sourceDomain.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium">{bl.sourceDomain}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={bl.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                            >
                              {truncateUrl(bl.sourceUrl)}
                              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                            </a>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs break-all">{bl.sourceUrl}</p>
                          </TooltipContent>
                        </UITooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{truncateUrl(bl.targetUrl, 25)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs max-w-[120px] truncate block" title={bl.anchorText ?? undefined}>
                        {bl.anchorText ?? <span className="italic text-muted-foreground/60">—</span>}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0 h-5">
                        {getLinkTypeIcon(bl.linkType)}
                        {bl.linkType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {bl.isFollow ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 text-[10px] px-1.5 py-0 h-5">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                          Follow
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800 text-[10px] px-1.5 py-0 h-5">
                          <XCircle className="h-2.5 w-2.5 mr-0.5" />
                          Nofollow
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${getAuthorityBg(bl.authorityScore)}`} />
                        <span className={`text-xs font-bold ${getAuthorityColor(bl.authorityScore)}`}>
                          {bl.authorityScore ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${getSpamColor(bl.spamScore)}`}>
                        {bl.spamScore ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(bl.status)}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{formatDate(bl.firstSeen)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{formatDate(bl.lastSeen)}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <p className="text-xs text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages} — {pagination.total} results
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                disabled={filters.page <= 1}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                <ChevronLeft className="h-3 w-3" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                disabled={filters.page >= pagination.totalPages}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Module Component ──────────────────────────────────────────────
export function BacklinksModule() {
  const activeProjectId = useSeoStore((s) => s.activeProjectId)

  // Use active project ID or "first" as fallback (API resolves "first" to the first project)
  const projectId = activeProjectId || "first"

  // Filters state
  const [filters, setFilters] = React.useState({
    status: "",
    linkType: "",
    isFollow: "",
    page: 1,
    limit: 15,
    sortBy: "authorityScore",
    sortOrder: "desc",
    search: "",
  })

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
      setFilters((prev) => ({ ...prev, page: 1 }))
    }, 400)
    return () => clearTimeout(timer)
  }, [filters.search])

  const queryFilters = { ...filters, search: debouncedSearch }

  const { data, isLoading } = useBacklinksData(projectId, queryFilters)

  // Load all backlinks for anchor text cloud (unfiltered)
  const { data: allData } = useQuery<BacklinkResponse>({
    queryKey: ["backlinks-all", projectId],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set("projectId", projectId)
      params.set("limit", "100")
      const res = await fetch(`/api/seo/backlinks?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
    enabled: !!projectId,
  })

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading backlink data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <Link className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">Backlink Intelligence</h2>
          <p className="text-xs text-muted-foreground">Monitor your link profile, discover opportunities, and track link health</p>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={data?.stats} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AuthorityDistributionChart distribution={data?.stats.authorityDistribution} />
        <FollowNofollowChart stats={data?.stats} />
      </div>

      {/* Top Domains + Anchor Cloud */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopDomainsTable domains={data?.stats.topDomains} />
        <AnchorTextCloud backlinks={allData?.backlinks ?? []} />
      </div>

      {/* Backlinks Table */}
      <BacklinksTable data={data} filters={filters} setFilters={setFilters} />
    </div>
  )
}
