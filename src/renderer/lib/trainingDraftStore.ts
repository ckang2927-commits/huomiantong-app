import type { AppSettings, TrainingMode, TrainingQuestionCount, TrainingRound } from '../../shared/types'

const trainingDraftKey = 'huomiantong.trainingDraft.v1'

export type TrainingDraftPayload = {
  version: 1
  savedAt: number
  resumeProfileId?: string
  resumeProfileName?: string
  trainingMode: TrainingMode
  roundCount: TrainingQuestionCount
  questionOutline: string[]
  rounds: TrainingRound[]
  currentAnswer: string
  finalReport: string
  lastProvider: string
  lastLatencyMs: number
  savedSessionId?: string
  savedSessionTitle: string
  lastSavedAt: number
}

export function saveTrainingDraft(payload: Omit<TrainingDraftPayload, 'version' | 'savedAt' | 'resumeProfileId' | 'resumeProfileName'>, settings: AppSettings): TrainingDraftPayload {
  const draft: TrainingDraftPayload = {
    version: 1,
    savedAt: Date.now(),
    resumeProfileId: settings.resume.id,
    resumeProfileName: settings.resume.profileName || settings.resume.candidateName || undefined,
    ...payload
  }

  window.localStorage.setItem(trainingDraftKey, JSON.stringify(draft))
  return draft
}

export function loadTrainingDraft(): TrainingDraftPayload | null {
  const raw = window.localStorage.getItem(trainingDraftKey)

  if (!raw) {
    return null
  }

  try {
    const draft = JSON.parse(raw) as Partial<TrainingDraftPayload>

    if (draft.version !== 1 || !Array.isArray(draft.rounds) || !isQuestionCount(draft.roundCount) || !isTrainingMode(draft.trainingMode)) {
      return null
    }

    return {
      version: 1,
      savedAt: safeNumber(draft.savedAt, Date.now()),
      resumeProfileId: draft.resumeProfileId,
      resumeProfileName: draft.resumeProfileName,
      trainingMode: draft.trainingMode,
      roundCount: draft.roundCount,
      questionOutline: Array.isArray(draft.questionOutline) ? draft.questionOutline.map((question) => String(question).trim()).filter(Boolean).slice(0, 20) : [],
      rounds: draft.rounds,
      currentAnswer: draft.currentAnswer || '',
      finalReport: draft.finalReport || '',
      lastProvider: draft.lastProvider || 'local',
      lastLatencyMs: safeNumber(draft.lastLatencyMs, 0),
      savedSessionId: draft.savedSessionId,
      savedSessionTitle: draft.savedSessionTitle || '',
      lastSavedAt: safeNumber(draft.lastSavedAt, 0)
    }
  } catch {
    return null
  }
}

export function clearTrainingDraft(): void {
  window.localStorage.removeItem(trainingDraftKey)
}

function isQuestionCount(value: unknown): value is TrainingQuestionCount {
  return typeof value === 'number' && Number.isFinite(value) && value >= 3 && value <= 40
}

function isTrainingMode(value: unknown): value is TrainingMode {
  return value === 'resumeDeepDive' || value === 'projectFollowUp' || value === 'fundamentals' || value === 'pressure' || value === 'comprehensive'
}

function safeNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
