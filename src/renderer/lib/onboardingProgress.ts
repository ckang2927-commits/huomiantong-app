import type { AppSettings, ProviderId, ProviderTestResult } from '../../shared/types'

export type OnboardingTaskId = 'answer-api' | 'speech-api' | 'resume' | 'training' | 'realistic-interview'

export type OnboardingTask = {
  id: OnboardingTaskId
  label: string
  description: string
  done: boolean
  detail: string
  view: 'settings' | 'resume' | 'training' | 'realisticInterview'
  settingsSection?: 'api' | 'voice'
}

type Milestones = {
  trainingCompletedAt?: number
  realisticInterviewCompletedAt?: number
}

const MILESTONE_KEY = 'huomiantong.onboarding-milestones.v1'

export function getOnboardingTasks(
  settings: AppSettings,
  providerTests: Partial<Record<ProviderId, ProviderTestResult>> = {}
): OnboardingTask[] {
  const milestones = loadMilestones()
  const answerProvider = settings.providers[settings.answer.llmProvider]
  const speechProvider = settings.speech.sttProvider
  const speechConfig =
    speechProvider === 'deepgram'
      ? {
          ...settings.speech.providers.deepgram,
          apiKey: settings.speech.providers.deepgram.apiKey || settings.providers.deepgram.apiKey
        }
      : settings.speech.providers[speechProvider]
  const answerReady = Boolean(answerProvider.enabled && answerProvider.apiKey.trim())
  const speechReady = Boolean(speechConfig.enabled && speechConfig.apiKey.trim())
  const resumeReady = Boolean(
    settings.resume.formalResume.trim() ||
      settings.resume.detailedResume.trim() ||
      (settings.resume.otherResumes?.length ?? 0) > 0
  )
  const trainingReady = Boolean(milestones.trainingCompletedAt || hasStoredTrainingResult())
  const realisticReady = Boolean(milestones.realisticInterviewCompletedAt)

  return [
    {
      id: 'answer-api',
      label: '回答模型',
      description: '配置一个可用的大模型 Key',
      done: answerReady,
      detail: answerReady
        ? providerTests[settings.answer.llmProvider]?.ok
          ? '已填写并测试通过'
          : '已填写，建议测试连接'
        : '还没有可用的回答模型 Key',
      view: 'settings',
      settingsSection: 'api'
    },
    {
      id: 'speech-api',
      label: '语音转写',
      description: '配置实时语音转文字服务',
      done: speechReady,
      detail: speechReady ? '已配置语音转写服务' : '可跳过，手动输入也能练习',
      view: 'settings',
      settingsSection: 'voice'
    },
    {
      id: 'resume',
      label: '导入简历',
      description: '让回答有你的真实经历依据',
      done: resumeReady,
      detail: resumeReady ? '已有简历资料' : '还没有导入简历',
      view: 'resume'
    },
    {
      id: 'training',
      label: '完成模拟训练',
      description: '至少完整练完一轮并生成复盘',
      done: trainingReady,
      detail: trainingReady ? '已有训练完成记录' : '还没有完整训练记录',
      view: 'training'
    },
    {
      id: 'realistic-interview',
      label: '体验拟真面试',
      description: '完成一场真人语音模拟面试',
      done: realisticReady,
      detail: realisticReady ? '已有拟真面试完成记录' : '还没有拟真面试完成记录',
      view: 'realisticInterview'
    }
  ]
}

export function markOnboardingMilestone(id: 'training' | 'realisticInterview'): void {
  const milestones = loadMilestones()
  const key = id === 'training' ? 'trainingCompletedAt' : 'realisticInterviewCompletedAt'
  window.localStorage.setItem(
    MILESTONE_KEY,
    JSON.stringify({
      ...milestones,
      [key]: Date.now()
    })
  )
  window.dispatchEvent(new CustomEvent('huomiantong:onboarding-progress-change'))
}

export function subscribeOnboardingProgress(callback: () => void): () => void {
  window.addEventListener('huomiantong:onboarding-progress-change', callback)
  window.addEventListener('storage', callback)

  return () => {
    window.removeEventListener('huomiantong:onboarding-progress-change', callback)
    window.removeEventListener('storage', callback)
  }
}

function loadMilestones(): Milestones {
  try {
    const raw = window.localStorage.getItem(MILESTONE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return {
      trainingCompletedAt: typeof parsed.trainingCompletedAt === 'number' ? parsed.trainingCompletedAt : undefined,
      realisticInterviewCompletedAt:
        typeof parsed.realisticInterviewCompletedAt === 'number' ? parsed.realisticInterviewCompletedAt : undefined
    }
  } catch {
    return {}
  }
}

function hasStoredTrainingResult(): boolean {
  try {
    const raw = window.localStorage.getItem('huomiantong.trainingTrend.v1')
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) && parsed.length > 0
  } catch {
    return false
  }
}
