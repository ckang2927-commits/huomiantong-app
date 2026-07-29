import type {
  AppSettings,
  InterviewMode,
  InterviewSession,
  ProviderId,
  TranscriptLine
} from '../../shared/types'
import { normalizeRoleJdTemplates } from '../../shared/roleJdTemplates'
import { defaultSpeechSettings } from '../../shared/speechProviders'
export type { ListeningMode } from './audio/audioTypes'
export { evidenceLabel, evidenceMarkdown, evidenceSources } from './evidenceFormatting'
export { buildFloatingRecords, buildReview, downloadText, safeFileName, sessionToMarkdown, sessionToWordHtml } from './sessionExport'

export type ViewId = 'workspace' | 'training' | 'realisticInterview' | 'checkup' | 'resume' | 'settings' | 'sessions' | 'interviewReview' | 'help'
export type ToastMessage = { id: number; text: string; kind: 'success' | 'info' | 'error' }
export type QueuedAnswer = { id: string; question: string; transcript: TranscriptLine[] }
export type HealthStatus = 'idle' | 'running' | 'pass' | 'warn' | 'fail'
export type HealthCheckItem = { id: string; title: string; detail: string; status: HealthStatus; action?: string; target?: ViewId }

export const providerNames: Record<ProviderId, string> = {
  deepgram: 'Deepgram 语音',
  deepseek: 'DeepSeek',
  dashscope: '阿里百炼 DashScope',
  openai: 'OpenAI',
  anthropic: 'Anthropic'
}

export const providerModelPresets: Partial<Record<ProviderId, string[]>> = {
  deepseek: ['deepseek-v4-flash', 'deepseek-v4-pro'],
  dashscope: ['qwen3.7-plus', 'qwen3.7-max', 'qwen3.6-flash', 'qwen-plus-latest', 'qwen-flash', 'qwen-long-latest'],
  openai: ['gpt-4.1-mini', 'gpt-4.1', 'gpt-4o-mini'],
  anthropic: ['claude-3-5-haiku-latest', 'claude-3-5-sonnet-latest']
}

export const modeOptions: Array<{ value: InterviewMode; label: string; hint: string }> = [
  { value: 'dataAnalyst', label: '数据分析岗', hint: '指标、SQL、业务结论' },
  { value: 'aiProductManager', label: 'AI 产品经理岗', hint: 'AI 场景、指标、落地' },
  { value: 'backendEngineer', label: '后端开发岗', hint: '系统、接口、稳定性' },
  { value: 'frontendEngineer', label: '前端工程师岗', hint: '组件、性能、体验' },
  { value: 'fullstackEngineer', label: '全栈工程师岗', hint: '前后端、部署、系统' },
  { value: 'general', label: '通用面试', hint: '经历、行动、结果复盘' }
]

export const sampleQuestions = [
  '请介绍一个最近的数据分析项目。',
  '如果业务方质疑你的结论，你会怎么处理？',
  '请展开讲讲指标体系建设。'
]

const waitingPhrases = [
  // ── 思考缓冲 ──
  '稍等一下，我想把这个问题说得更准确一点。',
  '这个问题我稍微想一下，避免只说表面。',
  '我整理一下思路，结合具体项目来讲。',
  '给我几秒钟，我回忆一下当时的细节。',
  '让我先理一下逻辑，别跳得太快。',
  '嗯，我先在脑子里过一遍框架。',
  '这个问题有点意思，让我想想怎么展开。',

  // ── 结构组织 ──
  '我分三个层面来说这个问题。',
  '我先讲背景，再说具体怎么做的。',
  '我想从目标出发，倒推一下执行过程。',
  '我用一个具体的例子来说明吧。',
  '我先说结论，再展开论据。',
  '这件事可以从短期和长期两个角度来看。',

  // ── 项目关联 ──
  '我拿我之前做过的一个项目来举例。',
  '这个跟我在上一家公司遇到的情况很像。',
  '我回忆一下当时的数据表现。',
  '具体到这个点，我遇到过类似的挑战。',
  '我想起之前有个项目就是这么做的。',
  '我结合简历里提到的那个项目来讲。',

  // ── 礼貌确认 ──
  '您问的是执行层面还是策略层面？',
  '我先确认一下，您关注的焦点是结果还是过程？',
  '这个问题我可以从业务和技术两个角度回答，您更想听哪个？',
  '我先理解一下，您是想了解整体思路还是具体细节？',
  '我再确认一下，这个问题是针对当前岗位还是通用能力？',

  // ── 谦虚铺垫 ──
  '这个领域我还在持续学习，我先把我的理解说一下。',
  '我试着从我的实际经验出发来回答。',
  '我不确定是不是最优方案，但当时我们是这样处理的。',
  '我先讲一下我们当时的做法，不一定适用于所有场景。',
  '这个问题没有标准答案，我分享一下我的做法。',
  '我尽量把思路说清楚，如果有遗漏欢迎追问。',
]

export const initialSettings: AppSettings = {
  providers: {
    deepgram: { enabled: true, apiKey: '' },
    deepseek: { enabled: true, apiKey: '', baseUrl: 'https://api.deepseek.com', model: 'deepseek-v4-flash' },
    dashscope: { enabled: false, apiKey: '', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen3.7-plus' },
    openai: { enabled: false, apiKey: '', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini' },
    anthropic: { enabled: false, apiKey: '', baseUrl: 'https://api.anthropic.com', model: 'claude-3-5-haiku-latest' }
  },
  speech: defaultSpeechSettings,
  resume: {
    id: 'default-resume',
    profileName: '默认候选人',
    candidateName: '',
    targetRole: '数据分析师',
    formalResume: '',
    detailedResume: '',
    otherResumes: []
  },
  resumeProfiles: [
    {
      id: 'default-resume',
      profileName: '默认候选人',
      candidateName: '',
      targetRole: '数据分析师',
      formalResume: '',
      detailedResume: '',
      otherResumes: []
    }
  ],
  activeResumeId: 'default-resume',
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

export function createSession(resume?: AppSettings['resume']): InterviewSession {
  const now = Date.now()

  return {
    id: crypto.randomUUID(),
    title: `模拟面试 ${new Date(now).toLocaleString('zh-CN')}`,
    createdAt: now,
    updatedAt: now,
    resumeProfileId: resume?.id,
    resumeProfileName: resume ? resumeLabel(resume) : undefined,
    candidateName: resume?.candidateName,
    targetRole: resume?.targetRole,
    transcript: [],
    answers: []
  }
}

export function formatTime(value: number): string {
  return new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function formatDateTime(value?: number): string {
  return value ? new Date(value).toLocaleString('zh-CN') : '旧版内容'
}

export function formatFileSize(value = 0): string {
  return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(2)} MB` : `${Math.max(1, Math.round(value / 1024)).toLocaleString('zh-CN')} KB`
}

export function fileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex >= 0 ? fileName.slice(dotIndex + 1).toUpperCase() : 'TEXT'
}

export function compactKey(value: string): string {
  return !value ? '未填写' : value.length <= 10 ? '已填写' : `${value.slice(0, 4)}...${value.slice(-4)}`
}

export function resumeLabel(profile: AppSettings['resume']): string {
  return profile.profileName || profile.candidateName || '未命名候选人'
}

export function waitingPhrase(): string {
  return waitingPhrases[Math.floor(Math.random() * waitingPhrases.length)]
}

export function attachResumeToSession(session: InterviewSession, resume: AppSettings['resume']): InterviewSession {
  return {
    ...session,
    resumeProfileId: resume.id,
    resumeProfileName: resumeLabel(resume),
    candidateName: resume.candidateName,
    targetRole: resume.targetRole
  }
}

