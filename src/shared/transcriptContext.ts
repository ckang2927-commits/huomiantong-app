import type { TranscriptLine } from './types'

export type TranscriptContextSnapshot = {
  compressed: boolean
  totalLines: number
  interviewerTurns: number
  candidateTurns: number
  summary: string
  recentLines: string[]
  topics: string[]
}

const topicRules: Array<{ label: string; patterns: RegExp[] }> = [
  { label: '公司地点', patterns: [/在哪里/i, /在哪儿/i, /在哪/i, /地址/i, /城市/i, /公司/i] },
  { label: '项目经历', patterns: [/项目/i, /案例/i, /经历/i, /模型/i, /A\/B/i, /RFM/i, /ROI/i, /ROAS/i] },
  { label: '职责范围', patterns: [/负责/i, /职责/i, /做什么/i, /工作内容/i, /岗位职责/i] },
  { label: '结果指标', patterns: [/结果/i, /提升/i, /增长/i, /转化率/i, /ACOS/i, /指标/i, /业绩/i] },
  { label: '方法过程', patterns: [/怎么/i, /如何/i, /步骤/i, /过程/i, /方法/i, /方案/i, /SQL/i, /Python/i] },
  { label: '时间节点', patterns: [/什么时候/i, /多久/i, /年限/i, /时间/i, /毕业/i, /离职/i] },
  { label: '薪资谈判', patterns: [/薪资/i, /工资/i, /期望薪资/i, /底线/i, /涨幅/i, /年包/i] },
  { label: '公司背景', patterns: [/公司/i, /业务/i, /团队/i, /组织/i, /行业/i, /主营业务/i] }
]

export function buildTranscriptContext(transcript: TranscriptLine[], options?: { recentLineCount?: number; maxTopics?: number }): TranscriptContextSnapshot {
  const recentLineCount = options?.recentLineCount ?? 6
  const maxTopics = options?.maxTopics ?? 4
  const totalLines = transcript.length
  const interviewerTurns = transcript.filter((line) => line.speaker === 'interviewer').length
  const candidateTurns = transcript.filter((line) => line.speaker === 'candidate').length
  const recentLines = transcript.slice(-recentLineCount).map(formatLine)
  const earlierLines = transcript.slice(0, Math.max(0, totalLines - recentLineCount))
  const topicScores = detectTopics(earlierLines)
  const topics = topicScores.slice(0, maxTopics)

  if (totalLines <= recentLineCount) {
    return {
      compressed: false,
      totalLines,
      interviewerTurns,
      candidateTurns,
      summary: '',
      recentLines,
      topics
    }
  }

  const repeatedQuestions = findRepeatedQuestions(transcript)
  const topicText = topics.length ? `主要话题：${topics.join('、')}。` : '主要话题：通用追问。'
  const repeatedText = repeatedQuestions.length ? `重复/追问较多的问题：${repeatedQuestions.join('、')}。` : ''

  return {
    compressed: true,
    totalLines,
    interviewerTurns,
    candidateTurns,
    summary: `会话已进行 ${interviewerTurns} 轮提问、${candidateTurns} 次回答。${topicText}${repeatedText}`.trim(),
    recentLines,
    topics
  }
}

export function formatTranscriptContext(snapshot: TranscriptContextSnapshot): string {
  const parts: string[] = []

  if (snapshot.summary) {
    parts.push('【会话摘要】', snapshot.summary, '')
  }

  parts.push('【最近上下文】')

  if (snapshot.recentLines.length === 0) {
    parts.push('暂无')
  } else {
    parts.push(...snapshot.recentLines)
  }

  return parts.join('\n')
}

function detectTopics(lines: TranscriptLine[]): string[] {
  const text = lines.map((line) => line.text).join(' ')
  const matched = topicRules
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(text)))
    .map((rule) => rule.label)

  return unique(matched)
}

function findRepeatedQuestions(transcript: TranscriptLine[]): string[] {
  const questionCounts = new Map<string, { count: number; sample: string }>()

  for (const line of transcript) {
    if (line.speaker !== 'interviewer') {
      continue
    }

    const key = normalizeText(line.text)
    if (!key) {
      continue
    }

    const current = questionCounts.get(key)
    if (current) {
      current.count += 1
    } else {
      questionCounts.set(key, { count: 1, sample: line.text })
    }
  }

  return Array.from(questionCounts.values())
    .filter((item) => item.count >= 2)
    .map((item) => item.sample)
    .slice(0, 3)
}

function formatLine(line: TranscriptLine): string {
  return `${line.speaker === 'interviewer' ? '面试官' : '候选人'}：${line.text}`
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values))
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, '').replace(/[，。！？、；;:,.]/g, '').trim()
}
