import { addUsage, defaultSettings, normalizeSettings } from './appStorage'
import { callOpenAiCompatible } from './modelClient'
import type {
  InterviewReviewDeepReportRequest,
  InterviewReviewDeepReportResult,
  InterviewReviewDeepTalkRequest,
  InterviewReviewDeepTalkResult
} from '../../shared/types'

export async function generateInterviewReviewDeepReport(
  request: InterviewReviewDeepReportRequest
): Promise<InterviewReviewDeepReportResult> {
  const startedAt = Date.now()
  const settings = normalizeSettings(request.settings)
  const provider = settings.answer.llmProvider
  const config = settings.providers[provider]
  const fallback = buildLocalDeepReport(request)

  if (!config.enabled || !config.apiKey) {
    return {
      reportMarkdown: `${fallback}\n\n> 说明：当前未调用 AI，以上为本地深度草案。请先在 API 设置里填写并启用 ${provider} API Key。`,
      provider: 'local',
      latencyMs: Date.now() - startedAt
    }
  }

  try {
    const result = await callOpenAiCompatible(provider, config, buildDeepReportPrompt(request), 1800, 18000, {
      systemPrompt: '你是获面通的面试复盘专家。只能基于用户给出的转写、问题、回答分析和本地报告总结，不得编造事实。输出要自然、具体、可执行，像真正的资深面试教练。更重要的是：把建议写成候选人能直接拿去复述的话。'
    })

    await addUsage(provider, config.model || defaultSettings.providers[provider].model, result.usage)

    return {
      reportMarkdown: result.answer || fallback,
      provider,
      latencyMs: Date.now() - startedAt,
      usage: result.usage
    }
  } catch (error) {
    return {
      reportMarkdown: `${fallback}\n\n> AI 深度报告失败：${error instanceof Error ? error.message : '未知错误'}。当前已退回本地草案。`,
      provider: 'local',
      latencyMs: Date.now() - startedAt
    }
  }
}

export async function generateInterviewReviewDeepTalk(
  request: InterviewReviewDeepTalkRequest
): Promise<InterviewReviewDeepTalkResult> {
  const startedAt = Date.now()
  const settings = normalizeSettings(request.settings)
  const provider = settings.answer.llmProvider
  const config = settings.providers[provider]
  const fallback = buildLocalDeepTalk(request)

  if (!config.enabled || !config.apiKey) {
    return {
      title: fallback.title,
      talkMarkdown: `${fallback.talkMarkdown}\n\n> 说明：当前未调用 AI，以上为本地深度话术草案。请先在 API 设置里填写并启用 ${provider} API Key。`,
      provider: 'local',
      latencyMs: Date.now() - startedAt
    }
  }

  try {
    const result = await callOpenAiCompatible(provider, config, buildDeepTalkPrompt(request), 900, 12000, {
      systemPrompt: '你是获面通的口语润色助手。只负责把候选人的回答改成更像真人说话的版本，不要编造经历，不要变成书面汇报。必须自然、简短、像面试现场会说的话。'
    })

    await addUsage(provider, config.model || defaultSettings.providers[provider].model, result.usage)

    return {
      title: fallback.title,
      talkMarkdown: result.answer || fallback.talkMarkdown,
      provider,
      latencyMs: Date.now() - startedAt,
      usage: result.usage
    }
  } catch (error) {
    return {
      title: fallback.title,
      talkMarkdown: `${fallback.talkMarkdown}\n\n> AI 深度话术失败：${error instanceof Error ? error.message : '未知错误'}。当前已退回本地草案。`,
      provider: 'local',
      latencyMs: Date.now() - startedAt
    }
  }
}

function buildDeepReportPrompt(request: InterviewReviewDeepReportRequest): string {
  const questionsText = request.questions
    .map((question) => {
      const analysis = request.answerAnalyses.find((item) => item.questionId === question.id)
      const answer = analysis?.answerText?.trim() || '未识别到回答'
      return [
        `Q${question.order}. ${question.question}`,
        `题型：${question.intentLabel}`,
        `分数：${analysis?.score ?? '-'}｜风险：${analysis?.level || '未知'}`,
        `回答：${answer}`,
        `问题点：${analysis?.issues.join('；') || '暂无'}`,
        `建议：${analysis?.suggestions.join('；') || '暂无'}`
      ].join('\n')
    })
    .join('\n\n')

  const localReport = truncateText(request.localReportMarkdown, 12000)
  const transcript = truncateText(request.transcriptText, 18000)

  return [
    '请基于以下材料，生成一版“AI 深度复盘报告”。',
    '',
    '要求：',
    '1. 只能基于提供材料总结，不得编造未出现的事实。',
    '2. 语言要像资深面试教练在给候选人做复盘，具体、自然、可执行。',
    '3. 不要把整段转写重复一遍，要提炼成结论和行动。',
    '4. 如果信息不足，请用“待确认”标注。',
    '5. 输出 Markdown。',
    '',
    `录音文件：${request.audioFileName || '未命名'}`,
    `录音时长：${request.durationSec ? `${Math.ceil(request.durationSec / 60)} 分钟` : '未知'}`,
    `报告标题：${request.title || '面试复盘'}`,
    '',
    '本地报告草案：',
    localReport,
    '',
    '转写文本：',
    transcript,
    '',
    '问题与回答分析：',
    questionsText || '暂无',
    '',
    '请按以下结构输出：',
    '# AI 深度复盘',
    '## 一句话总评',
    '## 候选人当前最强的 3 个证据',
    '## 现在最危险的 3 个问题',
    '## 面试官下一轮最可能追问什么',
    '## 候选人可以直接复述的优化版话术',
    '## 20 秒内先说什么',
    '## 下一轮最该补的材料/数字/证据',
    '## 复盘结论'
  ].join('\n')
}

function buildDeepTalkPrompt(request: InterviewReviewDeepTalkRequest): string {
  const issueList = request.answerIssues?.length ? request.answerIssues.map((item) => `- ${item}`).join('\n') : '- 暂无'
  const suggestionList = request.answerSuggestions?.length ? request.answerSuggestions.map((item) => `- ${item}`).join('\n') : '- 暂无'
  const lengthHint = request.targetLength === 'short' ? '60-120字' : request.targetLength === 'long' ? '180-300字' : '100-220字'

  return [
    '请把下面这段回答，改成更像真人在面试时会说的话。',
    '',
    '要求：',
    '1. 只基于原始回答和给出的分析来润色，不要编造新经历。',
    `2. 输出长度控制在 ${lengthHint} 左右。`,
    '3. 语言自然一点，说人话，不要太官方。',
    '4. 要保留真实感，不要像模板。',
    '5. 如果原回答有不确定或缺证据的地方，可以帮它补成“稳妥口径”，但不能虚构事实。',
    '6. 输出 Markdown，包含“优化后口语版”和“追问备份版”。',
    '',
    `问题：${request.question}`,
    `题目类型：${request.questionLabel || '未标注'}`,
    `原始回答：${request.answerText || '未识别到回答'}`,
    `回答分数：${request.answerScore ?? '-'}`,
    '',
    '本地报告相关上下文：',
    truncateText(request.localReportMarkdown, 6000),
    '',
    '问题点：',
    issueList,
    '',
    '优化建议：',
    suggestionList,
    '',
    '请按以下结构输出：',
    '# 口语优化版',
    '## 直接回答',
    '## 追问备份',
    '## 说话提醒'
  ].join('\n')
}

function buildLocalDeepReport(request: InterviewReviewDeepReportRequest): string {
  const questionCount = request.questions.length
  const answeredCount = request.answerAnalyses.filter((item) => item.answerText.trim()).length
  const riskCount = request.answerAnalyses.filter((item) => item.level === 'risk').length
  const averageScore = request.answerAnalyses.length
    ? Math.round(request.answerAnalyses.reduce((sum, item) => sum + item.score, 0) / request.answerAnalyses.length)
    : 0

  const topWeakPoints = request.answerAnalyses
    .flatMap((analysis, index) =>
      analysis.issues.slice(0, 2).map((issue) => ({
        title: `Q${index + 1} ${analysis.level}`,
        detail: issue
      }))
    )
    .slice(0, 6)

  return [
    '# AI 深度复盘（本地草案）',
    '',
    `- 录音文件：${request.audioFileName || '未命名'}`,
    `- 录音时长：${request.durationSec ? `${Math.ceil(request.durationSec / 60)} 分钟` : '未知'}`,
    `- 问题数：${questionCount}`,
    `- 已答：${answeredCount}`,
    `- 风险回答：${riskCount}`,
    `- 平均分：${averageScore || '-'}`,
    '',
    '## 一句话总评',
    `这场面试的主要问题集中在 ${riskCount > 0 ? '高风险回答和证据不足' : '表达还可以继续更稳一点'}，复盘重点应该放在“更短、更自然、更有证据”。`,
    '',
    '## 候选人当前最强的 3 个证据',
    '- 能把经历和岗位方向连起来。',
    '- 有一定的项目/业务表达能力。',
    '- 能给出基础的结果和方法。',
    '',
    '## 现在最危险的 3 个问题',
    ...(topWeakPoints.length ? topWeakPoints.map((item) => `- ${item.title}：${item.detail}`) : ['- 暂无明显风险点。']),
    '',
    '## 下一轮建议',
    '- 先补证据，再补话术。',
    '- 把长回答压到 100-300 字。',
    '- 把“我认为/大概/可能”这类模糊词减少。',
    '',
    '## 复盘结论',
    '这版先作为可执行草稿：如果后续再把 AI 深度话术接上，复盘质量会更像真正的面试教练。'
  ].join('\n')
}

function buildLocalDeepTalk(request: InterviewReviewDeepTalkRequest): { title: string; talkMarkdown: string } {
  const title = request.questionLabel ? `${request.questionLabel} 口语优化版` : '口语优化版'
  const answer = truncateAnswer(request.answerText)
  const issueLine = request.answerIssues?.length ? `- ${request.answerIssues[0]}` : '- 先把回答说短，再补证据。'
  const suggestionLine = request.answerSuggestions?.length ? `- ${request.answerSuggestions[0]}` : '- 先结论后过程，别一上来就铺背景。'

  return {
    title,
    talkMarkdown: [
      `# ${title}`,
      '',
      '## 直接回答',
      answer || '我会先按真实经历直接回答，结论先说清楚，再补一两句背景。',
      '',
      '## 追问备份',
      '如果面试官继续追问，我会补充：',
      '- 我负责了什么',
      '- 我具体做了什么',
      '- 最后带来了什么结果',
      '',
      '## 说话提醒',
      issueLine,
      suggestionLine
    ].join('\n')
  }
}

function truncateText(value: string, maxLength: number): string {
  const cleaned = value.trim()
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength)}…` : cleaned
}

function truncateAnswer(value: string): string {
  const cleaned = value.trim()
  if (!cleaned) {
    return ''
  }

  if (cleaned.length <= 260) {
    return cleaned
  }

  const sentenceEnd = Math.max(cleaned.lastIndexOf('。', 260), cleaned.lastIndexOf('！', 260), cleaned.lastIndexOf('？', 260), cleaned.lastIndexOf('?', 260))
  return (sentenceEnd > 80 ? cleaned.slice(0, sentenceEnd + 1) : cleaned.slice(0, 260)).trim()
}
