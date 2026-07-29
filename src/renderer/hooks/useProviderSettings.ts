import { useState, type Dispatch, type SetStateAction } from 'react'
import { providerNames, type ToastMessage } from '../lib/appHelpers'
import type { AppSettings, LlmProviderId, ProviderConfig, ProviderId, ProviderTestResult, UsageStats } from '../../shared/types'

type ShowToast = (text: string, kind?: ToastMessage['kind']) => void

type UseProviderSettingsOptions = {
  settings: AppSettings
  setSettings: Dispatch<SetStateAction<AppSettings>>
  setUsageStats: Dispatch<SetStateAction<UsageStats>>
  showToast: ShowToast
}

export function useProviderSettings({
  settings,
  setSettings,
  setUsageStats,
  showToast
}: UseProviderSettingsOptions) {
  const [settingsStatus, setSettingsStatus] = useState('未保存')
  const [providerTests, setProviderTests] = useState<Partial<Record<ProviderId, ProviderTestResult>>>({})
  const [testingProvider, setTestingProvider] = useState<ProviderId | null>(null)

  function updateProvider(provider: ProviderId, patch: Partial<ProviderConfig>): void {
    setSettings((current) => ({
      ...current,
      providers: {
        ...current.providers,
        [provider]: {
          ...current.providers[provider],
          ...patch
        }
      }
    }))
    setSettingsStatus('有未保存修改')
  }

  function updateAnswer(patch: Partial<AppSettings['answer']>): void {
    setSettings((current) => ({
      ...current,
      answer: {
        ...current.answer,
        ...patch
      }
    }))
    setSettingsStatus('有未保存修改')
  }

  async function saveSettings(): Promise<void> {
    const saved = await window.huomiantong.saveSettings(settings)
    setSettings(saved)
    setSettingsStatus('已保存')
    showToast('设置保存成功')
  }

  async function testProvider(provider: ProviderId): Promise<void> {
    setTestingProvider(provider)

    try {
      const result = await window.huomiantong.testProvider(provider, settings.providers[provider])
      setProviderTests((current) => ({ ...current, [provider]: result }))
      showToast(result.ok ? `${providerNames[provider]} 连接成功` : result.message, result.ok ? 'success' : 'error')
    } finally {
      setTestingProvider(null)
    }
  }

  async function saveUsageBudget(provider: LlmProviderId, budgetCny: number): Promise<void> {
    const next = await window.huomiantong.setUsageMoneyBudget(provider, budgetCny)
    setUsageStats(next)
    showToast(`${providerNames[provider]} 金额预算保存成功`)
  }

  return {
    providerTests,
    saveSettings,
    saveUsageBudget,
    setProviderTests,
    setSettingsStatus,
    settingsStatus,
    testingProvider,
    testProvider,
    updateAnswer,
    updateProvider
  }
}
