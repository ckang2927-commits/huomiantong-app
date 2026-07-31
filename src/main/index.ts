import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import { shell } from 'electron'
import {
  deleteInterviewReviews,
  deleteSessions,
  exportBackup,
  importBackup,
  loadInterviewReviews,
  loadSessions,
  loadSettings,
  loadUsage,
  saveInterviewReview,
  saveSession,
  saveSettings,
  setUsageBudget,
  setUsageMoneyBudget
} from './services/appStorage'
import { completeAnswer, prepareAnswer, streamAnswer, testProvider } from './services/answerService'
import { generateBackgroundPrep, searchBackgroundPublicInfo } from './services/backgroundPrepService'
import { openDocFile } from './services/docService'
import { generateInterviewReviewDeepReport, generateInterviewReviewDeepTalk } from './services/interviewReviewEnhancementService'
import { transcribeInterviewAudio } from './services/interviewReviewService'
import { synthesizeLocalSpeech } from './services/localTtsService'
import { generateRoleJd } from './services/roleJdService'
import { generateTrainingTurn } from './services/trainingService'
import {
  checkForUpdatesManually,
  checkForUpdatesOnStartup,
  downloadAvailableUpdate,
  getCurrentUpdateStatus,
  installDownloadedUpdate,
  registerAutoUpdateEvents
} from './services/updateService'
import {
  createFloatingWindow,
  createMainWindow,
  hideFloatingWindow,
  listDesktopAudioSources,
  sendFloatingPayload,
  setupDisplayMediaCapture,
  setDesktopAudioSourceId,
  toggleFloatingMaximize
} from './services/windowManager'
import type {
  AppSettings,
  AnswerRequest,
  AnswerStreamChunk,
  BackgroundPrepGenerateRequest,
  BackgroundPrepSearchRequest,
  BackupPayload,
  FloatingPayload,
  InterviewReviewRecord,
  InterviewSession,
  InterviewReviewDeepReportRequest,
  InterviewReviewDeepTalkRequest,
  InterviewReviewTranscriptionRequest,
  LlmProviderId,
  LocalSpeechSynthesisRequest,
  ProviderConfig,
  ProviderId,
  RoleJdGenerateRequest,
  TrainingTurnRequest,
} from '../shared/types'

app.whenReady().then(() => {
  setupDisplayMediaCapture()
  createMainWindow()
  createFloatingWindow()

  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    const window = createFloatingWindow()

    if (window.isVisible()) {
      window.hide()
    } else {
      window.showInactive()
    }
  })

  ipcMain.handle('settings:load', loadSettings)
  ipcMain.handle('settings:save', (_event, settings: AppSettings) => saveSettings(settings))
  ipcMain.handle('provider:test', (_event, provider: ProviderId, config: ProviderConfig) => testProvider(provider, config))
  ipcMain.handle('answer:prepare', (_event, request: AnswerRequest) => prepareAnswer(request))
  ipcMain.handle('answer:complete', (_event, request: AnswerRequest) => completeAnswer(request))
  // 流式回答：通过事件通道持续推送增量文本
  ipcMain.on('answer:stream-start', async (event, request: AnswerRequest) => {
    try {
      await streamAnswer(request, (chunk: AnswerStreamChunk) => {
        event.sender.send('answer:stream-chunk', chunk)
      })
    } catch (error) {
      event.sender.send('answer:stream-chunk', {
        text: '',
        done: true,
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  })
  ipcMain.handle('role-jd:generate', (_event, request: RoleJdGenerateRequest) => generateRoleJd(request))
  ipcMain.handle('training:turn', (_event, request: TrainingTurnRequest) => generateTrainingTurn(request))
  ipcMain.handle('background-prep:generate', (_event, request: BackgroundPrepGenerateRequest) => generateBackgroundPrep(request))
  ipcMain.handle('background-prep:search', (_event, request: BackgroundPrepSearchRequest) => searchBackgroundPublicInfo(request))
  ipcMain.handle('interview-review:transcribe-audio', (_event, request: InterviewReviewTranscriptionRequest) => transcribeInterviewAudio(request))
  ipcMain.handle('interview-review:deep-report', (_event, request: InterviewReviewDeepReportRequest) => generateInterviewReviewDeepReport(request))
  ipcMain.handle('interview-review:deep-talk', (_event, request: InterviewReviewDeepTalkRequest) => generateInterviewReviewDeepTalk(request))
  ipcMain.handle('interview-review:list-records', loadInterviewReviews)
  ipcMain.handle('interview-review:save-record', (_event, record: InterviewReviewRecord) => saveInterviewReview(record))
  ipcMain.handle('interview-review:delete-records', (_event, ids: string[]) => deleteInterviewReviews(ids))
  ipcMain.handle('sessions:list', loadSessions)
  ipcMain.handle('sessions:save', (_event, session: InterviewSession) => saveSession(session))
  ipcMain.handle('sessions:delete', (_event, ids: string[]) => deleteSessions(ids))
  ipcMain.handle('usage:load', loadUsage)
  ipcMain.handle('usage:set-budget', (_event, provider: LlmProviderId, budgetTokens: number) => setUsageBudget(provider, budgetTokens))
  ipcMain.handle('usage:set-money-budget', (_event, provider: LlmProviderId, budgetCny: number) => setUsageMoneyBudget(provider, budgetCny))
  ipcMain.handle('desktop:sources', listDesktopAudioSources)
  ipcMain.handle('desktop:set-source', (_event, sourceId: string) => setDesktopAudioSourceId(sourceId))
  ipcMain.handle('tts:synthesize', (_event, request: LocalSpeechSynthesisRequest) => synthesizeLocalSpeech(request))
  ipcMain.handle('backup:export', (_event, options) => exportBackup(options))
  ipcMain.handle('backup:import', (_event, payload: Partial<BackupPayload>) => importBackup(payload))
  ipcMain.handle('floating:update', (_event, payload: FloatingPayload) => sendFloatingPayload(payload))
  ipcMain.handle('floating:hide', hideFloatingWindow)
  ipcMain.handle('floating:toggle-maximize', toggleFloatingMaximize)
  ipcMain.handle('docs:open', (_event, docPath: string) => openDocFile(docPath))
  ipcMain.handle('external:open', (_event, url: string) => shell.openExternal(url))
  ipcMain.handle('app:update-status', getCurrentUpdateStatus)
  ipcMain.handle('app:update-check', checkForUpdatesManually)
  ipcMain.handle('app:update-download', downloadAvailableUpdate)
  ipcMain.handle('app:update-install', installDownloadedUpdate)
  ipcMain.handle('app:restart', () => {
    if (!app.isPackaged) {
      BrowserWindow.getAllWindows().forEach((window) => {
        if (!window.isDestroyed()) {
          window.webContents.reloadIgnoringCache()
        }
      })
      return { mode: 'reload' }
    }

    app.relaunch({ args: process.argv.slice(1) })
    app.quit()
    return { mode: 'relaunch' }
  })

  registerAutoUpdateEvents((status) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      if (!window.isDestroyed()) {
        window.webContents.send('app:update-status-changed', status)
      }
    })
  })

  setTimeout(() => {
    checkForUpdatesOnStartup()
  }, 8000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})




