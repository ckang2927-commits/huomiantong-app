import { type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import { attachResumeToSession, resumeLabel, type ToastMessage } from '../lib/appHelpers'
import { filterWorkspaceTranscript } from '../lib/transcriptFilter'
import type { AppSettings, InterviewSession, TranscriptLine } from '../../shared/types'

type ShowToast = (text: string, kind?: ToastMessage['kind']) => void

type UseInterviewSessionActionsOptions = {
  autoAnswerRef: MutableRefObject<boolean>
  currentSessionRef: MutableRefObject<InterviewSession>
  generateAnswerFrom: (text: string, transcript: TranscriptLine[]) => Promise<void>
  question: string
  saveSessionSnapshot: (session: InterviewSession) => Promise<unknown>
  setCurrentSession: Dispatch<SetStateAction<InterviewSession>>
  setQuestion: Dispatch<SetStateAction<string>>
  settingsRef: MutableRefObject<AppSettings>
  showToast: ShowToast
}

export function useInterviewSessionActions({
  autoAnswerRef,
  currentSessionRef,
  generateAnswerFrom,
  question,
  saveSessionSnapshot,
  setCurrentSession,
  setQuestion,
  settingsRef,
  showToast
}: UseInterviewSessionActionsOptions) {
  function addTranscriptLine(text: string, shouldAutoAnswer = false): void {
    const filtered = shouldAutoAnswer ? filterWorkspaceTranscript(text) : { accepted: true, text: text.trim() }

    if (!filtered.accepted) {
      console.info(`[transcript] ignored ${filtered.reason || 'invalid'}: ${text}`)
      return
    }

    const line: TranscriptLine = {
      id: crypto.randomUUID(),
      speaker: 'interviewer',
      text: filtered.text,
      at: Date.now(),
      isFinal: true
    }

    setCurrentSession((current) => {
      const transcript = [...current.transcript, line]
      const next = { ...current, transcript }
      currentSessionRef.current = next

      if (shouldAutoAnswer && autoAnswerRef.current) {
        void generateAnswerFrom(filtered.text, transcript)
      }

      return next
    })
    setQuestion(filtered.text)
  }

  function addManualQuestion(): void {
    if (question.trim()) {
      addTranscriptLine(question.trim())
    }
  }

  async function saveCurrentSession(): Promise<void> {
    if (currentSessionRef.current.transcript.length === 0 && currentSessionRef.current.answers.length === 0) {
      showToast('当前会话还没有问题或答案，先不用保存。', 'info')
      return
    }

    const input = window.prompt('给这次会话起个名字（不填就用“模拟面试 + 当前时间”）', '')

    if (input === null) {
      return
    }

    const title = input.trim() || `模拟面试 ${new Date().toLocaleString('zh-CN')}`
    const nextSession = attachResumeToSession(
      {
        ...currentSessionRef.current,
        title,
        updatedAt: Date.now()
      },
      settingsRef.current.resume
    )
    currentSessionRef.current = nextSession
    setCurrentSession(nextSession)
    await saveSessionSnapshot(nextSession)
    showToast(`会话保存成功，已绑定：${resumeLabel(settingsRef.current.resume)}`)
  }

  return {
    addManualQuestion,
    addTranscriptLine,
    saveCurrentSession
  }
}
