import { trainingModeLabels } from '../../shared/trainingOptions'
import type { TrainingMode, TrainingRound } from '../../shared/types'
import type { TrainingFocusPlan } from './trainingInsights'

const trainingQuestionBankKey = 'huomiantong.trainingQuestionBank.v1'
const maxQuestionBankItems = 120

export type TrainingQuestionBankSource = 'manual' | 'low-score' | 'focused-practice'

export type TrainingQuestionBankItem = {
  id: string
  questionKey: string
  question: string
  referenceAnswer?: string
  lastAnswer?: string
  lastFeedback?: string
  lastScore?: number
  lowestScore?: number
  source: TrainingQuestionBankSource
  trainingMode: TrainingMode
  trainingModeLabel: string
  tags: string[]
  savedAt: number
  updatedAt: number
  hitCount: number
  practicedCount: number
  lastPracticedAt?: number
}

type SaveQuestionBankItemOptions = {
  round: TrainingRound
  trainingMode: TrainingMode
  source: TrainingQuestionBankSource
  tags?: string[]
}

export function loadTrainingQuestionBankItems(): TrainingQuestionBankItem[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(trainingQuestionBankKey)
    const parsed = raw ? JSON.parse(raw) : []

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map(normalizeQuestionBankItem)
      .filter((item): item is TrainingQuestionBankItem => Boolean(item))
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, maxQuestionBankItems)
  } catch {
    return []
  }
}

export function saveTrainingQuestionBankItem({
  round,
  trainingMode,
  source,
  tags = []
}: SaveQuestionBankItemOptions): {
  items: TrainingQuestionBankItem[]
  saved: boolean
} {
  const question = round.question.trim()

  if (!question) {
    return { items: loadTrainingQuestionBankItems(), saved: false }
  }

  const current = loadTrainingQuestionBankItems()
  const questionKey = createQuestionKey(question)
  const now = Date.now()
  const existing = current.find((item) => item.questionKey === questionKey)
  const nextItem: TrainingQuestionBankItem = existing
    ? {
        ...existing,
        referenceAnswer: round.referenceAnswer || existing.referenceAnswer,
        lastAnswer: round.answer || existing.lastAnswer,
        lastFeedback: round.feedback || existing.lastFeedback,
        lastScore: typeof round.score === 'number' ? clampScore(round.score) : existing.lastScore,
        lowestScore:
          typeof round.score === 'number'
            ? Math.min(existing.lowestScore ?? clampScore(round.score), clampScore(round.score))
            : existing.lowestScore,
        source: source === 'manual' ? 'manual' : existing.source,
        trainingMode,
        trainingModeLabel: trainingModeLabels[trainingMode].label,
        tags: mergeTags(existing.tags, tags, scoreTags(round)),
        updatedAt: now,
        hitCount: existing.hitCount + 1
      }
    : {
        id: crypto.randomUUID(),
        questionKey,
        question,
        referenceAnswer: round.referenceAnswer,
        lastAnswer: round.answer,
        lastFeedback: round.feedback,
        lastScore: typeof round.score === 'number' ? clampScore(round.score) : undefined,
        lowestScore: typeof round.score === 'number' ? clampScore(round.score) : undefined,
        source,
        trainingMode,
        trainingModeLabel: trainingModeLabels[trainingMode].label,
        tags: mergeTags(tags, scoreTags(round)),
        savedAt: now,
        updatedAt: now,
        hitCount: 1,
        practicedCount: 0
      }

  const items = [nextItem, ...current.filter((item) => item.questionKey !== questionKey)]
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, maxQuestionBankItems)

  persistQuestionBankItems(items)

  return { items, saved: !existing }
}

export function removeTrainingQuestionBankItem(id: string): TrainingQuestionBankItem[] {
  const items = loadTrainingQuestionBankItems().filter((item) => item.id !== id)
  persistQuestionBankItems(items)
  return items
}

export function clearTrainingQuestionBankItems(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(trainingQuestionBankKey)
}

export function markTrainingQuestionBankPracticed(itemsToPractice: TrainingQuestionBankItem[]): TrainingQuestionBankItem[] {
  const ids = new Set(itemsToPractice.map((item) => item.id))
  const now = Date.now()
  const items = loadTrainingQuestionBankItems().map((item) =>
    ids.has(item.id)
      ? {
          ...item,
          practicedCount: item.practicedCount + 1,
          lastPracticedAt: now,
          updatedAt: now
        }
      : item
  )

  persistQuestionBankItems(items)
  return items
}

export function buildQuestionBankFocusPlan(items: TrainingQuestionBankItem[], label = '错题专项训练'): TrainingFocusPlan | null {
  const questions = items
    .map((item) => item.question.trim())
    .filter(Boolean)
    .slice(0, 10)

  if (questions.length === 0) {
    return null
  }

  return {
    label,
    mode: mostCommonTrainingMode(items),
    questions
  }
}

export function isRoundInQuestionBank(round: TrainingRound, items: TrainingQuestionBankItem[]): boolean {
  return items.some((item) => item.questionKey === createQuestionKey(round.question))
}

function persistQuestionBankItems(items: TrainingQuestionBankItem[]): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(trainingQuestionBankKey, JSON.stringify(items.slice(0, maxQuestionBankItems)))
}

function normalizeQuestionBankItem(value: unknown): TrainingQuestionBankItem | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const item = value as Partial<TrainingQuestionBankItem>
  const question = String(item.question || '').trim()

  if (!question) {
    return null
  }

  const trainingMode = isTrainingMode(item.trainingMode) ? item.trainingMode : 'comprehensive'
  const savedAt = Number(item.savedAt || Date.now())
  const updatedAt = Number(item.updatedAt || savedAt)

  return {
    id: item.id || crypto.randomUUID(),
    questionKey: item.questionKey || createQuestionKey(question),
    question,
    referenceAnswer: item.referenceAnswer,
    lastAnswer: item.lastAnswer,
    lastFeedback: item.lastFeedback,
    lastScore: typeof item.lastScore === 'number' ? clampScore(item.lastScore) : undefined,
    lowestScore: typeof item.lowestScore === 'number' ? clampScore(item.lowestScore) : undefined,
    source: isQuestionBankSource(item.source) ? item.source : 'manual',
    trainingMode,
    trainingModeLabel: item.trainingModeLabel || trainingModeLabels[trainingMode].label,
    tags: Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 6) : [],
    savedAt,
    updatedAt,
    hitCount: Math.max(1, Number(item.hitCount || 1)),
    practicedCount: Math.max(0, Number(item.practicedCount || 0)),
    lastPracticedAt: item.lastPracticedAt ? Number(item.lastPracticedAt) : undefined
  }
}

function createQuestionKey(question: string): string {
  return question.replace(/\s+/g, '').toLowerCase().slice(0, 120)
}

function scoreTags(round: TrainingRound): string[] {
  const tags: string[] = []

  if (typeof round.score === 'number' && round.score < 75) {
    tags.push('低分题')
  }

  if ((round.answer || '').length < 120) {
    tags.push('回答偏短')
  }

  if (/量化|指标|数据|结果|影响/.test(round.feedback || '')) {
    tags.push('补量化')
  }

  if (/结构|逻辑|STAR|层次/.test(round.feedback || '')) {
    tags.push('补结构')
  }

  if (/证据|简历|编造|真实/.test(round.feedback || '')) {
    tags.push('补证据')
  }

  return tags
}

function mergeTags(...groups: string[][]): string[] {
  return Array.from(new Set(groups.flat().map((tag) => tag.trim()).filter(Boolean))).slice(0, 6)
}

function mostCommonTrainingMode(items: TrainingQuestionBankItem[]): TrainingMode {
  const counts = new Map<TrainingMode, number>()

  items.forEach((item) => {
    counts.set(item.trainingMode, (counts.get(item.trainingMode) || 0) + 1)
  })

  return Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] || 'comprehensive'
}

function isTrainingMode(value: unknown): value is TrainingMode {
  return typeof value === 'string' && value in trainingModeLabels
}

function isQuestionBankSource(value: unknown): value is TrainingQuestionBankSource {
  return value === 'manual' || value === 'low-score' || value === 'focused-practice'
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}
