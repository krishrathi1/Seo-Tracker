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
  | 'settings'

interface SeoStore {
  activeModule: ModuleKey
  activeProjectId: string | null
  sidebarCollapsed: boolean
  setActiveModule: (module: ModuleKey) => void
  setActiveProjectId: (id: string | null) => void
  toggleSidebar: () => void
}

export const useSeoStore = create<SeoStore>((set) => ({
  activeModule: 'dashboard',
  activeProjectId: null,
  sidebarCollapsed: false,
  setActiveModule: (module) => set({ activeModule: module }),
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
