import { randomUUID } from 'node:crypto'
import { readJson, writeJson } from './jsonStorage'
import type { InterviewSession, TranscriptLine } from '../../shared/types'

export async function loadSessions(): Promise<InterviewSession[]> {
  return readJson<InterviewSession[]>('sessions.json', [])
}

export async function saveSession(session: InterviewSession): Promise<InterviewSession[]> {
  const sessions = await loadSessions()
  const existingIndex = sessions.findIndex((item) => item.id === session.id)
  const nextSession = {
    ...session,
    updatedAt: Date.now()
  }

  if (existingIndex >= 0) {
    sessions[existingIndex] = nextSession
  } else {
    sessions.unshift(nextSession)
  }

  await writeJson('sessions.json', sessions.slice(0, 50))
  return sessions
}

function normalizeTranscriptLine(value: Partial<TranscriptLine> | undefined, fallbackId: string): TranscriptLine {
  return {
    id: value?.id || fallbackId,
    speaker: value?.speaker === 'candidate' ? 'candidate' : 'interviewer',
    text: value?.text || '',
    at: typeof value?.at === 'number' && Number.isFinite(value.at) ? value.at : Date.now(),
    isFinal: Boolean(value?.isFinal)
  }
}

export function normalizeImportedSessions(value: unknown): InterviewSession[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item, index) => {
    const raw = (item || {}) as Partial<InterviewSession> & { transcript?: unknown; answers?: unknown }
    const now = Date.now()
    const transcript = Array.isArray(raw.transcript)
      ? raw.transcript.map((line, lineIndex) => normalizeTranscriptLine(line as Partial<TranscriptLine>, `${raw.id || `import-${index + 1}`}-t${lineIndex + 1}`))
      : []
    const answers = Array.isArray(raw.answers)
      ? raw.answers.map((answer, answerIndex) => {
          const current = (answer || {}) as Partial<InterviewSession['answers'][number]>

          return {
            id: current.id || `${raw.id || `import-${index + 1}`}-a${answerIndex + 1}`,
            question: current.question || '',
            answer: current.answer || '',
            provider: current.provider || 'unknown',
            at: typeof current.at === 'number' && Number.isFinite(current.at) ? current.at : now,
            evidence: Array.isArray(current.evidence) ? current.evidence : undefined,
            quality: current.quality,
            risk: current.risk
          }
        })
      : []

    return {
      id: raw.id || randomUUID(),
      title: raw.title || `导入会话 ${index + 1}`,
      createdAt: typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : now,
      updatedAt: typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt) ? raw.updatedAt : now,
      resumeProfileId: raw.resumeProfileId,
      resumeProfileName: raw.resumeProfileName,
      candidateName: raw.candidateName,
      targetRole: raw.targetRole,
      transcript,
      answers
    }
  })
}

export async function deleteSessions(ids: string[]): Promise<InterviewSession[]> {
  const idSet = new Set(ids)
  const sessions = await loadSessions()
  const nextSessions = sessions.filter((session) => !idSet.has(session.id))
  await writeJson('sessions.json', nextSessions)
  return nextSessions
}
