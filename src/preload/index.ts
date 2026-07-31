import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppSettings,
  AppUpdateStatus,
  AnswerRequest,
  AnswerStreamChunk,
  BackgroundPrepGenerateRequest,
  BackgroundPrepGenerateResult,
  BackgroundPrepSearchRequest,
  BackgroundPrepSearchResult,
  BackupImportResult,
  BackupOptions,
  BackupPayload,
  CompletedAnswer,
  DesktopAudioSource,
  FloatingPayload,
  InterviewReviewDeepReportRequest,
  InterviewReviewDeepReportResult,
  InterviewReviewDeepTalkRequest,
  InterviewReviewDeepTalkResult,
  InterviewReviewRecord,
  InterviewSession,
  InterviewReviewTranscriptionRequest,
  InterviewReviewTranscriptionResult,
  LocalSpeechSynthesisRequest,
  LocalSpeechSynthesisResult,
  PreparedAnswer,
  ProviderConfig,
  ProviderId,
  ProviderTestResult,
  RoleJdGenerateRequest,
  RoleJdGenerateResult,
  TrainingTurnRequest,
  TrainingTurnResult,
  UsageStats
} from '../shared/types'

const api = {
  loadSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings: AppSettings): Promise<AppSettings> => ipcRenderer.invoke('settings:save', settings),
  testProvider: (provider: ProviderId, config: ProviderConfig): Promise<ProviderTestResult> =>
    ipcRenderer.invoke('provider:test', provider, config),
  prepareAnswer: (request: AnswerRequest): Promise<PreparedAnswer> => ipcRenderer.invoke('answer:prepare', request),
  completeAnswer: (request: AnswerRequest): Promise<CompletedAnswer> => ipcRenderer.invoke('answer:complete', request),
  generateRoleJd: (request: RoleJdGenerateRequest): Promise<RoleJdGenerateResult> => ipcRenderer.invoke('role-jd:generate', request),
  generateTrainingTurn: (request: TrainingTurnRequest): Promise<TrainingTurnResult> => ipcRenderer.invoke('training:turn', request),
  generateBackgroundPrep: (request: BackgroundPrepGenerateRequest): Promise<BackgroundPrepGenerateResult> => ipcRenderer.invoke('background-prep:generate', request),
  searchBackgroundPublicInfo: (request: BackgroundPrepSearchRequest): Promise<BackgroundPrepSearchResult> => ipcRenderer.invoke('background-prep:search', request),
  transcribeInterviewAudio: (request: InterviewReviewTranscriptionRequest): Promise<InterviewReviewTranscriptionResult> =>
    ipcRenderer.invoke('interview-review:transcribe-audio', request),
  generateInterviewReviewDeepReport: (request: InterviewReviewDeepReportRequest): Promise<InterviewReviewDeepReportResult> =>
    ipcRenderer.invoke('interview-review:deep-report', request),
  generateInterviewReviewDeepTalk: (request: InterviewReviewDeepTalkRequest): Promise<InterviewReviewDeepTalkResult> =>
    ipcRenderer.invoke('interview-review:deep-talk', request),
  listInterviewReviews: (): Promise<InterviewReviewRecord[]> => ipcRenderer.invoke('interview-review:list-records'),
  saveInterviewReview: (record: InterviewReviewRecord): Promise<InterviewReviewRecord[]> => ipcRenderer.invoke('interview-review:save-record', record),
  deleteInterviewReviews: (ids: string[]): Promise<InterviewReviewRecord[]> => ipcRenderer.invoke('interview-review:delete-records', ids),
  listSessions: (): Promise<InterviewSession[]> => ipcRenderer.invoke('sessions:list'),
  saveSession: (session: InterviewSession): Promise<InterviewSession[]> => ipcRenderer.invoke('sessions:save', session),
  deleteSessions: (ids: string[]): Promise<InterviewSession[]> => ipcRenderer.invoke('sessions:delete', ids),
  loadUsage: (): Promise<UsageStats> => ipcRenderer.invoke('usage:load'),
  setUsageBudget: (provider: string, budgetTokens: number): Promise<UsageStats> => ipcRenderer.invoke('usage:set-budget', provider, budgetTokens),
  setUsageMoneyBudget: (provider: string, budgetCny: number): Promise<UsageStats> => ipcRenderer.invoke('usage:set-money-budget', provider, budgetCny),
  listDesktopAudioSources: (): Promise<DesktopAudioSource[]> => ipcRenderer.invoke('desktop:sources'),
  setDesktopAudioSourceId: (sourceId: string): Promise<void> => ipcRenderer.invoke('desktop:set-source', sourceId),
  synthesizeSpeech: (request: LocalSpeechSynthesisRequest): Promise<LocalSpeechSynthesisResult> => ipcRenderer.invoke('tts:synthesize', request),
  exportBackup: (options?: BackupOptions): Promise<BackupPayload> => ipcRenderer.invoke('backup:export', options),
  importBackup: (payload: Partial<BackupPayload>): Promise<BackupImportResult> => ipcRenderer.invoke('backup:import', payload),
  updateFloating: (payload: FloatingPayload): Promise<void> => ipcRenderer.invoke('floating:update', payload),
  hideFloating: (): Promise<void> => ipcRenderer.invoke('floating:hide'),
  toggleFloatingMaximize: (): Promise<boolean> => ipcRenderer.invoke('floating:toggle-maximize'),
  openDoc: (docPath: string): Promise<{ ok: boolean; path?: string; message?: string }> => ipcRenderer.invoke('docs:open', docPath),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('external:open', url),
  restartApp: (): Promise<{ mode: 'reload' | 'relaunch' }> => ipcRenderer.invoke('app:restart'),
  getUpdateStatus: (): Promise<AppUpdateStatus> => ipcRenderer.invoke('app:update-status'),
  checkForUpdates: (): Promise<AppUpdateStatus> => ipcRenderer.invoke('app:update-check'),
  downloadUpdate: (): Promise<AppUpdateStatus> => ipcRenderer.invoke('app:update-download'),
  installUpdate: (): Promise<AppUpdateStatus> => ipcRenderer.invoke('app:update-install'),
  // 启动流式回答
  startStreamingAnswer: (request: AnswerRequest): void => {
    ipcRenderer.send('answer:stream-start', request)
  },
  // 监听流式回答增量
  onStreamChunk: (callback: (chunk: AnswerStreamChunk) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, chunk: AnswerStreamChunk): void => callback(chunk)
    ipcRenderer.on('answer:stream-chunk', listener)
    return () => ipcRenderer.removeListener('answer:stream-chunk', listener)
  },
  onFloatingPayload: (callback: (payload: FloatingPayload) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: FloatingPayload): void => callback(payload)
    ipcRenderer.on('floating:payload', listener)

    return () => ipcRenderer.removeListener('floating:payload', listener)
  },
  onUpdateStatus: (callback: (status: AppUpdateStatus) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: AppUpdateStatus): void => callback(status)
    ipcRenderer.on('app:update-status-changed', listener)

    return () => ipcRenderer.removeListener('app:update-status-changed', listener)
  }
}

contextBridge.exposeInMainWorld('huomiantong', api)

export type HuomiantongApi = typeof api
