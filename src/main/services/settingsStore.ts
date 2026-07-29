import { safeStorage } from 'electron'
import { randomUUID } from 'node:crypto'
import { readJson, writeJson } from './jsonStorage'
import { normalizeRoleJdTemplates } from '../../shared/roleJdTemplates'
import { defaultSpeechSettings, normalizeSpeechSettings } from '../../shared/speechProviders'
import type { AppSettings, ProviderConfig, ProviderId, ResumeProfile, TrainingMode, TrainingPreset, TrainingQuestionCount } from '../../shared/types'

export const defaultSettings: AppSettings = {
  providers: {
    deepgram: {
      enabled: true,
      apiKey: ''
    },
    deepseek: {
      enabled: true,
      apiKey: '',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash'
    },
    dashscope: {
      enabled: false,
      apiKey: '',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen3.7-plus'
    },
    openai: {
      enabled: false,
      apiKey: '',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4.1-mini'
    },
    anthropic: {
      enabled: false,
      apiKey: '',
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-3-5-haiku-latest'
    }
  },
  speech: defaultSpeechSettings,
  resume: {
    candidateName: '',
    targetRole: '数据分析师',
    formalResume: '',
    detailedResume: '',
    otherResumes: []
  },
  answer: {
    llmProvider: 'deepseek',
    answerStyle: 'standard',
    interviewMode: 'dataAnalyst',
    responseLanguage: 'zh',
    fastFirst: true,
    roleJdTemplates: normalizeRoleJdTemplates(),
    customTrainingPresets: []
  }
}

function encryptSecret(value: string): string {
  if (!value) {
    return ''
  }

  try {
    if (safeStorage.isEncryptionAvailable()) {
      return `safe:${safeStorage.encryptString(value).toString('base64')}`
    }
  } catch {
    // Falls back to local plain text for development machines without OS keychain access.
  }

  return `plain:${value}`
}

function decryptSecret(value: string): string {
  if (!value) {
    return ''
  }

  if (value.startsWith('safe:')) {
    try {
      return safeStorage.decryptString(Buffer.from(value.slice(5), 'base64'))
    } catch {
      return ''
    }
  }

  if (value.startsWith('plain:')) {
    return value.slice(6)
  }

  return value
}

function normalizeProvider(provider: ProviderId, value?: Partial<ProviderConfig>): ProviderConfig {
  const fallback = defaultSettings.providers[provider]
  const legacyModels: Partial<Record<ProviderId, Record<string, string>>> = {
    deepseek: {
      'deepseek-chat': 'deepseek-v4-flash',
      'deepseek-reasoner': 'deepseek-v4-pro'
    },
    dashscope: {
      'qwen-plus': 'qwen-plus-latest',
      'qwen-long': 'qwen-long-latest'
    }
  }
  const model = value?.model ?? fallback.model

  return {
    enabled: value?.enabled ?? fallback.enabled,
    apiKey: value?.apiKey ?? fallback.apiKey,
    baseUrl: value?.baseUrl ?? fallback.baseUrl,
    model: legacyModels[provider]?.[model || ''] ?? model
  }
}

function encodeSpeechSettings(settings: AppSettings['speech']): AppSettings['speech'] {
  return {
    ...settings,
    providers: Object.fromEntries(
      Object.entries(settings.providers).map(([provider, config]) => [
        provider,
        {
          ...config,
          apiKey: encryptSecret(config.apiKey)
        }
      ])
    ) as AppSettings['speech']['providers']
  }
}

function decodeSpeechSettings(settings: AppSettings['speech']): AppSettings['speech'] {
  return {
    ...settings,
    providers: Object.fromEntries(
      Object.entries(settings.providers).map(([provider, config]) => [
        provider,
        {
          ...config,
          apiKey: decryptSecret(config.apiKey)
        }
      ])
    ) as AppSettings['speech']['providers']
  }
}

function normalizeInterviewMode(value?: string): AppSettings['answer']['interviewMode'] {
  if (value === 'productManager') {
    return 'aiProductManager'
  }

  if (value === 'dataAnalyst' || value === 'aiProductManager' || value === 'backendEngineer' || value === 'frontendEngineer' || value === 'fullstackEngineer' || value === 'general') {
    return value
  }

  return defaultSettings.answer.interviewMode
}

function normalizeTrainingMode(value?: string): TrainingMode {
  return value === 'resumeDeepDive' || value === 'projectFollowUp' || value === 'fundamentals' || value === 'pressure' || value === 'comprehensive'
    ? value
    : 'comprehensive'
}

function normalizeTrainingQuestionCount(value?: number): TrainingQuestionCount {
  return normalizeQuestionCountNumber(value, 20)
}

function normalizeQuestionCountNumber(value: unknown, fallback: number): TrainingQuestionCount {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(40, Math.max(3, Math.round(parsed)))
}

function normalizeCustomTrainingPresets(value?: unknown): TrainingPreset[] {
  if (!Array.isArray(value)) {
    return []
  }

  const presets: TrainingPreset[] = []

  value.forEach((item, index) => {
    const current = (item || {}) as Partial<TrainingPreset>
    const label = (current.label || '').trim()

    if (!label) {
      return
    }

    presets.push({
      id: current.id || `custom-training-${index + 1}`,
      label,
      roleLabel: (current.roleLabel || '自定义岗位').trim(),
      hint: (current.hint || '自定义训练模板').trim(),
      interviewMode: normalizeInterviewMode(current.interviewMode),
      trainingMode: normalizeTrainingMode(current.trainingMode),
      roundCount: normalizeTrainingQuestionCount(current.roundCount),
      focus: Array.isArray(current.focus)
        ? current.focus.map((focus) => String(focus).trim()).filter(Boolean).slice(0, 8)
        : [],
      questionOutline: Array.isArray(current.questionOutline)
        ? current.questionOutline.map((question) => String(question).trim()).filter(Boolean).slice(0, 20)
        : [],
      isCustom: true,
      updatedAt: typeof current.updatedAt === 'number' && Number.isFinite(current.updatedAt) ? current.updatedAt : Date.now()
    })
  })

  return presets.slice(0, 30)
}

function normalizeResumeProfile(value: Partial<ResumeProfile> | undefined, fallback: ResumeProfile, id: string): ResumeProfile {
  const now = Date.now()

  return {
    id: value?.id || id,
    profileName: value?.profileName || value?.candidateName || fallback.profileName || fallback.candidateName || '默认候选人',
    createdAt: value?.createdAt || now,
    updatedAt: value?.updatedAt || now,
    candidateName: value?.candidateName ?? fallback.candidateName,
    targetRole: value?.targetRole ?? fallback.targetRole,
    formalResume: value?.formalResume ?? fallback.formalResume,
    detailedResume: value?.detailedResume ?? fallback.detailedResume,
    formalResumeFile: value?.formalResumeFile,
    detailedResumeFile: value?.detailedResumeFile,
    otherResumes: (value?.otherResumes ?? fallback.otherResumes ?? []).map((item) => ({
      ...item,
      id: item.id || randomUUID(),
      title: item.title || item.file?.name || '其他简历',
      createdAt: item.createdAt || item.file?.addedAt || now
    }))
  }
}

export function normalizeSettings(value?: Partial<AppSettings>): AppSettings {
  const fallbackResume = defaultSettings.resume
  const baseResume = normalizeResumeProfile(value?.resume, fallbackResume, value?.resume?.id || value?.activeResumeId || 'default-resume')
  const rawProfiles = value?.resumeProfiles?.length ? value.resumeProfiles : [baseResume]
  const resumeProfiles = rawProfiles.map((profile, index) => normalizeResumeProfile(profile, fallbackResume, profile.id || (index === 0 ? baseResume.id || 'default-resume' : `resume-${index + 1}`)))
  const activeResumeId = value?.activeResumeId || baseResume.id || resumeProfiles[0]?.id || 'default-resume'
  const activeResume = resumeProfiles.find((profile) => profile.id === activeResumeId) || baseResume

  return {
    providers: {
      deepgram: normalizeProvider('deepgram', value?.providers?.deepgram),
      deepseek: normalizeProvider('deepseek', value?.providers?.deepseek),
      dashscope: normalizeProvider('dashscope', value?.providers?.dashscope),
      openai: normalizeProvider('openai', value?.providers?.openai),
      anthropic: normalizeProvider('anthropic', value?.providers?.anthropic)
    },
    speech: normalizeSpeechSettings(value?.speech, value?.providers?.deepgram),
    resume: activeResume,
    resumeProfiles,
    activeResumeId: activeResume.id,
    answer: {
      llmProvider: value?.answer?.llmProvider ?? defaultSettings.answer.llmProvider,
      answerStyle: value?.answer?.answerStyle ?? defaultSettings.answer.answerStyle,
      interviewMode: normalizeInterviewMode(value?.answer?.interviewMode),
      responseLanguage: value?.answer?.responseLanguage ?? defaultSettings.answer.responseLanguage,
      fastFirst: value?.answer?.fastFirst ?? defaultSettings.answer.fastFirst,
      roleJdTemplates: normalizeRoleJdTemplates(value?.answer?.roleJdTemplates),
      customTrainingPresets: normalizeCustomTrainingPresets(value?.answer?.customTrainingPresets),
      privacyMode: value?.answer?.privacyMode ?? false
    }
  }
}

function encodeSettings(settings: AppSettings): AppSettings {
  const normalized = normalizeSettings(settings)

  return {
    ...normalized,
    providers: Object.fromEntries(
      Object.entries(normalized.providers).map(([provider, config]) => [
        provider,
        {
          ...config,
          apiKey: encryptSecret(config.apiKey)
        }
      ])
    ) as AppSettings['providers'],
    speech: encodeSpeechSettings(normalized.speech)
  }
}

function decodeSettings(settings: AppSettings): AppSettings {
  const normalized = normalizeSettings(settings)

  return {
    ...normalized,
    providers: Object.fromEntries(
      Object.entries(normalized.providers).map(([provider, config]) => [
        provider,
        {
          ...config,
          apiKey: decryptSecret(config.apiKey)
        }
      ])
    ) as AppSettings['providers'],
    speech: decodeSpeechSettings(normalized.speech)
  }
}

export async function loadSettings(): Promise<AppSettings> {
  const stored = await readJson<AppSettings>('settings.json', defaultSettings)
  return decodeSettings(stored)
}

export async function saveSettings(settings: AppSettings): Promise<AppSettings> {
  const normalized = normalizeSettings(settings)
  await writeJson('settings.json', encodeSettings(normalized))
  return normalized
}
