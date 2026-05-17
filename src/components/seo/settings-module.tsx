'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Lock,
  CreditCard,
  Bell,
  Plug,
  Key,
  Users,
  Shield,
  Globe,
  Target,
  Link2,
  TrendingUp,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Trash2,
  Pause,
  Edit3,
  ChevronRight,
  ExternalLink,
  Zap,
  BarChart3,
  Search,
  Palette,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────
interface Project {
  id: string
  name: string
  domain: string
  status: 'active' | 'paused'
  keywordsCount: number
  lastAudit: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  avatar?: string
  initials: string
}

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ElementType
  connected: boolean
  connectLabel: string
}

// ─── Constants ────────────────────────────────────────────────────────
const PROJECTS: Project[] = [
  { id: 'p1', name: 'TechVenture Inc.', domain: 'techventure.io', status: 'active', keywordsCount: 53, lastAudit: '2026-03-15' },
  { id: 'p2', name: 'GrowthLab.io', domain: 'growthlab.io', status: 'active', keywordsCount: 28, lastAudit: '2026-03-10' },
  { id: 'p3', name: 'DataFlow Systems', domain: 'dataflowsystems.com', status: 'paused', keywordsCount: 15, lastAudit: '2026-02-20' },
]

const TEAM_MEMBERS: TeamMember[] = [
  { id: 't1', name: 'John Doe', email: 'john@techventure.io', role: 'admin', initials: 'JD' },
  { id: 't2', name: 'Sarah Miller', email: 'sarah@techventure.io', role: 'editor', initials: 'SM' },
  { id: 't3', name: 'Alex Chen', email: 'alex@techventure.io', role: 'viewer', initials: 'AC' },
  { id: 't4', name: 'Maria Garcia', email: 'maria@techventure.io', role: 'editor', initials: 'MG' },
]

const INTEGRATIONS: Integration[] = [
  { id: 'gsc', name: 'Google Search Console', description: 'Connect your GSC account for search analytics data', icon: Search, connected: true, connectLabel: 'Connect' },
  { id: 'ga4', name: 'Google Analytics 4', description: 'Import traffic and user behavior data from GA4', icon: BarChart3, connected: false, connectLabel: 'Connect' },
  { id: 'slack', name: 'Slack', description: 'Send alerts and reports to your Slack channels', icon: Zap, connected: false, connectLabel: 'Configure' },
  { id: 'zapier', name: 'Zapier', description: 'Automate workflows with 5000+ app integrations', icon: Plug, connected: false, connectLabel: 'Enable' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' },
  }),
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-emerald-500/15 text-emerald-600',
  editor: 'bg-amber-500/15 text-amber-600',
  viewer: 'bg-slate-500/15 text-slate-600',
}

// ─── Account Settings ─────────────────────────────────────────────────
function AccountSettings() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [currentPassword, setCurrentPassword] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')

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
        {/* Profile */}
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="" alt="User" />
            <AvatarFallback className="bg-emerald-500/10 text-emerald-600 text-lg font-semibold">
              JD
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Full Name</Label>
                <Input defaultValue="John Doe" className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email</Label>
                <Input defaultValue="john@techventure.io" className="h-9 text-sm" type="email" />
              </div>
            </div>
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              Save Changes
            </Button>
          </div>
        </div>

        <Separator />

        {/* Password Change */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Change Password
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Current Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-9 text-sm pr-9"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="h-9 text-sm"
              />
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs">
            Update Password
          </Button>
        </div>

        <Separator />

        {/* Plan Info */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-semibold">Pro Plan</span>
                <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[10px] px-1.5 py-0">
                  Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">$129/month &middot; Billed monthly &middot; Next billing: Apr 1, 2026</p>
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs">
              Manage Plan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Project Management ───────────────────────────────────────────────
function ProjectManagement() {
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [newProject, setNewProject] = React.useState({ name: '', domain: '', industry: '', country: '' })

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-500" />
              Project Management
            </CardTitle>
            <CardDescription>Manage your tracked projects and websites</CardDescription>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Project</DialogTitle>
                <DialogDescription>Add a new website to track and monitor</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">Project Name</Label>
                  <Input
                    placeholder="e.g., My Website"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Domain</Label>
                  <Input
                    placeholder="e.g., example.com"
                    value={newProject.domain}
                    onChange={(e) => setNewProject({ ...newProject, domain: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Industry</Label>
                    <Select value={newProject.industry} onValueChange={(v) => setNewProject({ ...newProject, industry: v })}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tech">Technology</SelectItem>
                        <SelectItem value="saas">SaaS</SelectItem>
                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="health">Healthcare</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Target Country</Label>
                    <Select value={newProject.country} onValueChange={(v) => setNewProject({ ...newProject, country: v })}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="ca">Canada</SelectItem>
                        <SelectItem value="au">Australia</SelectItem>
                        <SelectItem value="de">Germany</SelectItem>
                        <SelectItem value="fr">France</SelectItem>
                        <SelectItem value="global">Global</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setAddDialogOpen(false)}>
                  Create Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Project</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Keywords</TableHead>
                <TableHead className="text-xs">Last Audit</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PROJECTS.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                        <Globe className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{project.name}</p>
                        <p className="text-[11px] text-muted-foreground">{project.domain}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        'text-[10px] px-1.5 py-0 border-0 font-medium',
                        project.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-amber-500/15 text-amber-600'
                      )}
                    >
                      {project.status === 'active' ? 'Active' : 'Paused'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs tabular-nums">{project.keywordsCount}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(project.lastAudit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit">
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Pause">
                        <Pause className="h-3.5 w-3.5" />
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

// ─── Notification Settings ────────────────────────────────────────────
function NotificationSettings() {
  const [alerts, setAlerts] = React.useState({
    rankingChanges: true,
    backlinks: true,
    auditIssues: true,
    trafficAnomalies: false,
    competitorChanges: false,
  })

  const [channels, setChannels] = React.useState({
    email: true,
    slack: false,
    webhook: false,
  })

  const [slackWebhook, setSlackWebhook] = React.useState('')
  const [webhookUrl, setWebhookUrl] = React.useState('')
  const [digestFrequency, setDigestFrequency] = React.useState('daily')

  const toggleAlert = (key: keyof typeof alerts) => {
    setAlerts((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleChannel = (key: keyof typeof channels) => {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const alertItems = [
    { key: 'rankingChanges' as const, label: 'Ranking Changes', description: 'When keywords move up or down significantly', icon: TrendingUp },
    { key: 'backlinks' as const, label: 'New / Lost Backlinks', description: 'When backlinks are gained or lost', icon: Link2 },
    { key: 'auditIssues' as const, label: 'Audit Issues', description: 'New technical SEO issues detected', icon: Shield },
    { key: 'trafficAnomalies' as const, label: 'Traffic Anomalies', description: 'Unusual traffic patterns or drops', icon: AlertTriangle },
    { key: 'competitorChanges' as const, label: 'Competitor Changes', description: 'Significant competitor movement', icon: Users },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-emerald-500" />
          Notification Settings
        </CardTitle>
        <CardDescription>Configure how and when you receive alerts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alert Types */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Alert Types</h4>
          {alertItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-lg border p-3 hover:border-emerald-500/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  alerts[item.key] ? 'bg-emerald-500/10' : 'bg-muted'
                )}>
                  <item.icon className={cn('h-4 w-4', alerts[item.key] ? 'text-emerald-500' : 'text-muted-foreground')} />
                </div>
                <div>
                  <p className="text-xs font-medium">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <Switch
                checked={alerts[item.key]}
                onCheckedChange={() => toggleAlert(item.key)}
              />
            </div>
          ))}
        </div>

        <Separator />

        {/* Notification Channels */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Notification Channels</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium">Email</p>
                  <p className="text-[11px] text-muted-foreground">john@techventure.io</p>
                </div>
              </div>
              <Switch checked={channels.email} onCheckedChange={() => toggleChannel('email')} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium">Slack</p>
                    <p className="text-[11px] text-muted-foreground">Send alerts to a Slack channel</p>
                  </div>
                </div>
                <Switch checked={channels.slack} onCheckedChange={() => toggleChannel('slack')} />
              </div>
              {channels.slack && (
                <div className="pl-11">
                  <Input
                    placeholder="https://hooks.slack.com/services/..."
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhook(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Plug className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium">Custom Webhook</p>
                    <p className="text-[11px] text-muted-foreground">POST alerts to your endpoint</p>
                  </div>
                </div>
                <Switch checked={channels.webhook} onCheckedChange={() => toggleChannel('webhook')} />
              </div>
              {channels.webhook && (
                <div className="pl-11">
                  <Input
                    placeholder="https://api.example.com/webhook"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Alert Digest Frequency */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Alert Digest Frequency</Label>
          <Select value={digestFrequency} onValueChange={setDigestFrequency}>
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily Digest</SelectItem>
              <SelectItem value="weekly">Weekly Digest</SelectItem>
              <SelectItem value="never">Never (Real-time only)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Integrations ─────────────────────────────────────────────────────
function IntegrationsSettings() {
  const [integrationStates, setIntegrationStates] = React.useState<Record<string, boolean>>(
    Object.fromEntries(INTEGRATIONS.map((i) => [i.id, i.connected]))
  )
  const [slackWebhook, setSlackWebhook] = React.useState('')
  const [showOAuthDialog, setShowOAuthDialog] = React.useState<string | null>(null)

  const toggleIntegration = (id: string) => {
    if (integrationStates[id]) {
      setIntegrationStates((prev) => ({ ...prev, [id]: false }))
    } else {
      setShowOAuthDialog(id)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plug className="h-4 w-4 text-emerald-500" />
            Integrations
          </CardTitle>
          <CardDescription>Connect third-party services for enhanced data and workflows</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {INTEGRATIONS.map((integration) => {
            const isConnected = integrationStates[integration.id]
            return (
              <div
                key={integration.id}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-4 transition-colors',
                  isConnected && 'border-emerald-500/30 bg-emerald-500/5'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    isConnected ? 'bg-emerald-500/10' : 'bg-muted'
                  )}>
                    <integration.icon className={cn('h-5 w-5', isConnected ? 'text-emerald-500' : 'text-muted-foreground')} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{integration.name}</p>
                      <Badge
                        className={cn(
                          'text-[9px] px-1.5 py-0 border-0 font-medium',
                          isConnected ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {isConnected ? 'Connected' : 'Not Connected'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{integration.description}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isConnected ? 'outline' : 'default'}
                  className={cn(
                    'h-8 text-xs',
                    !isConnected && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  )}
                  onClick={() => toggleIntegration(integration.id)}
                >
                  {isConnected ? 'Disconnect' : integration.connectLabel}
                </Button>
              </div>
            )
          })}

          {/* Slack webhook input if Slack is connected */}
          {integrationStates['slack'] && (
            <div className="ml-13 pl-13">
              <Label className="text-xs text-muted-foreground">Slack Webhook URL</Label>
              <Input
                placeholder="https://hooks.slack.com/services/..."
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                className="h-9 text-xs mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* OAuth Dialog Mock */}
      <Dialog open={showOAuthDialog !== null} onOpenChange={(open) => { if (!open) setShowOAuthDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-emerald-500" />
              Connect {showOAuthDialog ? INTEGRATIONS.find((i) => i.id === showOAuthDialog)?.name : ''}
            </DialogTitle>
            <DialogDescription>
              You will be redirected to authorize RankPulse access
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-lg border bg-muted/30 p-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Shield className="h-5 w-5 text-emerald-500" />
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  {showOAuthDialog && (() => {
                    const Icon = INTEGRATIONS.find((i) => i.id === showOAuthDialog)?.icon ?? Plug
                    return <Icon className="h-5 w-5 text-muted-foreground" />
                  })()}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                RankPulse will request read-only access to your account data.
                You can revoke access at any time from your account settings.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowOAuthDialog(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                if (showOAuthDialog) {
                  setIntegrationStates((prev) => ({ ...prev, [showOAuthDialog]: true }))
                }
                setShowOAuthDialog(null)
              }}
            >
              Authorize & Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── API Access ───────────────────────────────────────────────────────
function ApiAccessSettings() {
  const [showKey, setShowKey] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const apiKey = 'rp_live_sk_a8f3c2d1e9b7456a0148cf92d3e7b6a1'
  const maskedKey = 'rp_live_sk_' + '•'.repeat(28)
  const usagePercent = 67
  const requestsUsed = 3348
  const requestsLimit = 5000

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Key className="h-4 w-4 text-emerald-500" />
          API Access
        </CardTitle>
        <CardDescription>Manage your API key and monitor usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* API Key */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">API Key</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border bg-muted/30 px-3 py-2 font-mono text-xs">
              {showKey ? apiKey : maskedKey}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">API Usage This Month</span>
            <span className="font-medium">
              {requestsUsed.toLocaleString()} / {requestsLimit.toLocaleString()} requests
            </span>
          </div>
          <Progress value={usagePercent} className="h-2" />
          <p className="text-[11px] text-muted-foreground">
            {usagePercent}% of monthly limit used &middot; Resets on Apr 1, 2026
          </p>
        </div>

        {/* Regenerate Key */}
        <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-xs font-medium">Regenerate API Key</p>
              <p className="text-[11px] text-muted-foreground">This will invalidate your current key immediately</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs text-amber-600 border-amber-500/30 hover:bg-amber-500/10">
            <RefreshCw className="h-3 w-3 mr-1" />
            Regenerate
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Team Members ─────────────────────────────────────────────────────
function TeamMembersSettings() {
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [inviteEmail, setInviteEmail] = React.useState('')
  const [inviteRole, setInviteRole] = React.useState('viewer')

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" />
              Team Members
            </CardTitle>
            <CardDescription>Manage team access and permissions</CardDescription>
          </div>
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>Send an invitation to join your RankPulse team</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin — Full access to all features</SelectItem>
                      <SelectItem value="editor">Editor — Can edit projects and reports</SelectItem>
                      <SelectItem value="viewer">Viewer — Read-only access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setInviteDialogOpen(false)}>
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border p-3 hover:border-emerald-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={cn('text-[10px] px-2 py-0.5 border-0 font-medium capitalize', ROLE_COLORS[member.role])}>
                  {member.role}
                </Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-rose-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Billing ──────────────────────────────────────────────────────────
function BillingSettings() {
  const planFeatures = [
    'Up to 5 projects',
    '1,000 keywords tracked',
    'Weekly site audits',
    'Backlink monitoring',
    'Competitor tracking (5 competitors)',
    'Email & Slack alerts',
    'API access (5,000 requests/mo)',
    'PDF & Web reports',
  ]

  const usageItems = [
    { label: 'Keywords', used: 53, limit: 1000, color: 'bg-emerald-500' },
    { label: 'Crawls', used: 24, limit: 50, color: 'bg-amber-500' },
    { label: 'API Calls', used: 3348, limit: 5000, color: 'bg-cyan-500' },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-emerald-500" />
          Billing
        </CardTitle>
        <CardDescription>Manage your subscription and billing details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-emerald-500" />
              <span className="text-base font-bold">Pro Plan</span>
              <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[10px] px-1.5 py-0">Active</Badge>
            </div>
            <span className="text-lg font-bold">$129<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {planFeatures.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Usage This Month */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Usage This Month</h4>
          {usageItems.map((item) => {
            const percent = Math.round((item.used / item.limit) * 100)
            return (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">
                    {item.used.toLocaleString()} / {item.limit.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', item.color)}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <Separator />

        {/* Upgrade */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-sm font-semibold">Need more capacity?</p>
            <p className="text-xs text-muted-foreground mt-0.5">Upgrade to Enterprise for unlimited access and priority support</p>
          </div>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Upgrade Plan
          </Button>
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
            Configure your account, projects, notifications, and integrations
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="account" className="text-xs">
              <User className="h-3.5 w-3.5 mr-1.5" />
              Account
            </TabsTrigger>
            <TabsTrigger value="projects" className="text-xs">
              <Globe className="h-3.5 w-3.5 mr-1.5" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs">
              <Bell className="h-3.5 w-3.5 mr-1.5" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="integrations" className="text-xs">
              <Plug className="h-3.5 w-3.5 mr-1.5" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs">
              <Key className="h-3.5 w-3.5 mr-1.5" />
              API
            </TabsTrigger>
            <TabsTrigger value="team" className="text-xs">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Team
            </TabsTrigger>
            <TabsTrigger value="billing" className="text-xs">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <AccountSettings />
            </motion.div>
          </TabsContent>

          <TabsContent value="projects">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <ProjectManagement />
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <NotificationSettings />
            </motion.div>
          </TabsContent>

          <TabsContent value="integrations">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <IntegrationsSettings />
            </motion.div>
          </TabsContent>

          <TabsContent value="api">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <ApiAccessSettings />
            </motion.div>
          </TabsContent>

          <TabsContent value="team">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <TeamMembersSettings />
            </motion.div>
          </TabsContent>

          <TabsContent value="billing">
            <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
              <BillingSettings />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
