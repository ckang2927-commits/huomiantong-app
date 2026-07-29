export type ProviderId = 'deepgram' | 'deepseek' | 'dashscope' | 'openai' | 'anthropic'

export type SpeechProviderId = 'deepgram' | 'aliyun' | 'tencent' | 'baidu' | 'volcengine' | 'iflytek'

export type LlmProviderId = 'deepseek' | 'dashscope' | 'openai' | 'anthropic'

export type AnswerStyle = 'fast' | 'standard' | 'star'

export type InterviewMode = 'dataAnalyst' | 'aiProductManager' | 'backendEngineer' | 'frontendEngineer' | 'fullstackEngineer' | 'general'

export type RoleJdTemplates = Record<InterviewMode, string>

export type TrainingMode = 'resumeDeepDive' | 'projectFollowUp' | 'fundamentals' | 'pressure' | 'comprehensive'

export type TrainingQuestionCount = number
export type WarmupQuestionCount = 30 | 50 | 100
export type TrainingRoundKind = 'base' | 'followUp'

export type AppUpdateStatus =
  | { state: 'idle'; message: string; version?: string }
  | { state: 'checking'; message: string; version?: string }
  | { state: 'available'; message: string; version?: string }
  | { state: 'not-available'; message: string; version?: string }
  | { state: 'downloading'; message: string; version?: string; percent?: number }
  | { state: 'downloaded'; message: string; version?: string }
  | { state: 'installing'; message: string; version?: string }
  | { state: 'error'; message: string; version?: string }

import type { MockInterviewConfig } from './mockInterview'

export interface TrainingPreset {
  id: string
  label: string
  roleLabel: string
  hint: string
  interviewMode: InterviewMode
  trainingMode: TrainingMode
  roundCount: TrainingQuestionCount
  focus: string[]
  questionOutline?: string[]
  isCustom?: boolean
  updatedAt?: number
}

export interface ProviderConfig {
  enabled: boolean
  apiKey: string
  baseUrl?: string
  model?: string
}

export type ProviderSettings = Record<ProviderId, ProviderConfig>

export type SpeechProviderSettings = Record<SpeechProviderId, ProviderConfig>

export interface SpeechSettings {
  sttProvider: SpeechProviderId
  endpointingMs: number
  providers: SpeechProviderSettings
}

export interface InterviewReviewTranscriptionRequest {
  fileName: string
  mimeType: string
  size: number
  data: ArrayBuffer
}

export interface InterviewReviewUtterance {
  speaker?: string
  text: string
  start?: number
  end?: number
  confidence?: number
}

export interface InterviewReviewTranscriptionResult {
  transcript: string
  provider: 'deepgram'
  model: string
  fileName: string
  fileSize: number
  mimeType: string
  durationSec?: number
  confidence?: number
  requestId?: string
  utterances: InterviewReviewUtterance[]
  latencyMs: number
}

export interface InterviewReviewQuestionRecord {
  id: string
  order: number
  question: string
  intentLabel: string
  confidence: number
  source: string
  startSec?: number
  speaker?: string
  contextBefore?: string
  contextAfter?: string
}

export interface InterviewReviewAnswerAnalysisRecord {
  questionId: string
  answerText: string
  wordCount: number
  score: number
  level: 'good' | 'warn' | 'risk'
  metrics: {
    relevance: number
    completeness: number
    concision: number
    evidence: number
  }
  issues: string[]
  suggestions: string[]
}

export interface InterviewReviewRecord {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  candidateName?: string
  targetRole?: string
  resumeProfileId?: string
  resumeProfileName?: string
  audioFileName?: string
  audioFileSize?: number
  audioDurationSec?: number
  transcriptText: string
  questions: InterviewReviewQuestionRecord[]
  answerAnalyses: InterviewReviewAnswerAnalysisRecord[]
  reportMarkdown: string
  overallScore: number
  overallLevel: string
  questionCount: number
  answeredCount: number
  riskCount: number
}

export interface InterviewReviewDeepReportRequest {
  settings: AppSettings
  title?: string
  transcriptText: string
  questions: InterviewReviewQuestionRecord[]
  answerAnalyses: InterviewReviewAnswerAnalysisRecord[]
  localReportMarkdown: string
  audioFileName?: string
  durationSec?: number
}

export interface InterviewReviewDeepReportResult {
  reportMarkdown: string
  provider: LlmProviderId | 'local'
  latencyMs: number
  usage?: TokenUsage
}

export interface InterviewReviewDeepTalkRequest {
  settings: AppSettings
  question: string
  answerText: string
  localReportMarkdown: string
  questionLabel?: string
  answerScore?: number
  answerIssues?: string[]
  answerSuggestions?: string[]
  targetLength?: 'short' | 'standard' | 'long'
}

export interface InterviewReviewDeepTalkResult {
  title: string
  talkMarkdown: string
  provider: LlmProviderId | 'local'
  latencyMs: number
  usage?: TokenUsage
}

export interface ResumeProfile {
  id?: string
  profileName?: string
  createdAt?: number
  updatedAt?: number
  candidateName: string
  targetRole: string
  formalResume: string
  detailedResume: string
  formalResumeFile?: ResumeFileMeta
  detailedResumeFile?: ResumeFileMeta
  otherResumes?: ResumeAttachment[]
}

export interface ResumeFileMeta {
  name: string
  extension: string
  size: number
  addedAt: number
  textLength: number
}

export interface ResumeAttachment {
  id: string
  title: string
  text: string
  file: ResumeFileMeta
  createdAt: number
}

export interface AnswerSettings {
  llmProvider: LlmProviderId
  answerStyle: AnswerStyle
  interviewMode: InterviewMode
  responseLanguage: 'zh' | 'en'
  fastFirst: boolean
  roleJdTemplates: RoleJdTemplates
  customTrainingPresets?: TrainingPreset[]
  privacyMode?: boolean
}

export interface AppSettings {
  providers: ProviderSettings
  speech: SpeechSettings
  resume: ResumeProfile
  resumeProfiles?: ResumeProfile[]
  activeResumeId?: string
  answer: AnswerSettings
}

export interface BackupPayload {
  version: number
  appName: string
  appVersion?: string
  exportedAt: number
  settings: AppSettings
  sessions: InterviewSession[]
  interviewReviews?: InterviewReviewRecord[]
  usage: UsageStats
}

export interface BackupOptions {
  includeApiKeys?: boolean
}

export interface BackupImportResult {
  importedAt: number
  settings: AppSettings
  sessions: InterviewSession[]
  interviewReviews?: InterviewReviewRecord[]
  usage: UsageStats
}

export interface ProviderTestResult {
  ok: boolean
  provider: ProviderId
  status: number
  message: string
  latencyMs: number
}

export interface DesktopAudioSource {
  id: string
  name: string
  thumbnail: string
}

export interface TranscriptLine {
  id: string
  speaker: 'interviewer' | 'candidate'
  text: string
  at: number
  isFinal: boolean
}

export interface SpeechExpressionScore {
  total: number
  pace: number
  clarity: number
  structure: number
  confidence: number
  durationSec: number
  estimatedDuration: boolean
  charsPerMinute: number
  fillerCount: number
  pauseHintCount: number
  notes: string[]
}

export interface EvidenceSnippet {
  source: 'formal' | 'detailed' | 'extra'
  sourceLabel?: string
  text: string
  score: number
}

export interface AnswerRequest {
  question: string
  transcript: TranscriptLine[]
  settings: AppSettings
}

export interface RoleJdGenerateRequest {
  settings: AppSettings
  interviewMode: InterviewMode
}

export interface RoleJdGenerateResult {
  jd: string
  provider: LlmProviderId | 'local'
  latencyMs: number
  usage?: TokenUsage
}

export type BackgroundPrepPackageType = 'hr' | 'salary' | 'company' | 'work' | 'onboard' | 'risk'

export interface BackgroundPrepInput {
  packageType: BackgroundPrepPackageType
  companyName: string
  targetRole: string
  confirmedFacts: string
  uncertainNotes: string
  publicSources?: BackgroundPublicSource[]
}

export interface BackgroundPrepGenerateRequest {
  settings: AppSettings
  input: BackgroundPrepInput
}

export interface BackgroundPublicSource {
  title: string
  url: string
  snippet: string
  source: string
  checkedAt: number
}

export interface BackgroundPrepSearchRequest {
  input: BackgroundPrepInput
}

export interface BackgroundPrepSearchResult {
  query: string
  sources: BackgroundPublicSource[]
  latencyMs: number
  message?: string
}

export interface BackgroundPrepGenerateResult {
  title: string
  content: string
  provider: LlmProviderId | 'local'
  latencyMs: number
  usage?: TokenUsage
}

export interface TrainingRound {
  id: string
  question: string
  referenceAnswer?: string
  kind?: TrainingRoundKind
  answer?: string
  feedback?: string
  score?: number
  speechScore?: SpeechExpressionScore
  at: number
  answeredAt?: number
}

export interface TrainingTurnRequest {
  settings: AppSettings
  trainingMode: TrainingMode
  roundCount: TrainingQuestionCount
  questionOutline?: string[]
  mockInterviewConfig?: MockInterviewConfig
  rounds: TrainingRound[]
}

export interface TrainingTurnResult {
  feedback?: string
  score?: number
  nextQuestion?: string
  nextQuestionKind?: TrainingRoundKind
  referenceAnswer?: string
  finalReport?: string
  done: boolean
  provider: LlmProviderId | 'local'
  latencyMs: number
  usage?: TokenUsage
}

export interface PreparedAnswer {
  fastAnswer: string
  evidence: EvidenceSnippet[]
}

export interface CompletedAnswer {
  answer: string
  provider: LlmProviderId | 'local'
  evidence: EvidenceSnippet[]
  latencyMs: number
  quality?: AnswerQualityScore
  risk?: FabricationRisk
  usage?: TokenUsage
}

export interface AnswerStreamChunk {
  text: string
  done: boolean
  finalText?: string
  firstByteMs?: number
  latencyMs?: number
  provider?: LlmProviderId | 'local'
  usage?: TokenUsage
  error?: string
}

export interface AnswerQualityScore {
  total: number
  resumeFit: number
  structure: number
  clarity: number
  riskControl: number
  notes: string[]
}

export interface FabricationRisk {
  level: 'low' | 'medium' | 'high'
  score: number
  reasons: string[]
  unsupportedClaims: string[]
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimated: boolean
}

export interface ProviderUsageStats extends TokenUsage {
  budgetTokens?: number
  budgetCny: number
  models: Record<string, TokenUsage>
}

export type UsageStats = Partial<Record<LlmProviderId, ProviderUsageStats>>

export interface InterviewSession {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  resumeProfileId?: string
  resumeProfileName?: string
  candidateName?: string
  targetRole?: string
  transcript: TranscriptLine[]
  answers: Array<{
    id: string
    question: string
    answer: string
    provider: string
    at: number
    evidence?: EvidenceSnippet[]
    quality?: AnswerQualityScore
    risk?: FabricationRisk
  }>
}

export interface FloatingPayload {
  question: string
  answer: string
  evidence: EvidenceSnippet[]
  status: 'idle' | 'thinking' | 'ready' | 'error'
  candidateName?: string
  targetRole?: string
  queuedCount?: number
  records?: Array<{
    id: string
    kind: 'question' | 'answer'
    text: string
    at: number
    evidence?: EvidenceSnippet[]
  }>
}
