import { useMemo, useState } from 'react'
import { providerNames, resumeLabel, type HealthCheckItem } from '../lib/appHelpers'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useUIStore } from '../stores/useUIStore'

export function useHealthCheck() {
  const [healthChecks, setHealthChecks] = useState<HealthCheckItem[]>([])
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false)

  const healthSummary = useMemo(() => {
    const fail = healthChecks.filter((item) => item.status === 'fail').length
    const warn = healthChecks.filter((item) => item.status === 'warn').length
    const pass = healthChecks.filter((item) => item.status === 'pass').length
    const total = healthChecks.length || 1
    return { fail, warn, pass, score: Math.round((pass / total) * 100) }
  }, [healthChecks])

  function updateHealthCheck(id: string, patch: Partial<HealthCheckItem>): void {
    setHealthChecks((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function getWarmupStatus(): { hasCache: boolean; count: number } {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('huomiantong.warmup'))
      if (keys.length === 0) return { hasCache: false, count: 0 }
      const latest = JSON.parse(localStorage.getItem(keys[0]) || '""')
      return { hasCache: true, count: latest?.answers?.length || 0 }
    } catch { return { hasCache: false, count: 0 } }
  }

  async function runHealthCheck(): Promise<void> {
    const settings = useSettingsStore.getState().settings
    const setActiveView = useUIStore.getState().setActiveView
    const showToast = useUIStore.getState().showToast
    const setProviderTests = useSettingsStore.getState().setProviderTests

    setActiveView('checkup')
    setIsRunningHealthCheck(true)

    const answerProvider = settings.answer.llmProvider
    const answerConfig = settings.providers[answerProvider]
    const deepgramConfig = settings.providers.deepgram
    const resumeTextLength =
      settings.resume.formalResume.length +
      settings.resume.detailedResume.length +
      (settings.resume.otherResumes ?? []).reduce((sum, item) => sum + item.text.length, 0)
    const supportsMicrophone = typeof navigator.mediaDevices?.getUserMedia === 'function'
    const supportsSystemAudio = typeof navigator.mediaDevices?.getDisplayMedia === 'function'
    const initialChecks: HealthCheckItem[] = [
      {
        id: 'candidate',
        title: '当前候选人',
        status: settings.resume.id ? 'pass' : 'fail',
        detail: settings.resume.id ? `${resumeLabel(settings.resume)}${settings.resume.targetRole ? `· ${settings.resume.targetRole}` : ''}` : '还没有选择候选人',
        action: '去简历库选择',
        target: 'resume' as const
      },
      {
        id: 'resume',
        title: '简历材料',
        status: resumeTextLength > 300 ? 'pass' : resumeTextLength > 0 ? 'warn' : 'fail',
        detail: resumeTextLength > 300 ? `已读取约 ${resumeTextLength.toLocaleString('zh-CN')} 字材料` : resumeTextLength > 0 ? '简历内容偏少，回答依据可能不足' : '还没有导入简历材料',
        action: '去简历库导入',
        target: 'resume' as const
      },
      {
        id: 'answer-model',
        title: '回答模型',
        status: answerConfig.enabled && answerConfig.apiKey ? 'running' : 'fail',
        detail: answerConfig.enabled && answerConfig.apiKey ? `正在测试 ${providerNames[answerProvider]} · ${answerConfig.model || '默认模型'}` : `${providerNames[answerProvider]} 未启用或未填写 Key`,
        action: '去 API 设置',
        target: 'settings' as const
      },
      {
        id: 'deepgram',
        title: 'Deepgram 语音',
        status: deepgramConfig.enabled && deepgramConfig.apiKey ? 'running' : 'warn',
        detail: deepgramConfig.enabled && deepgramConfig.apiKey ? '正在测试 Deepgram Key' : '未配置 Deepgram，实时语音转写不可用',
        action: '去 API 设置',
        target: 'settings' as const
      },
      {
        id: 'microphone',
        title: '麦克风权限',
        status: supportsMicrophone ? 'pass' : 'fail',
        detail: supportsMicrophone ? '浏览器内核支持麦克风采集，正式开启时仍需要授权' : '当前环境不支持麦克风采集',
        action: '去面试台',
        target: 'workspace' as const
      },
      {
        id: 'warmup',
        title: '预热缓存',
        status: getWarmupStatus().hasCache ? 'pass' : 'warn',
        detail: getWarmupStatus().hasCache ? `已缓存 ${getWarmupStatus().count} 道常见题答案` : '还没有预热缓存，建议在面试前生成一批',
        action: '去预热',
        target: 'workspace' as const
      },
      {
        id: 'system-audio',
        title: '电脑音频转写',
        status: supportsSystemAudio ? 'warn' : 'fail',
        detail: supportsSystemAudio ? '支持屏幕/窗口采集；使用时需要勾选共享系统音频' : '当前环境不支持电脑音频采集',
        action: '去面试台',
        target: 'workspace' as const
      },
      {
        id: 'floating',
        title: '悬浮窗入口',
        status: 'pass' as const,
        detail: '可通过面试台按钮或快捷键打开悬浮窗',
        action: '打开悬浮窗',
        target: 'workspace' as const
      }
    ]
    setHealthChecks(initialChecks)

    try {
      if (answerConfig.enabled && answerConfig.apiKey) {
        const result = await window.huomiantong.testProvider(answerProvider, answerConfig)
        updateHealthCheck('answer-model', {
          status: result.ok ? 'pass' : 'fail',
          detail: result.ok ? `${providerNames[answerProvider]} 可用· ${result.latencyMs}ms` : `模型测试失败：${result.status || ''} ${result.message}`
        })
        setProviderTests({ ...useSettingsStore.getState().providerTests, [answerProvider]: result })
      }

      if (deepgramConfig.enabled && deepgramConfig.apiKey) {
        const result = await window.huomiantong.testProvider('deepgram', deepgramConfig)
        updateHealthCheck('deepgram', {
          status: result.ok ? 'pass' : 'fail',
          detail: result.ok ? `Deepgram 可用· ${result.latencyMs}ms` : `Deepgram 测试失败：${result.status || ''} ${result.message}`
        })
        setProviderTests({ ...useSettingsStore.getState().providerTests, deepgram: result })
      }

      showToast('面试前体检完成')
    } finally {
      setIsRunningHealthCheck(false)
    }
  }

  return {
    healthChecks,
    healthSummary,
    isRunningHealthCheck,
    runHealthCheck
  }
}
