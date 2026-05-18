"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import {
  Bell,
  BellOff,
  TrendingDown,
  TrendingUp,
  Link2Off,
  Link,
  ShieldAlert,
  Activity,
  Search,
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Plus,
  Mail,
  MessageSquare,
  X,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useSeoStore } from "@/lib/seo-store"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from "@/components/ui/chart"

// ─── Types ──────────────────────────────────────────────────────────────
interface Alert {
  id: string
  type: string
  severity: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

interface AlertSummary {
  total: number
  unread: number
  severityCounts: {
    critical: number
    high: number
    medium: number
    low: number
    info: number
  }
  typeCounts: Record<string, number>
}

interface AlertsResponse {
  alerts: Alert[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  summary: AlertSummary
}

// ─── Alert Type Icon Mapping ────────────────────────────────────────────
function getAlertTypeIcon(type: string) {
  switch (type) {
    case "ranking_drop":
    case "rank_change":
      return TrendingDown
    case "ranking_gain":
      return TrendingUp
    case "backlink_lost":
      return Link2Off
    case "new_backlink":
    case "backlink":
      return Link
    case "audit_issue":
    case "audit":
      return ShieldAlert
    case "traffic_spike":
    case "traffic":
      return Activity
    case "competitor":
      return AlertTriangle
    case "technical":
      return AlertCircle
    case "keyword":
      return Info
    default:
      return Bell
  }
}

// ─── Severity Helpers ───────────────────────────────────────────────────
function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "text-red-500"
    case "high":
      return "text-orange-500"
    case "medium":
      return "text-amber-500"
    case "low":
      return "text-sky-500"
    case "info":
      return "text-slate-400"
    default:
      return "text-muted-foreground"
  }
}

function getSeverityBg(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-500"
    case "high":
      return "bg-orange-500"
    case "medium":
      return "bg-amber-500"
    case "low":
      return "bg-sky-500"
    case "info":
      return "bg-slate-400"
    default:
      return "bg-muted"
  }
}

function getSeverityDotBg(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-500/10 dark:bg-red-500/20"
    case "high":
      return "bg-orange-500/10 dark:bg-orange-500/20"
    case "medium":
      return "bg-amber-500/10 dark:bg-amber-500/20"
    case "low":
      return "bg-sky-500/10 dark:bg-sky-500/20"
    case "info":
      return "bg-slate-100 dark:bg-slate-800"
    default:
      return "bg-muted"
  }
}

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "critical":
      return AlertTriangle
    case "high":
      return AlertCircle
    case "medium":
      return AlertCircle
    case "low":
      return Info
    case "info":
      return Info
    default:
      return Bell
  }
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "critical":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800 text-[10px] px-1.5 py-0 h-5">
          Critical
        </Badge>
      )
    case "high":
      return (
        <Badge className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800 text-[10px] px-1.5 py-0 h-5">
          High
        </Badge>
      )
    case "medium":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800 text-[10px] px-1.5 py-0 h-5">
          Warning
        </Badge>
      )
    case "low":
      return (
        <Badge className="bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-400 dark:border-sky-800 text-[10px] px-1.5 py-0 h-5">
          Low
        </Badge>
      )
    case "info":
      return (
        <Badge className="bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 text-[10px] px-1.5 py-0 h-5">
          Info
        </Badge>
      )
    default:
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{severity}</Badge>
  }
}

// ─── Relative Time ──────────────────────────────────────────────────────
function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMinutes < 1) return "Just now"
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } catch {
    return dateStr
  }
}

function formatTimeIndicator(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

    if (diffDays < 1) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  } catch {
    return ""
  }
}

// ─── Alert Category Mapping ─────────────────────────────────────────────
function mapTypeToCategory(type: string): string {
  switch (type) {
    case "ranking_drop":
    case "ranking_gain":
    case "rank_change":
    case "keyword":
      return "Ranking"
    case "backlink_lost":
    case "new_backlink":
    case "backlink":
      return "Backlink"
    case "audit_issue":
    case "audit":
      return "Audit"
    case "traffic_spike":
    case "traffic":
      return "Traffic"
    case "competitor":
      return "Competitor"
    case "technical":
      return "Technical"
    default:
      return "Other"
  }
}

// ─── Fetch Hook ─────────────────────────────────────────────────────────
function useAlertsData(
  projectId: string,
  params: {
    severity: string
    isRead: string
    search: string
    page: number
  }
) {
  const queryParams = new URLSearchParams()
  queryParams.set("projectId", projectId)
  if (params.severity) queryParams.set("severity", params.severity)
  if (params.isRead) queryParams.set("isRead", params.isRead)
  queryParams.set("page", String(params.page))
  queryParams.set("limit", "50")

  return useQuery<AlertsResponse>({
    queryKey: ["alerts", projectId, params],
    queryFn: async () => {
      const res = await fetch(`/api/seo/alerts?${queryParams.toString()}`)
      if (!res.ok) {
        // If 404, try seeding first
        if (res.status === 404 || res.status === 400) {
          const seedRes = await fetch("/api/seo/seed", { method: "POST" })
          if (seedRes.ok) {
            const retryRes = await fetch(`/api/seo/alerts?${queryParams.toString()}`)
            if (!retryRes.ok) throw new Error("Failed to fetch alerts after seeding")
            return retryRes.json()
          }
        }
        throw new Error("Failed to fetch alerts")
      }
      return res.json()
    },
    enabled: !!projectId,
  })
}

// ─── Summary Cards ──────────────────────────────────────────────────────
function SummaryCards({ summary, isLoading }: { summary: AlertSummary | undefined; isLoading: boolean }) {
  const criticalCount = summary?.severityCounts.critical ?? 0
  const highCount = summary?.severityCounts.high ?? 0
  // "Warning" = high + medium
  const warningCount = highCount + (summary?.severityCounts.medium ?? 0)
  const unread = summary?.unread ?? 0
  const total = summary?.total ?? 0

  const cards = [
    {
      title: "Total Alerts",
      value: total,
      icon: Bell,
      accent: "text-emerald-600 dark:text-emerald-400",
      bgAccent: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      title: "Unread",
      value: unread,
      icon: BellOff,
      accent: "text-emerald-600 dark:text-emerald-400",
      bgAccent: "bg-emerald-50 dark:bg-emerald-950/50",
      badge: unread > 0 ? unread : undefined,
    },
    {
      title: "Critical",
      value: criticalCount,
      icon: AlertTriangle,
      accent: "text-red-600 dark:text-red-400",
      bgAccent: "bg-red-50 dark:bg-red-950/50",
    },
    {
      title: "Warning",
      value: warningCount,
      icon: AlertCircle,
      accent: "text-amber-600 dark:text-amber-400",
      bgAccent: "bg-amber-50 dark:bg-amber-950/50",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              {isLoading ? (
                <div className="h-7 w-12 animate-pulse rounded bg-muted" />
              ) : (
                <span className="text-2xl font-bold tracking-tight">{card.value.toLocaleString()}</span>
              )}
              {card.badge !== undefined && card.badge > 0 && (
                <Badge className="mb-1 bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800 text-[10px] px-1.5 h-5">
                  {card.badge} new
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Alert Type Breakdown Donut ─────────────────────────────────────────
const ALERT_TYPE_COLORS: Record<string, string> = {
  Ranking: "#10b981",
  Backlink: "#f59e0b",
  Audit: "#ef4444",
  Traffic: "#06b6d4",
  Competitor: "#8b5cf6",
  Technical: "#f97316",
  Other: "#94a3b8",
}

const alertTypeChartConfig = {
  Ranking: { label: "Ranking", color: "#10b981" },
  Backlink: { label: "Backlink", color: "#f59e0b" },
  Audit: { label: "Audit", color: "#ef4444" },
  Traffic: { label: "Traffic", color: "#06b6d4" },
  Competitor: { label: "Competitor", color: "#8b5cf6" },
  Technical: { label: "Technical", color: "#f97316" },
  Other: { label: "Other", color: "#94a3b8" },
} satisfies ChartConfig

function AlertTypeBreakdown({ typeCounts }: { typeCounts: Record<string, number> | undefined }) {
  if (!typeCounts) return null

  // Map raw types to categories
  const categoryCounts: Record<string, number> = {}
  for (const [type, count] of Object.entries(typeCounts)) {
    const category = mapTypeToCategory(type)
    categoryCounts[category] = (categoryCounts[category] ?? 0) + count
  }

  const data = Object.entries(categoryCounts)
    .map(([name, value]) => ({
      name,
      value,
      fill: ALERT_TYPE_COLORS[name] ?? "#94a3b8",
    }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) return null

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card className="py-4 gap-3">
      <CardHeader className="pb-0 px-4">
        <CardTitle className="text-sm font-semibold">Alert Type Breakdown</CardTitle>
        <CardDescription className="text-xs">Distribution of alerts by category</CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex items-center gap-4">
          <div className="relative" style={{ width: 160, height: 160 }}>
            <ChartContainer config={alertTypeChartConfig} className="w-full h-full">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-xl font-bold">{total}</span>
                <span className="block text-[10px] text-muted-foreground">Total</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 flex-1">
            {data.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                  <span className="text-xs font-medium">{entry.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold">{entry.value}</span>
                  <span className="text-[10px] text-muted-foreground">
                    ({total > 0 ? Math.round((entry.value / total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Alert Rules Section ────────────────────────────────────────────────
interface AlertRule {
  id: string
  name: string
  description: string
  type: string
  channel: string
  enabled: boolean
}

const DEFAULT_RULES: AlertRule[] = [
  {
    id: "rule-1",
    name: "Keyword Drop Alert",
    description: "Alert when keyword drops > 5 positions",
    type: "ranking_drop",
    channel: "email",
    enabled: true,
  },
  {
    id: "rule-2",
    name: "Critical Audit Issues",
    description: "Alert on new critical audit issues",
    type: "audit_issue",
    channel: "email",
    enabled: true,
  },
  {
    id: "rule-3",
    name: "High-DA Backlink Lost",
    description: "Alert when backlink from DA>50 is lost",
    type: "backlink_lost",
    channel: "slack",
    enabled: true,
  },
]

function AlertRulesSection() {
  const [rules, setRules] = React.useState<AlertRule[]>(DEFAULT_RULES)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [newRule, setNewRule] = React.useState({
    name: "",
    type: "ranking_drop",
    threshold: "5",
    channel: "email",
  })

  const handleCreateRule = () => {
    if (!newRule.name.trim()) return

    const typeLabels: Record<string, string> = {
      ranking_drop: "Keyword drops",
      ranking_gain: "Keyword gains",
      backlink_lost: "Lost backlinks",
      new_backlink: "New backlinks",
      audit_issue: "Audit issues",
      traffic_spike: "Traffic spikes",
    }

    const created: AlertRule = {
      id: `rule-${Date.now()}`,
      name: newRule.name,
      description: `Alert on ${typeLabels[newRule.type] ?? newRule.type} with threshold ${newRule.threshold}`,
      type: newRule.type,
      channel: newRule.channel,
      enabled: true,
    }

    setRules((prev) => [...prev, created])
    setNewRule({ name: "", type: "ranking_drop", threshold: "5", channel: "email" })
    setDialogOpen(false)
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="h-3 w-3" />
      case "slack":
        return <MessageSquare className="h-3 w-3" />
      default:
        return <Bell className="h-3 w-3" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "ranking_drop":
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 text-[9px] px-1 py-0 h-4">Drop</Badge>
      case "ranking_gain":
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[9px] px-1 py-0 h-4">Gain</Badge>
      case "backlink_lost":
        return <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 text-[9px] px-1 py-0 h-4">Lost BL</Badge>
      case "new_backlink":
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[9px] px-1 py-0 h-4">New BL</Badge>
      case "audit_issue":
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 text-[9px] px-1 py-0 h-4">Audit</Badge>
      case "traffic_spike":
        return <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400 text-[9px] px-1 py-0 h-4">Traffic</Badge>
      default:
        return <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">{type}</Badge>
    }
  }

  return (
    <Card className="py-4 gap-3">
      <CardHeader className="pb-0 px-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Alert Rules</CardTitle>
            <CardDescription className="text-xs">Configure when and how you get notified</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-3 w-3" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Alert Rule</DialogTitle>
                <DialogDescription>Set up a new alert rule to stay informed about important SEO events.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Rule Name</Label>
                  <Input
                    placeholder="e.g., Major Ranking Drop Alert"
                    className="h-8 text-xs"
                    value={newRule.name}
                    onChange={(e) => setNewRule((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Alert Type</Label>
                  <Select
                    value={newRule.type}
                    onValueChange={(v) => setNewRule((prev) => ({ ...prev, type: v }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ranking_drop">Ranking Drop</SelectItem>
                      <SelectItem value="ranking_gain">Ranking Gain</SelectItem>
                      <SelectItem value="backlink_lost">Lost Backlink</SelectItem>
                      <SelectItem value="new_backlink">New Backlink</SelectItem>
                      <SelectItem value="audit_issue">Audit Issue</SelectItem>
                      <SelectItem value="traffic_spike">Traffic Spike</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Threshold</Label>
                  <Input
                    type="number"
                    placeholder="5"
                    className="h-8 text-xs"
                    value={newRule.threshold}
                    onChange={(e) => setNewRule((prev) => ({ ...prev, threshold: e.target.value }))}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Minimum value to trigger the alert (e.g., position change, authority score)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Notification Channel</Label>
                  <Select
                    value={newRule.channel}
                    onValueChange={(v) => setNewRule((prev) => ({ ...prev, channel: v }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="slack">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-3 w-3" />
                          Slack
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateRule}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!newRule.name.trim()}
                >
                  Create Rule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${rule.enabled ? "bg-emerald-50 dark:bg-emerald-950/50" : "bg-muted"}`}>
                  {getChannelIcon(rule.channel)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium truncate">{rule.name}</span>
                    {getTypeBadge(rule.type)}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{rule.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5 gap-1">
                  {getChannelIcon(rule.channel)}
                  {rule.channel}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-red-500"
                  onClick={() => setRules((prev) => prev.filter((r) => r.id !== rule.id))}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Alert Timeline ─────────────────────────────────────────────────────
function AlertTimeline({
  alerts,
  onMarkAsRead,
  isMarkingRead,
}: {
  alerts: Alert[]
  onMarkAsRead: (alertId: string) => void
  isMarkingRead: boolean
}) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  if (alerts.length === 0) {
    return (
      <Card className="py-4 gap-3">
        <CardContent className="px-4 py-12 flex flex-col items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <BellOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No alerts found</h3>
          <p className="text-xs text-muted-foreground text-center max-w-xs">
            No alerts match your current filters. Try adjusting your severity or read status filters.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Group alerts by time period
  const groupedAlerts: Record<string, Alert[]> = {}
  for (const alert of alerts) {
    const key = formatTimeIndicator(alert.createdAt)
    if (!groupedAlerts[key]) groupedAlerts[key] = []
    groupedAlerts[key].push(alert)
  }

  return (
    <Card className="py-4 gap-3">
      <CardHeader className="pb-0 px-4">
        <CardTitle className="text-sm font-semibold">Alert Timeline</CardTitle>
        <CardDescription className="text-xs">{alerts.length} alert{alerts.length !== 1 ? "s" : ""} found</CardDescription>
      </CardHeader>
      <CardContent className="px-4">
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />

          <div className="space-y-1">
            {Object.entries(groupedAlerts).map(([timeGroup, groupAlerts]) => (
              <div key={timeGroup}>
                {/* Time group header */}
                <div className="flex items-center gap-3 py-2">
                  <div className="relative z-10 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-background border">
                    <span className="text-[9px] font-bold text-muted-foreground">{timeGroup.charAt(0)}</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{timeGroup}</span>
                </div>

                {/* Alerts in this group */}
                <div className="space-y-2 ml-[30px] pl-4">
                  {groupAlerts.map((alert) => {
                    const Icon = getAlertTypeIcon(alert.type)
                    const isExpanded = expandedId === alert.id

                    return (
                      <div
                        key={alert.id}
                        className={`relative rounded-lg border transition-all duration-200 ${
                          !alert.isRead
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30"
                            : "bg-background hover:bg-muted/30"
                        }`}
                      >
                        {/* Timeline connector dot */}
                        <div
                          className={`absolute -left-[21px] top-4 h-2.5 w-2.5 rounded-full border-2 border-background ${getSeverityBg(alert.severity)}`}
                        />

                        <div
                          className="p-3 cursor-pointer"
                          onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Alert icon */}
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${getSeverityDotBg(alert.severity)}`}>
                              <Icon className={`h-4 w-4 ${getSeverityColor(alert.severity)}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold truncate">{alert.title}</span>
                                {!alert.isRead && (
                                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                                )}
                                {getSeverityBadge(alert.severity)}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{alert.message}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] text-muted-foreground">{formatRelativeTime(alert.createdAt)}</span>
                                {isExpanded ? (
                                  <ChevronUp className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              {!alert.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-[10px] gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                                  disabled={isMarkingRead}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onMarkAsRead(alert.id)
                                  }}
                                >
                                  <CheckCheck className="h-3 w-3" />
                                  <span className="hidden sm:inline">Read</span>
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-xs text-muted-foreground leading-relaxed">{alert.message}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-[10px] text-muted-foreground">
                                  Type: <span className="font-medium text-foreground">{mapTypeToCategory(alert.type)}</span>
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  Severity: <span className="font-medium text-foreground capitalize">{alert.severity}</span>
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  Created: <span className="font-medium text-foreground">{new Date(alert.createdAt).toLocaleString()}</span>
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Module ────────────────────────────────────────────────────────
export function AlertsModule() {
  const activeProjectId = useSeoStore((s) => s.activeProjectId)
  const queryClient = useQueryClient()
  const projectId = activeProjectId || "first"

  // Filters
  const [severityFilter, setSeverityFilter] = React.useState("")
  const [readFilter, setReadFilter] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [page, setPage] = React.useState(1)

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch alerts
  const { data, isLoading } = useAlertsData(projectId, {
    severity: severityFilter,
    isRead: readFilter,
    search: debouncedSearch,
    page,
  })

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const res = await fetch("/api/seo/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertIds: [alertId] }),
      })
      if (!res.ok) throw new Error("Failed to mark as read")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", projectId] })
    },
  })

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/seo/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true, projectId }),
      })
      if (!res.ok) throw new Error("Failed to mark all as read")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", projectId] })
    },
  })

  // Client-side search filtering (API doesn't support search param)
  const alertsList = data?.alerts
  const filteredAlerts = React.useMemo(() => {
    if (!alertsList) return []
    if (!debouncedSearch) return alertsList
    const q = debouncedSearch.toLowerCase()
    return alertsList.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
    )
  }, [alertsList, debouncedSearch])

  const summary = data?.summary

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading alerts data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight">Alerts &amp; Notifications</h2>
          <p className="text-xs text-muted-foreground">Stay informed about critical SEO events, ranking changes, and site issues</p>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards summary={summary} isLoading={isLoading} />

      {/* Filter Bar */}
      <Card className="py-3 gap-2">
        <CardContent className="px-4 py-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] max-w-[280px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                className="h-8 pl-8 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Severity filter */}
            <Select
              value={severityFilter || "all"}
              onValueChange={(v) => {
                setSeverityFilter(v === "all" ? "" : v)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Warning</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>

            {/* Read status filter */}
            <Select
              value={readFilter || "all"}
              onValueChange={(v) => {
                setReadFilter(v === "all" ? "" : v)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="false">Unread</SelectItem>
                <SelectItem value="true">Read</SelectItem>
              </SelectContent>
            </Select>

            {/* Mark all as read */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 ml-auto"
              disabled={markAllReadMutation.isPending || (summary?.unread ?? 0) === 0}
              onClick={() => markAllReadMutation.mutate()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark All as Read
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main content grid: Timeline + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline - takes 2 cols */}
        <div className="lg:col-span-2">
          <AlertTimeline
            alerts={filteredAlerts}
            onMarkAsRead={(id) => markReadMutation.mutate(id)}
            isMarkingRead={markReadMutation.isPending}
          />
        </div>

        {/* Sidebar: Breakdown + Rules */}
        <div className="space-y-4">
          <AlertTypeBreakdown typeCounts={summary?.typeCounts} />
          <AlertRulesSection />
        </div>
      </div>
    </div>
  )
}
