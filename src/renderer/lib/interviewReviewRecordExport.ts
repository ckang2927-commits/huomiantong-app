import type { InterviewReviewAnswerAnalysis, InterviewReviewExtractedQuestion } from './interviewReviewAnalyzer'
import type { InterviewReviewReport } from './interviewReviewReport'
import { maskSensitiveInfo, safeFileName } from './sessionExport'
import type { AppSettings, InterviewReviewRecord } from '../../shared/types'

export function defaultInterviewReviewTitle(settings: AppSettings, fileName?: string): string {
  const date = new Date().toLocaleDateString('zh-CN').replaceAll('/', '-')
  const candidate = settings.resume.profileName || settings.resume.candidateName || '未命名候选人'
  const role = settings.resume.targetRole || '面试'
  const source = fileName ? `-${stripFileExtension(fileName)}` : ''

  return `${candidate}-${role}-复盘-${date}${source}`
}

export function buildInterviewReviewRecord(input: {
  title: string
  settings: AppSettings
  transcriptText: string
  questions: InterviewReviewExtractedQuestion[]
  answerAnalyses: InterviewReviewAnswerAnalysis[]
  report: InterviewReviewReport
  audioFileName?: string
  audioFileSize?: number
  audioDurationSec?: number
}): InterviewReviewRecord {
  const now = Date.now()

  return {
    id: `review-${now}`,
    title: input.title.trim() || defaultInterviewReviewTitle(input.settings, input.audioFileName),
    createdAt: now,
    updatedAt: now,
    candidateName: input.settings.resume.candidateName,
    targetRole: input.settings.resume.targetRole,
    resumeProfileId: input.settings.resume.id,
    resumeProfileName: input.settings.resume.profileName,
    audioFileName: input.audioFileName,
    audioFileSize: input.audioFileSize,
    audioDurationSec: input.audioDurationSec,
    transcriptText: input.transcriptText,
    questions: input.questions.map((question) => ({
      id: question.id,
      order: question.order,
      question: question.question,
      intentLabel: question.intentLabel,
      confidence: question.confidence,
      source: question.source,
      startSec: question.startSec,
      speaker: question.speaker,
      contextBefore: question.contextBefore,
      contextAfter: question.contextAfter
    })),
    answerAnalyses: input.answerAnalyses.map((analysis) => ({
      questionId: analysis.questionId,
      answerText: analysis.answerText,
      wordCount: analysis.wordCount,
      score: analysis.score,
      level: analysis.level,
      metrics: analysis.metrics,
      issues: analysis.issues,
      suggestions: analysis.suggestions
    })),
    reportMarkdown: input.report.markdown,
    overallScore: input.report.overallScore,
    overallLevel: input.report.overallLevel,
    questionCount: input.report.overview.questionCount,
    answeredCount: input.report.overview.answeredCount,
    riskCount: input.report.overview.riskCount
  }
}

export function interviewReviewRecordToMarkdown(record: InterviewReviewRecord, privacyMode?: boolean): string {
  const header = [
    `# ${maskReviewText(record.title, record, privacyMode)}`,
    '',
    `保存时间：${formatDateTime(record.updatedAt || record.createdAt)}`,
    `候选人：${privacyMode ? '***' : record.resumeProfileName || record.candidateName || '未绑定候选人'}`,
    `目标岗位：${privacyMode ? '***' : record.targetRole || '未填写'}`,
    record.audioFileName ? `录音文件：${maskReviewText(record.audioFileName, record, privacyMode)}` : '',
    `整体评分：${record.overallScore || '-'} / 100（${record.overallLevel || '待分析'}）`,
    ''
  ].filter(Boolean)

  const questions = record.questions.map((question) => {
    const analysis = record.answerAnalyses.find((item) => item.questionId === question.id)

    return [
      `## Q${question.order}. ${maskReviewText(question.question, record, privacyMode)}`,
      '',
      `- 类型：${question.intentLabel}`,
      `- 置信度：${question.confidence}%`,
      analysis ? `- 评分：${analysis.score}/100` : '- 评分：暂无',
      '',
      '### 识别回答',
      maskReviewText(analysis?.answerText || '暂无回答片段', record, privacyMode),
      '',
      '### 问题点',
      ...(analysis?.issues.length ? analysis.issues.map((item) => `- ${maskReviewText(item, record, privacyMode)}`) : ['- 暂无']),
      '',
      '### 优化建议',
      ...(analysis?.suggestions.length ? analysis.suggestions.map((item) => `- ${maskReviewText(item, record, privacyMode)}`) : ['- 暂无'])
    ].join('\n')
  })

  return [
    ...header,
    '## 整场复盘报告',
    maskReviewText(record.reportMarkdown || '暂无报告', record, privacyMode),
    '',
    '## 逐题分析',
    questions.join('\n\n') || '暂无逐题分析',
    '',
    '## 原始转写',
    maskReviewText(record.transcriptText || '暂无转写', record, privacyMode)
  ].join('\n')
}

export function interviewReviewRecordToWordHtml(record: InterviewReviewRecord, privacyMode?: boolean): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(record.title)}</title></head><body>${markdownToSimpleHtml(interviewReviewRecordToMarkdown(record, privacyMode))}</body></html>`
}

export function interviewReviewExportFileName(record: InterviewReviewRecord): string {
  return safeFileName(record.title || '面试复盘记录')
}

function maskReviewText(text: string, record: InterviewReviewRecord, privacyMode?: boolean): string {
  if (!privacyMode) {
    return text
  }

  let masked = maskSensitiveInfo(text, true)
  const terms = [record.candidateName, record.resumeProfileName]
    .filter((item): item is string => Boolean(item && item.trim().length >= 2))
    .map((item) => item.trim())

  for (const term of Array.from(new Set(terms))) {
    masked = masked.replace(new RegExp(escapeRegExp(term), 'g'), '***')
  }

  return masked
}

function markdownToSimpleHtml(markdown: string): string {
  return markdown
    .split('\n')
    .map((line) => {
      if (line.startsWith('# ')) return `<h1>${escapeHtml(line.slice(2))}</h1>`
      if (line.startsWith('## ')) return `<h2>${escapeHtml(line.slice(3))}</h2>`
      if (line.startsWith('### ')) return `<h3>${escapeHtml(line.slice(4))}</h3>`
      if (line.startsWith('- ')) return `<p>• ${escapeHtml(line.slice(2))}</p>`
      if (!line.trim()) return '<br>'
      return `<p>${escapeHtml(line)}</p>`
    })
    .join('\n')
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function stripFileExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '')
}

function formatDateTime(value: number): string {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}
