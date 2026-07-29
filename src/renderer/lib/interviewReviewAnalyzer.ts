import { analyzeQuestionIntent, type QuestionIntentCategory } from '../../shared/questionIntent'

export type InterviewReviewQuestionSource = 'punctuation' | 'speaker' | 'keyword'

export type InterviewReviewExtractedQuestion = {
  id: string
  order: number
  segmentIndex: number
  question: string
  originalText: string
  intentCategory: QuestionIntentCategory
  intentLabel: string
  confidence: number
  source: InterviewReviewQuestionSource
  startSec?: number
  speaker?: string
  contextBefore: string
  contextAfter: string
}

export type InterviewReviewAnswerRiskLevel = 'good' | 'warn' | 'risk'

export type InterviewReviewAnswerAnalysis = {
  questionId: string
  answerText: string
  wordCount: number
  score: number
  level: InterviewReviewAnswerRiskLevel
  metrics: {
    relevance: number
    completeness: number
    concision: number
    evidence: number
  }
  issues: string[]
  suggestions: string[]
}

export type InterviewReviewAnswerReviewMode = 'shortFact' | 'hrIntent' | 'businessEvidence' | 'selfIntro' | 'general'

type TranscriptSegment = {
  text: string
  rawText: string
  index: number
  startSec?: number
  speaker?: string
}

const questionKeywordPatterns = [
  /什么/,
  /怎么|怎样|如何/,
  /为什么|为啥/,
  /哪里|哪儿|哪家公司|哪一年|哪个/,
  /多少|多久|多长/,
  /有没有|是否|吗|能不能|可不可以|能否/,
  /介绍一下|说一下|讲一下|聊一下|展开讲|展开说|具体讲|描述一下|表述一下|分享一下/,
  /了解一下|想了解|想问|问一下|反馈周期|反向提问|怎么考量|怎么理解|怎么处理/,
  /任务量|量级|业务部门|发展方向|管理方向|任职过|参与到|市场调研|行业领域|国内转国外|不符合原有的需求|自己想要的方向|同时并行|处理多少/,
  /自我介绍|项目|经历|职责|负责|离职|薪资|期望|优点|缺点|规划|压力|困难|挑战|复盘|结果|指标|模型|SQL|Python|A\/B|实验|ROI|ROAS|ACOS/i
]

const interviewerSpeakerPattern = /^(面试官|HR|hr|Interviewer|interviewer|Recruiter|recruiter)/i
const candidateSpeakerPattern = /^(候选人|Candidate|candidate|Me|me|我)(?:\s|$)/i
const candidateLeadPattern = /^(我|我的|我们|当时|然后我|所以我|这块我|这个项目我|简单说)/i
const interviewerAnswerLeadPattern = /^(这里我描述一下|我描述一下|这里描述一下|这边大概|这边的话大概|好的那如果没有其他问题|如果没有其他问题|好的了解，如果没有其他问题)/i
const noisePattern = /^(嗯+|啊+|呃+|额+|好的|好|可以|没事|谢谢|喂|哈喽|hello|ok|OK|行)[。.!！,，\s]*$/i
const resultPattern = /提升|降低|增长|减少|节省|优化|改善|转化率|准确率|召回率|留存|复购|ROI|ROAS|ACOS|CPA|GMV|营收|成本|效率|满意度|%|％|\d/i
const structurePattern = /背景|目标|问题|原因|动作|方案|过程|结果|复盘|总结|首先|其次|最后|第一|第二|第三/
const uncertainPattern = /大概|可能|应该|差不多|好像|不太确定|也许|大约/
const directAttitudePattern = /支持|愿意|可以|能接受|没问题|有意愿|确定|比较明确|不影响|认可|同意|已经沟通|已沟通/
const stabilityReasonPattern = /因为|主要是|原因|考虑|家里|父母|发展|机会|城市|岗位|长期|稳定|安排|沟通|租房|通勤|到岗|入职|朋友|同学|生活/

export function getInterviewReviewAnswerReviewMode(question: Pick<InterviewReviewExtractedQuestion, 'intentCategory' | 'question'>): InterviewReviewAnswerReviewMode {
  if (isSelfIntroQuestion(question.question)) {
    return 'selfIntro'
  }

  if (isShortFactQuestion(question)) {
    return 'shortFact'
  }

  if (isHrIntentQuestion(question)) {
    return 'hrIntent'
  }

  if (requiresBusinessEvidence(question)) {
    return 'businessEvidence'
  }

  return 'general'
}

export function getInterviewReviewEvidenceMetricLabel(question: Pick<InterviewReviewExtractedQuestion, 'intentCategory' | 'question'>): string {
  const mode = getInterviewReviewAnswerReviewMode(question)

  if (mode === 'shortFact') return '准确'
  if (mode === 'hrIntent') return '可信'
  if (mode === 'businessEvidence' || mode === 'selfIntro') return '证据'
  return '可信'
}

export function extractInterviewReviewQuestions(transcript: string): InterviewReviewExtractedQuestion[] {
  const segments = buildSegments(transcript)
  const candidates = segments
    .flatMap((segment) => splitSegmentIntoCandidates(segment))
    .map((segment) => scoreSegment(segment))
    .filter((item) => item.score >= 42)
    .sort((a, b) => b.score - a.score)

  const seen = new Set<string>()
  const selected = candidates
    .filter((item) => {
      const key = normalizeQuestionKey(item.segment.text)
      if (!key || seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
    .sort((a, b) => a.segment.index - b.segment.index)
    .slice(0, 80)

  return selected.map((item, index) => {
    const intent = analyzeQuestionIntent(item.segment.text)
    const context = buildContext(segments, item.segment.index)

    return {
      id: `${item.segment.index}-${normalizeQuestionKey(item.segment.text).slice(0, 24)}`,
      order: index + 1,
      segmentIndex: item.segment.index,
      question: normalizeQuestionText(item.segment.text),
      originalText: item.segment.rawText,
      intentCategory: intent.category,
      intentLabel: intent.label,
      confidence: Math.min(98, Math.max(35, item.score)),
      source: item.source,
      startSec: item.segment.startSec,
      speaker: item.segment.speaker,
      contextBefore: context.before,
      contextAfter: context.after
    }
  })
}

export function analyzeInterviewReviewAnswers(
  transcript: string,
  questions: InterviewReviewExtractedQuestion[]
): InterviewReviewAnswerAnalysis[] {
  const segments = buildSegments(transcript)
  const orderedQuestions = [...questions].sort((a, b) => a.segmentIndex - b.segmentIndex)

  return orderedQuestions.map((question, index) => {
    const nextQuestion = orderedQuestions[index + 1]
    const answerSegments = collectAnswerSegments(segments, question, nextQuestion)
    const answerText = normalizeQuestionText(answerSegments.map((segment) => segment.text).join('\n'))

    return scoreAnswerSegment(question, answerText)
  })
}

export function summarizeExtractedQuestions(questions: InterviewReviewExtractedQuestion[]): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>()

  questions.forEach((question) => {
    counts.set(question.intentLabel, (counts.get(question.intentLabel) || 0) + 1)
  })

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

function collectAnswerSegments(
  segments: TranscriptSegment[],
  question: InterviewReviewExtractedQuestion,
  nextQuestion?: InterviewReviewExtractedQuestion
): TranscriptSegment[] {
  const startIndex = Math.floor(question.segmentIndex)
  const endIndex = nextQuestion ? Math.floor(nextQuestion.segmentIndex) : Number.POSITIVE_INFINITY

  return segments.filter((segment) => {
    if (segment.index <= startIndex || segment.index >= endIndex) {
      return false
    }

    if (!segment.text || noisePattern.test(segment.text)) {
      return false
    }

    if (segment.speaker && interviewerSpeakerPattern.test(segment.speaker) && !candidateSpeakerPattern.test(segment.speaker)) {
      return false
    }

    const scored = scoreSegment(segment)
    if (scored.score >= 58 && !candidateSpeakerPattern.test(segment.speaker || '')) {
      return false
    }

    return true
  })
}

function scoreAnswerSegment(question: InterviewReviewExtractedQuestion, answerText: string): InterviewReviewAnswerAnalysis {
  const wordCount = countAnswerUnits(answerText)
  const metrics = {
    relevance: scoreRelevance(question, answerText),
    completeness: scoreCompleteness(question, answerText),
    concision: scoreConcision(question, answerText, wordCount),
    evidence: scoreEvidence(question, answerText)
  }
  const score = Math.round(metrics.relevance * 0.32 + metrics.completeness * 0.28 + metrics.concision * 0.18 + metrics.evidence * 0.22)
  const issues = buildAnswerIssues(question, answerText, wordCount, metrics)
  const suggestions = buildAnswerSuggestions(question, answerText, metrics, issues)
  const level: InterviewReviewAnswerRiskLevel = score >= 78 && issues.length <= 1 ? 'good' : score >= 58 ? 'warn' : 'risk'

  return {
    questionId: question.id,
    answerText,
    wordCount,
    score,
    level,
    metrics,
    issues,
    suggestions
  }
}

function scoreRelevance(question: InterviewReviewExtractedQuestion, answerText: string): number {
  if (!answerText.trim()) {
    return 0
  }

  const reviewMode = getInterviewReviewAnswerReviewMode(question)

  if (reviewMode === 'selfIntro') {
    return clampScore(58 + (/我叫|我是|姓名|名字|经验|年|负责|主要|擅长|SQL|Python|BI|数据/i.test(answerText) ? 28 : 8))
  }

  if (reviewMode === 'shortFact') {
    return clampScore(62 + (hasConcreteShortFact(answerText) ? 22 : 8) + (answerText.length <= 80 ? 6 : 0))
  }

  if (reviewMode === 'hrIntent') {
    return clampScore(56 + (directAttitudePattern.test(answerText) ? 20 : 0) + (stabilityReasonPattern.test(answerText) ? 14 : 0))
  }

  const questionTerms = extractMeaningfulTerms(question.question)
  const answerTerms = new Set(extractMeaningfulTerms(answerText))
  const overlap = questionTerms.filter((term) => answerTerms.has(term)).length
  const baseScore = questionTerms.length ? Math.round((overlap / questionTerms.length) * 70) : 42

  return clampScore(baseScore + (answerText.length >= 24 ? 18 : 8))
}

function scoreCompleteness(question: InterviewReviewExtractedQuestion, answerText: string): number {
  if (!answerText.trim()) {
    return 0
  }

  const reviewMode = getInterviewReviewAnswerReviewMode(question)

  if (reviewMode === 'shortFact') {
    return clampScore(56 + (hasConcreteShortFact(answerText) ? 24 : 8) + (/因为|当时|目前|现在|主要/.test(answerText) ? 8 : 0))
  }

  if (reviewMode === 'hrIntent') {
    let score = 42
    if (directAttitudePattern.test(answerText)) score += 24
    if (stabilityReasonPattern.test(answerText)) score += 18
    if (/长期|稳定|安排|沟通|租房|通勤|到岗|入职|规划/.test(answerText)) score += 12
    return clampScore(score)
  }

  if (reviewMode === 'selfIntro') {
    let score = 48
    if (/我叫|我是|姓名|名字/.test(answerText)) score += 14
    if (/年|经验|经历|做了|从事/.test(answerText)) score += 16
    if (/SQL|Python|BI|Excel|数据|分析|模型|报表/i.test(answerText)) score += 14
    if (/负责|主要|擅长|目标|岗位/.test(answerText)) score += 10
    return clampScore(score)
  }

  let score = 35
  if (answerText.length >= 80) score += 18
  if (structurePattern.test(answerText)) score += 20
  if (/我|我们|负责|参与|主导|搭建|分析|推进|落地/.test(answerText)) score += 12
  if (resultPattern.test(answerText)) score += 15

  return clampScore(score)
}

function scoreConcision(question: InterviewReviewExtractedQuestion, answerText: string, wordCount: number): number {
  if (!answerText.trim()) {
    return 0
  }

  const reviewMode = getInterviewReviewAnswerReviewMode(question)

  if (reviewMode === 'shortFact') {
    if (wordCount <= 60) return 92
    if (wordCount <= 120) return 75
    return 48
  }

  if (reviewMode === 'hrIntent') {
    if (wordCount < 18) return 56
    if (wordCount <= 180) return 92
    if (wordCount <= 300) return 76
    return 48
  }

  if (wordCount < 35) return 52
  if (wordCount <= 260) return 92
  if (wordCount <= 420) return 72
  return 45
}

function scoreEvidence(question: InterviewReviewExtractedQuestion, answerText: string): number {
  if (!answerText.trim()) {
    return 0
  }

  const reviewMode = getInterviewReviewAnswerReviewMode(question)

  if (reviewMode === 'shortFact') {
    return clampScore(52 + (hasConcreteShortFact(answerText) ? 28 : 8) - (uncertainPattern.test(answerText) ? 14 : 0))
  }

  if (reviewMode === 'hrIntent') {
    let score = 42
    if (directAttitudePattern.test(answerText)) score += 24
    if (stabilityReasonPattern.test(answerText)) score += 18
    if (/长期|稳定|安排|沟通|租房|通勤|到岗|入职|规划/.test(answerText)) score += 10
    if (uncertainPattern.test(answerText)) score -= 16
    return clampScore(score)
  }

  if (reviewMode === 'selfIntro') {
    return clampScore(54 + (/年|经验|SQL|Python|BI|Excel|数据|分析|岗位/i.test(answerText) ? 22 : 0) + (resultPattern.test(answerText) ? 12 : 0))
  }

  if (reviewMode === 'general') {
    let score = 45
    if (/我|我们|因为|主要|实际|真实|结合|岗位|经历|情况/.test(answerText)) score += 18
    if (structurePattern.test(answerText)) score += 12
    if (resultPattern.test(answerText)) score += 8
    if (uncertainPattern.test(answerText)) score -= 14
    return clampScore(score)
  }

  let score = 35
  if (resultPattern.test(answerText)) score += 30
  if (/项目|公司|业务|用户|广告|库存|销售|指标|模型|实验|SQL|Python|BI|报表/i.test(answerText)) score += 18
  if (uncertainPattern.test(answerText)) score -= 18

  return clampScore(score)
}

function buildAnswerIssues(
  question: InterviewReviewExtractedQuestion,
  answerText: string,
  wordCount: number,
  metrics: InterviewReviewAnswerAnalysis['metrics']
): string[] {
  const issues: string[] = []

  if (!answerText.trim()) {
    return ['没有识别到候选人的回答片段，可能是说话人分离不准或录音里没有作答。']
  }

  if (metrics.relevance < 55) {
    issues.push('回答和问题关键词重合较低，可能有跑题风险。')
  }

  const reviewMode = getInterviewReviewAnswerReviewMode(question)

  if (reviewMode === 'shortFact') {
    if (wordCount > 120) {
      issues.push('这是短问短答类问题，回答偏长，建议先直接给结论。')
    }
    if (metrics.evidence < 55) {
      issues.push('短事实回答不够明确，建议先给具体地点、时间、公司名或薪资区间。')
    }
  } else if (reviewMode === 'hrIntent') {
    if (wordCount < 25) {
      issues.push('意愿/稳定性说得偏短，建议补一句真实原因和后续安排。')
    }
    if (wordCount > 300) {
      issues.push('意愿类问题回答偏长，容易显得解释过度，建议控制在 60-180 字。')
    }
    if (metrics.evidence < 55) {
      issues.push('态度和稳定安排不够清楚，建议明确“是否支持/是否愿意/怎么安排”。')
    }
  } else {
    if (wordCount < 45) {
      issues.push('回答偏短，缺少背景、动作或结果，面试官可能会继续追问。')
    }
    if (wordCount > 420) {
      issues.push('回答偏长，现场表达容易显得啰嗦，建议压缩到 100-300 字。')
    }
  }

  if (metrics.evidence < 55 && reviewMode === 'businessEvidence') {
    issues.push('缺少可验证结果或业务指标，建议补充数字、对比或落地结果。')
  } else if (metrics.evidence < 55 && reviewMode === 'general') {
    issues.push('回答缺少结合自身情况的具体说明，建议补真实背景或选择理由。')
  }

  if (uncertainPattern.test(answerText)) {
    issues.push('不确定表达较多，正式面试中会削弱可信度。')
  }

  return issues
}

function buildAnswerSuggestions(
  question: InterviewReviewExtractedQuestion,
  answerText: string,
  metrics: InterviewReviewAnswerAnalysis['metrics'],
  issues: string[]
): string[] {
  if (!answerText.trim()) {
    return ['先检查转写文本：如果候选人回答没有被分到问题后面，可以手动调整文本或补充说话人标签。']
  }

  const suggestions: string[] = []
  const reviewMode = getInterviewReviewAnswerReviewMode(question)

  if (reviewMode === 'shortFact') {
    suggestions.push('先用一句话直接回答，再补一句背景，不要展开成完整项目经历。')
  } else if (reviewMode === 'hrIntent') {
    suggestions.push('建议按“明确态度 → 真实原因 → 稳定安排”回答，不要硬套项目/指标结构。')
  } else if (reviewMode === 'businessEvidence') {
    suggestions.push('建议按“结论 → 背景 → 动作 → 结果/复盘”压缩表达。')
  } else {
    suggestions.push('先直答问题，再补一两句个人情况或岗位匹配理由。')
  }

  if (metrics.evidence < 65 && reviewMode === 'businessEvidence') {
    suggestions.push('补一个真实指标或业务结果，例如提升、降低、节省、准确率或转化率。')
  } else if (metrics.evidence < 65 && reviewMode === 'hrIntent') {
    suggestions.push('补充一个真实安排，例如已沟通、可到岗、租房/通勤计划或长期发展考虑。')
  } else if (metrics.evidence < 65 && reviewMode !== 'shortFact') {
    suggestions.push('补一条真实背景或选择理由，让回答更像现场沟通，而不是空泛表态。')
  }

  if (metrics.relevance < 65) {
    suggestions.push('开头先复述问题核心，避免上来就背简历。')
  }

  if (issues.length === 0) {
    suggestions.push('这段回答结构基本可用，后续可以让 AI 生成一版更自然的优化话术。')
  }

  return Array.from(new Set(suggestions)).slice(0, 4)
}

function extractMeaningfulTerms(text: string): string[] {
  const normalized = text.toLowerCase()
  const englishTerms = normalized.match(/[a-z][a-z0-9+#./-]{1,}/g) || []
  const chineseTerms = normalized
    .replace(/[^\u4e00-\u9fa5]/g, '')
    .split(/(?=项目|经历|负责|结果|指标|模型|公司|哪里|时间|薪资|原因|离职|挑战|困难|业务|用户|数据|分析|报表|实验|转化|提升|降低)/)
    .flatMap((part) => part.match(/[\u4e00-\u9fa5]{2,6}/g) || [])

  return Array.from(new Set([...englishTerms, ...chineseTerms])).filter((term) => !isStopTerm(term)).slice(0, 40)
}

function isStopTerm(term: string): boolean {
  return ['这个', '那个', '一下', '就是', '然后', '因为', '所以', '我们', '你们', '他们', '可以', '进行', '主要'].includes(term)
}

function countAnswerUnits(text: string): number {
  const chinese = text.match(/[\u4e00-\u9fa5]/g)?.length || 0
  const englishWords = text.match(/[a-zA-Z0-9+#./-]+/g)?.length || 0
  return chinese + englishWords
}

function isSelfIntroQuestion(question: string): boolean {
  return /自我介绍|介绍一下你自己|介绍下你自己|你是谁|简单介绍/.test(question)
}

function isShortFactQuestion(question: Pick<InterviewReviewExtractedQuestion, 'intentCategory' | 'question'>): boolean {
  if (question.intentCategory === 'location' || question.intentCategory === 'time' || question.intentCategory === 'salary') {
    return true
  }

  return question.intentCategory === 'company' && /叫什么|哪家|哪个公司|公司名|地址|地点|在哪|哪里|哪儿/.test(question.question)
}

function isHrIntentQuestion(question: Pick<InterviewReviewExtractedQuestion, 'intentCategory' | 'question'>): boolean {
  return question.intentCategory === 'motivation' || /家里|家人|父母|支持|意愿|愿意|想不想|稳定|长期|定居|城市选择|到岗|入职|通勤|租房|离职原因|为什么离职/.test(question.question)
}

function requiresBusinessEvidence(question: Pick<InterviewReviewExtractedQuestion, 'intentCategory' | 'question'>): boolean {
  if (isShortFactQuestion(question) || isHrIntentQuestion(question)) {
    return false
  }

  return (
    question.intentCategory === 'project' ||
    question.intentCategory === 'responsibility' ||
    question.intentCategory === 'achievement' ||
    question.intentCategory === 'process' ||
    /项目|经历|负责|职责|结果|指标|模型|实验|A\/B|ROI|ROAS|ACOS|业务|用户|数据|分析|报表|转化率|准确率/i.test(question.question)
  )
}

function hasConcreteShortFact(answerText: string): boolean {
  return /[\u4e00-\u9fa5]{2,}(省|市|区|县|州|路|号|公司|集团|学院|大学)|北京|上海|广州|深圳|杭州|南京|郑州|河南|河北|湖北|湖南|江苏|浙江|四川|成都|重庆|\d{4}年|\d{1,2}月|\d{1,2}k|K|千|万|元/i.test(answerText) || answerText.replace(/\s+/g, '').length >= 4
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function buildSegments(transcript: string): TranscriptSegment[] {
  const normalized = transcript
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")

  const rawLines = normalized
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  const preparedLines = normalizeTranscriptLines(rawLines)
  const baseSegments = preparedLines.length > 0 ? preparedLines : normalized.split(/[。！？!?]+/).map((line) => line.trim()).filter(Boolean)

  return baseSegments
    .map((line, index) => parseTranscriptLine(line, index))
    .filter((segment) => segment.text.length > 0)
}

function normalizeTranscriptLines(rawLines: string[]): string[] {
  const preparedLines: string[] = []
  let pendingSpeaker = ''
  let pendingTime = ''

  for (const line of rawLines) {
    const meetingHeader = line.match(/^((?:说话人|Speaker)\s*\d+|说话人\d+|面试官|候选人|HR|hr)\s+(\d{1,2}:\d{2}(?::\d{2})?)$/i)

    if (meetingHeader) {
      pendingSpeaker = normalizeSpeakerLabel(meetingHeader[1])
      pendingTime = meetingHeader[2]
      continue
    }

    if (pendingSpeaker) {
      preparedLines.push(`[${pendingTime}] ${pendingSpeaker}：${line}`)
      pendingSpeaker = ''
      pendingTime = ''
      continue
    }

    preparedLines.push(line)
  }

  return preparedLines
}

function normalizeSpeakerLabel(speaker: string): string {
  const compactSpeaker = speaker.replace(/\s+/g, '')
  const speakerNumber = compactSpeaker.match(/^(?:说话人|Speaker)(\d+)$/i)?.[1]

  if (!speakerNumber) {
    return speaker.trim()
  }

  return `说话人 ${Number(speakerNumber)}`
}

function parseTranscriptLine(line: string, index: number): TranscriptSegment {
  const timeMatch = line.match(/^\[(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\]\s*/)
  const simpleTimeMatch = line.match(/^\[(\d{1,2}):(\d{2})\]\s*/)
  let startSec: number | undefined
  let withoutTime = line

  if (timeMatch) {
    const hours = Number(timeMatch[1] || 0)
    const minutes = Number(timeMatch[2] || 0)
    const seconds = Number(timeMatch[3] || 0)
    startSec = hours * 3600 + minutes * 60 + seconds
    withoutTime = line.slice(timeMatch[0].length).trim()
  } else if (simpleTimeMatch) {
    const minutes = Number(simpleTimeMatch[1] || 0)
    const seconds = Number(simpleTimeMatch[2] || 0)
    startSec = minutes * 60 + seconds
    withoutTime = line.slice(simpleTimeMatch[0].length).trim()
  }

  const speakerMatch = withoutTime.match(/^([^：:]{1,24})[：:]\s*(.+)$/)
  const speaker = speakerMatch?.[1]?.trim()
  const text = speakerMatch?.[2]?.trim() || withoutTime

  return {
    text: normalizeQuestionText(text),
    rawText: line,
    index,
    startSec,
    speaker
  }
}

function splitSegmentIntoCandidates(segment: TranscriptSegment): TranscriptSegment[] {
  const text = segment.text

  if (text.length <= 120 && !shouldForceSplitShortQuestion(text)) {
    return [segment]
  }

  const parts = text
    .split(/(?<=[？?。.!！])\s*|(?=请你|请问|那你|你能|能不能|可以说|说一下|讲一下|介绍一下|描述一下|表述一下|分享一下|为什么|怎么|如何|有没有|是否|想了解|想问|问一下|这里的话|回到|关于|如果说|举个例子|大概是什么|反向提问|反馈周期)/)
    .map((part) => normalizeQuestionText(part))
    .filter((part) => part.length >= 5)

  if (parts.length <= 1) {
    return [segment]
  }

  return parts.map((part, partIndex) => ({
    ...segment,
    text: part,
    rawText: part,
    index: segment.index + partIndex / 100
  }))
}

function shouldForceSplitShortQuestion(text: string): boolean {
  const triggerHits = text.match(/请问|那你|你能|有没有|想了解|想问|问一下|如果说|举个例子|怎么|如何|为什么/g) || []
  return triggerHits.length >= 2
}

function scoreSegment(segment: TranscriptSegment): {
  segment: TranscriptSegment
  score: number
  source: InterviewReviewQuestionSource
} {
  const text = normalizeQuestionText(segment.text)
  let score = 0
  let source: InterviewReviewQuestionSource = 'keyword'

  if (!text || noisePattern.test(text)) {
    return { segment, score: 0, source }
  }

  if (/[？?]/.test(text)) {
    score += 42
    source = 'punctuation'
  }

  if (segment.speaker && interviewerSpeakerPattern.test(segment.speaker)) {
    score += 24
    source = source === 'punctuation' ? source : 'speaker'
  }

  if (segment.speaker && candidateSpeakerPattern.test(segment.speaker) && !/[？?]/.test(text)) {
    score -= 30
  }

  const keywordHits = questionKeywordPatterns.filter((pattern) => pattern.test(text)).length
  score += Math.min(36, keywordHits * 12)

  if (/^(请|那|你|您|能|可以|方便|简单|先|接下来|这里|回到|关于|另外)/.test(text)) {
    score += 10
  }

  if (text.length >= 8 && text.length <= 90) {
    score += 8
  } else if (text.length > 160) {
    score -= 12
  }

  if (candidateLeadPattern.test(text) && !/[？?]/.test(text)) {
    score -= 28
  }

  if (interviewerAnswerLeadPattern.test(text) && !/[？?]/.test(text)) {
    score -= 38
  }

  if (/我认为|我觉得|我的理解|我当时|我们当时|我负责|我主要/.test(text) && !/[？?]/.test(text)) {
    score -= 18
  }

  if (/回答|答案|结果是|总结一下/.test(text) && !/[？?]/.test(text)) {
    score -= 8
  }

  return {
    segment: {
      ...segment,
      text
    },
    score,
    source
  }
}

function buildContext(segments: TranscriptSegment[], index: number): { before: string; after: string } {
  const currentIndex = segments.findIndex((segment) => Math.floor(segment.index) === Math.floor(index))
  const safeIndex = currentIndex >= 0 ? currentIndex : Math.floor(index)
  const before = segments
    .slice(Math.max(0, safeIndex - 1), safeIndex)
    .map((segment) => segment.text)
    .join(' ')
  const after = segments
    .slice(safeIndex + 1, safeIndex + 3)
    .map((segment) => segment.text)
    .join(' ')

  return { before, after }
}

function normalizeQuestionText(text: string): string {
  return text
    .replace(/\b(?:[A-Za-z]\s+){2,}[A-Za-z]\b/g, (match) => match.replace(/\s+/g, ''))
    .replace(/([\u4e00-\u9fa5])\s+(?=[\u4e00-\u9fa5])/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/([,，。.!！?？;；:：])\1+/g, '$1')
    .replace(/\s+([,，。.!！?？;；:：])/g, '$1')
    .trim()
}

function normalizeQuestionKey(text: string): string {
  return normalizeQuestionText(text)
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')
    .toLowerCase()
    .slice(0, 120)
}
