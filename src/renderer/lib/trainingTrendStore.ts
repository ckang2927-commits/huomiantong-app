import { trainingModeLabels } from '../../shared/trainingOptions'
import type { AppSettings, TrainingMode, TrainingQuestionCount, TrainingRound } from '../../shared/types'
import { buildTrainingWeaknessInsights } from './trainingInsights'

const trainingTrendKey = 'huomiantong.trainingTrend.v1'
const maxTrendEntries = 80

export type TrainingTrendWeakness = {
  title: string
  score: number
}

export type TrainingTrendEntry = {
  id: string
  fingerprint: string
  recordedAt: number
  candidateName: string
  targetRole: string
  trainingMode: TrainingMode
  trainingModeLabel: string
  roundCount: TrainingQuestionCount
  answeredCount: number
  averageScore: number
  highestScore: number
  lowestScore: number
  provider: string
  weakness: TrainingTrendWeakness[]
}

type BuildTrainingTrendEntryOptions = {
  settings: AppSettings
  trainingMode: TrainingMode
  roundCount: TrainingQuestionCount
  rounds: TrainingRound[]
  finalReport: string
  provider: string
}

export function buildTrainingTrendEntry({
  settings,
  trainingMode,
  roundCount,
  rounds,
  finalReport,
  provider
}: BuildTrainingTrendEntryOptions): TrainingTrendEntry | null {
  const scoredRounds = rounds.filter((round) => round.answer?.trim() && typeof round.score === 'number')

  if (!finalReport.trim() || scoredRounds.length === 0) {
    return null
  }

  const scores = scoredRounds.map((round) => Math.max(0, Math.min(100, Math.round(round.score || 0))))
  const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  const weakness = buildTrainingWeaknessInsights(rounds).map((item) => ({
    title: item.title,
    score: item.score
  }))
  const fingerprint = createTrainingFingerprint({
    trainingMode,
    roundCount,
    rounds: scoredRounds,
    finalReport
  })

  return {
    id: crypto.randomUUID(),
    fingerprint,
    recordedAt: Date.now(),
    candidateName: settings.resume.candidateName || settings.resume.profileName || '默认候选人',
    targetRole: settings.resume.targetRole || '未填写岗位',
    trainingMode,
    trainingModeLabel: trainingModeLabels[trainingMode].label,
    roundCount,
    answeredCount: scoredRounds.length,
    averageScore,
    highestScore: Math.max(...scores),
    lowestScore: Math.min(...scores),
    provider,
    weakness
  }
}

export function loadTrainingTrendEntries(): TrainingTrendEntry[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(trainingTrendKey)
    const parsed = raw ? JSON.parse(raw) : []

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map(normalizeTrendEntry)
      .filter((entry): entry is TrainingTrendEntry => Boolean(entry))
      .sort((left, right) => right.recordedAt - left.recordedAt)
      .slice(0, maxTrendEntries)
  } catch {
    return []
  }
}

export function saveTrainingTrendEntry(entry: TrainingTrendEntry): {
  entries: TrainingTrendEntry[]
  saved: boolean
} {
  if (typeof window === 'undefined') {
    return { entries: [], saved: false }
  }

  const current = loadTrainingTrendEntries()
  const withoutDuplicate = current.filter((item) => item.fingerprint !== entry.fingerprint)
  const saved = withoutDuplicate.length === current.length
  const entries = [entry, ...withoutDuplicate].slice(0, maxTrendEntries)
  window.localStorage.setItem(trainingTrendKey, JSON.stringify(entries))

  return { entries, saved }
}

export function clearTrainingTrendEntries(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(trainingTrendKey)
}

function normalizeTrendEntry(value: unknown): TrainingTrendEntry | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const entry = value as Partial<TrainingTrendEntry>

  if (!entry.fingerprint || !entry.recordedAt || typeof entry.averageScore !== 'number') {
    return null
  }

  const trainingMode: TrainingMode = isTrainingMode(entry.trainingMode) ? entry.trainingMode : 'comprehensive'

  return {
    id: entry.id || crypto.randomUUID(),
    fingerprint: entry.fingerprint,
    recordedAt: Number(entry.recordedAt),
    candidateName: entry.candidateName || '默认候选人',
    targetRole: entry.targetRole || '未填写岗位',
    trainingMode,
    trainingModeLabel: entry.trainingModeLabel || trainingModeLabels[trainingMode].label,
    roundCount: isTrainingQuestionCount(entry.roundCount) ? entry.roundCount : 10,
    answeredCount: Number(entry.answeredCount || 0),
    averageScore: clampScore(entry.averageScore),
    highestScore: clampScore(entry.highestScore),
    lowestScore: clampScore(entry.lowestScore),
    provider: entry.provider || 'local',
    weakness: Array.isArray(entry.weakness)
      ? entry.weakness
          .map((item) => ({
            title: String(item.title || '').trim(),
            score: clampScore(item.score)
          }))
          .filter((item) => item.title)
          .slice(0, 3)
      : []
  }
}

function createTrainingFingerprint({
  trainingMode,
  roundCount,
  rounds,
  finalReport
}: {
  trainingMode: TrainingMode
  roundCount: TrainingQuestionCount
  rounds: TrainingRound[]
  finalReport: string
}): string {
  const source = [
    trainingMode,
    roundCount,
    rounds.map((round) => `${round.question}|${round.score || 0}|${round.answeredAt || 0}`).join('::'),
    finalReport.slice(0, 160)
  ].join('###')

  return `training-${hashString(source)}`
}

function hashString(value: string): string {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash).toString(36)
}

function clampScore(value?: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round(value)))
}

function isTrainingMode(value: unknown): value is TrainingMode {
  return typeof value === 'string' && value in trainingModeLabels
}

function isTrainingQuestionCount(value: unknown): value is TrainingQuestionCount {
  return typeof value === 'number' && Number.isFinite(value) && value >= 3 && value <= 40
}
