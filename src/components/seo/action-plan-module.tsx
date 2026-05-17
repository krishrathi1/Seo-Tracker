'use client'

import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Rocket,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Shield,
  FileText,
  Link,
  Globe,
  Type,
  Layout,
  Code2,
  BarChart3,
  Wrench,
  Users,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useSeoStore } from '@/lib/seo-store'

// ─── Types ────────────────────────────────────────────────────────────────
interface ActionItem {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  estimatedTime: string
  steps: string[]
  status: 'pending' | 'in-progress' | 'completed'
  expectedResult: string
}

interface ActionPlanData {
  project: { id: string; name: string; domain: string }
  overallScore: number
  currentGrade: string
  potentialGrade: string
  totalActions: number
  completedActions: number
  quickWins: Array<{
    id: string
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
    effort: 'low' | 'medium' | 'high'
    category: string
    estimatedTime: string
  }>
  timeline: {
    thisWeek: ActionItem[]
    thisMonth: ActionItem[]
    thisQuarter: ActionItem[]
  }
  impactMatrix: {
    quickWins: ActionItem[]
    majorProjects: ActionItem[]
    fillIns: ActionItem[]
    thankless: ActionItem[]
  }
}

// ─── Constants ────────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  critical: { label: 'Critical', color: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500', ring: 'ring-red-500', dot: 'bg-red-500' },
  high: { label: 'High', color: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500', ring: 'ring-orange-500', dot: 'bg-orange-500' },
  medium: { label: 'Medium', color: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500', ring: 'ring-amber-500', dot: 'bg-amber-500' },
  low: { label: 'Low', color: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-500', dot: 'bg-emerald-500' },
} as const

const IMPACT_CONFIG = {
  high: { label: 'High', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  medium: { label: 'Medium', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  low: { label: 'Low', className: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20' },
} as const

const EFFORT_CONFIG = {
  low: { label: 'Low', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  medium: { label: 'Medium', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  high: { label: 'High', className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
} as const

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Circle, className: 'text-slate-400' },
  'in-progress': { label: 'In Progress', icon: Clock, className: 'text-amber-500' },
  completed: { label: 'Done', icon: CheckCircle2, className: 'text-emerald-500' },
} as const

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'Technical': { label: 'Technical', icon: Shield, color: '#ef4444' },
  'Content': { label: 'Content', icon: FileText, color: '#f97316' },
  'Backlinks': { label: 'Backlinks', icon: Link, color: '#8b5cf6' },
  'On-Page': { label: 'On-Page', icon: Type, color: '#10b981' },
  'Performance': { label: 'Performance', icon: Zap, color: '#eab308' },
  'Schema': { label: 'Schema', icon: Code2, color: '#06b6d4' },
  'UX': { label: 'UX', icon: Layout, color: '#ec4899' },
  'Local SEO': { label: 'Local SEO', icon: Globe, color: '#14b8a6' },
  'Analytics': { label: 'Analytics', icon: BarChart3, color: '#6366f1' },
  'Mobile': { label: 'Mobile', icon: Wrench, color: '#f43f5e' },
  'Social': { label: 'Social', icon: Users, color: '#0ea5e9' },
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function getScoreColor(score: number): string {
  if (score < 40) return '#ef4444'
  if (score < 70) return '#f59e0b'
  return '#10b981'
}

function getGradeColor(grade: string): string {
  if (['A+', 'A', 'A-'].includes(grade)) return 'text-emerald-500'
  if (['B+', 'B', 'B-'].includes(grade)) return 'text-emerald-500'
  if (['C+', 'C', 'C-'].includes(grade)) return 'text-amber-500'
  return 'text-red-500'
}

function getCategoryIcon(category: string): React.ElementType {
  return CATEGORY_CONFIG[category]?.icon ?? Target
}

function getCategoryColor(category: string): string {
  return CATEGORY_CONFIG[category]?.color ?? '#10b981'
}

// ─── Circular Score Ring ──────────────────────────────────────────────────
function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const [animatedScore, setAnimatedScore] = React.useState(0)
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (animatedScore / 100) * circumference
  const color = getScoreColor(score)

  React.useEffect(() => {
    let frame: number
    const duration = 1200
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimatedScore(Math.round(score * eased))
      if (t < 1) frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [score])

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums" style={{ color }}>{animatedScore}</span>
        <span className="text-[10px] font-medium text-muted-foreground">/ 100</span>
      </div>
    </div>
  )
}

// ─── Priority Badge ───────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: ActionItem['priority'] }) {
  const config = PRIORITY_CONFIG[priority]
  return (
    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 gap-1', config.border, config.color)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {config.label}
    </Badge>
  )
}

// ─── Impact Badge ─────────────────────────────────────────────────────────
function ImpactBadge({ impact }: { impact: ActionItem['impact'] }) {
  const config = IMPACT_CONFIG[impact]
  return (
    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', config.className)}>
      {config.label} Impact
    </Badge>
  )
}

// ─── Category Badge ───────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: string }) {
  const config = CATEGORY_CONFIG[category]
  if (!config) return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{category}</Badge>
  const Icon = config.icon
  return (
    <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
      <Icon className="h-3 w-3" style={{ color: config.color }} />
      {config.label}
    </Badge>
  )
}

// ─── Status Toggle ────────────────────────────────────────────────────────
function StatusToggle({
  status,
  onToggle,
}: {
  status: ActionItem['status']
  onToggle: () => void
}) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon
  const nextStatus: Record<ActionItem['status'], ActionItem['status']> = {
    pending: 'in-progress',
    'in-progress': 'completed',
    completed: 'pending',
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 gap-1.5 text-xs"
      onClick={(e) => { e.stopPropagation(); onToggle() }}
    >
      <Icon className={cn('h-3.5 w-3.5', config.className)} />
      <span className={config.className}>{config.label}</span>
    </Button>
  )
}

// ─── Action Timeline Item ─────────────────────────────────────────────────
function ActionTimelineItem({
  item,
  statusOverride,
  onStatusChange,
  isLast,
}: {
  item: ActionItem
  statusOverride: ActionItem['status']
  onStatusChange: (status: ActionItem['status']) => void
  isLast: boolean
}) {
  const [expanded, setExpanded] = React.useState(false)
  const priorityConfig = PRIORITY_CONFIG[item.priority]
  const catIcon = getCategoryIcon(item.category)
  const catColor = getCategoryColor(item.category)
  const isCompleted = statusOverride === 'completed'
  const isInProgress = statusOverride === 'in-progress'

  return (
    <motion.div {...fadeUp} className="relative flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          isCompleted ? 'border-emerald-500 bg-emerald-500' : isInProgress ? 'border-amber-500 bg-amber-500/10' : 'border-muted-foreground/30 bg-background',
          priorityConfig.ring
        )}>
          {isCompleted ? (
            <CheckCircle2 className="h-4 w-4 text-white" />
          ) : isInProgress ? (
            <Clock className="h-4 w-4 text-amber-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground/40" />
          )}
        </div>
        {!isLast && (
          <div className={cn(
            'w-0.5 flex-1 min-h-[40px]',
            isCompleted ? 'bg-emerald-500/30' : 'bg-border'
          )} />
        )}
      </div>

      {/* Content */}
      <div className={cn(
        'flex-1 rounded-lg border p-4 transition-all mb-3',
        isCompleted && 'opacity-60 bg-muted/30',
        isInProgress && 'border-amber-500/30 bg-amber-500/5',
        !isCompleted && !isInProgress && 'hover:border-emerald-500/30'
      )}>
        <div
          className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={item.priority} />
              <CategoryBadge category={item.category} />
              <ImpactBadge impact={item.impact} />
            </div>
            <h4 className={cn(
              'text-sm font-semibold leading-snug',
              isCompleted && 'line-through text-muted-foreground'
            )}>
              {item.title}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {item.estimatedTime}
            </div>
            <StatusToggle status={statusOverride} onToggle={() => onStatusChange(statusOverride)} />
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Expanded Steps */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 space-y-3"
          >
            <Separator />
            <div>
              <h5 className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3 text-emerald-500" />
                Step-by-Step Instructions
              </h5>
              <ol className="space-y-2">
                {item.steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3">
              <Lightbulb className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Expected Result
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">{item.expectedResult}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn('flex items-center gap-1', EFFORT_CONFIG[item.effort].className)}>
                <Zap className="h-3 w-3" />
                {EFFORT_CONFIG[item.effort].label} effort
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <catIcon className="h-3 w-3" style={{ color: catColor }} />
                {item.category}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Impact vs Effort Matrix ──────────────────────────────────────────────
function ImpactEffortMatrix({ matrix }: { matrix: ActionPlanData['impactMatrix'] }) {
  const quadrants = [
    {
      key: 'quickWins' as const,
      title: 'Quick Wins',
      subtitle: 'High Impact · Low Effort',
      items: matrix.quickWins,
      icon: Zap,
      color: 'emerald',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/5',
      headerBg: 'bg-emerald-500/10',
      headerText: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      key: 'majorProjects' as const,
      title: 'Major Projects',
      subtitle: 'High Impact · High Effort',
      items: matrix.majorProjects,
      icon: Rocket,
      color: 'orange',
      border: 'border-orange-500/20',
      bg: 'bg-orange-500/5',
      headerBg: 'bg-orange-500/10',
      headerText: 'text-orange-600 dark:text-orange-400',
    },
    {
      key: 'fillIns' as const,
      title: 'Fill-Ins',
      subtitle: 'Low Impact · Low Effort',
      items: matrix.fillIns,
      icon: Clock,
      color: 'sky',
      border: 'border-sky-500/20',
      bg: 'bg-sky-500/5',
      headerBg: 'bg-sky-500/10',
      headerText: 'text-sky-600 dark:text-sky-400',
    },
    {
      key: 'thankless' as const,
      title: 'Thankless Tasks',
      subtitle: 'Low Impact · High Effort',
      items: matrix.thankless,
      icon: AlertTriangle,
      color: 'slate',
      border: 'border-slate-500/20',
      bg: 'bg-slate-500/5',
      headerBg: 'bg-slate-500/10',
      headerText: 'text-slate-500 dark:text-slate-400',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-4 w-4 text-emerald-500" />
          Impact vs Effort Matrix
        </CardTitle>
        <CardDescription>Prioritize actions by their expected impact and required effort</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Axis labels */}
        <div className="flex items-end gap-1 mb-2 pl-2">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider rotate-0">
            EFFORT →
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 relative">
          {/* Y-axis label */}
          <div className="absolute -left-1 top-1/2 -translate-y-1/2 -translate-x-full origin-center -rotate-90">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">
              IMPACT →
            </span>
          </div>
          {quadrants.map((q) => {
            const Icon = q.icon
            return (
              <motion.div
                key={q.key}
                {...fadeUp}
                className={cn('rounded-lg border p-3', q.border, q.bg)}
              >
                <div className={cn('flex items-center gap-2 rounded-md px-2 py-1.5 mb-2', q.headerBg)}>
                  <Icon className={cn('h-4 w-4', q.headerText)} />
                  <div>
                    <h4 className={cn('text-xs font-bold', q.headerText)}>{q.title}</h4>
                    <p className="text-[10px] text-muted-foreground">{q.subtitle}</p>
                  </div>
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                    {q.items.length}
                  </Badge>
                </div>
                <ScrollArea className="max-h-[160px]">
                  <div className="space-y-1.5">
                    {q.items.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground text-center py-3">No items</p>
                    ) : (
                      q.items.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2 rounded border border-border/50 bg-background/50 p-2 hover:bg-background transition-colors"
                        >
                          <span className={cn(
                            'mt-0.5 h-2 w-2 shrink-0 rounded-full',
                            PRIORITY_CONFIG[item.priority].dot
                          )} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-medium leading-tight truncate">{item.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] text-muted-foreground">{item.estimatedTime}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {q.items.length > 5 && (
                      <p className="text-[10px] text-muted-foreground text-center">
                        +{q.items.length - 5} more
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Quick Wins Section ───────────────────────────────────────────────────
function QuickWinsSection({ items }: { items: ActionPlanData['quickWins'] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Quick Wins
        </CardTitle>
        <CardDescription>Easy actions that deliver high-impact results — start here!</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-start gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                  <Zap className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold leading-snug">{item.title}</h4>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                      {item.estimatedTime}
                    </Badge>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0">
                      {item.category}
                    </Badge>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No quick wins identified right now.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Priority Summary ─────────────────────────────────────────────────────
function PrioritySummary({
  timeline,
  statusOverrides,
  onStatusChange,
}: {
  timeline: ActionPlanData['timeline']
  statusOverrides: Record<string, ActionItem['status']>
  onStatusChange: (id: string, status: ActionItem['status']) => void
}) {
  const periods = [
    { key: 'thisWeek' as const, label: 'This Week', icon: Clock, color: 'emerald', items: timeline.thisWeek },
    { key: 'thisMonth' as const, label: 'This Month', icon: TrendingUp, color: 'amber', items: timeline.thisMonth },
    { key: 'thisQuarter' as const, label: 'This Quarter', icon: Rocket, color: 'orange', items: timeline.thisQuarter },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-500" />
          Priority Summary
        </CardTitle>
        <CardDescription>Your SEO improvement roadmap broken down by time horizon</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="thisWeek">
          <TabsList className="w-full grid grid-cols-3 mb-4">
            {periods.map((p) => {
              const completedCount = p.items.filter(
                (item) => (statusOverrides[item.id] ?? item.status) === 'completed'
              ).length
              return (
                <TabsTrigger key={p.key} value={p.key} className="text-xs gap-1.5">
                  {p.label}
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-1">
                    {completedCount}/{p.items.length}
                  </Badge>
                </TabsTrigger>
              )
            })}
          </TabsList>
          {periods.map((p) => (
            <TabsContent key={p.key} value={p.key} className="mt-0">
              <ScrollArea className="max-h-[320px]">
                <div className="space-y-2">
                  {p.items.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-6 w-6 mb-2 opacity-40" />
                      <p className="text-xs">No actions scheduled for this period.</p>
                    </div>
                  ) : (
                    p.items.map((item) => {
                      const status = statusOverrides[item.id] ?? item.status
                      const isCompleted = status === 'completed'
                      const catIcon = getCategoryIcon(item.category)
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                            isCompleted && 'opacity-50 bg-muted/30',
                            !isCompleted && 'hover:border-emerald-500/20'
                          )}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              'h-6 w-6 shrink-0 rounded-full border-2',
                              isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-muted-foreground/30'
                            )}
                            onClick={() => onStatusChange(item.id, status)}
                          >
                            {isCompleted && <CheckCircle2 className="h-3.5 w-3.5" />}
                          </Button>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-xs font-medium', isCompleted && 'line-through')}>
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <PriorityBadge priority={item.priority} />
                              <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                                <catIcon className="h-2.5 w-2.5" />
                                {item.category}
                              </span>
                              <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {item.estimatedTime}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                        </div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

// ─── Fetch Hook ───────────────────────────────────────────────────────────
function useActionPlan(projectId: string) {
  return useQuery<ActionPlanData>({
    queryKey: ['action-plan', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/seo/action-plan?projectId=${projectId}`)
      if (!res.ok) throw new Error('Failed to fetch action plan')
      return res.json()
    },
    refetchOnWindowFocus: false,
  })
}

// ─── Main Component ───────────────────────────────────────────────────────
export function ActionPlanModule() {
  const activeProjectId = useSeoStore((s) => s.activeProjectId)
  const queryClient = useQueryClient()
  const projectId = activeProjectId ?? 'first'

  const { data, isLoading, error, refetch, isFetching } = useActionPlan(projectId)
  const [statusOverrides, setStatusOverrides] = React.useState<Record<string, ActionItem['status']>>({})
  const [isRegenerating, setIsRegenerating] = React.useState(false)

  const handleStatusChange = (id: string, currentStatus: ActionItem['status']) => {
    const nextMap: Record<ActionItem['status'], ActionItem['status']> = {
      pending: 'in-progress',
      'in-progress': 'completed',
      completed: 'pending',
    }
    setStatusOverrides((prev) => ({ ...prev, [id]: nextMap[currentStatus] ?? 'pending' }))
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    await queryClient.invalidateQueries({ queryKey: ['action-plan', projectId] })
    setTimeout(() => setIsRegenerating(false), 1500)
  }

  // Compute completed count including overrides
  const getEffectiveStatus = (item: ActionItem): ActionItem['status'] =>
    statusOverrides[item.id] ?? item.status

  const allActions = React.useMemo(() => {
    if (!data) return []
    return [
      ...data.timeline.thisWeek,
      ...data.timeline.thisMonth,
      ...data.timeline.thisQuarter,
    ]
  }, [data])

  const completedCount = allActions.filter((a) => getEffectiveStatus(a) === 'completed').length
  const inProgressCount = allActions.filter((a) => getEffectiveStatus(a) === 'in-progress').length
  const progressPercent = allActions.length > 0 ? Math.round((completedCount / allActions.length) * 100) : 0

  // ─── Loading State ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="text-sm text-muted-foreground">Generating your AI action plan...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-muted-foreground">Failed to load action plan. Please try again.</p>
          <Button variant="outline" onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">

        {/* ── 1. Score Hero & Progress ──────────────────────────────── */}
        <motion.div {...fadeUp}>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                {/* Score Ring */}
                <div className="flex flex-col items-center gap-2">
                  <ScoreRing score={data.overallScore} size={140} />
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-bold', getGradeColor(data.currentGrade))}>
                      Grade {data.currentGrade}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-bold text-emerald-500">
                      {data.potentialGrade}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Potential grade after all actions</span>
                </div>

                {/* Stats Grid */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 w-full">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Rocket className="h-4 w-4" />
                      <span className="text-xs font-medium">Total Actions</span>
                    </div>
                    <span className="text-2xl font-bold tabular-nums">{data.totalActions}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Completed</span>
                    </div>
                    <span className="text-2xl font-bold tabular-nums text-emerald-500">{completedCount}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium">In Progress</span>
                    </div>
                    <span className="text-2xl font-bold tabular-nums text-amber-500">{inProgressCount}</span>
                  </div>
                  <div className="col-span-2 md:col-span-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Overall Progress</span>
                      <span className="text-xs font-bold text-emerald-500 tabular-nums">{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2.5" />
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span>{completedCount} of {allActions.length || data.totalActions} actions completed</span>
                      <span>·</span>
                      <span>{data.project.name} ({data.project.domain})</span>
                    </div>
                  </div>
                </div>

                {/* Regenerate Button */}
                <div className="shrink-0">
                  <Button
                    onClick={handleRegenerate}
                    disabled={isFetching || isRegenerating}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    {(isFetching || isRegenerating) ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Regenerate Plan
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 2. Quick Wins ──────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
          <QuickWinsSection items={data.quickWins} />
        </motion.div>

        {/* ── 3. Impact vs Effort Matrix ─────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
          <ImpactEffortMatrix matrix={data.impactMatrix} />
        </motion.div>

        {/* ── 4. Timeline / Roadmap ──────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Rocket className="h-4 w-4 text-emerald-500" />
                Action Roadmap
              </CardTitle>
              <CardDescription>
                Step-by-step SEO improvement plan ordered by priority — click to expand instructions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-0">
                  {allActions.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mb-2 opacity-40" />
                      <p className="text-sm">No action items yet. Generate a plan to get started.</p>
                    </div>
                  ) : (
                    allActions
                      .sort((a, b) => {
                        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
                        return priorityOrder[a.priority] - priorityOrder[b.priority]
                      })
                      .map((item, i) => (
                        <ActionTimelineItem
                          key={item.id}
                          item={item}
                          statusOverride={getEffectiveStatus(item)}
                          onStatusChange={(currentStatus) => handleStatusChange(item.id, currentStatus)}
                          isLast={i === allActions.length - 1}
                        />
                      ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── 5. Priority Summary ────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
          <PrioritySummary
            timeline={data.timeline}
            statusOverrides={statusOverrides}
            onStatusChange={handleStatusChange}
          />
        </motion.div>

        {/* ── 6. Footer CTA ──────────────────────────────────────────── */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }}>
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Need a fresh perspective?</h3>
                  <p className="text-xs text-muted-foreground">
                    Regenerate your AI action plan with the latest data and new recommendations.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleRegenerate}
                disabled={isFetching || isRegenerating}
                variant="outline"
                className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-2 shrink-0"
              >
                {(isFetching || isRegenerating) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Regenerate Plan
              </Button>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  )
}
