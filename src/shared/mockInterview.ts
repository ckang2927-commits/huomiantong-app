export type MockInterviewDifficulty = 'easy' | 'medium' | 'hard' | 'pressure'
export type MockInterviewerStyle = 'warm' | 'followUp' | 'pressure' | 'techLead' | 'hr' | 'random'
export type MockQuestionStrategy = 'fixed' | 'adaptive' | 'mixed'

export interface MockInterviewConfig {
  durationMinutes: number
  questionCount: number
  difficulty: MockInterviewDifficulty
  focus: string[]
  interviewerStyle: MockInterviewerStyle
  interviewerVoiceURI: string
  questionStrategy: MockQuestionStrategy
}

export const mockInterviewFocusOptions = ['项目深挖', '简历真实性', '技术深度', '业务理解', '表达流畅', '压力追问']

export const defaultMockInterviewConfig: MockInterviewConfig = {
  durationMinutes: 30,
  questionCount: 10,
  difficulty: 'medium',
  focus: ['项目深挖', '简历真实性'],
  interviewerStyle: 'random',
  interviewerVoiceURI: '',
  questionStrategy: 'mixed'
}

export function normalizeMockInterviewConfig(value: Partial<MockInterviewConfig> | null | undefined): MockInterviewConfig {
  const durationMinutes = toSafeInteger(value?.durationMinutes, defaultMockInterviewConfig.durationMinutes, 5, 180)
  const questionCount = toSafeInteger(value?.questionCount, defaultMockInterviewConfig.questionCount, 3, 40)
  const focus = Array.isArray(value?.focus)
    ? value.focus.map((item) => String(item).trim()).filter((item) => mockInterviewFocusOptions.includes(item)).slice(0, 6)
    : defaultMockInterviewConfig.focus

  return {
    durationMinutes,
    questionCount,
    difficulty: isDifficulty(value?.difficulty) ? value.difficulty : defaultMockInterviewConfig.difficulty,
    focus: focus.length > 0 ? focus : defaultMockInterviewConfig.focus,
    interviewerStyle: isInterviewerStyle(value?.interviewerStyle) ? value.interviewerStyle : defaultMockInterviewConfig.interviewerStyle,
    interviewerVoiceURI: typeof value?.interviewerVoiceURI === 'string' ? value.interviewerVoiceURI.trim().slice(0, 240) : defaultMockInterviewConfig.interviewerVoiceURI,
    questionStrategy: isQuestionStrategy(value?.questionStrategy) ? value.questionStrategy : defaultMockInterviewConfig.questionStrategy
  }
}

function toSafeInteger(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(max, Math.max(min, Math.round(parsed)))
}

function isDifficulty(value: unknown): value is MockInterviewDifficulty {
  return value === 'easy' || value === 'medium' || value === 'hard' || value === 'pressure'
}

function isInterviewerStyle(value: unknown): value is MockInterviewerStyle {
  return value === 'warm' || value === 'followUp' || value === 'pressure' || value === 'techLead' || value === 'hr' || value === 'random'
}

function isQuestionStrategy(value: unknown): value is MockQuestionStrategy {
  return value === 'fixed' || value === 'adaptive' || value === 'mixed'
}
