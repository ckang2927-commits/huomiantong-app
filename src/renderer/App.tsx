import { useEffect, useMemo, useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { AppTopbar, SidebarNav, ToastNotice } from './components/AppLayoutParts'
import { useAudioDeviceSettings } from './hooks/useAudioDeviceSettings'
import { useAudioTranscription } from './hooks/useAudioTranscription'
import { useAnswerGeneration } from './hooks/useAnswerGeneration'
import { useHealthCheck } from './hooks/useHealthCheck'
import { useInterviewSessionActions } from './hooks/useInterviewSessionActions'
import { useInterviewSimulation } from './hooks/useInterviewSimulation'
import { useResumeProfiles } from './hooks/useResumeProfiles'
import { useRoleJdGeneration } from './hooks/useRoleJdGeneration'
import { useSessions } from './hooks/useSessions'
import { useSettingsBackup } from './hooks/useSettingsBackup'
import { useSyncedRef } from './hooks/useSyncedRef'
import { useTrainingSession } from './hooks/useTrainingSession'
import { useTranscriptRouting } from './hooks/useTranscriptRouting'
import { useGlobalHotkeys } from './hooks/useGlobalHotkeys'
import { useInterviewWarmup } from './hooks/useInterviewWarmup'
import { filterWorkspaceTranscript } from './lib/transcriptFilter'
import { speechProviderNames } from '../shared/speechProviders'
import { useSettingsStore } from './stores/useSettingsStore'
import { useUIStore } from './stores/useUIStore'
import {
  createSession,
  providerNames,
  type ViewId
} from './lib/appHelpers'
import { buildReview } from './lib/sessionExport'
import { appendSpokenAnswer, stripTrainingAnswerCompletionCue } from './lib/trainingAnswerCompletion'
import { HealthCheckView } from './views/HealthCheckView'
import { HelpCenterView } from './views/HelpCenterView'
import { InterviewReviewView } from './views/InterviewReviewView'
import { RealisticInterviewView } from './views/RealisticInterviewView'
import { ResumeView } from './views/ResumeView'
import { SettingsView } from './views/SettingsView'
import { SessionsView } from './views/SessionsView'
import { TrainingView } from './views/TrainingView'
import { WorkspaceView } from './views/WorkspaceView'
import { UpdateExperience } from './components/UpdateExperience'
import { NewUserOnboarding } from './components/NewUserOnboarding'
import { markOnboardingMilestone } from './lib/onboardingProgress'
import type { AppSettings, InterviewSession, TrainingPreset, WarmupQuestionCount, UsageStats, ProviderId, ProviderTestResult } from '../shared/types'

function useStoreSetUsageStats(): Dispatch<SetStateAction<UsageStats>> {
  return useCallback((value: UsageStats | ((prev: UsageStats) => UsageStats)) => {
    if (typeof value === 'function') {
      const prev = useSettingsStore.getState().usageStats
      useSettingsStore.getState().setUsageStats((value as (prev: UsageStats) => UsageStats)(prev))
    } else {
      useSettingsStore.getState().setUsageStats(value)
    }
  }, [])
}

export function App(): JSX.Element {
  // --- Zustand stores ---
  const activeView = useUIStore((s) => s.activeView)
  const setActiveView = useUIStore((s) => s.setActiveView)
  const showToast = useUIStore((s) => s.showToast)
  const toast = useUIStore((s) => s.toast)
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed)
  const isScrollActive = useUIStore((s) => s.isScrollActive)
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)

  const settings = useSettingsStore((s) => s.settings)
  const usageStats = useSettingsStore((s) => s.usageStats)
  const providerTests = useSettingsStore((s) => s.providerTests)
  const testingProvider = useSettingsStore((s) => s.testingProvider)
  const setUsageStats = useStoreSetUsageStats()
  const updateAnswer = useSettingsStore((s) => s.updateAnswer)
  const updateSpeech = useSettingsStore((s) => s.updateSpeech)
  const setProviderTests = useCallback((value: Partial<Record<ProviderId, ProviderTestResult>> | ((prev: Partial<Record<ProviderId, ProviderTestResult>>) => Partial<Record<ProviderId, ProviderTestResult>>)) => {
    if (typeof value === 'function') {
      const prev = useSettingsStore.getState().providerTests
      useSettingsStore.getState().setProviderTests((value as (prev: Partial<Record<ProviderId, ProviderTestResult>>) => Partial<Record<ProviderId, ProviderTestResult>>)(prev))
    } else {
      useSettingsStore.getState().setProviderTests(value)
    }
  }, [])

  const [session, setSession] = useState<InterviewSession>(() => createSession())
  const [isSimulating, setIsSimulating] = useState(false)
  const [autoAnswer, setAutoAnswer] = useState(false)
  const [isTranscriptPaused, setIsTranscriptPaused] = useState(false)
  const [pausedTranscriptCount, setPausedTranscriptCount] = useState(0)
  const [warmupQuestionCount, setWarmupQuestionCount] = useState<WarmupQuestionCount>(30)
  const trainingAnswerBufferRef = useRef('')
  const trainingAnswerActionsRef = useRef({
    appendTranscript: (_text: string) => {},
    finishAnswer: (_text?: string) => {}
  })

  const settingsRef = useSyncedRef(settings)
  const sessionRef = useSyncedRef(session)
  const autoAnswerRef = useSyncedRef(autoAnswer)
  const latestTranscript = useMemo(() => session.transcript.slice(-5), [session.transcript])

  useEffect(() => {
    useSettingsStore.getState().loadAll()
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => useUIStore.getState().dismissToast(), toast.kind === 'error' ? 5200 : 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const openDiagnosticsFromToast = useCallback(() => {
    setActiveView('checkup')
    useUIStore.getState().dismissToast()
    window.setTimeout(() => {
      document.querySelector('.diagnostic-log-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }, [setActiveView])

  useEffect(() => {
    let timer = 0
    const markScrolling = () => {
      useUIStore.getState().setScrollActive(true)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => useUIStore.getState().setScrollActive(false), 1000)
    }
    window.addEventListener('scroll', markScrolling, true)
    window.addEventListener('wheel', markScrolling, { passive: true })
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', markScrolling, true)
      window.removeEventListener('wheel', markScrolling)
    }
  }, [])

  const {
    audioDeviceError,
    audioInputDevices,
    desktopAudioSources,
    isRefreshingAudioDevices,
    isRefreshingDesktopSources,
    isRunningMicrophoneDiagnostic,
    microphonePermission,
    microphoneDiagnostic,
    refreshAudioDevices,
    refreshDesktopAudioSources,
    resetAudioUiState,
    runMicrophoneDiagnostic,
    selectedMicrophoneDeviceId,
    selectedMicrophoneLabel,
    selectedSystemSourceId,
    selectedSystemSourceName,
    setSelectedMicrophoneDeviceId,
    setSelectedSystemSourceId,
    systemAudioSupported
  } = useAudioDeviceSettings({ showToast })

  const {
    state: warmupState,
    startWarmup,
    pauseWarmup,
    clearCache: clearWarmupCache,
    checkCache: checkCachedAnswer
  } = useInterviewWarmup({ settings })

  const {
    question,
    setQuestion,
    prepared,
    completed,
    isGenerating,
    streamingText,
    queuedCount,
    queuedAnswers,
    generateAnswerFrom,
    generateAnswer,
    resetAnswerState,
    startNewSession,
    exportCurrentReview,
    latencyReport,
    openFloatingWindow,
    questionRewriteNotice,
    questionIntentNotice,
    contextCompressionNotice
  } = useAnswerGeneration({
    checkCachedAnswer,
    settings,
    currentSessionRef: sessionRef,
    setCurrentSession: setSession,
    setUsageStats,
    showToast
  })

  const {
    addManualQuestion,
    addTranscriptLine,
    saveCurrentSession
  } = useInterviewSessionActions({
    autoAnswerRef,
    currentSessionRef: sessionRef,
    generateAnswerFrom,
    question,
    saveSessionSnapshot: async (s) => {
      // Will be provided below
      return []
    },
    setCurrentSession: setSession,
    setQuestion,
    settingsRef,
    showToast
  })

  const onMissingDeepgramKey = useCallback(() => {
    showToast('还没有配置 Deepgram API Key，请先到设置中心填写并测试连接。', 'error')
  }, [showToast])

  const handleWorkspaceTranscript = useCallback((text: string) => {
    if (isTranscriptPaused) {
      setPausedTranscriptCount((count) => count + 1)
      return
    }

    const filtered = filterWorkspaceTranscript(text)

    if (!filtered.accepted) {
      console.info(`[transcript] filtered ${filtered.reason || 'invalid'}: ${text}`)
      return
    }

    const currentSession = sessionRef.current
    const line = { id: crypto.randomUUID(), speaker: 'interviewer' as const, text: filtered.text, at: Date.now(), isFinal: true }
    const nextTranscript = [...currentSession.transcript, line]

    setSession((prev) => ({ ...prev, transcript: [...prev.transcript, line] }))

    if (autoAnswerRef.current) {
      void generateAnswerFrom(filtered.text, nextTranscript)
    }
  }, [autoAnswerRef, generateAnswerFrom, isTranscriptPaused, sessionRef, setSession])

  const handleTrainingAnswerTranscript = useCallback((text: string) => {
    trainingAnswerActionsRef.current.appendTranscript(text)
  }, [])

  const onTranscriptFinal = useCallback((text: string) => {
    const { routeFinalTranscript } = useTranscriptRoutingStore.getState()
    routeFinalTranscript(text)
  }, [])

  const {
    isListening,
    listeningMode,
    startAudioTranscription,
    stopAudioTranscription,
    interimTranscript,
    transcriptError,
    transcriptionStats,
    connectionStatus,
    inputLevel
  } = useAudioTranscription({
    settings,
    selectedMicrophoneDeviceId,
    audioInputDevices,
    selectedMicrophoneLabel,
    selectedSystemSourceId,
    selectedSystemSourceName,
    onTranscriptFinal,
    onMissingDeepgramKey,
    showToast
  })

  const audioTopbarStatus = useMemo(() => {
    const speechProvider = settings.speech.sttProvider
    const speechConfig =
      speechProvider === 'deepgram'
        ? {
            ...settings.speech.providers.deepgram,
            enabled: settings.speech.providers.deepgram.enabled || settings.providers.deepgram.enabled,
            apiKey: settings.speech.providers.deepgram.apiKey || settings.providers.deepgram.apiKey
          }
        : settings.speech.providers[speechProvider]
    const speechProviderName = speechProviderNames[speechProvider]

    if (isListening) {
      const source = listeningMode === 'system' ? '电脑音频' : '麦克风'
      return {
        kind: 'live' as const,
        label: `${source}接收中`,
        detail: `${source}正在通过 ${speechProviderName} 实时转写，连接状态：${connectionStatus}。`
      }
    }

    if (!speechConfig.enabled || !speechConfig.apiKey.trim()) {
      return {
        kind: 'warn' as const,
        label: '语音 Key 未配',
        detail: `${speechProviderName} 未启用或 API Key 未填写，实时语音转写不可用。`
      }
    }

    if (microphonePermission === 'denied') {
      return {
        kind: 'error' as const,
        label: '麦克风被拒绝',
        detail: '系统拒绝了麦克风权限，请到 Windows 隐私权限里打开后再试。'
      }
    }

    if (microphonePermission === 'unsupported') {
      return {
        kind: 'error' as const,
        label: '语音不支持',
        detail: '当前环境不支持麦克风设备枚举或录音能力。'
      }
    }

    if (microphonePermission === 'checking') {
      return {
        kind: 'warn' as const,
        label: '麦克风检测中',
        detail: '正在读取系统麦克风权限和设备列表。'
      }
    }

    if (audioInputDevices.length === 0) {
      return {
        kind: 'warn' as const,
        label: '未检测麦克风',
        detail: '暂时没有检测到可用麦克风，可以到面试台语音设置里刷新 / 授权。'
      }
    }

    return {
      kind: 'ok' as const,
      label: `${speechProviderName} 待机`,
      detail: selectedMicrophoneLabel ? `已检测到麦克风：${selectedMicrophoneLabel}` : '已检测到可用麦克风，等待开启转写。'
    }
  }, [
    audioInputDevices.length,
    connectionStatus,
    isListening,
    listeningMode,
    microphonePermission,
    selectedMicrophoneLabel,
    settings.providers.deepgram.apiKey,
    settings.providers.deepgram.enabled,
    settings.speech
  ])

  const modelTopbarStatus = useMemo(() => {
    const activeProvider = settings.answer.llmProvider
    const providerConfig = settings.providers[activeProvider]
    const providerLabel = providerNames[activeProvider]
    const testResult = providerTests[activeProvider]

    if (testingProvider === activeProvider) {
      return {
        kind: 'live' as const,
        label: `${providerLabel} 测试中`,
        detail: `正在测试当前回答模型：${providerLabel}。`
      }
    }

    if (!providerConfig.enabled) {
      return {
        kind: 'error' as const,
        label: `${providerLabel} 未启用`,
        detail: `当前回答模型服务商 ${providerLabel} 未启用，生成答案前需要到设置中心启用。`
      }
    }

    if (!providerConfig.apiKey.trim()) {
      return {
        kind: 'warn' as const,
        label: `${providerLabel} Key 未填`,
        detail: `当前回答模型 ${providerLabel} 没有填写 API Key，真实 AI 回答会失败。`
      }
    }

    if (testResult?.ok) {
      return {
        kind: 'ok' as const,
        label: `${providerLabel} 在线`,
        detail: `${providerLabel} 最近一次连接测试成功，耗时 ${testResult.latencyMs}ms。`
      }
    }

    if (testResult && !testResult.ok) {
      return {
        kind: 'error' as const,
        label: `${providerLabel} 异常`,
        detail: `${providerLabel} 最近一次连接测试失败：${testResult.status || '失败'}，${testResult.message}`
      }
    }

    return {
      kind: 'warn' as const,
      label: `${providerLabel} 未测试`,
      detail: `${providerLabel} 已填写 Key，但还没有完成连接测试；建议先去设置中心测试。`
    }
  }, [providerTests, settings.answer.llmProvider, settings.providers, testingProvider])

  const {
    transcriptTarget,
    setTranscriptTarget,
    routeFinalTranscript
  } = useTranscriptRouting({
    onWorkspaceTranscript: handleWorkspaceTranscript,
    onTrainingAnswerTranscript: handleTrainingAnswerTranscript
  })

  const useTranscriptRoutingStore = { getState: () => ({ routeFinalTranscript }) }

  const handleToggleTranscriptPause = useCallback(() => {
    const next = !isTranscriptPaused
    setIsTranscriptPaused(next)
    if (next) {
      showToast('已暂停接收转写，本轮闲聊不会进入会话。', 'info')
      return
    }

    setPausedTranscriptCount(0)
    showToast('已恢复接收转写。', 'info')
  }, [isTranscriptPaused, showToast])

  const handleStartNewSession = useCallback(() => {
    setIsTranscriptPaused(false)
    setPausedTranscriptCount(0)
    startNewSession()
  }, [startNewSession])

  const {
    sessions,
    selectedSessionIds,
    openedSession,
    sessionProfileFilter,
    openedRecords,
    filteredSessions,
    setOpenedSession,
    setSessionProfileFilter,
    refreshSessions,
    saveSessionSnapshot,
    replaceSessions,
    exportSessionMarkdown,
    exportSessionWord,
    renameSession,
    toggleSessionSelection,
    exportSelectedSessions,
    deleteSelectedSessions
  } = useSessions({ currentSessionRef: sessionRef, setCurrentSession: setSession, showToast })

  const { generatingRoleJdMode, generateRoleJdWithAi } = useRoleJdGeneration()

  const trainingSession = useTrainingSession({
    settings,
    setUsageStats,
    saveSessionSnapshot,
    shouldAutoRestoreDraft: activeView === 'training',
    onUpdateAnswer: updateAnswer,
    showToast
  })

  useEffect(() => {
    if (activeView === 'training' && trainingSession.finalReport.trim() && trainingSession.answeredCount > 0) {
      markOnboardingMilestone('training')
    }
  }, [activeView, trainingSession.answeredCount, trainingSession.finalReport])

  useEffect(() => {
    trainingAnswerBufferRef.current = trainingSession.currentAnswer
  }, [trainingSession.currentAnswer])

  useEffect(() => {
    trainingAnswerActionsRef.current = {
      appendTranscript: (text: string) => {
        const parsed = stripTrainingAnswerCompletionCue(text)

        if (!parsed.text && !parsed.completed) {
          return
        }

        const nextAnswer = parsed.text ? appendSpokenAnswer(trainingAnswerBufferRef.current, parsed.text) : trainingAnswerBufferRef.current
        trainingAnswerBufferRef.current = nextAnswer
        trainingSession.setCurrentAnswer(nextAnswer)

        if (parsed.completed && nextAnswer.trim()) {
          setTranscriptTarget('workspace')
          stopAudioTranscription()
          void trainingSession.submitAnswer(nextAnswer)
        }
      },
      finishAnswer: (answerText?: string) => {
        const nextAnswer = (answerText ?? trainingAnswerBufferRef.current).trim()

        if (!nextAnswer) {
          return
        }

        trainingAnswerBufferRef.current = nextAnswer
        trainingSession.setCurrentAnswer(nextAnswer)
        setTranscriptTarget('workspace')
        stopAudioTranscription()
        void trainingSession.submitAnswer(nextAnswer)
      }
    }
  }, [setTranscriptTarget, stopAudioTranscription, trainingSession.setCurrentAnswer, trainingSession.submitAnswer])

  const {
    resumeProfiles,
    filteredResumeProfiles,
    resumeImportStatus,
    resumeSaveStatus,
    resumeSearch,
    isImportingResume,
    setResumeSearch,
    updateResume,
    addResumeProfile,
    selectResumeProfile,
    deleteResumeProfile,
    saveResume,
    importResume,
    removeOtherResume
  } = useResumeProfiles({
    onDeletedProfile: (id) => {
      if (sessionProfileFilter === id) {
        setSessionProfileFilter('all')
      }
    }
  })

  useInterviewSimulation({
    isSimulating,
    onTranscriptLine: addTranscriptLine
  })

  const {
    healthChecks,
    healthSummary,
    isRunningHealthCheck,
    runHealthCheck
  } = useHealthCheck()

  const [customTrainingPresets, setCustomTrainingPresets] = useState<TrainingPreset[]>([])
  const saveCustomTrainingPresets = useCallback((presets: TrainingPreset[]) => {
    setCustomTrainingPresets(presets)
    ;(window.huomiantong as any).saveCustomTrainingPresets?.(presets).catch(() => undefined)
  }, [])

  const {
    backupImportRef,
    backupStatus,
    exportBackup,
    handleBackupImport,
    openBackupImporter
  } = useSettingsBackup({
    currentSessionRef: sessionRef,
    replaceSessions,
    resetAnswerState,
    setCurrentSession: setSession,
    stopAudioTranscription
  })


  const openSettingsTarget = (section: 'api' | 'voice' | 'updates', focus?: string): void => {
    setActiveView('settings')
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('huomiantong:settings-section', { detail: { section } }))
      if (focus) {
        window.setTimeout(() => {
          window.dispatchEvent(new CustomEvent('huomiantong:settings-focus', { detail: { focus } }))
        }, 120)
      }
    }, 80)
  }

  const openResumeTarget = (field: 'candidateName' | 'targetRole' = 'candidateName'): void => {
    setActiveView('resume')
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('huomiantong:resume-focus', { detail: { field } }))
    }, 140)
  }

  return (
    <div className={'app-shell' + (isScrollActive ? ' scrolling' : '')}>
      <SidebarNav activeView={activeView} onChangeView={setActiveView} collapsed={true} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main>
        <AppTopbar
          activeView={activeView}
          audioStatus={audioTopbarStatus}
          isRunningHealthCheck={isRunningHealthCheck}
          modelStatus={modelTopbarStatus}
          onOpenAudioSettings={() => openSettingsTarget('voice', 'speech')}
          onOpenModelSettings={() => openSettingsTarget('api', settings.answer.llmProvider)}
          onRefreshSessions={refreshSessions}
          onRunHealthCheck={runHealthCheck}
          onSaveCurrentSession={saveCurrentSession}
          onOpenFloating={openFloatingWindow}
        />
        {activeView === 'workspace' && (
          <WorkspaceView
            audioSettings={{
              audioDeviceError,
              connectionLatencyMs: transcriptionStats.connectionLatencyMs,
              connectionStatus,
              activeSpeechProvider: settings.speech.sttProvider,
              speechEndpointingMs: settings.speech.endpointingMs,
              speechProviderReady: Boolean(
                (settings.speech.sttProvider === 'deepgram'
                  ? settings.speech.providers.deepgram.apiKey || settings.providers.deepgram.apiKey
                  : settings.speech.providers[settings.speech.sttProvider].apiKey
                ).trim()
              ),
              inputLevel,
              audioInputDevices,
              desktopAudioSources,
              isRefreshingAudioDevices,
              isRefreshingDesktopSources,
              isRunningMicrophoneDiagnostic,
              microphonePermission,
              microphoneDiagnostic,
              onRefreshAudioDevices: (requestPermission?: boolean) => refreshAudioDevices({ requestPermission }),
              onRefreshDesktopAudioSources: refreshDesktopAudioSources,
              onResetAudioUiState: resetAudioUiState,
              onRunMicrophoneDiagnostic: runMicrophoneDiagnostic,
              onSpeechEndpointingMsChange: (value) => updateSpeech({ endpointingMs: value }),
              onSpeechProviderChange: (provider) => updateSpeech({ sttProvider: provider }),
              selectedMicrophoneDeviceId,
              selectedMicrophoneLabel,
              selectedSystemSourceId,
              selectedSystemSourceName,
              onSelectedMicrophoneDeviceIdChange: setSelectedMicrophoneDeviceId,
              onSelectedSystemSourceIdChange: setSelectedSystemSourceId,
              systemAudioSupported,
              isListening,
              listeningMode
            }}
            resume={settings.resume}
            latestTranscript={latestTranscript}
            session={session}
            question={question}
            prepared={prepared}
            completed={completed}
            review={buildReview(session)}
            hasResume={settings.resume.formalResume.trim().length > 0}
            isListening={isListening}
            isTranscriptPaused={isTranscriptPaused}
            listeningMode={listeningMode}
            autoAnswer={autoAnswer}
            interimTranscript={interimTranscript}
            transcriptError={transcriptError}
            questionRewriteNotice={questionRewriteNotice}
            questionIntentNotice={questionIntentNotice}
            contextCompressionNotice={contextCompressionNotice}
            pausedTranscriptCount={pausedTranscriptCount}
            queuedCount={queuedCount}
            queuedAnswers={queuedAnswers}
            isGenerating={isGenerating}
            streamingText={streamingText}
            latencyReport={latencyReport}
            onSwitchResume={openResumeTarget}
            onStartAudioTranscription={startAudioTranscription}
            onStopAudioTranscription={stopAudioTranscription}
            onToggleTranscriptPause={handleToggleTranscriptPause}
            onToggleAutoAnswer={() => setAutoAnswer((prev) => !prev)}
            onStartNewSession={handleStartNewSession}
            onQuestionChange={setQuestion}
            onAddManualQuestion={addManualQuestion}
            onGenerateAnswer={generateAnswer}
            warmupAnswers={warmupState.answers}
            warmupIsGenerating={warmupState.isGenerating}
            warmupIsPaused={warmupState.isPaused}
            warmupProgress={warmupState.progress}
            warmupHasCache={warmupState.hasCache}
            warmupCachedAt={warmupState.cachedAt}
            warmupQuestionCount={warmupQuestionCount}
            onWarmupQuestionCountChange={(count) => setWarmupQuestionCount(count)}
            onStartWarmup={() => void startWarmup(warmupQuestionCount)}
            onPauseWarmup={pauseWarmup}
            onClearWarmupCache={clearWarmupCache}
            onExportCurrentReview={exportCurrentReview}
          />
        )}
        {activeView === 'checkup' && (
          <HealthCheckView
            checks={healthChecks}
            summary={healthSummary}
            isRunning={isRunningHealthCheck}
            onRun={runHealthCheck}
            onBackWorkspace={() => setActiveView('workspace')}
            onChangeView={setActiveView}
          />
        )}
        {activeView === 'help' && <HelpCenterView />}
        {activeView === 'interviewReview' && <InterviewReviewView onOpenSettings={() => setActiveView('settings')} />}
        {activeView === 'training' && (
          <TrainingView
            settings={settings}
            trainingMode={trainingSession.trainingMode}
            roundCount={trainingSession.roundCount}
            rounds={trainingSession.rounds}
            trainingTrendEntries={trainingSession.trainingTrendEntries}
            currentAnswer={trainingSession.currentAnswer}
            answerInterimTranscript={interimTranscript}
            answerSpeechStats={transcriptionStats}
            answerTranscriptError={transcriptError}
            finalReport={trainingSession.finalReport}
            answeredCount={trainingSession.answeredCount}
            canPersistTraining={trainingSession.canPersistTraining}
            draftSavedAt={trainingSession.draftSavedAt}
            hasTrainingDraft={trainingSession.hasTrainingDraft}
            isGeneratingTraining={trainingSession.isGeneratingTraining}
            isAnswerTranscribing={transcriptTarget === 'training-answer' && isListening}
            isSavingTraining={trainingSession.isSavingTraining}
            lastLatencyMs={trainingSession.lastLatencyMs}
            lastProvider={trainingSession.lastProvider}
            lastSavedAt={trainingSession.lastSavedAt}
            autoRestoredDraftAt={trainingSession.autoRestoredDraftAt ?? 0}
            onCurrentAnswerChange={trainingSession.setCurrentAnswer}
            onExportTraining={trainingSession.exportTraining}
            onOpenResume={() => setActiveView('resume')}
            onOpenRealisticInterview={() => setActiveView('realisticInterview')}
            onOpenSettings={() => setActiveView('settings')}
            onResetTraining={trainingSession.resetTraining}
            onRoundCountChange={trainingSession.setRoundCount}
            onRestoreTrainingDraft={trainingSession.restoreTrainingDraft}
            onSaveCustomTrainingPresets={saveCustomTrainingPresets}
            onSaveTrainingSession={trainingSession.saveTrainingSession}
            onSaveTrainingDraft={trainingSession.saveTrainingDraft}
            onClearTrainingDraft={trainingSession.clearTrainingDraft}
            onStartAnswerTranscription={() => {
              setTranscriptTarget('training-answer')
              void startAudioTranscription('microphone')
            }}
            onStartFocusedTraining={trainingSession.startFocusedTraining}
            onStartTraining={trainingSession.startTraining}
            onSubmitAnswer={trainingSession.submitAnswer}
            onFinishAnswer={(answerText) => {
              trainingAnswerActionsRef.current.finishAnswer(answerText)
            }}
            onStopAnswerTranscription={() => {
              setTranscriptTarget('workspace')
              stopAudioTranscription()
            }}
            onStartTrainingPreset={trainingSession.startTrainingFromPreset}
            onTrainingModeChange={trainingSession.setTrainingMode}
            onClearTrainingTrend={trainingSession.clearTrainingTrend}
          />
        )}
        {activeView === 'realisticInterview' && (
          <RealisticInterviewView
            settings={settings}
            roundCount={trainingSession.roundCount}
            rounds={trainingSession.rounds}
            currentAnswer={trainingSession.currentAnswer}
            answerInterimTranscript={interimTranscript}
            answerSpeechStats={transcriptionStats}
            answerTranscriptError={transcriptError}
            finalReport={trainingSession.finalReport}
            answeredCount={trainingSession.answeredCount}
            canPersistTraining={trainingSession.canPersistTraining}
            isGeneratingTraining={trainingSession.isGeneratingTraining}
            isAnswerTranscribing={transcriptTarget === 'training-answer' && isListening}
            isSavingTraining={trainingSession.isSavingTraining}
            lastLatencyMs={trainingSession.lastLatencyMs}
            lastProvider={trainingSession.lastProvider}
            onCurrentAnswerChange={trainingSession.setCurrentAnswer}
            onExportTraining={trainingSession.exportTraining}
            onOpenResume={() => setActiveView('resume')}
            onOpenSettings={() => setActiveView('settings')}
            onOpenTraining={() => setActiveView('training')}
            onMockInterviewConfigSaved={() => showToast('拟真面试配置已保存。', 'success')}
            onResetTraining={trainingSession.resetTraining}
            onRoundCountChange={trainingSession.setRoundCount}
            onSaveTrainingSession={trainingSession.saveTrainingSession}
            onStartAnswerTranscription={() => {
              setTranscriptTarget('training-answer')
              void startAudioTranscription('microphone')
            }}
            onStartTraining={trainingSession.startTraining}
            onSubmitAnswer={trainingSession.submitAnswer}
            onFinishAnswer={(answerText) => {
              trainingAnswerActionsRef.current.finishAnswer(answerText)
            }}
            onStopAnswerTranscription={() => {
              setTranscriptTarget('workspace')
              stopAudioTranscription()
            }}
          />
        )}
        {activeView === 'resume' && (
          <ResumeView
            filteredResumeProfiles={filteredResumeProfiles}
            isImportingResume={isImportingResume}
            onAddProfile={addResumeProfile}
            onDeleteProfile={deleteResumeProfile}
            onImportResume={importResume}
            onRemoveOtherResume={removeOtherResume}
            onResumeSearchChange={setResumeSearch}
            onSaveResume={saveResume}
            onSelectProfile={selectResumeProfile}
            onUpdateResume={updateResume}
            resumeImportStatus={resumeImportStatus}
            resumeSaveStatus={resumeSaveStatus}
            resumeSearch={resumeSearch}
            settings={settings}
          />
        )}
        {activeView === 'settings' && (
          <SettingsView
            backupImportRef={backupImportRef}
            backupStatus={backupStatus}
            onBackupImportChange={handleBackupImport}
            onExportBackup={exportBackup}
            onOpenBackupImporter={openBackupImporter}
            onGenerateRoleJdWithAi={generateRoleJdWithAi}
            generatingRoleJdMode={generatingRoleJdMode}
          />
        )}
        {activeView === 'sessions' && (
          <SessionsView
            filteredSessions={filteredSessions}
            onCloseOpenedSession={() => setOpenedSession(null)}
            onDeleteSessions={deleteSelectedSessions}
            onExportSelectedSessions={exportSelectedSessions}
            onExportSessionMarkdown={exportSessionMarkdown}
            onExportSessionWord={exportSessionWord}
            onFilterChange={setSessionProfileFilter}
            onOpenSession={setOpenedSession}
            onRenameSession={renameSession}
            onStartFocusedTraining={async (plan) => {
              await trainingSession.startFocusedTraining(plan)
              setActiveView('training')
            }}
            onToggleSessionSelection={toggleSessionSelection}
            openedRecords={openedRecords}
            openedSession={openedSession}
            resumeProfiles={resumeProfiles}
            selectedSessionIds={selectedSessionIds}
            sessionProfileFilter={sessionProfileFilter}
            sessions={sessions}
          />
        )}
      </main>
      <UpdateExperience />
      <NewUserOnboarding />
      {toast && <ToastNotice toast={toast} onOpenDiagnostics={openDiagnosticsFromToast} />}
    </div>
  )
}
