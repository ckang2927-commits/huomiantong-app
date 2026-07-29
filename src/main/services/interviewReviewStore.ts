import { randomUUID } from 'node:crypto'
import { readJson, writeJson } from './jsonStorage'
import type { InterviewReviewRecord } from '../../shared/types'

const storageFileName = 'interviewReviews.json'
const maxSavedReviewRecords = 100

export async function loadInterviewReviews(): Promise<InterviewReviewRecord[]> {
  return normalizeInterviewReviewRecords(await readJson<InterviewReviewRecord[]>(storageFileName, []))
}

export async function saveInterviewReview(record: InterviewReviewRecord): Promise<InterviewReviewRecord[]> {
  const records = await loadInterviewReviews()
  const existingIndex = records.findIndex((item) => item.id === record.id)
  const now = Date.now()
  const nextRecord: InterviewReviewRecord = {
    ...record,
    id: record.id || randomUUID(),
    title: record.title?.trim() || '面试复盘记录',
    createdAt: Number.isFinite(record.createdAt) ? record.createdAt : now,
    updatedAt: now,
    transcriptText: record.transcriptText || '',
    questions: Array.isArray(record.questions) ? record.questions : [],
    answerAnalyses: Array.isArray(record.answerAnalyses) ? record.answerAnalyses : [],
    reportMarkdown: record.reportMarkdown || '',
    overallScore: toSafeNumber(record.overallScore),
    overallLevel: record.overallLevel || '待分析',
    questionCount: toSafeNumber(record.questionCount),
    answeredCount: toSafeNumber(record.answeredCount),
    riskCount: toSafeNumber(record.riskCount)
  }

  if (existingIndex >= 0) {
    records[existingIndex] = nextRecord
  } else {
    records.unshift(nextRecord)
  }

  const nextRecords = records.slice(0, maxSavedReviewRecords)
  await writeJson(storageFileName, nextRecords)
  return nextRecords
}

export async function deleteInterviewReviews(ids: string[]): Promise<InterviewReviewRecord[]> {
  const idSet = new Set(ids)
  const records = await loadInterviewReviews()
  const nextRecords = records.filter((record) => !idSet.has(record.id))
  await writeJson(storageFileName, nextRecords)
  return nextRecords
}

export function normalizeInterviewReviewRecords(value: unknown): InterviewReviewRecord[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item, index) => {
    const raw = (item || {}) as Partial<InterviewReviewRecord>
    const now = Date.now()

    return {
      id: raw.id || randomUUID(),
      title: raw.title?.trim() || `面试复盘记录 ${index + 1}`,
      createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt as number : now,
      updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt as number : now,
      candidateName: raw.candidateName,
      targetRole: raw.targetRole,
      resumeProfileId: raw.resumeProfileId,
      resumeProfileName: raw.resumeProfileName,
      audioFileName: raw.audioFileName,
      audioFileSize: Number.isFinite(raw.audioFileSize) ? raw.audioFileSize : undefined,
      audioDurationSec: Number.isFinite(raw.audioDurationSec) ? raw.audioDurationSec : undefined,
      transcriptText: raw.transcriptText || '',
      questions: Array.isArray(raw.questions) ? raw.questions : [],
      answerAnalyses: Array.isArray(raw.answerAnalyses) ? raw.answerAnalyses : [],
      reportMarkdown: raw.reportMarkdown || '',
      overallScore: toSafeNumber(raw.overallScore),
      overallLevel: raw.overallLevel || '待分析',
      questionCount: toSafeNumber(raw.questionCount),
      answeredCount: toSafeNumber(raw.answeredCount),
      riskCount: toSafeNumber(raw.riskCount)
    }
  })
}

function toSafeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}
