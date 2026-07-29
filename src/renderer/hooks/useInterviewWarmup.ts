import { useState, useCallback, useEffect, useRef } from 'react'
import {
  loadWarmupCache,
  saveWarmupCache,
  clearWarmupCache,
  getWarmupQuestions,
  findSimilarInCache,
  type CachedAnswer
} from '../lib/interviewWarmupCache'
import type { AppSettings, AnswerRequest, TranscriptLine } from '../../shared/types'

interface WarmupState {
  answers: CachedAnswer[]
  isGenerating: boolean
  isPaused: boolean
  progress: { done: number; total: number }
  hasCache: boolean
  cachedAt: number | null
}

interface UseInterviewWarmupOptions {
  settings: AppSettings
}

interface WarmupRunState {
  questionCount: number
  questions: string[]
  transcript: TranscriptLine[]
  results: CachedAnswer[]
  nextIndex: number
}

function buildResumeScope(settings: AppSettings): string {
  const { resume, answer } = settings
  const attachments = (resume.otherResumes ?? [])
    .map((item) => `${item.id}:${item.title}:${item.text}`)
    .join('\u001f')
  const currentRoleJd = answer.roleJdTemplates[answer.interviewMode] ?? ''

  return [
    resume.id ?? 'default',
    resume.targetRole,
    resume.formalResume,
    resume.detailedResume,
    attachments,
    answer.interviewMode,
    currentRoleJd,
    answer.responseLanguage
  ].join('\u001e')
}

function readWarmupState(resumeScope: string, targetRole: string, answerStyle: string): WarmupState {
  const cache = loadWarmupCache(resumeScope, targetRole, answerStyle)

  return {
    answers: cache?.answers ?? [],
    isGenerating: false,
    isPaused: false,
    progress: { done: 0, total: 0 },
    hasCache: (cache?.answers.length ?? 0) > 0,
    cachedAt: cache?.generatedAt ?? null
  }
}

export function useInterviewWarmup({ settings }: UseInterviewWarmupOptions): {
  state: WarmupState
  startWarmup: (questionCount?: number) => Promise<void>
  pauseWarmup: () => void
  clearCache: () => void
  checkCache: (question: string) => CachedAnswer | null
} {
  const resumeScope = buildResumeScope(settings)
  const targetRole = settings.resume.targetRole
  const answerStyle = settings.answer.answerStyle
  const [state, setState] = useState<WarmupState>(() => readWarmupState(resumeScope, targetRole, answerStyle))
  const runRef = useRef<WarmupRunState | null>(null)
  const pauseRequestedRef = useRef(false)

  useEffect(() => {
    if (state.isGenerating || state.isPaused) {
      return
    }

    runRef.current = null
    pauseRequestedRef.current = false
    setState(readWarmupState(resumeScope, targetRole, answerStyle))
  }, [resumeScope, targetRole, answerStyle])

  const persistRun = useCallback(
    (run: WarmupRunState): void => {
      if (run.results.length > 0) {
        saveWarmupCache(resumeScope, targetRole, answerStyle, run.results)
      }
    },
    [resumeScope, targetRole, answerStyle]
  )

  const runWarmup = useCallback(
    async (run: WarmupRunState): Promise<void> => {
      const total = run.questions.length

      for (let index = run.nextIndex; index < total; index++) {
        if (pauseRequestedRef.current) {
          break
        }

        const question = run.questions[index]

        try {
          const request: AnswerRequest = { question, transcript: run.transcript, settings }
          const completed = await window.huomiantong.completeAnswer(request)
          run.results.push({
            question,
            answer: completed.answer,
            provider: completed.provider,
            at: Date.now()
          })
        } catch {
          // 失败题目不写入缓存，避免面试时命中“生成失败，请重试”。
        }

        run.nextIndex = index + 1
        const snapshot = [...run.results]
        const paused = pauseRequestedRef.current

        setState((previous) => ({
          ...previous,
          answers: snapshot,
          isGenerating: !paused && run.nextIndex < total,
          isPaused: paused && run.nextIndex < total,
          progress: { done: run.nextIndex, total },
          hasCache: snapshot.length > 0,
          cachedAt: snapshot.length > 0 ? Date.now() : previous.cachedAt
        }))

        if (paused) {
          break
        }
      }

      persistRun(run)
      const finished = run.nextIndex >= total && !pauseRequestedRef.current

      if (finished) {
        runRef.current = null
        pauseRequestedRef.current = false
        setState((previous) => ({
          ...previous,
          answers: [...run.results],
          isGenerating: false,
          isPaused: false,
          progress: { done: total, total },
          hasCache: run.results.length > 0,
          cachedAt: run.results.length > 0 ? Date.now() : previous.cachedAt
        }))
        return
      }

      runRef.current = run
      pauseRequestedRef.current = false
      setState((previous) => ({
        ...previous,
        answers: [...run.results],
        isGenerating: false,
        isPaused: true,
        progress: { done: run.nextIndex, total },
        hasCache: run.results.length > 0,
        cachedAt: run.results.length > 0 ? Date.now() : previous.cachedAt
      }))
    },
    [persistRun, settings]
  )

  const startWarmup = useCallback(async (questionCount: number = 30) => {
    const existingRun = runRef.current
    const canResumeExisting = state.isPaused && existingRun && existingRun.questionCount === questionCount

    if (state.isGenerating) {
      return
    }

    if (canResumeExisting && existingRun) {
      pauseRequestedRef.current = false
      setState((previous) => ({
        ...previous,
        isGenerating: true,
        isPaused: false,
        progress: { done: existingRun.nextIndex, total: existingRun.questions.length }
      }))
      await runWarmup(existingRun)
      return
    }

    const questions = getWarmupQuestions(targetRole, questionCount)
    const run: WarmupRunState = {
      questionCount,
      questions,
      transcript: [],
      results: [],
      nextIndex: 0
    }

    runRef.current = run
    pauseRequestedRef.current = false
    setState((previous) => ({
      ...previous,
      isGenerating: true,
      isPaused: false,
      progress: { done: 0, total: questions.length }
    }))
    await runWarmup(run)
  }, [runWarmup, state.isGenerating, state.isPaused, targetRole])

  const pauseWarmup = useCallback(() => {
    if (!state.isGenerating) {
      return
    }

    pauseRequestedRef.current = true
  }, [state.isGenerating])

  const clearCache = useCallback(() => {
    pauseRequestedRef.current = false
    runRef.current = null
    clearWarmupCache(resumeScope, targetRole, answerStyle)
    setState({
      answers: [],
      isGenerating: false,
      isPaused: false,
      progress: { done: 0, total: 0 },
      hasCache: false,
      cachedAt: null
    })
  }, [resumeScope, targetRole, answerStyle])

  const checkCache = useCallback(
    (question: string): CachedAnswer | null => {
      const cache = loadWarmupCache(resumeScope, targetRole, answerStyle)
      return cache ? findSimilarInCache(cache, question) : null
    },
    [resumeScope, targetRole, answerStyle]
  )

  return { state, startWarmup, pauseWarmup, clearCache, checkCache }
}
