'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  FileText,
  ShieldCheck,
  TrendingUp,
  Link2,
  Users,
  Calendar,
  Download,
  Share2,
  Trash2,
  Eye,
  Clock,
  Mail,
  Lock,
  Copy,
  Check,
  ChevronRight,
  BarChart3,
  Target,
  AlertTriangle,
  Lightbulb,
  Globe,
  FileSpreadsheet,
  Presentation,
  RefreshCw,
  Plus,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useSeoStore } from '@/lib/seo-store'

// ─── Types ────────────────────────────────────────────────────────────
interface ReportData {
  reportDate: string
  project: { id: string; name: string; domain: string }
  keywords: {
    total: number
    averageRank: number
    improved: number
    declined: number
    topKeywords: { keyword: string; currentRank: number; previousRank: number | null; change: number | null; searchVolume: number | null; url: string | null }[]
    positionDistribution: { top3: number; top10: number; top20: number; top50: number; beyond50: number }
  }
  traffic: { estimatedMonthlyVisits: number; estimatedValue: number }
  audit: {
    score: number
    scoreChange: number | null
    totalIssues: number
    criticalIssues: number
    highIssues: number
    resolvedIssues: number
    openIssues: number
    topCategories: { category: string; count: number }[]
  } | null
  backlinks: {
    total: number
    active: number
    follow: number
    nofollow: number
    referringDomains: number
    newThisMonth: number
    lostThisMonth: number
    avgAuthority: number
  }
  competitors: { domain: string; authorityScore: number; organicKeywords: number; organicTraffic: number; backlinks: number }[]
  alerts: { total: number; unread: number; critical: number; high: number }
  insights: string[]
  recommendations: string[]
}

interface ReportTemplate {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  bgColor: string
}

interface ReportHistoryItem {
  id: string
  name: string
  type: string
  date: string
  format: string
  status: 'completed' | 'generating' | 'failed'
}

// ─── Constants ────────────────────────────────────────────────────────
const CHART_COLORS = {
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  rose: '#f43f5e',
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'executive',
    title: 'Executive Summary',
    description: 'High-level overview for leadership with key metrics and trends',
    icon: BarChart3,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'audit',
    title: 'Full SEO Audit Report',
    description: 'Comprehensive technical audit with issue breakdown and fixes',
    icon: ShieldCheck,
    color: 'text-teal-600',
    bgColor: 'bg-teal-500/10',
  },
  {
    id: 'monthly',
    title: 'Monthly Performance',
    description: 'Rank & traffic changes over the past month with trends',
    icon: TrendingUp,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-500/10',
  },
  {
    id: 'backlink',
    title: 'Backlink Analysis',
    description: 'Link profile health, new/lost links, and authority analysis',
    icon: Link2,
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'competitor',
    title: 'Competitor Comparison',
    description: 'Market position analysis and competitive gap identification',
    icon: Users,
    color: 'text-rose-600',
    bgColor: 'bg-rose-500/10',
  },
]

const REPORT_HISTORY: ReportHistoryItem[] = [
  { id: 'r1', name: 'Executive Summary - Q1 2026', type: 'Executive Summary', date: '2026-03-31', format: 'PDF', status: 'completed' },
  { id: 'r2', name: 'Monthly Performance - Feb 2026', type: 'Monthly Performance', date: '2026-02-28', format: 'Web', status: 'completed' },
  { id: 'r3', name: 'Full SEO Audit - March', type: 'Full SEO Audit', date: '2026-03-15', format: 'PDF', status: 'completed' },
  { id: 'r4', name: 'Backlink Analysis - Q1', type: 'Backlink Analysis', date: '2026-03-01', format: 'PPT', status: 'completed' },
  { id: 'r5', name: 'Competitor Comparison - Mar', type: 'Competitor Comparison', date: '2026-03-20', format: 'Web', status: 'completed' },
  { id: 'r6', name: 'Executive Summary - Q4 2025', type: 'Executive Summary', date: '2025-12-31', format: 'PDF', status: 'completed' },
  { id: 'r7', name: 'Monthly Performance - Jan 2026', type: 'Monthly Performance', date: '2026-01-31', format: 'Web', status: 'failed' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' as const },
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

// ─── Fetch hook ───────────────────────────────────────────────────────
function useReportData() {
  const activeProjectId = useSeoStore((s) => s.activeProjectId)
  return useQuery<ReportData>({
    queryKey: ['seo-reports', activeProjectId],
    queryFn: async () => {
      const pid = activeProjectId || 'first'
      const res = await fetch(`/api/seo/reports?projectId=${pid}`)
      if (!res.ok) throw new Error('Failed to fetch report data')
      return res.json()
    },
    staleTime: 60_000,
    enabled: !!activeProjectId,
  })
}

// ─── Loading Skeleton ─────────────────────────────────────────────────
function ReportsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-0 p-4">
              <Skeleton className="h-10 w-10 rounded-lg mb-3" />
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-0 p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Report Templates Grid ────────────────────────────────────────────
function ReportTemplatesGrid({
  selectedTemplate,
  onSelectTemplate,
}: {
  selectedTemplate: string | null
  onSelectTemplate: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Report Templates</h2>
        <p className="text-sm text-muted-foreground mt-1">Choose a template to generate a comprehensive SEO report</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {REPORT_TEMPLATES.map((template, i) => {
          const isSelected = selectedTemplate === template.id
          return (
            <motion.div key={template.id} custom={i} variants={fadeUp} initial="hidden" animate="visible">
              <Card
                className={cn(
                  'cursor-pointer transition-all duration-200 hover:shadow-md h-full',
                  isSelected && 'ring-2 ring-emerald-500 shadow-md'
                )}
                onClick={() => onSelectTemplate(template.id)}
              >
                <CardContent className="pt-0 p-4">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg mb-3', template.bgColor)}>
                    <template.icon className={cn('h-5 w-5', template.color)} />
                  </div>
                  <h3 className="text-sm font-semibold mb-1">{template.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{template.description}</p>
                  <Button
                    size="sm"
                    className={cn(
                      'mt-3 w-full text-xs h-8',
                      isSelected
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                    )}
                    variant={isSelected ? 'default' : 'secondary'}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectTemplate(template.id)
                    }}
                  >
                    {isSelected ? 'Selected' : 'Generate'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Report Configuration Panel ───────────────────────────────────────
function ReportConfiguration({
  onGenerate,
  isGenerating,
}: {
  onGenerate: (config: ReportConfig) => void
  isGenerating: boolean
}) {
  const [dateRange, setDateRange] = React.useState('30')
  const [sections, setSections] = React.useState({
    rankings: true,
    audit: true,
    backlinks: true,
    competitors: true,
    traffic: true,
  })
  const [format, setFormat] = React.useState('web')
  const [schedule, setSchedule] = React.useState('once')
  const [emailDelivery, setEmailDelivery] = React.useState(false)

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleGenerate = () => {
    onGenerate({ dateRange, sections, format, schedule, emailDelivery })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-emerald-500" />
          Report Configuration
        </CardTitle>
        <CardDescription>Customize your report settings before generating</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Date Range</Label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input type="date" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input type="date" className="h-9 text-xs" />
              </div>
            </div>
          )}
        </div>

        {/* Sections to Include */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Sections to Include</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'rankings' as const, label: 'Rankings', icon: Target },
              { key: 'audit' as const, label: 'Audit', icon: ShieldCheck },
              { key: 'backlinks' as const, label: 'Backlinks', icon: Link2 },
              { key: 'competitors' as const, label: 'Competitors', icon: Users },
              { key: 'traffic' as const, label: 'Traffic', icon: TrendingUp },
            ].map((section) => (
              <div
                key={section.key}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors',
                  sections[section.key]
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-border hover:border-emerald-500/30'
                )}
                onClick={() => toggleSection(section.key)}
              >
                <Checkbox
                  checked={sections[section.key]}
                  onCheckedChange={() => toggleSection(section.key)}
                  className="pointer-events-none"
                />
                <section.icon className={cn('h-3.5 w-3.5', sections[section.key] ? 'text-emerald-500' : 'text-muted-foreground')} />
                <span className="text-xs font-medium">{section.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Format */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Format</Label>
          <div className="flex gap-2">
            {[
              { value: 'pdf', label: 'PDF', icon: FileText },
              { value: 'web', label: 'Web', icon: Globe },
              { value: 'ppt', label: 'PPT', icon: Presentation },
            ].map((fmt) => (
              <div
                key={fmt.value}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-4 py-2 cursor-pointer transition-colors',
                  format === fmt.value
                    ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-600'
                    : 'border-border hover:border-emerald-500/30 text-muted-foreground'
                )}
                onClick={() => setFormat(fmt.value)}
              >
                <fmt.icon className="h-4 w-4" />
                <span className="text-xs font-medium">{fmt.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Schedule</Label>
          <Select value={schedule} onValueChange={setSchedule}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="once">One-time</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Email Delivery */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email Delivery</p>
              <p className="text-xs text-muted-foreground">Send report to team members via email</p>
            </div>
          </div>
          <Switch checked={emailDelivery} onCheckedChange={setEmailDelivery} />
        </div>

        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Generated Report Preview ─────────────────────────────────────────
function ReportPreview({
  data,
  config,
  projectName,
}: {
  data: ReportData
  config: ReportConfig
  projectName: string
}) {
  const distributionData = [
    { name: 'Top 3', value: data.keywords.positionDistribution.top3, color: CHART_COLORS.emerald },
    { name: 'Top 10', value: data.keywords.positionDistribution.top10, color: CHART_COLORS.teal },
    { name: 'Top 20', value: data.keywords.positionDistribution.top20, color: CHART_COLORS.cyan },
    { name: 'Top 50', value: data.keywords.positionDistribution.top50, color: CHART_COLORS.amber },
    { name: '50+', value: data.keywords.positionDistribution.beyond50, color: CHART_COLORS.rose },
  ].filter((d) => d.value > 0)

  const auditCategoryData = data.audit
    ? data.audit.topCategories.map((c) => ({
        name: c.category,
        count: c.count,
      }))
    : []

  const topKeywordsData = data.keywords.topKeywords.slice(0, 7).map((k) => ({
    keyword: k.keyword.length > 15 ? k.keyword.substring(0, 15) + '...' : k.keyword,
    rank: k.currentRank,
    change: k.change ?? 0,
  }))

  return (
    <Card className="border-emerald-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-500" />
              Report Preview
            </CardTitle>
            <CardDescription>Preview of your generated report</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-8 text-xs">
              <Download className="h-3.5 w-3.5 mr-1" />
              Download
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-xs">
              <Share2 className="h-3.5 w-3.5 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/30 p-6 space-y-6">
          {/* Report Header */}
          <div className="text-center space-y-2 pb-4 border-b">
            <h2 className="text-xl font-bold">{projectName} — SEO Report</h2>
            <p className="text-sm text-muted-foreground">
              Generated on {new Date(data.reportDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} &middot; Last {config.dateRange} days
            </p>
          </div>

          {/* Key Metrics Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-background">
              <p className="text-2xl font-bold text-emerald-600">{data.keywords.total}</p>
              <p className="text-xs text-muted-foreground">Keywords Tracked</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background">
              <p className="text-2xl font-bold text-teal-600">#{data.keywords.averageRank}</p>
              <p className="text-xs text-muted-foreground">Average Rank</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background">
              <p className="text-2xl font-bold text-cyan-600">{formatNumber(data.backlinks.total)}</p>
              <p className="text-xs text-muted-foreground">Total Backlinks</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background">
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(data.traffic.estimatedValue)}</p>
              <p className="text-xs text-muted-foreground">Traffic Value</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Position Distribution Mini */}
            {config.sections.rankings && (
              <div className="rounded-lg border bg-background p-4">
                <h4 className="text-xs font-semibold mb-2">Position Distribution</h4>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                      formatter={(value: number, name: string) => [`${value} keywords`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Keywords Mini */}
            {config.sections.rankings && (
              <div className="rounded-lg border bg-background p-4">
                <h4 className="text-xs font-semibold mb-2">Top Keywords</h4>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={topKeywordsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="keyword" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis reversed tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                      formatter={(value: number) => [`#${value}`, 'Rank']}
                    />
                    <Bar dataKey="rank" fill={CHART_COLORS.emerald} radius={[3, 3, 0, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Audit Categories Mini */}
            {config.sections.audit && data.audit && auditCategoryData.length > 0 && (
              <div className="rounded-lg border bg-background p-4">
                <h4 className="text-xs font-semibold mb-2">Audit Issues by Category</h4>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={auditCategoryData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                      formatter={(value: number) => [`${value} issues`, '']}
                    />
                    <Bar dataKey="count" fill={CHART_COLORS.teal} radius={[0, 3, 3, 0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Backlink Stats Mini */}
            {config.sections.backlinks && (
              <div className="rounded-lg border bg-background p-4">
                <h4 className="text-xs font-semibold mb-3">Backlink Profile</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Active Links</span>
                    <span className="font-semibold">{formatNumber(data.backlinks.active)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Referring Domains</span>
                    <span className="font-semibold">{formatNumber(data.backlinks.referringDomains)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Follow / Nofollow</span>
                    <span className="font-semibold">
                      {formatNumber(data.backlinks.follow)} / {formatNumber(data.backlinks.nofollow)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Avg Authority</span>
                    <span className="font-semibold">{data.backlinks.avgAuthority}/100</span>
                  </div>
                  <div className="flex gap-4 text-xs pt-1">
                    <span className="flex items-center gap-1 text-emerald-500">
                      <TrendingUp className="h-3 w-3" />+{data.backlinks.newThisMonth} new
                    </span>
                    <span className="flex items-center gap-1 text-rose-500">
                      <TrendingUp className="h-3 w-3 rotate-180" />-{data.backlinks.lostThisMonth} lost
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Insights */}
          {data.insights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                Key Insights
              </h4>
              <ul className="space-y-1.5">
                {data.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <ChevronRight className="h-3 w-3 mt-0.5 text-emerald-500 shrink-0" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {data.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Recommendations
              </h4>
              <ul className="space-y-1.5">
                {data.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 text-[9px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Report History ───────────────────────────────────────────────────
function ReportHistorySection() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-500" />
          Report History
        </CardTitle>
        <CardDescription>Previously generated reports</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Format</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {REPORT_HISTORY.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="text-xs font-medium max-w-[200px] truncate">
                    {report.name}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{report.type}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                      {report.format}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge
                      className={cn(
                        'text-[10px] px-1.5 py-0 border-0 font-medium',
                        report.status === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : report.status === 'generating'
                            ? 'bg-amber-500/15 text-amber-600'
                            : 'bg-rose-500/15 text-rose-600'
                      )}
                    >
                      {report.status === 'completed' ? 'Completed' : report.status === 'generating' ? 'Generating' : 'Failed'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="View">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Download">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Share">
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500 hover:text-rose-600" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Share Settings Dialog ────────────────────────────────────────────
function ShareSettingsDialog() {
  const [shareEnabled, setShareEnabled] = React.useState(false)
  const [passwordProtected, setPasswordProtected] = React.useState(false)
  const [expiry, setExpiry] = React.useState('7')
  const [copied, setCopied] = React.useState(false)

  const shareLink = 'https://rankpulse.io/share/rpt-a8f3c2d1e9'

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <Share2 className="h-3.5 w-3.5 mr-1" />
          Share Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Report</DialogTitle>
          <DialogDescription>Create a shareable link for this report</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Shareable Link */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Enable Share Link</Label>
            <Switch checked={shareEnabled} onCheckedChange={setShareEnabled} />
          </div>

          {shareEnabled && (
            <>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Shareable Link</Label>
                <div className="flex items-center gap-2">
                  <Input value={shareLink} readOnly className="h-9 text-xs flex-1" />
                  <Button size="sm" variant="outline" className="h-9 px-3" onClick={handleCopy}>
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              {/* Expiry */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Link Expiry</Label>
                <Select value={expiry} onValueChange={setExpiry}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">24 hours</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Password Protection */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Password Protection</Label>
                </div>
                <Switch checked={passwordProtected} onCheckedChange={setPasswordProtected} />
              </div>
              {passwordProtected && (
                <Input type="password" placeholder="Enter password" className="h-9 text-xs" />
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Report Config Type ───────────────────────────────────────────────
interface ReportConfig {
  dateRange: string
  sections: {
    rankings: boolean
    audit: boolean
    backlinks: boolean
    competitors: boolean
    traffic: boolean
  }
  format: string
  schedule: string
  emailDelivery: boolean
}

// ─── Main Reports Module ──────────────────────────────────────────────
export function ReportsModule() {
  const { data, isLoading, error } = useReportData()
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null)
  const [showPreview, setShowPreview] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [reportConfig, setReportConfig] = React.useState<ReportConfig | null>(null)

  const handleGenerate = (config: ReportConfig) => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setShowPreview(true)
      setReportConfig(config)
    }, 2000)
  }

  if (isLoading) return <ReportsSkeleton />

  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-0 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
              <AlertTriangle className="h-7 w-7 text-rose-500" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Unable to Load Reports</h3>
            <p className="text-sm text-muted-foreground">
              {error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate, schedule, and share comprehensive SEO reports
            </p>
          </div>
          <div className="flex gap-2">
            <ShareSettingsDialog />
          </div>
        </div>

        {/* 1. Report Templates */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
          <ReportTemplatesGrid
            selectedTemplate={selectedTemplate}
            onSelectTemplate={(id) => {
              setSelectedTemplate(id)
              setShowPreview(false)
            }}
          />
        </motion.div>

        {/* 2. Configuration + Preview */}
        {selectedTemplate && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-1">
              <ReportConfiguration onGenerate={handleGenerate} isGenerating={isGenerating} />
            </motion.div>
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-2">
              {showPreview && reportConfig ? (
                <ReportPreview data={data} config={reportConfig} projectName={data.project.name} />
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="pt-0 text-center py-12">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                      <FileText className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1">Report Preview</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Configure your report settings and click &quot;Generate Report&quot; to see a preview here
                    </p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        )}

        {/* 4. Report History */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
          <ReportHistorySection />
        </motion.div>
      </div>
    </div>
  )
}
