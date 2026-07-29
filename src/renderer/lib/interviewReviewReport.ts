import {
  getInterviewReviewAnswerReviewMode,
  type InterviewReviewAnswerAnalysis,
  type InterviewReviewExtractedQuestion
} from './interviewReviewAnalyzer'

export type InterviewReviewReportPriority = 'high' | 'medium' | 'low'

export type InterviewReviewReportItem = {
  title: string
  detail: string
  priority: InterviewReviewReportPriority
}

export type InterviewReviewReportQuestionInsight = {
  questionOrder: number
  question: string
  typeLabel: string
  score: number
  answerExcerpt: string
  issueSummary: string
  suggestion: string
}

export type InterviewReviewReport = {
  generatedAt: string
  overallScore: number
  overallLevel: '优秀' | '良好' | '待提升' | '高风险'
  headline: string
  overview: {
    fileName?: string
    durationLabel: string
    transcriptUnits: number
    questionCount: number
    answeredCount: number
    riskCount: number
    averageRelevance: number
    averageCompleteness: number
    averageConcision: number
    averageEvidence: number
  }
  questionTypeSummary: Array<{ label: string; count: number }>
  strengths: string[]
  weakPoints: InterviewReviewReportItem[]
  actionPlan: InterviewReviewReportItem[]
  highRiskAnswers: InterviewReviewReportQuestionInsight[]
  excellentAnswers: InterviewReviewReportQuestionInsight[]
  markdown: string
}

export function buildLocalInterviewReviewReport(input: {
  transcriptText: string
  questions: InterviewReviewExtractedQuestion[]
  answerAnalyses: InterviewReviewAnswerAnalysis[]
  fileName?: string
  durationSec?: number
}): InterviewReviewReport {
  const generatedAt = new Date().toLocaleString('zh-CN', { hour12: false })
  const analyses = input.answerAnalyses
  const answeredAnalyses = analyses.filter((analysis) => analysis.answerText.trim())
  const averageScore = analyses.length ? average(analyses.map((analysis) => analysis.score)) : 0
  const riskCount = analyses.filter((analysis) => analysis.level === 'risk').length
  const overview = {
    fileName: input.fileName,
    durationLabel: formatDuration(input.durationSec),
    transcriptUnits: countTextUnits(input.transcriptText),
    questionCount: input.questions.length,
    answeredCount: answeredAnalyses.length,
    riskCount,
    averageRelevance: averageMetric(analyses, 'relevance'),
    averageCompleteness: averageMetric(analyses, 'completeness'),
    averageConcision: averageMetric(analyses, 'concision'),
    averageEvidence: averageMetric(analyses, 'evidence')
  }
  const questionTypeSummary = summarizeQuestionTypes(input.questions)
  const highRiskAnswers = buildQuestionInsights(input.questions, analyses, 'risk')
  const excellentAnswers = buildQuestionInsights(input.questions, analyses, 'good')
  const weakPoints = buildWeakPoints(input.questions, analyses, overview)
  const strengths = buildStrengths(input.questions, analyses, overview)
  const actionPlan = buildActionPlan(weakPoints, overview)
  const overallLevel = getOverallLevel(averageScore, riskCount, overview.questionCount)
  const headline = buildHeadline(overallLevel, overview, weakPoints)
  const reportWithoutMarkdown = {
    generatedAt,
    overallScore: averageScore,
    overallLevel,
    headline,
    overview,
    questionTypeSummary,
    strengths,
    weakPoints,
    actionPlan,
    highRiskAnswers,
    excellentAnswers,
    markdown: ''
  }

  return {
    ...reportWithoutMarkdown,
    markdown: buildMarkdown(reportWithoutMarkdown)
  }
}

function buildHeadline(
  overallLevel: InterviewReviewReport['overallLevel'],
  overview: InterviewReviewReport['overview'],
  weakPoints: InterviewReviewReportItem[]
): string {
  if (overview.questionCount === 0) {
    return '暂时没有识别到面试问题，建议先修正转写文本或补充问号。'
  }

  const primaryWeakPoint = weakPoints[0]?.title || '表达结构'
  if (overallLevel === '优秀') {
    return `整场表现比较稳，主要继续打磨「${primaryWeakPoint}」即可。`
  }
  if (overallLevel === '良好') {
    return `整体可用，但「${primaryWeakPoint}」会影响面试说服力。`
  }
  if (overallLevel === '待提升') {
    return `这场复盘暴露出「${primaryWeakPoint}」问题，建议面试前专项训练。`
  }
  return `当前回答风险偏高，优先处理「${primaryWeakPoint}」和回答边界。`
}

function summarizeQuestionTypes(questions: InterviewReviewExtractedQuestion[]): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>()
  questions.forEach((question) => {
    counts.set(question.intentLabel, (counts.get(question.intentLabel) || 0) + 1)
  })

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh-CN'))
}

function buildQuestionInsights(
  questions: InterviewReviewExtractedQuestion[],
  analyses: InterviewReviewAnswerAnalysis[],
  mode: 'risk' | 'good'
): InterviewReviewReportQuestionInsight[] {
  const questionMap = new Map(questions.map((question) => [question.id, question]))
  const filtered = analyses
    .filter((analysis) => (mode === 'risk' ? analysis.level === 'risk' || analysis.score < 58 : analysis.level === 'good' && analysis.answerText.trim()))
    .sort((a, b) => (mode === 'risk' ? a.score - b.score : b.score - a.score))
    .slice(0, 4)

  return filtered.flatMap((analysis) => {
    const question = questionMap.get(analysis.questionId)
    if (!question) {
      return []
    }

    return [{
      questionOrder: question.order,
      question: question.question,
      typeLabel: question.intentLabel,
      score: analysis.score,
      answerExcerpt: excerpt(analysis.answerText || '暂时没有识别到回答片段。', 150),
      issueSummary: analysis.issues[0] || '没有明显问题。',
      suggestion: analysis.suggestions[0] || '保持当前表达，继续补充真实业务细节。'
    }]
  })
}

function buildWeakPoints(
  questions: InterviewReviewExtractedQuestion[],
  analyses: InterviewReviewAnswerAnalysis[],
  overview: InterviewReviewReport['overview']
): InterviewReviewReportItem[] {
  const items: InterviewReviewReportItem[] = []
  const missingAnswers = Math.max(0, questions.length - overview.answeredCount)

  if (missingAnswers > 0) {
    items.push({
      title: '回答边界不清',
      detail: `${missingAnswers} 个问题没有稳定匹配到回答，可能是说话人分离不准、录音太乱，或候选人没有明显作答。`,
      priority: 'high'
    })
  }

  if (overview.averageRelevance > 0 && overview.averageRelevance < 65) {
    items.push({
      title: '贴题度不足',
      detail: '部分回答没有先回应问题核心，容易被面试官感觉是在背简历或绕开问题。',
      priority: 'high'
    })
  }

  const questionMap = new Map(questions.map((question) => [question.id, question]))
  const businessEvidenceAnalyses = analyses.filter((analysis) => {
    const question = questionMap.get(analysis.questionId)
    return question ? getInterviewReviewAnswerReviewMode(question) === 'businessEvidence' : false
  })
  const averageBusinessEvidence = averageMetric(businessEvidenceAnalyses, 'evidence')

  if (businessEvidenceAnalyses.length > 0 && averageBusinessEvidence > 0 && averageBusinessEvidence < 65) {
    items.push({
      title: '业务证据偏弱',
      detail: '项目、职责或成果类问题里，可验证的指标、项目动作和落地结果不足，说服力会打折。',
      priority: 'high'
    })
  } else if (overview.averageEvidence > 0 && overview.averageEvidence < 65) {
    items.push({
      title: '回答可信度偏弱',
      detail: '部分回答没有把态度、事实或个人选择讲清楚，容易让面试官继续追问真实性。',
      priority: 'medium'
    })
  }

  if (overview.averageCompleteness > 0 && overview.averageCompleteness < 68) {
    items.push({
      title: '结构完整度不足',
      detail: '建议多用“结论 → 背景 → 动作 → 结果/复盘”，避免只给一句判断或散点表达。',
      priority: 'medium'
    })
  }

  if (overview.averageConcision > 0 && overview.averageConcision < 68) {
    items.push({
      title: '表达长度需要控制',
      detail: '回答可能过短或过长，建议普通问题控制在 100-300 字，短问短答先给结论。',
      priority: 'medium'
    })
  }

  const commonIssues = countIssueTitles(analyses)
  commonIssues.slice(0, 2).forEach((issue) => {
    if (!items.some((item) => issue.title.includes(item.title) || item.detail.includes(issue.title))) {
      items.push({
        title: issue.title,
        detail: `出现 ${issue.count} 次，建议作为下一轮专项训练主题。`,
        priority: issue.count >= 3 ? 'high' : 'medium'
      })
    }
  })

  if (items.length === 0 && questions.length > 0) {
    items.push({
      title: '继续打磨自然表达',
      detail: '当前本地规则没有发现明显硬伤，后续可以让 AI 深度报告进一步检查语气、逻辑和岗位匹配。',
      priority: 'low'
    })
  }

  return items.slice(0, 5)
}

function buildStrengths(
  questions: InterviewReviewExtractedQuestion[],
  analyses: InterviewReviewAnswerAnalysis[],
  overview: InterviewReviewReport['overview']
): string[] {
  const strengths: string[] = []
  const topType = summarizeQuestionTypes(questions)[0]

  if (overview.questionCount > 0) {
    strengths.push(`本次共识别 ${overview.questionCount} 个面试问题，主要集中在「${topType?.label || '综合能力'}」。`)
  }

  if (overview.answeredCount > 0) {
    strengths.push(`已匹配到 ${overview.answeredCount} 段候选人回答，可以支撑后续逐题复盘。`)
  }

  if (overview.averageConcision >= 78) {
    strengths.push('整体表达长度控制还不错，没有明显大段堆简历的问题。')
  }

  if (overview.averageEvidence >= 72) {
    strengths.push('回答里已经出现一定的事实依据、项目动作或稳定解释，具备继续打磨成强话术的基础。')
  }

  if (analyses.some((analysis) => analysis.level === 'good')) {
    strengths.push('已有部分回答达到可直接复用的水平，建议优先沉淀成个人答案库。')
  }

  return strengths.length ? strengths.slice(0, 5) : ['目前信息较少，建议先补充更完整的转写文本，再生成复盘。']
}

function buildActionPlan(
  weakPoints: InterviewReviewReportItem[],
  overview: InterviewReviewReport['overview']
): InterviewReviewReportItem[] {
  const actions: InterviewReviewReportItem[] = []

  if (overview.answeredCount < overview.questionCount) {
    actions.push({
      title: '先修正转写文本',
      detail: '把面试官和候选人用“面试官：”“候选人：”标出来，再重新提取问题，报告会更准。',
      priority: 'high'
    })
  }

  weakPoints.slice(0, 3).forEach((weakPoint) => {
    actions.push({
      title: `专项训练：${weakPoint.title}`,
      detail: buildActionDetail(weakPoint.title),
      priority: weakPoint.priority
    })
  })

  actions.push({
    title: '沉淀个人答案库',
    detail: '把高分回答改成 100-300 字自然口语版，保存到后续训练材料里。',
    priority: 'medium'
  })

  return dedupeItems(actions).slice(0, 5)
}

function buildActionDetail(title: string): string {
  if (title.includes('边界')) {
    return '优先使用带说话人分离的录音，或手动给转写文本补充“面试官/候选人”标签。'
  }
  if (title.includes('贴题')) {
    return '练习每个回答第一句先直答问题，再展开项目背景，避免直接背整段简历。'
  }
  if (title.includes('业务证据') || title.includes('证据感')) {
    return '为每段经历补 1 个数字、1 个动作、1 个结果，例如提升率、成本变化或转化效果。'
  }
  if (title.includes('可信度')) {
    return '把事实、态度和选择理由说清楚；HR 类问题不要硬套业务指标，也不要编造细节。'
  }
  if (title.includes('结构')) {
    return '按“结论、背景、动作、结果、复盘”重写 3 个核心项目答案。'
  }
  if (title.includes('长度')) {
    return '普通问题控制 100-300 字，地点/时间/薪资类问题先用一句话直接答。'
  }
  return '围绕这个问题做 3 轮模拟追问，直到能自然表达而不是照读材料。'
}

function buildMarkdown(report: Omit<InterviewReviewReport, 'markdown'>): string {
  const lines: string[] = [
    `# 面试复盘报告`,
    '',
    `生成时间：${report.generatedAt}`,
    report.overview.fileName ? `录音文件：${report.overview.fileName}` : '',
    `整体评分：${report.overallScore || '-'} / 100（${report.overallLevel}）`,
    `一句话结论：${report.headline}`,
    '',
    '## 1. 面试概况',
    `- 录音时长：${report.overview.durationLabel}`,
    `- 转写文本量：约 ${report.overview.transcriptUnits} 字/词`,
    `- 识别问题：${report.overview.questionCount} 个`,
    `- 匹配回答：${report.overview.answeredCount} 个`,
    `- 高风险回答：${report.overview.riskCount} 个`,
    `- 四项均分：贴题 ${report.overview.averageRelevance} / 完整 ${report.overview.averageCompleteness} / 简洁 ${report.overview.averageConcision} / 依据可信 ${report.overview.averageEvidence}`,
    '',
    '## 2. 高频问题类型',
    ...formatBulletList(report.questionTypeSummary.map((item) => `${item.label}：${item.count} 次`), '暂未识别到明确问题类型。'),
    '',
    '## 3. 表现亮点',
    ...formatBulletList(report.strengths),
    '',
    '## 4. 主要薄弱点',
    ...formatReportItems(report.weakPoints),
    '',
    '## 5. 高风险回答',
    ...formatQuestionInsights(report.highRiskAnswers, '没有明显高风险回答。'),
    '',
    '## 6. 可沉淀回答',
    ...formatQuestionInsights(report.excellentAnswers, '暂时没有识别到高分回答，建议先修正转写或补充回答细节。'),
    '',
    '## 7. 下一步训练计划',
    ...formatReportItems(report.actionPlan)
  ].filter(Boolean)

  return `${lines.join('\n')}\n`
}

function formatReportItems(items: InterviewReviewReportItem[]): string[] {
  if (items.length === 0) {
    return ['- 暂无。']
  }

  return items.map((item) => `- 【${formatPriority(item.priority)}】${item.title}：${item.detail}`)
}

function formatQuestionInsights(items: InterviewReviewReportQuestionInsight[], fallback: string): string[] {
  if (items.length === 0) {
    return [`- ${fallback}`]
  }

  return items.flatMap((item) => [
    `- Q${item.questionOrder}（${item.typeLabel}，${item.score} 分）：${item.question}`,
    `  - 回答片段：${item.answerExcerpt}`,
    `  - 问题/建议：${item.issueSummary}；${item.suggestion}`
  ])
}

function formatBulletList(items: string[], fallback = '暂无。'): string[] {
  if (items.length === 0) {
    return [`- ${fallback}`]
  }
  return items.map((item) => `- ${item}`)
}

function countIssueTitles(analyses: InterviewReviewAnswerAnalysis[]): Array<{ title: string; count: number }> {
  const counts = new Map<string, number>()
  analyses.forEach((analysis) => {
    analysis.issues.forEach((issue) => {
      const title = normalizeIssueTitle(issue)
      counts.set(title, (counts.get(title) || 0) + 1)
    })
  })

  return Array.from(counts.entries())
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
}

function normalizeIssueTitle(issue: string): string {
  if (issue.includes('回答和问题')) return '贴题度不足'
  if (issue.includes('偏短')) return '回答偏短'
  if (issue.includes('偏长')) return '回答偏长'
  if (issue.includes('缺少可验证')) return '证据感偏弱'
  if (issue.includes('态度和稳定')) return '稳定性表达不清'
  if (issue.includes('短事实')) return '事实回答不明确'
  if (issue.includes('具体说明')) return '回答可信度偏弱'
  if (issue.includes('不确定')) return '表达不够坚定'
  if (issue.includes('没有识别')) return '回答边界不清'
  return issue.replace(/[，。；;].*$/, '').slice(0, 18)
}

function averageMetric(analyses: InterviewReviewAnswerAnalysis[], key: keyof InterviewReviewAnswerAnalysis['metrics']): number {
  if (analyses.length === 0) {
    return 0
  }

  return average(analyses.map((analysis) => analysis.metrics[key]))
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function getOverallLevel(score: number, riskCount: number, questionCount: number): InterviewReviewReport['overallLevel'] {
  if (questionCount === 0 || score < 52 || riskCount >= Math.max(2, Math.ceil(questionCount * 0.35))) {
    return '高风险'
  }
  if (score >= 82 && riskCount === 0) {
    return '优秀'
  }
  if (score >= 68) {
    return '良好'
  }
  return '待提升'
}

function countTextUnits(text: string): number {
  const chinese = text.match(/[\u4e00-\u9fa5]/g)?.length || 0
  const englishWords = text.match(/[a-zA-Z0-9+#./-]+/g)?.length || 0
  return chinese + englishWords
}

function formatDuration(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds)) {
    return '未知'
  }

  const totalSeconds = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(totalSeconds / 60)
  const restSeconds = totalSeconds % 60
  return `${minutes}分${String(restSeconds).padStart(2, '0')}秒`
}

function formatPriority(priority: InterviewReviewReportPriority): string {
  if (priority === 'high') return '高'
  if (priority === 'medium') return '中'
  return '低'
}

function excerpt(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength)}...`
}

function dedupeItems(items: InterviewReviewReportItem[]): InterviewReviewReportItem[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.title)) {
      return false
    }
    seen.add(item.title)
    return true
  })
}
