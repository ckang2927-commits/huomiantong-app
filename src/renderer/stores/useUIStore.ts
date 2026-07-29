import { create } from 'zustand'
import { recordDiagnosticLog } from '../lib/diagnosticLog'
import type { ToastMessage, ViewId } from '../lib/appHelpers'

interface UIStore {
  // 导航
  activeView: ViewId
  setActiveView: (view: ViewId) => void

  // Toast（带自动消失）
  toast: ToastMessage | null
  showToast: (text: string, kind?: ToastMessage['kind']) => void
  dismissToast: () => void

  // 滚动感知（用于显示滚动条）
  isScrollActive: boolean
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  setScrollActive: (active: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  activeView: 'workspace',

  setActiveView: (view) => set({ activeView: view }),

  toast: null,

  showToast: (text, kind = 'success') => {
    if (kind === 'error') {
      recordDiagnosticLog({
        severity: 'error',
        source: '界面提示',
        message: text
      })
    }

    set({ toast: { id: Date.now(), text, kind } })
  },

  dismissToast: () => set({ toast: null }),

  isScrollActive: false,
  sidebarCollapsed: localStorage.getItem('huomiantong.sidebar.collapsed') === 'true',
  setSidebarCollapsed: (collapsed) => {
    localStorage.setItem('huomiantong.sidebar.collapsed', String(collapsed))
    set({ sidebarCollapsed: collapsed })
  },
  setScrollActive: (active) => set({ isScrollActive: active })
}))
