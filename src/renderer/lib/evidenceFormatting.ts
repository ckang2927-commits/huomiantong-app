import type { CompletedAnswer } from '../../shared/types'

type EvidenceLike = {
  source: 'formal' | 'detailed' | 'extra'
  sourceLabel?: string
}

export function evidenceLabel(item: EvidenceLike): string {
  return item.sourceLabel || (item.source === 'formal' ? '正式简历' : item.source === 'detailed' ? '万字简历' : '其他简历')
}

export function evidenceSources(evidence: EvidenceLike[] = []): string[] {
  return Array.from(new Set(evidence.map(evidenceLabel))).slice(0, 6)
}

export function evidenceMarkdown(evidence = [] as NonNullable<CompletedAnswer['evidence']>): string {
  if (evidence.length === 0) {
    return '无明确简历依据'
  }

  return evidence.slice(0, 5).map((item, index) => `${index + 1}. [${evidenceLabel(item)}] ${item.text}`).join('\n')
}
