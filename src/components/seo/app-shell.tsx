"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import {
  LayoutDashboard,
  Target,
  ShieldCheck,
  Link,
  Users,
  Search,
  FileText,
  Bell,
  BarChart3,
  Settings,
  Sun,
  Moon,
  Activity,
  LogOut,
  User,
  Keyboard,
  Plus,
  Code2,
  Zap,
  Rocket,
  Trash2,
  Check,
  ChevronDown,
  PanelLeft,
} from "lucide-react"

import { useSeoStore, type ModuleKey } from "@/lib/seo-store"
import { KeywordTrackingModule } from "@/components/seo/keyword-tracking-module"
import { SiteAuditModule } from "@/components/seo/site-audit-module"
import { CompetitorsModule } from "@/components/seo/competitors-module"
import { BacklinksModule } from "@/components/seo/backlinks-module"
import { ContentOptimizerModule } from "@/components/seo/content-optimizer-module"
import { AlertsModule } from "@/components/seo/alerts-module"
import { KeywordResearchModule } from "@/components/seo/keyword-research-module"
import { ReportsModule } from "@/components/seo/reports-module"
import { SettingsModule } from "@/components/seo/settings-module"
import { SchemaAnalyzerModule } from "@/components/seo/schema-analyzer-module"
import { CoreWebVitalsModule } from "@/components/seo/core-web-vitals-module"
import { ActionPlanModule } from "@/components/seo/action-plan-module"
import { AiChatAssistant } from "@/components/seo/ai-chat-assistant"
import { cn } from "@/lib/utils"
import { DashboardModule } from "@/components/seo/dashboard-module"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

// ─── Nav Item Definition ────────────────────────────────────────────
interface NavItem {
  key: ModuleKey
  label: string
  icon: React.ElementType
  group: "main" | "tools" | "system"
}

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { key: "keywords", label: "Keyword Tracking", icon: Target, group: "main" },
  { key: "audit", label: "Site Audit", icon: ShieldCheck, group: "main" },
  { key: "backlinks", label: "Backlinks", icon: Link, group: "main" },
  { key: "competitors", label: "Competitors", icon: Users, group: "main" },
  { key: "schema", label: "Schema Analyzer", icon: Code2, group: "tools" },
  { key: "vitals", label: "Core Web Vitals", icon: Zap, group: "tools" },
  { key: "research", label: "Keyword Research", icon: Search, group: "tools" },
  { key: "optimizer", label: "Content Optimizer", icon: FileText, group: "tools" },
  { key: "action-plan", label: "AI Action Plan", icon: Rocket, group: "tools" },
  { key: "alerts", label: "Alerts", icon: Bell, group: "tools" },
  { key: "reports", label: "Reports", icon: BarChart3, group: "tools" },
  { key: "settings", label: "Settings", icon: Settings, group: "system" },
]

const mainNav = navItems.filter((i) => i.group === "main")
const toolsNav = navItems.filter((i) => i.group === "tools")
const systemNav = navItems.filter((i) => i.group === "system")

// ─── Module Placeholder Components ──────────────────────────────────
const modulePlaceholders: Record<ModuleKey, { title: string; description: string }> = {
  dashboard: {
    title: "Dashboard",
    description: "Overview of your SEO performance, key metrics, and recent changes.",
  },
  keywords: {
    title: "Keyword Tracking",
    description: "Monitor your keyword rankings across search engines and track position changes.",
  },
  audit: {
    title: "Site Audit",
    description: "Analyze your site for technical SEO issues, performance, and accessibility.",
  },
  backlinks: {
    title: "Backlinks",
    description: "Track your backlink profile, discover new links, and monitor lost links.",
  },
  competitors: {
    title: "Competitors",
    description: "Analyze competitor strategies, compare domain authority, and identify opportunities.",
  },
  research: {
    title: "Keyword Research",
    description: "Discover new keyword opportunities, analyze search volume, and assess difficulty.",
  },
  optimizer: {
    title: "Content Optimizer",
    description: "Optimize your content for target keywords with AI-powered recommendations.",
  },
  alerts: {
    title: "Alerts",
    description: "Stay informed about critical SEO events, ranking changes, and site issues.",
  },
  reports: {
    title: "Reports",
    description: "Generate and schedule comprehensive SEO reports for stakeholders.",
  },
  schema: {
    title: "Schema Analyzer",
    description: "Analyze structured data markup, validate JSON-LD, and improve rich results.",
  },
  vitals: {
    title: "Core Web Vitals",
    description: "Monitor page performance metrics, LCP, FID, CLS, and loading behavior.",
  },
  "action-plan": {
    title: "AI Action Plan",
    description: "Get a personalized step-by-step SEO improvement plan powered by AI.",
  },
  settings: {
    title: "Settings",
    description: "Configure your account, projects, notifications, and integrations.",
  },
}

function ModuleContent({ moduleKey }: { moduleKey: ModuleKey }) {
  // Render real dashboard module
  if (moduleKey === 'dashboard') {
    return <DashboardModule />
  }

  // Render keyword tracking module
  if (moduleKey === 'keywords') {
    return <KeywordTrackingModule />
  }

  // Render backlinks module
  if (moduleKey === 'backlinks') {
    return <BacklinksModule />
  }

  // Render site audit module
  if (moduleKey === 'audit') {
    return <SiteAuditModule />
  }

  // Render competitors module
  if (moduleKey === 'competitors') {
    return <CompetitorsModule />
  }

  // Render alerts module
  if (moduleKey === 'alerts') {
    return <AlertsModule />
  }

  // Render keyword research module
  if (moduleKey === 'research') {
    return <KeywordResearchModule />
  }

  // Render content optimizer module
  if (moduleKey === 'optimizer') {
    return <ContentOptimizerModule />
  }

  // Render reports module
  if (moduleKey === 'reports') {
    return <ReportsModule />
  }

  // Render schema analyzer module
  if (moduleKey === 'schema') {
    return <SchemaAnalyzerModule />
  }

  // Render core web vitals module
  if (moduleKey === 'vitals') {
    return <CoreWebVitalsModule />
  }

  // Render AI action plan module
  if (moduleKey === 'action-plan') {
    return <ActionPlanModule />
  }

  // Render settings module
  if (moduleKey === 'settings') {
    return <SettingsModule />
  }

  const mod = modulePlaceholders[moduleKey]
  const Icon = navItems.find((i) => i.key === moduleKey)?.icon ?? LayoutDashboard

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">{mod.title}</h2>
        <p className="text-muted-foreground leading-relaxed">{mod.description}</p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm text-muted-foreground">
          <Activity className="h-3.5 w-3.5" />
          Module coming soon
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar Logo ─────────────────────────────────────────────────────
function SidebarLogo() {
  const { state } = useSidebar()
  const [isHovered, setIsHovered] = React.useState(false)

  const isCollapsed = state === "collapsed"

  return (
    <div
      className="relative flex items-center justify-between px-2 py-1 h-9 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Expanded State: Full logo text on left, toggle trigger fades in on right upon hover */}
      {!isCollapsed && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
              <Activity className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
                RankPulse
              </span>
              <span className="text-[10px] text-sidebar-foreground/50 font-medium uppercase tracking-widest">
                SEO Tracker
              </span>
            </div>
          </div>
          <div className={cn("transition-all duration-200", isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1 pointer-events-none")}>
            <SidebarTrigger className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent" />
          </div>
        </>
      )}

      {/* 2. Collapsed State: Logo icon centered by default, crossfades to toggle trigger on hover */}
      {isCollapsed && (
        <div className="relative flex items-center justify-center w-8 h-8 mx-auto">
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all duration-200 ease-in-out",
              isHovered ? "opacity-0 scale-75 pointer-events-none" : "opacity-100 scale-100"
            )}
          >
            <Activity className="h-4.5 w-4.5" />
          </div>
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center transition-all duration-200 ease-in-out",
              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
            )}
          >
            <SidebarTrigger className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent" />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Nav Section ────────────────────────────────────────────────────
function NavSection({ items }: { items: NavItem[] }) {
  const activeModule = useSeoStore((s) => s.activeModule)
  const setActiveModule = useSeoStore((s) => s.setActiveModule)

  return (
    <>
      {items.map((item) => {
        const isActive = activeModule === item.key
        return (
          <SidebarMenuItem key={item.key}>
            <SidebarMenuButton
              isActive={isActive}
              onClick={() => setActiveModule(item.key)}
              tooltip={item.label}
              className={cn(
                "transition-all duration-150",
                isActive && "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary"
              )}
            >
              <item.icon className={cn(isActive && "text-primary")} />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </>
  )
}



// ─── Header Component ───────────────────────────────────────────────
function AppHeader() {
  const { theme, setTheme } = useTheme()
  const [commandOpen, setCommandOpen] = React.useState(false)
  const activeModule = useSeoStore((s) => s.activeModule)
  const setActiveModule = useSeoStore((s) => s.setActiveModule)
  const activeProjectId = useSeoStore((s) => s.activeProjectId)
  const resetForNewAnalysis = useSeoStore((s) => s.resetForNewAnalysis)
  const [projects, setProjects] = React.useState<Array<{ id: string; name: string; domain: string }>>([])

  React.useEffect(() => {
    fetch('/api/seo/projects')
      .then(res => res.ok ? res.json() : { projects: [] })
      .then(data => setProjects(data.projects || []))
      .catch(() => {})
  }, [])
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const currentModule = modulePlaceholders[activeModule]

  return (
    <>
      <header className="flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
        {/* Breadcrumb area */}
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger className="-ml-1 group-data-[collapsible=icon]:hidden md:hidden" />
          <h1 className="text-sm font-semibold truncate">{currentModule.title}</h1>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Project Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden sm:flex h-8 gap-1.5 text-xs font-semibold border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
              <span className="truncate max-w-[120px]">
                {projects.find(p => p.id === activeProjectId)?.name || "Select project"}
              </span>
              <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[260px]">
            <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Switch Site / Project
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {projects.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">No projects found.</div>
            ) : (
              projects.map((p) => {
                const isActive = p.id === activeProjectId
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-center justify-between gap-2 px-2 py-1.5 text-xs rounded-md cursor-pointer transition-colors group/item",
                      isActive ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-semibold" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300"
                    )}
                    onClick={() => useSeoStore.getState().setActiveProjectId(p.id)}
                  >
                    <span className="truncate flex-1 pr-2">{p.name || p.domain}</span>
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 text-muted-foreground/40 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150"
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete the site "${p.name || p.domain}"? This will permanently delete all ranking history, backlink profiles, site audit details, and alerts.`)) {
                            try {
                              const res = await fetch(`/api/seo/projects?id=${p.id}`, { method: 'DELETE' })
                              if (res.ok) {
                                // Remove project from state
                                setProjects(prev => prev.filter(proj => proj.id !== p.id))
                                // If the active project is deleted, select another one or reset
                                if (activeProjectId === p.id) {
                                  const remaining = projects.filter(proj => proj.id !== p.id)
                                  if (remaining.length > 0) {
                                    useSeoStore.getState().setActiveProjectId(remaining[0].id)
                                  } else {
                                    useSeoStore.getState().resetForNewAnalysis()
                                  }
                                }
                              } else {
                                alert("Failed to delete project. Please try again.")
                              }
                            } catch (err) {
                              console.error(err)
                              alert("An error occurred while deleting the project.")
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      {isActive && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                    </div>
                  </div>
                )
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* New Analysis Button */}
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex h-8 gap-1.5 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          onClick={resetForNewAnalysis}
        >
          <Plus className="h-3.5 w-3.5" />
          New Analysis
        </Button>

        {/* Command Palette Trigger */}
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex h-8 w-56 justify-start gap-2 text-muted-foreground text-xs"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Mobile search */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  JD
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">John Doe</p>
                <p className="text-xs leading-none text-muted-foreground">
                  user@rankpulse.io
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Keyboard className="mr-2 h-4 w-4" />
                Keyboard shortcuts
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Command Palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {navItems.map((item) => (
              <CommandItem
                key={item.key}
                onSelect={() => {
                  setActiveModule(item.key)
                  setCommandOpen(false)
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem>
              <Search className="mr-2 h-4 w-4" />
              <span>Run keyword research</span>
            </CommandItem>
            <CommandItem>
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Start site audit</span>
            </CommandItem>
            <CommandItem>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Generate report</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

// ─── Main App Shell ─────────────────────────────────────────────────
export function AppShell() {
  const activeModule = useSeoStore((s) => s.activeModule)

  return (
    <SidebarProvider>
      {/* Sidebar */}
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="pb-2">
          <SidebarLogo />
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent className="custom-scrollbar">
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel>Analytics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavSection items={mainNav} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Tools */}
          <SidebarGroup>
            <SidebarGroupLabel>Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavSection items={toolsNav} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* System */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <NavSection items={systemNav} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarSeparator />
          <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
                RP
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-xs font-medium text-sidebar-foreground">RankPulse</span>
              <span className="text-[10px] text-sidebar-foreground/50">Community Edition</span>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* Main content area */}
      <SidebarInset>
        <AppHeader />
        <ModuleContent moduleKey={activeModule} />
      </SidebarInset>

      {/* Floating AI Chat Assistant */}
      <AiChatAssistant />
    </SidebarProvider>
  )
}
