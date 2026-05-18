'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import {
  User,
  Globe,
  Trash2,
  Palette,
  Sun,
  Moon,
  Monitor,
  Download,
  Database,
  AlertTriangle,
  Award,
  Shield,
  Info,
  Check,
  Loader2,
  FileDown,
  FolderOpen,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSeoStore } from '@/lib/seo-store'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────
interface ProjectItem {
  id: string
  name: string
  domain: string
  isActive: boolean
  seoScore: number | null
  createdAt: string
  updatedAt: string
}

interface ProjectsResponse {
  projects: ProjectItem[]
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' as const },
  }),
}

function getScoreColor(score: number | null): string {
  if (score === null) return 'text-muted-foreground'
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-rose-600'
}

function getScoreBg(score: number | null): string {
  if (score === null) return 'bg-muted'
  if (score >= 80) return 'bg-emerald-500/10'
  if (score >= 60) return 'bg-amber-500/10'
  if (score >= 40) return 'bg-orange-500/10'
  return 'bg-rose-500/10'
}

// ─── Project Management Section ───────────────────────────────────────
function ProjectManagement() {
  const queryClient = useQueryClient()
  const { activeProjectId, resetForNewAnalysis } = useSeoStore()
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  // Fetch projects
  const { data, isLoading, error } = useQuery<ProjectsResponse>({
    queryKey: ['seo-projects'],
    queryFn: async () => {
      const res = await fetch('/api/seo/projects')
      if (!res.ok) throw new Error('Failed to fetch projects')
      return res.json()
    },
  })

  // Delete single project mutation
  const deleteMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch(`/api/seo/projects?id=${projectId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to delete project')
      }
      return res.json()
    },
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['seo-projects'] })
      // If the deleted project was the active one, reset
      if (activeProjectId === deletedId) {
        resetForNewAnalysis()
      }
      setDeletingId(null)
    },
    onError: () => {
      setDeletingId(null)
    },
  })

  // Clear all projects mutation
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      if (!data?.projects.length) return
      // Delete all projects one by one (cascade deletes everything)
      const results = await Promise.allSettled(
        data.projects.map((p) =>
          fetch(`/api/seo/projects?id=${p.id}`, { method: 'DELETE' })
            .then((res) => {
              if (!res.ok) throw new Error(`Failed to delete ${p.name}`)
              return res.json()
            })
        )
      )
      const failed = results.filter((r) => r.status === 'rejected')
      if (failed.length > 0) {
        throw new Error(`${failed.length} project(s) could not be deleted`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-projects'] })
      resetForNewAnalysis()
    },
  })

  const projects = data?.projects ?? []

  return (
    <div className="space-y-6">
      {/* Project List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-500" />
                Project Management
              </CardTitle>
              <CardDescription>
                {isLoading
                  ? 'Loading projects...'
                  : `${projects.length} project${projects.length !== 1 ? 's' : ''} tracked`}
              </CardDescription>
            </div>
            {activeProjectId && (
              <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[10px] px-2 py-0.5">
                Active: {activeProjectId}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              <span className="ml-2 text-sm text-muted-foreground">Loading projects...</span>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 text-center">
              <AlertTriangle className="h-5 w-5 text-rose-500 mx-auto mb-2" />
              <p className="text-sm text-rose-600">Failed to load projects</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-8 text-xs"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['seo-projects'] })}
              >
                Retry
              </Button>
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">No projects yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Analyze a website to create your first project
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Project</TableHead>
                    <TableHead className="text-xs">Domain</TableHead>
                    <TableHead className="text-xs">SEO Score</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Created</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg',
                            getScoreBg(project.seoScore)
                          )}>
                            <Globe className={cn('h-4 w-4', getScoreColor(project.seoScore))} />
                          </div>
                          <span className="text-xs font-medium">{project.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground font-mono">
                          {project.domain}
                        </span>
                      </TableCell>
                      <TableCell>
                        {project.seoScore !== null ? (
                          <div className="flex items-center gap-2">
                            <span className={cn('text-sm font-bold tabular-nums', getScoreColor(project.seoScore))}>
                              {project.seoScore}
                            </span>
                            <span className="text-[10px] text-muted-foreground">/100</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'text-[10px] px-1.5 py-0 border-0 font-medium',
                            project.isActive
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : 'bg-amber-500/15 text-amber-600'
                          )}
                        >
                          {project.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                                  disabled={deleteMutation.isPending && deletingId === project.id}
                                >
                                  {deleteMutation.isPending && deletingId === project.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Delete project</TooltipContent>
                          </Tooltip>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-rose-500" />
                                Delete Project
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{project.name}</strong> ({project.domain})?
                                This will permanently remove all associated keywords, audits, backlinks, competitors, and alerts.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeletingId(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-rose-600 hover:bg-rose-700 text-white"
                                onClick={() => {
                                  setDeletingId(project.id)
                                  deleteMutation.mutate(project.id)
                                }}
                              >
                                Delete Project
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-500" />
            Data Management
          </CardTitle>
          <CardDescription>Manage your data — export or clear all project data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export All Data */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <FileDown className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Export All Data</p>
                <p className="text-xs text-muted-foreground">
                  Download a full CSV report with keywords, audit issues, backlinks &amp; competitors
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              disabled={projects.length === 0}
              onClick={() => {
                window.open('/api/seo/export?format=csv&module=full', '_blank')
              }}
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>

          {/* Clear All Data */}
          <div className="flex items-center justify-between rounded-lg border border-rose-500/20 bg-rose-500/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-rose-600">Clear All Data</p>
                <p className="text-xs text-muted-foreground">
                  Delete all projects and their associated data. This cannot be undone.
                </p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10 gap-1.5"
                  disabled={projects.length === 0 || clearAllMutation.isPending}
                >
                  {clearAllMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-rose-500" />
                    Clear All Data
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete <strong>all {projects.length} project{projects.length !== 1 ? 's' : ''}</strong> and
                    all associated data including keywords, audits, backlinks, competitors, and alerts.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                    onClick={() => clearAllMutation.mutate()}
                  >
                    Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Appearance Section ────────────────────────────────────────────────
function AppearanceSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const themeOptions = [
    {
      value: 'light',
      label: 'Light',
      description: 'Clean and bright',
      icon: Sun,
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Easy on the eyes',
      icon: Moon,
    },
    {
      value: 'system',
      label: 'System',
      description: 'Match your OS',
      icon: Monitor,
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="h-4 w-4 text-emerald-500" />
          Appearance
        </CardTitle>
        <CardDescription>Customize how RankPulse looks on your screen</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Theme</Label>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const isSelected = mounted && theme === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    'relative flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:border-emerald-500/50',
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : 'border-muted'
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                  )}
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    isSelected ? 'bg-emerald-500/10' : 'bg-muted'
                  )}>
                    <option.icon className={cn(
                      'h-5 w-5',
                      isSelected ? 'text-emerald-500' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium">{option.label}</p>
                    <p className="text-[10px] text-muted-foreground">{option.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* Current Theme Info */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">
                {mounted ? (
                  <>
                    Active theme: <span className="font-medium text-foreground">{resolvedTheme}</span>
                    {theme === 'system' && (
                      <span className="text-muted-foreground"> (following your system preference)</span>
                    )}
                  </>
                ) : (
                  'Loading theme...'
                )}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── About Section ─────────────────────────────────────────────────────
function AboutSection() {
  const features = [
    'Unlimited projects & keywords',
    '13 SEO analysis modules',
    'AI-powered insights',
    'CSV & PDF report export',
    'No sign-up required',
    'No tracking, no paywalls',
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Info className="h-4 w-4 text-emerald-500" />
          About RankPulse
        </CardTitle>
        <CardDescription>Application information and license details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* App Identity */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Shield className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold">RankPulse</span>
                  <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[10px] px-1.5 py-0">
                    v1.0
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Open Source SEO Analytics Platform</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Badge className="bg-emerald-600 text-white border-0 text-[10px] px-2 py-0.5">
              MIT License
            </Badge>
            <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[10px] px-1.5 py-0">
              Open Source
            </Badge>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Features</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* License & Credits */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">License</h4>
          <div className="rounded-lg border p-3 text-xs text-muted-foreground space-y-1.5">
            <p>
              RankPulse is free and open source software released under the{' '}
              <span className="font-medium text-foreground">MIT License</span>.
            </p>
            <p>
              You are free to use, modify, and distribute this software for any purpose,
              including commercial applications, without restriction.
            </p>
          </div>
        </div>

        <Separator />

        {/* Community CTA */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold">Community Edition</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Free forever &middot; No limits &middot; Open source
            </p>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[10px] px-2 py-0.5">
            Free Forever
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Account Settings (kept from original) ────────────────────────────
function AccountSettings() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4 text-emerald-500" />
          Account Settings
        </CardTitle>
        <CardDescription>Manage your profile and security settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Summary */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <User className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">Community User</p>
            <p className="text-xs text-muted-foreground">No sign-up required — all features unlocked</p>
          </div>
        </div>

        <Separator />

        {/* Community Edition Badge */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold">Community Edition</span>
                <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[10px] px-1.5 py-0">
                  Free Forever
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                MIT License &middot; No limits, no paywalls, no tracking
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Settings Module ─────────────────────────────────────────────
export function SettingsModule() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage projects, data, appearance, and more
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="projects" className="text-xs">
              <Globe className="h-3.5 w-3.5 mr-1.5" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs">
              <Palette className="h-3.5 w-3.5 mr-1.5" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="account" className="text-xs">
              <User className="h-3.5 w-3.5 mr-1.5" />
              Account
            </TabsTrigger>
            <TabsTrigger value="about" className="text-xs">
              <Info className="h-3.5 w-3.5 mr-1.5" />
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <ProjectManagement />
            </motion.div>
          </TabsContent>

          <TabsContent value="appearance">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <AppearanceSettings />
            </motion.div>
          </TabsContent>

          <TabsContent value="account">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <AccountSettings />
            </motion.div>
          </TabsContent>

          <TabsContent value="about">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <AboutSection />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
