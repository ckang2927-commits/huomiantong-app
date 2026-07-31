import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { providerNames, type ToastMessage } from '../lib/appHelpers'
import { downloadText, safeFileName, sessionToMarkdown, sessionToWordHtml } from '../lib/sessionExport'
import { clearTrainingDraft as removeTrainingDraft, loadTrainingDraft, saveTrainingDraft as persistTrainingDraft } from '../lib/trainingDraftStore'
import { loadMockInterviewConfig } from '../lib/mockInterviewConfigStore'
import type { MockInterviewConfig } from '../lib/mockInterviewConfigStore'
import type { TrainingFocusPlan } from '../lib/trainingInsights'
import { buildTrainingInterviewSession, defaultTrainingSessionTitle } from '../lib/trainingSessionExport'
import {
  buildTrainingTrendEntry,
  clearTrainingTrendEntries as removeTrainingTrendEntries,
  loadTrainingTrendEntries,
  saveTrainingTrendEntry,
  type TrainingTrendEntry
} from '../lib/trainingTrendStore'
import type { TrainingDraftPayload } from '../lib/trainingDraftStore'
import type {
  AppSettings,
  InterviewSession,
  SpeechExpressionScore,
  TrainingMode,
  TrainingPreset,
  TrainingQuestionCount,
  TrainingRound,
  UsageStats
} from '../../shared/types'

type ShowToast = (text: string, kind?: ToastMessage['kind']) => void

type UseTrainingSessionOptions = {
  settings: AppSettings
  setUsageStats: Dispatch<SetStateAction<UsageStats>>
  saveSessionSnapshot: (session: InterviewSession) => Promise<InterviewSession[]>
  shouldAutoRestoreDraft: boolean
  onUpdateAnswer: (patch: Partial<AppSettings['answer']>) => void
  showToast: ShowToast
}

export function useTrainingSession({ settings, setUsageStats, saveSessionSnapshot, shouldAutoRestoreDraft, onUpdateAnswer, showToast }: UseTrainingSessionOptions) {
  const [trainingMode, setTrainingMode] = useState<TrainingMode>('comprehensive')
  const [roundCount, setRoundCount] = useState<TrainingQuestionCount>(10)
  const [questionOutline, setQuestionOutline] = useState<string[]>([])
  const [questionFocus, setQuestionFocus] = useState<string[]>([])
  const [rounds, setRounds] = useState<TrainingRound[]>([])
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [finalReport, setFinalReport] = useState('')
  const [isGeneratingTraining, setIsGeneratingTraining] = useState(false)
  const [isSavingTraining, setIsSavingTraining] = useState(false)
  const [lastProvider, setLastProvider] = useState<string>('local')
  const [lastLatencyMs, setLastLatencyMs] = useState(0)
  const [savedSessionId, setSavedSessionId] = useState<string>()
  const [savedSessionTitle, setSavedSessionTitle] = useState('')
  const [lastSavedAt, setLastSavedAt] = useState(0)
  const [draftSavedAt, setDraftSavedAt] = useState(() => loadTrainingDraft()?.savedAt || 0)
  const [autoRestoredDraftAt, setAutoRestoredDraftAt] = useState(0)
  const [hasTriedAutoRestore, setHasTriedAutoRestore] = useState(false)
  const [trainingTrendEntries, setTrainingTrendEntries] = useState<TrainingTrendEntry[]>(() => loadTrainingTrendEntries())

  const answeredCount = rounds.filter((round) => round.answer?.trim()).length
  const isTrainingRunning = rounds.length > 0 && !finalReport
  const canPersistTraining = finalReport.trim().length > 0 && answeredCount > 0
  const hasTrainingDraft = draftSavedAt > 0

  useEffect(() => {
    if (!shouldAutoRestoreDraft || hasTriedAutoRestore) {
      return
    }

    setHasTriedAutoRestore(true)

    if (hasDraftableTraining()) {
      return
    }

    const draft = loadTrainingDraft()

    if (!draft) {
      setDraftSavedAt(0)
      return
    }

    applyTrainingDraft(draft)
    setAutoRestoredDraftAt(draft.savedAt)
    showToast(`已自动恢复上次训练草稿：${new Date(draft.savedAt).toLocaleString('zh-CN')}`)
  }, [shouldAutoRestoreDraft, hasTriedAutoRestore])

  useEffect(() => {
    if (!hasDraftableTraining()) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      persistCurrentDraft()
    }, 600)

    return () => window.clearTimeout(timer)
  }, [settings, trainingMode, roundCount, questionOutline, questionFocus, rounds, currentAnswer, finalReport, lastProvider, lastLatencyMs, savedSessionId, savedSessionTitle, lastSavedAt])

  useEffect(() => {
    const entry = buildTrainingTrendEntry({
      settings,
      trainingMode,
      roundCount,
      rounds,
      finalReport,
      provider: lastProvider
    })

    if (!entry) {
      return
    }

    const result = saveTrainingTrendEntry(entry)
    setTrainingTrendEntries(result.entries)

    if (result.saved) {
      showToast('本轮训练成绩已记录到趋势看板')
    }
  }, [settings, trainingMode, roundCount, rounds, finalReport, lastProvider])

  async function refreshUsage(): Promise<void> {
    try {
      setUsageStats(await window.huomiantong.loadUsage())
    } catch {
      // 用量刷新失败不影响训练主流程
    }
  }

  async function startTraining(options?: { roundCount?: TrainingQuestionCount; mockInterviewConfig?: MockInterviewConfig }): Promise<void> {
    const nextRoundCount = normalizeRuntimeQuestionCount(options?.roundCount ?? roundCount)

    await beginTraining({
      settingsForRequest: settings,
      mode: trainingMode,
      count: nextRoundCount,
      outline: questionOutline,
      focus: options?.mockInterviewConfig?.focus || questionFocus,
      mockInterviewConfig: options?.mockInterviewConfig
    })
  }

  async function startTrainingFromPreset(preset: TrainingPreset): Promise<void> {
    if (isGeneratingTraining) {
      return
    }

    if (hasDraftableTraining() && !window.confirm(`套用“${preset.label}”会清空当前模拟训练记录并切换到${preset.roleLabel}，确定继续吗？`)) {
      return
    }

    const nextSettings: AppSettings = {
      ...settings,
      answer: {
        ...settings.answer,
        interviewMode: preset.interviewMode
      }
    }

    onUpdateAnswer({ interviewMode: preset.interviewMode })
    setTrainingMode(preset.trainingMode)
    setRoundCount(preset.roundCount)
    setQuestionOutline(normalizeQuestionOutline(preset.questionOutline))
    setQuestionFocus(normalizeQuestionFocus(preset.focus))
    await beginTraining({
      settingsForRequest: nextSettings,
      mode: preset.trainingMode,
      count: preset.roundCount,
      outline: normalizeQuestionOutline(preset.questionOutline),
      focus: normalizeQuestionFocus(preset.focus),
      presetLabel: preset.label
    })
  }

  async function startFocusedTraining(plan: TrainingFocusPlan): Promise<void> {
    if (isGeneratingTraining) {
      return
    }

    if (hasDraftableTraining() && !window.confirm(`开始“${plan.label}”会清空当前模拟训练记录，确定继续吗？`)) {
      return
    }

    const outline = normalizeQuestionOutline(plan.questions)
    const nextRoundCount: TrainingQuestionCount = 10

    setTrainingMode(plan.mode)
    setRoundCount(nextRoundCount)
    setQuestionOutline(outline)
    setQuestionFocus([])
    await beginTraining({
      settingsForRequest: settings,
      mode: plan.mode,
      count: nextRoundCount,
      outline,
      focus: [],
      presetLabel: plan.label
    })
  }

  async function beginTraining({
    settingsForRequest,
    mode,
    count,
    outline,
    focus,
    mockInterviewConfig,
    presetLabel
  }: {
    settingsForRequest: AppSettings
    mode: TrainingMode
    count: TrainingQuestionCount
    outline: string[]
    focus?: string[]
    mockInterviewConfig?: MockInterviewConfig
    presetLabel?: string
  }): Promise<void> {
    if (isGeneratingTraining) {
      return
    }

    if (!presetLabel && rounds.length > 0 && !window.confirm('重新开始会清空当前模拟训练记录，确定继续吗？')) {
      return
    }

    setIsGeneratingTraining(true)
    setRoundCount(count)
    setQuestionFocus(normalizeQuestionFocus(focus))
    setRounds([])
    setCurrentAnswer('')
    setFinalReport('')
    setSavedSessionId(undefined)
    setSavedSessionTitle('')
    setLastSavedAt(0)

    try {
      const result = await window.huomiantong.generateTrainingTurn({
        settings: settingsForRequest,
        trainingMode: mode,
        roundCount: count,
        questionOutline: outline,
        questionFocus: normalizeQuestionFocus(focus),
        mockInterviewConfig: mockInterviewConfig || loadMockInterviewConfig(),
        rounds: []
      })

      setLastProvider(result.provider)
      setLastLatencyMs(result.latencyMs)

      if (result.nextQuestion) {
        setRounds([createTrainingRound(result.nextQuestion, result.referenceAnswer, result.nextQuestionKind)])
        showToast(result.provider === 'local' ? `${presetLabel || '模拟训练'}已开始（本地兜底）` : `${providerNames[result.provider]} 已生成${presetLabel ? `“${presetLabel}”` : '训练'}第一题`)
      } else {
        setFinalReport(result.finalReport || '训练启动失败：没有生成题目，请检查模型设置后重试。')
        showToast('没有生成训练题目，请检查模型设置', 'error')
      }

      await refreshUsage()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '模拟训练启动失败', 'error')
    } finally {
      setIsGeneratingTraining(false)
    }
  }

  async function submitAnswer(answerText?: string, speechScore?: SpeechExpressionScore): Promise<void> {
    if (isGeneratingTraining) {
      return
    }

    const answer = (answerText ?? currentAnswer).trim()
    const activeIndex = rounds.findIndex((round) => !round.answer?.trim())

    if (activeIndex < 0) {
      showToast(rounds.length ? '当前没有待回答的问题' : '请先开始模拟训练', 'info')
      return
    }

    if (!answer) {
      showToast('先写一点回答内容，再提交给 AI 面试官点评', 'info')
      return
    }

    const answeredRounds = rounds.map((round, index) =>
      index === activeIndex
        ? {
            ...round,
            answer,
            speechScore,
            answeredAt: Date.now()
          }
        : round
    )

    setRounds(answeredRounds)
    setCurrentAnswer('')
    setIsGeneratingTraining(true)

    try {
      const result = await window.huomiantong.generateTrainingTurn({
        settings,
        trainingMode,
        roundCount,
        questionOutline,
        questionFocus,
        mockInterviewConfig: loadMockInterviewConfig(),
        rounds: answeredRounds
      })
      const withFeedback = answeredRounds.map((round, index) =>
        index === activeIndex
          ? {
              ...round,
              feedback: result.feedback,
              score: result.score
            }
          : round
      )
      const nextRounds = result.nextQuestion
        ? [...withFeedback, createTrainingRound(result.nextQuestion, result.referenceAnswer, result.nextQuestionKind)]
        : withFeedback

      setRounds(nextRounds)
      setFinalReport(result.finalReport || '')
      setLastProvider(result.provider)
      setLastLatencyMs(result.latencyMs)
      showToast(result.done ? '模拟训练完成，复盘报告已生成' : `第 ${activeIndex + 1} 题已点评，下一题来了`)
      await refreshUsage()
    } catch (error) {
      showToast(error instanceof Error ? error.message : '提交训练回答失败', 'error')
      setCurrentAnswer(answer)
    } finally {
      setIsGeneratingTraining(false)
    }
  }

  function resetTraining(): void {
    if (rounds.length > 0 && !window.confirm('确定清空当前模拟训练吗？')) {
      return
    }

    setRounds([])
    setCurrentAnswer('')
    setFinalReport('')
    setQuestionOutline([])
    setQuestionFocus([])
    setLastLatencyMs(0)
    setSavedSessionId(undefined)
    setSavedSessionTitle('')
    setLastSavedAt(0)
    removeTrainingDraft()
    setDraftSavedAt(0)
    setAutoRestoredDraftAt(0)
  }

  function saveTrainingDraft(): void {
    if (!hasDraftableTraining()) {
      showToast('先开始一轮训练，再保存草稿', 'info')
      return
    }

    const draft = persistCurrentDraft()
    showToast(`训练草稿已保存：${new Date(draft.savedAt).toLocaleString('zh-CN')}`)
  }

  function restoreTrainingDraft(): void {
    const draft = loadTrainingDraft()

    if (!draft) {
      setDraftSavedAt(0)
      showToast('没有可恢复的训练草稿', 'info')
      return
    }

    if (hasDraftableTraining() && !window.confirm('恢复草稿会覆盖当前训练进度，确定继续吗？')) {
      return
    }

    applyTrainingDraft(draft)
    setAutoRestoredDraftAt(0)
    showToast(`已恢复训练草稿：${new Date(draft.savedAt).toLocaleString('zh-CN')}`)
  }

  function clearTrainingDraft(): void {
    if (!hasTrainingDraft) {
      return
    }

    if (!window.confirm('确定清除本地训练草稿吗？当前页面内容不会被清空。')) {
      return
    }

    removeTrainingDraft()
    setDraftSavedAt(0)
    showToast('训练草稿已清除')
  }

  function clearTrainingTrend(): void {
    if (trainingTrendEntries.length === 0) {
      return
    }

    if (!window.confirm('确定清空训练成绩趋势记录吗？这不会删除会话记录。')) {
      return
    }

    removeTrainingTrendEntries()
    setTrainingTrendEntries([])
    showToast('训练成绩趋势已清空')
  }

  async function saveTrainingSession(): Promise<void> {
    if (!canPersistTraining) {
      showToast('完成整轮训练并生成复盘后，再保存到会话记录', 'info')
      return
    }

    if (isSavingTraining) {
      return
    }

    const defaultTitle = savedSessionTitle || defaultTrainingSessionTitle(settings, trainingMode)
    const input = window.prompt('保存训练复盘名称', defaultTitle)

    if (input === null) {
      return
    }

    const title = input.trim() || defaultTitle
    const session = buildTrainingInterviewSession({
      settings,
      trainingMode,
      roundCount,
      rounds,
      finalReport,
      provider: lastProvider,
      sessionId: savedSessionId,
      title
    })

    setIsSavingTraining(true)

    try {
      await saveSessionSnapshot(session)
      setSavedSessionId(session.id)
      setSavedSessionTitle(title)
      setLastSavedAt(Date.now())
      showToast('训练复盘已保存到会话记录')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '训练复盘保存失败', 'error')
    } finally {
      setIsSavingTraining(false)
    }
  }

  function exportTraining(format: 'md' | 'word'): void {
    if (!canPersistTraining) {
      showToast('完成整轮训练并生成复盘后，再导出文件', 'info')
      return
    }

    const session = buildTrainingInterviewSession({
      settings,
      trainingMode,
      roundCount,
      rounds,
      finalReport,
      provider: lastProvider,
      sessionId: savedSessionId,
      title: savedSessionTitle || defaultTrainingSessionTitle(settings, trainingMode)
    })
    const fileName = safeFileName(session.title)
    const privacyMode = settings.answer.privacyMode ?? false

    if (format === 'word') {
      downloadText(`${fileName}.doc`, sessionToWordHtml(session, privacyMode), 'application/msword;charset=utf-8')
      showToast('训练复盘 Word 导出成功')
      return
    }

    downloadText(`${fileName}.md`, sessionToMarkdown(session, privacyMode))
    showToast('训练复盘 MD 导出成功')
  }

  function updateTrainingMode(mode: TrainingMode): void {
    setTrainingMode(mode)
    setQuestionOutline([])
    setQuestionFocus([])
  }

  function updateRoundCount(count: TrainingQuestionCount): void {
    setRoundCount(count)
    setQuestionOutline([])
  }

  return {
    trainingMode,
    roundCount,
    rounds,
    currentAnswer,
    finalReport,
    isTrainingRunning,
    isGeneratingTraining,
    isSavingTraining,
    answeredCount,
    canPersistTraining,
    hasTrainingDraft,
    trainingTrendEntries,
    lastProvider,
    lastLatencyMs,
    lastSavedAt,
    draftSavedAt,
    autoRestoredDraftAt,
    setTrainingMode: updateTrainingMode,
    setRoundCount: updateRoundCount,
    setCurrentAnswer,
    startTraining,
    submitAnswer,
    resetTraining,
    saveTrainingSession,
    exportTraining,
    saveTrainingDraft,
    restoreTrainingDraft,
    clearTrainingDraft,
    clearTrainingTrend,
    startTrainingFromPreset,
    startFocusedTraining
  }

  function hasDraftableTraining(): boolean {
    return rounds.length > 0 || currentAnswer.trim().length > 0 || finalReport.trim().length > 0
  }

  function persistCurrentDraft() {
    const draft = persistTrainingDraft(
      {
        trainingMode,
        roundCount,
        questionOutline,
        questionFocus,
        rounds,
        currentAnswer,
        finalReport,
        lastProvider,
        lastLatencyMs,
        savedSessionId,
        savedSessionTitle,
        lastSavedAt
      },
      settings
    )

    setDraftSavedAt(draft.savedAt)
    return draft
  }

  function applyTrainingDraft(draft: TrainingDraftPayload): void {
    setTrainingMode(draft.trainingMode)
    setRoundCount(draft.roundCount)
    setQuestionOutline(draft.questionOutline)
    setQuestionFocus(draft.questionFocus)
    setRounds(draft.rounds)
    setCurrentAnswer(draft.currentAnswer)
    setFinalReport(draft.finalReport)
    setLastProvider(draft.lastProvider)
    setLastLatencyMs(draft.lastLatencyMs)
    setSavedSessionId(draft.savedSessionId)
    setSavedSessionTitle(draft.savedSessionTitle)
    setLastSavedAt(draft.lastSavedAt)
    setDraftSavedAt(draft.savedAt)
  }
}

function normalizeQuestionOutline(value?: string[]): string[] {
  return Array.isArray(value) ? value.map((question) => question.trim()).filter(Boolean).slice(0, 20) : []
}

function normalizeQuestionFocus(value?: string[]): string[] {
  return Array.isArray(value) ? value.map((item) => item.trim()).filter(Boolean).slice(0, 12) : []
}

function normalizeRuntimeQuestionCount(value: unknown): TrainingQuestionCount {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return 10
  }

  return Math.min(40, Math.max(3, Math.round(parsed)))
}

function createTrainingRound(question: string, referenceAnswer?: string, kind?: TrainingRound['kind']): TrainingRound {
  return {
    id: crypto.randomUUID(),
    question,
    referenceAnswer,
    kind,
    at: Date.now()
  }
}
