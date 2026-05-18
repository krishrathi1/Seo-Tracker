import { create } from 'zustand'

export type ModuleKey = 
  | 'dashboard' 
  | 'keywords' 
  | 'audit' 
  | 'backlinks' 
  | 'competitors' 
  | 'research' 
  | 'optimizer' 
  | 'alerts' 
  | 'reports' 
  | 'schema'
  | 'vitals'
  | 'action-plan'
  | 'settings'

interface SeoStore {
  activeModule: ModuleKey
  activeProjectId: string | null
  sidebarCollapsed: boolean
  analyzedUrl: string | null
  showOnboarding: boolean
  setActiveModule: (module: ModuleKey) => void
  setActiveProjectId: (id: string | null) => void
  toggleSidebar: () => void
  setAnalyzedUrl: (url: string | null) => void
  setShowOnboarding: (show: boolean) => void
  resetForNewAnalysis: () => void
}

export const useSeoStore = create<SeoStore>((set) => ({
  activeModule: 'dashboard',
  activeProjectId: null,
  sidebarCollapsed: false,
  analyzedUrl: null,
  showOnboarding: false,
  setActiveModule: (module) => set({ activeModule: module }),
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setAnalyzedUrl: (url) => set({ analyzedUrl: url }),
  setShowOnboarding: (show) => set({ showOnboarding: show }),
  resetForNewAnalysis: () => set({
    activeModule: 'dashboard',
    activeProjectId: null,
    analyzedUrl: null,
    showOnboarding: true,
  }),
}))
