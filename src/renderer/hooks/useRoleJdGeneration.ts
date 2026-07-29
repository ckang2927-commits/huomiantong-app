import { useState } from 'react'
import { providerNames } from '../lib/appHelpers'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useUIStore } from '../stores/useUIStore'
import type { InterviewMode } from '../../shared/types'

export function useRoleJdGeneration() {
  const [generatingRoleJdMode, setGeneratingRoleJdMode] = useState<InterviewMode | null>(null)

  async function generateRoleJdWithAi(mode: InterviewMode): Promise<void> {
    if (generatingRoleJdMode) {
      return
    }

    setGeneratingRoleJdMode(mode)
    const settings = useSettingsStore.getState().settings

    try {
      const result = await window.huomiantong.generateRoleJd({ settings, interviewMode: mode })
      useSettingsStore.getState().updateAnswer({
        roleJdTemplates: {
          ...settings.answer.roleJdTemplates,
          [mode]: result.jd
        }
      })
      window.huomiantong.loadUsage().then((u) => useSettingsStore.getState().setUsageStats(u)).catch(() => undefined)
      useUIStore.getState().showToast(result.provider === 'local' ? '已生成本地 JD 建议，AI 深度生成未启用' : `${providerNames[result.provider]} 已生成 JD`)
    } catch (error) {
      useUIStore.getState().showToast(error instanceof Error ? error.message : 'AI 深度生成 JD 失败', 'error')
    } finally {
      setGeneratingRoleJdMode(null)
    }
  }

  return {
    generatingRoleJdMode,
    generateRoleJdWithAi
  }
}
