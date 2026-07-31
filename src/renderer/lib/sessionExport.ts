import type { EvidenceSnippet, FloatingPayload, InterviewSession } from '../../shared/types'
import { evidenceMarkdown } from './evidenceFormatting'

export function safeFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '-').trim() || '面试会话'
}

export function downloadText(fileName: string, content: string, type = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export function buildReview(session: InterviewSession): { avg: number; risks: number; count: number } {
  const scored = session.answers.filter((item) => item.quality)
  const avg = scored.length ? Math.round(scored.reduce((sum, item) => sum + (item.quality?.total || 0), 0) / scored.length) : 0
  const risks = session.answers.filter((item) => item.risk?.level === 'medium' || item.risk?.level === 'high').length

  return { avg, risks, count: session.answers.length }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function maskSensitiveInfo(text: string, privacyMode?: boolean): string {
  if (!privacyMode) return text

  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '***@***')
    .replace(/(?:\+?86[-\s]?)?1[3-9]\d{9}/g, '[已隐藏手机号]')
    .replace(/[\u4e00-\u9fffA-Za-z0-9（）()]{2,}(?:有限公司|有限责任公司|科技股份有限公司|股份有限公司|科技公司|集团|公司)/g, '[已隐藏公司]')
    .replace(/[\u4e00-\u9fff]{2,4}(?:同学|先生|女士|老师)/g, '[已隐藏姓名]')
    .replace(/(?:我叫|姓名|称呼|候选人)[：:]\s*[\u4e00-\u9fff]{2,4}/g, (matched) => matched.replace(/[\u4e00-\u9fff]{2,4}$/, '[已隐藏姓名]'))
}

export function maskSessionText(text: string, session: InterviewSession, privacyMode?: boolean): string {
  if (!privacyMode) return text

  let masked = maskSensitiveInfo(text, true)
  const terms = [
    session.candidateName,
    session.resumeProfileName
  ]
    .filter((item): item is string => Boolean(item && item.trim().length >= 2))
    .map((item) => item.trim())

  for (const term of Array.from(new Set(terms))) {
    masked = masked.replace(new RegExp(escapeRegExp(term), 'g'), '[已隐藏姓名]')
  }

  return masked
}

export function maskEvidenceSnippets(evidence: EvidenceSnippet[] = [], session: InterviewSession, privacyMode?: boolean): EvidenceSnippet[] {
  if (!privacyMode) return evidence

  return evidence.map((item) => ({
    ...item,
    sourceLabel: item.sourceLabel ? maskSessionText(item.sourceLabel, session, true) : item.sourceLabel,
    text: maskSessionText(item.text, session, true)
  }))
}

export function sessionToMarkdown(session: InterviewSession, privacyMode?: boolean): string {
  const transcript = session.transcript
    .map((line) => `- ${formatExportTime(line.at)} ${line.speaker === 'interviewer' ? '面试官' : '候选人'}：${maskSessionText(line.text, session, privacyMode)}`)
    .join('\n')
  const answers = session.answers
    .map((item, index) => {
      const evidence = maskEvidenceSnippets(item.evidence || [], session, privacyMode)

      return [
        `## ${index + 1}. [${formatExportTime(item.at)}] ${maskSessionText(item.question, session, privacyMode)}`,
        '',
        maskSessionText(item.answer, session, privacyMode),
        '',
        '### 参考依据',
        evidenceMarkdown(evidence),
        '',
        `模型：${item.provider}${item.quality ? `\n评分：${item.quality.total}/100` : ''}${item.risk ? `\n编造风险：${item.risk.level}` : ''}`
      ].join('\n')
    })
    .join('\n\n')
  const review = buildReview(session)

  return [
    `# ${privacyMode ? '脱敏面试会话' : session.title}`,
    '',
    `候选人：${privacyMode ? '***' : session.resumeProfileName || session.candidateName || '未绑定候选人'}`,
    `目标岗位：${privacyMode ? '***' : session.targetRole || '未填写'}`,
    '',
    '## 转写记录',
    transcript || '暂无',
    '',
    '## AI 回答',
    answers || '暂无',
    '',
    '## 面试复盘',
    `- 问答数量：${review.count}`,
    `- 平均评分：${review.avg || '暂无'}`,
    `- 中高风险回答：${review.risks}`
  ].join('\n')
}

export function sessionToWordHtml(session: InterviewSession, privacyMode?: boolean): string {
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>${sessionToMarkdown(session, privacyMode).replaceAll('\n', '<br>')}</body></html>`
}

export function buildFloatingRecords(session: InterviewSession, privacyMode?: boolean): NonNullable<FloatingPayload['records']> {
  return [
    ...session.transcript.map((line) => ({
      id: line.id,
      kind: 'question' as const,
      text: maskSessionText(line.text, session, privacyMode),
      at: line.at
    })),
    ...session.answers.map((item) => ({
      id: item.id,
      kind: 'answer' as const,
      text: maskSessionText(item.answer, session, privacyMode),
      at: item.at,
      evidence: maskEvidenceSnippets(item.evidence, session, privacyMode)
    }))
  ].sort((left, right) => left.at - right.at)
}

function formatExportTime(value: number): string {
  return new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
