import { useEffect, useRef, useState, useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import {
  attachResumeToSession,
  createSession,
  resumeLabel,
  waitingPhrase,
  type QueuedAnswer,
  type ToastMessage
} from '../lib/appHelpers'
import {
  buildFloatingRecords,
  downloadText,
  maskEvidenceSnippets,
  maskSessionText,
  safeFileName,
  sessionToMarkdown
} from '../lib/sessionExport'
import { rewriteInterviewQuestion } from '../lib/questionRewrite'
import { analyzeQuestionIntent, formatQuestionIntentNotice } from '../../shared/questionIntent'
import { buildTranscriptContext } from '../../shared/transcriptContext'
import { useSettingsStore } from '../stores/useSettingsStore'
import type { AppSettings, CompletedAnswer, FloatingPayload, InterviewSession, PreparedAnswer, TranscriptLine, UsageStats } from '../../shared/types'

type ShowToast = (text: string, kind?: ToastMessage['kind']) => void
type LatencyReport = { deepgramMs?: number; firstTokenMs?: number; totalMs?: number }

type UseAnswerGenerationOptions = {
  /** 可选：预生成缓存检查，命中后秒出答案 */
  checkCachedAnswer?: (question: string) => { answer: string; provider?: CompletedAnswer['provider'] } | null
  settings: AppSettings
  currentSessionRef: MutableRefObject<InterviewSession>
  setCurrentSession: Dispatch<SetStateAction<InterviewSession>>
  setUsageStats: Dispatch<SetStateAction<UsageStats>>
  showToast: ShowToast
}

export function useAnswerGeneration({
  checkCachedAnswer,
  settings,
  currentSessionRef,
  setCurrentSession,
  setUsageStats,
  showToast
}: UseAnswerGenerationOptions) {
  const [question, setQuestion] = useState('')
  const [prepared, setPrepared] = useState<PreparedAnswer | null>(null)
  const [completed, setCompleted] = useState<CompletedAnswer | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamingText, setStreamingText] = useState('') // 流式增量文本
  const [queuedCount, setQueuedCount] = useState(0)
  const [queuedAnswers, setQueuedAnswers] = useState<QueuedAnswer[]>([])
  const [latencyReport, setLatencyReport] = useState<LatencyReport | null>(null)
  const [questionRewriteNotice, setQuestionRewriteNotice] = useState('')
  const [contextCompressionNotice, setContextCompressionNotice] = useState('')
  const questionIntent = analyzeQuestionIntent(question)
  const questionIntentNotice = question.trim() ? formatQuestionIntentNotice(questionIntent) : ''
  const settingsRef = useRef(settings)
  const queueRef = useRef<QueuedAnswer[]>([])
  const isGeneratingRef = useRef(false)
  const cleanupStreamRef = useRef<(() => void) | null>(null)
  const activeQuestionRef = useRef('')

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  // 组件卸载时清理流式监听
  useEffect(() => {
    return () => {
      cleanupStreamRef.current?.()
    }
  }, [])

  async function syncFloatingWindow(payload: Omit<FloatingPayload, 'records' | 'queuedCount'>, snapshot = currentSessionRef.current): Promise<void> {
    const privacyMode = settingsRef.current.answer.privacyMode ?? false

    await window.huomiantong.updateFloating({
      ...payload,
      question: maskSessionText(payload.question, snapshot, privacyMode),
      answer: maskSessionText(payload.answer, snapshot, privacyMode),
      evidence: maskEvidenceSnippets(payload.evidence, snapshot, privacyMode),
      candidateName: maskSessionText(snapshot.candidateName || settingsRef.current.resume.candidateName || '未选择候选人', snapshot, privacyMode),
      targetRole: snapshot.targetRole || settingsRef.current.resume.targetRole || '未设置岗位',
      queuedCount: queueRef.current.length,
      privacyMode,
      records: buildFloatingRecords(snapshot, privacyMode)
    })
  }

  function syncQueueState(): void {
    setQueuedCount(queueRef.current.length)
    setQueuedAnswers([...queueRef.current])
  }

  function enqueueAnswer(text: string, transcript: TranscriptLine[]): void {
    queueRef.current.push({ id: crypto.randomUUID(), question: text, transcript })
    syncQueueState()
    void syncFloatingWindow({
      question: text,
      answer: `已暂存新问题，当前排队 ${queueRef.current.length} 个。`,
      evidence: [],
      status: 'thinking'
    })
  }

  function finishGenerationAndMaybeContinue(): void {
    setIsGenerating(false)
    isGeneratingRef.current = false
    const nextQueued = queueRef.current.shift()
    syncQueueState()

    if (nextQueued) {
      void generateAnswerFrom(nextQueued.question, nextQueued.transcript, true)
    }
  }

  async function generateAnswerFrom(text: string, transcript: TranscriptLine[], fromQueue = false): Promise<void> {
    const rewrite = rewriteInterviewQuestion(text)
    const trimmed = rewrite.corrected.trim()
    const transcriptContext = buildTranscriptContext(transcript, { recentLineCount: 6 })

    if (!trimmed) {
      return
    }

    if (rewrite.changed) {
      setQuestion(trimmed)
      setQuestionRewriteNotice(rewrite.reason || `已改写为：${trimmed}`)
    } else {
      setQuestionRewriteNotice('')
    }

    if (transcriptContext.compressed) {
      setContextCompressionNotice(`会话已压缩：${transcriptContext.summary}`)
    } else {
      setContextCompressionNotice('')
    }

    if (isGeneratingRef.current) {
      if (!fromQueue) {
        enqueueAnswer(trimmed, transcript)
      }
      return
    }

    isGeneratingRef.current = true
    setIsGenerating(true)
    setStreamingText('')
    setLatencyReport(null)
    activeQuestionRef.current = trimmed


    const activeResume = settingsRef.current.resume
    const answerStartTime = Date.now()
    // --- 检查预生成缓存 ---
    if (checkCachedAnswer) {
      const cached = checkCachedAnswer(trimmed)
      if (cached) {
        const cachedProvider = cached.provider ?? 'local'
        const result = {
          answer: cached.answer,
          provider: cachedProvider,
          evidence: [],
          latencyMs: 0,
        }
        setPrepared(null)
        setCompleted(result)
        setStreamingText('')
        setLatencyReport({ firstTokenMs: 0, totalMs: 0 })
        setIsGenerating(false)
        isGeneratingRef.current = false
        setCurrentSession((current) => {
          const next = attachResumeToSession(
            {
              ...current,
              answers: [
                { id: crypto.randomUUID(), question: trimmed, answer: cached.answer, provider: cachedProvider, at: Date.now() },
                ...current.answers
              ]
            },
            activeResume
          );
          currentSessionRef.current = next
          void syncFloatingWindow({ question: trimmed, answer: cached.answer, evidence: [], status: 'ready' }, next)
          return next
        })
        showToast('已命中缓存答案', 'info')
        finishGenerationAndMaybeContinue()
        return
      }
    }
    const phrase = waitingPhrase()
    setPrepared({ fastAnswer: phrase, evidence: [] })
    setCompleted(null)
    await syncFloatingWindow(
      { question: trimmed, answer: phrase, evidence: [], status: 'thinking' },
      attachResumeToSession({ ...currentSessionRef.current, transcript }, activeResume)
    )

    cleanupStreamRef.current?.()

    let accumulatedAnswer = ''
    let firstTokenMs: number | undefined
    let streamError: string | null = null

    const removeListener = window.huomiantong.onStreamChunk((chunk) => {
      if (chunk.firstByteMs !== undefined && firstTokenMs === undefined) {
        firstTokenMs = chunk.firstByteMs
        setLatencyReport({ firstTokenMs })
      }

      if (chunk.text) {
        if (firstTokenMs === undefined) {
          firstTokenMs = Date.now() - answerStartTime
          setLatencyReport({ firstTokenMs })
        }
        accumulatedAnswer += chunk.text
        setStreamingText(accumulatedAnswer)
        // 同步更新悬浮窗
        void syncFloatingWindow(
          { question: trimmed, answer: accumulatedAnswer, evidence: [], status: 'thinking' },
          attachResumeToSession({ ...currentSessionRef.current, transcript }, activeResume)
        )
      }

      if (chunk.error) {
        streamError = chunk.error
        showToast('流式生成出错：' + chunk.error, 'error')
      }

      if (chunk.done) {
        // 流式完成，移除监听
        removeListener()
        cleanupStreamRef.current = null

        const totalMs = chunk.latencyMs ?? Date.now() - answerStartTime
        setLatencyReport((current) => ({
          ...current,
          firstTokenMs,
          totalMs
        }))

        if (streamError) {
          const errorAnswer = formatGenerationError(streamError)
          setCompleted({
            answer: errorAnswer,
            provider: chunk.provider ?? settingsRef.current.answer.llmProvider,
            evidence: [],
            latencyMs: totalMs
          })
          setStreamingText('')
          void syncFloatingWindow(
            { question: trimmed, answer: errorAnswer, evidence: [], status: 'error' },
            attachResumeToSession({ ...currentSessionRef.current, transcript }, activeResume)
          )
          finishGenerationAndMaybeContinue()
          return
        }

        const finalAnswer = (chunk.finalText || accumulatedAnswer).trim() || '模型这次没有返回有效正文，请检查 API 余额、模型名称或网络后重试。'
        const result: CompletedAnswer = {
          answer: finalAnswer,
          provider: chunk.provider ?? settingsRef.current.answer.llmProvider,
          evidence: [],
          latencyMs: totalMs,
        }
        setCompleted(result)
        setStreamingText('')
        window.huomiantong.loadUsage().then(setUsageStats).catch(() => undefined)

        setCurrentSession((current) => {
          const next = attachResumeToSession(
            {
              ...current,
              answers: [
                {
                  id: crypto.randomUUID(),
                  question: trimmed,
                  answer: finalAnswer,
                  provider: result.provider,
                  at: Date.now(),
                },
                ...current.answers
              ]
            },
            activeResume
          )
          currentSessionRef.current = next
          void syncFloatingWindow({ question: trimmed, answer: finalAnswer, evidence: [], status: 'ready' }, next)
          return next
        })

        // 处理队列中的下一个问题
        finishGenerationAndMaybeContinue()
      }
    })

    cleanupStreamRef.current = removeListener

    // 使用流式 API（替代之前的 completeAnswer 一次性调用）
    try {
      window.huomiantong.startStreamingAnswer({
        question: trimmed,
        transcript,
        settings: settingsRef.current
      })
    } catch (error) {
      // 如果 startStreamingAnswer 抛错（极少数情况）
      removeListener()
      cleanupStreamRef.current = null
      setLatencyReport({ totalMs: Date.now() - answerStartTime })
      void syncFloatingWindow(
        { question: trimmed, answer: '启动流式回答失败，请检查模型设置后重试。', evidence: [], status: 'error' },
        attachResumeToSession({ ...currentSessionRef.current, transcript }, activeResume)
      )
      finishGenerationAndMaybeContinue()
      showToast('启动流式回答失败', 'error')
    }
  }

  async function generateAnswer(): Promise<void> {
    await generateAnswerFrom(question, currentSessionRef.current.transcript)
  }

  function resetAnswerState(): void {
    cleanupStreamRef.current?.()
    cleanupStreamRef.current = null
    queueRef.current = []
    isGeneratingRef.current = false
    syncQueueState()
    setQuestionRewriteNotice('')
    setContextCompressionNotice('')
    setQuestion('')
    setPrepared(null)
    setCompleted(null)
    setStreamingText('')
    setIsGenerating(false)
  }

  function startNewSession(): void {
    const next = createSession(settingsRef.current.resume)
    setCurrentSession(next)
    currentSessionRef.current = next
    resetAnswerState()
    showToast(`已开始新会话：${resumeLabel(settingsRef.current.resume)}`, 'info')
    void syncFloatingWindow({ question: '', answer: '新会话已开始，等待面试问题。', evidence: [], status: 'idle' }, next)
  }

  function exportCurrentReview(): void {
    const session = currentSessionRef.current

    if (session.answers.length === 0) {
      showToast('当前还没有回答，先生成几个答案再复盘。', 'info')
      return
    }

    downloadText(`${safeFileName(session.title)}-复盘报告.md`, sessionToMarkdown(session, settingsRef.current.answer.privacyMode))
    showToast('复盘报告导出成功')
  }

  function openFloatingWindow(): void {
    void syncFloatingWindow({
      question,
      answer: streamingText || completed?.answer || prepared?.fastAnswer || '悬浮窗已打开，等待面试问题。',
      evidence: completed?.evidence || prepared?.evidence || [],
      status: completed ? 'ready' : isGenerating ? 'thinking' : 'idle'
    })
  }

  return {
    question,
    setQuestion,
    prepared,
    completed,
    isGenerating,
    streamingText,
    queuedCount,
    queuedAnswers,
    latencyReport,
    syncFloatingWindow,
    generateAnswerFrom,
    generateAnswer,
    resetAnswerState,
    startNewSession,
    exportCurrentReview,
    openFloatingWindow,
    questionRewriteNotice,
    questionIntentNotice,
    contextCompressionNotice,
    questionIntent
  }
}

function formatGenerationError(message: string): string {
  const normalized = message.trim()

  if (/timeout|timed out|aborted due to timeout|abort/i.test(normalized)) {
    return '模型响应超时了，已保留当前问题，未把错误写成正式答案。请先检查网络、模型名和余额，或切到更快的模型后重试。'
  }

  if (/401|unauthorized|api key/i.test(normalized)) {
    return '模型调用失败：API Key 可能无效或没有权限。请到设置中心重新保存 Key 后再试。'
  }

  if (/402|payment|quota|余额|额度/i.test(normalized)) {
    return '模型调用失败：当前账号额度或余额可能不足。请到服务商后台确认后再试。'
  }

  if (/404|model|not found/i.test(normalized)) {
    return '模型调用失败：模型名称或 Base URL 可能填错。请到设置中心检查当前模型配置。'
  }

  return `模型调用失败：${normalized || '未知错误'}`
}
