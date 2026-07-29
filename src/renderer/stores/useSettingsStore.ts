import { create } from 'zustand'
import { initialSettings, providerNames } from '../lib/appHelpers'
import { recordDiagnosticLog } from '../lib/diagnosticLog'
import type {
  AppSettings,
  LlmProviderId,
  ProviderConfig,
  ProviderId,
  ProviderTestResult,
  SpeechProviderId,
  UsageStats
} from '../../shared/types'

interface SettingsStore {
  // 核心数据
  settings: AppSettings
  usageStats: UsageStats
  settingsStatus: string
  providerTests: Partial<Record<ProviderId, ProviderTestResult>>
  testingProvider: ProviderId | null

  // 初始化
  loadAll: () => Promise<void>

  // Settings 操作
  setSettings: (settings: AppSettings) => void
  setSettingsStatus: (status: string) => void
  updateProvider: (provider: ProviderId, patch: Partial<ProviderConfig>) => void
  updateSpeech: (patch: Partial<AppSettings['speech']>) => void
  updateSpeechProvider: (provider: SpeechProviderId, patch: Partial<ProviderConfig>) => void
  updateAnswer: (patch: Partial<AppSettings['answer']>) => void
  saveSettings: () => Promise<void>

  // Provider 测试
  testProvider: (provider: ProviderId) => Promise<void>
  setProviderTests: (tests: Partial<Record<ProviderId, ProviderTestResult>>) => void

  // 用量
  setUsageStats: (stats: UsageStats) => void
  saveUsageBudget: (provider: LlmProviderId, budgetCny: number) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: initialSettings,
  usageStats: {},
  settingsStatus: '未保存',
  providerTests: {},
  testingProvider: null,

  loadAll: async () => {
    try {
      const loaded = await window.huomiantong.loadSettings()
      set({ settings: loaded })
    } catch {
      set({ settings: initialSettings })
    }
    try {
      const usage = await window.huomiantong.loadUsage()
      set({ usageStats: usage })
    } catch {
      set({ usageStats: {} })
    }
  },

  setSettings: (settings) => set({ settings }),

  setSettingsStatus: (status) => set({ settingsStatus: status }),

  updateProvider: (provider, patch) => {
    set((state) => ({
      settings: {
        ...state.settings,
        providers: {
          ...state.settings.providers,
          [provider]: {
            ...state.settings.providers[provider],
            ...patch
          }
        }
      },
      settingsStatus: '有未保存修改'
    }))
  },

  updateSpeech: (patch) => {
    set((state) => ({
      settings: {
        ...state.settings,
        speech: {
          ...state.settings.speech,
          ...patch
        }
      },
      settingsStatus: '有未保存修改'
    }))
  },

  updateSpeechProvider: (provider, patch) => {
    set((state) => ({
      settings: {
        ...state.settings,
        speech: {
          ...state.settings.speech,
          providers: {
            ...state.settings.speech.providers,
            [provider]: {
              ...state.settings.speech.providers[provider],
              ...patch
            }
          }
        }
      },
      settingsStatus: '有未保存修改'
    }))
  },

  updateAnswer: (patch) => {
    set((state) => ({
      settings: {
        ...state.settings,
        answer: {
          ...state.settings.answer,
          ...patch
        }
      },
      settingsStatus: '有未保存修改'
    }))
  },

  saveSettings: async () => {
    const { settings } = get()
    const saved = await window.huomiantong.saveSettings(settings)
    set({ settings: saved, settingsStatus: '已保存' })
  },

  testProvider: async (provider) => {
    set({ testingProvider: provider })
    try {
      const result = await window.huomiantong.testProvider(provider, get().settings.providers[provider])
      set((state) => ({
        providerTests: { ...state.providerTests, [provider]: result }
      }))

      recordDiagnosticLog({
        severity: result.ok ? 'success' : 'error',
        category: provider === 'deepgram' ? 'speech' : 'api',
        source: providerNames[provider],
        title: result.ok ? '服务商连接测试成功' : '服务商连接测试失败',
        message: result.ok ? `${providerNames[provider]} 连接成功，耗时 ${result.latencyMs}ms。` : `${result.status || '失败'}：${result.message}`,
        details: `latency=${result.latencyMs}ms`
      })
    } catch (error) {
      recordDiagnosticLog({
        severity: 'error',
        category: provider === 'deepgram' ? 'speech' : 'api',
        source: providerNames[provider],
        title: '服务商连接测试异常',
        message: error instanceof Error ? error.message : '测试连接失败'
      })
      throw error
    } finally {
      set({ testingProvider: null })
    }
  },

  setProviderTests: (tests) => set({ providerTests: tests }),

  setUsageStats: (stats) => set({ usageStats: stats }),

  saveUsageBudget: async (provider, budgetCny) => {
    const next = await window.huomiantong.setUsageMoneyBudget(provider, budgetCny)
    set({ usageStats: next })
  }
}))
