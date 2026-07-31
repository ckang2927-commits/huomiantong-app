import { addUsage, defaultSettings, normalizeSettings } from './appStorage'
import { findEvidence } from './evidenceService'
import { callOpenAiCompatible } from './modelClient'
import { roleJdForMode } from '../../shared/roleJdTemplates'
import { trainingModeLabels } from '../../shared/trainingOptions'
import { normalizeMockInterviewConfig, type MockInterviewConfig } from '../../shared/mockInterview'
import { selectDataAnalystInterviewQuestion } from '../../shared/dataAnalystInterviewQuestionBank'
import type { AppSettings, TrainingMode, TrainingRound, TrainingTurnRequest, TrainingTurnResult } from '../../shared/types'

type ParsedTrainingResponse = {
  feedback?: string
  score?: number
  nextQuestion?: string
  referenceAnswer?: string
  finalReport?: string
}

type NextQuestionPlan = {
  nextQuestion?: string
  nextQuestionKind?: 'base' | 'followUp'
  referenceAnswer?: string
}

const fallbackQuestions: Record<TrainingMode, string[]> = {
  resumeDeepDive: [
    '请挑一段最能代表你能力的经历，先讲背景、你的角色和最终结果。',
    '这段经历里，你个人的贡献和团队贡献分别是什么？',
    '如果面试官继续追问这段经历的真实性，你会拿什么证据支撑？'
  ],
  projectFollowUp: [
    '请介绍一个你做过的最复杂项目，重点讲难点和取舍。',
    '这个项目如果重新做一遍，你会优先优化哪里？',
    '项目里有没有和其他同事意见不一致的时候，你怎么推进？'
  ],
  fundamentals: [
    '请讲一个你目标岗位里最基础但最关键的方法论。',
    '如果业务方只给你一个模糊问题，你会怎么拆解？',
    '你怎么判断一个方案是不是真的有效？'
  ],
  pressure: [
    '你这段经历听起来比较泛，能不能讲一个只有亲自做过才知道的细节？',
    '如果结果没有达到预期，你会怎么解释？',
    '你简历里这个能力和岗位要求还有差距，你怎么看？'
  ],
  comprehensive: [
    '请先做一个 1 分钟自我介绍，重点贴合当前岗位。',
    '你最匹配这个岗位的三个证据是什么？',
    '如果入职后 30 天内要交付结果，你会怎么做？'
  ]
}

export async function generateTrainingTurn(request: TrainingTurnRequest): Promise<TrainingTurnResult> {
  const startedAt = Date.now()
  const settings = normalizeSettings(request.settings)
  const provider = settings.answer.llmProvider
  const config = settings.providers[provider]
  const mockConfig = normalizeMockInterviewConfig(request.mockInterviewConfig)
  const scheduler = buildNextQuestionPlan(settings, request, mockConfig)
  const localResult = buildLocalTrainingTurn(settings, request, scheduler, 0)

  if (!config.enabled || !config.apiKey) {
    return {
      ...localResult,
      feedback: request.rounds.some((round) => round.answer)
        ? `${localResult.feedback || ''}\n\n未调用 AI：请先在 API 设置里填写并启用 ${provider} API Key。`.trim()
        : localResult.feedback,
      provider: 'local',
      latencyMs: Date.now() - startedAt
    }
  }

  try {
    const result = await callOpenAiCompatible(provider, config, buildTrainingPrompt(settings, request, mockConfig, scheduler), 900, 12000, {
      systemPrompt: '你是获面通的模拟面试官。你只负责点评、评分和复盘，不要替候选人回答。请严格返回 JSON。',
      temperature: 0.55
    })
    await addUsage(provider, config.model || defaultSettings.providers[provider].model, result.usage)
    const parsed = parseTrainingResponse(result.answer)
    const isDone = answeredCount(request.rounds) >= request.roundCount

    return {
      feedback: parsed.feedback || localResult.feedback,
      score: clampScore(parsed.score ?? localResult.score),
      nextQuestion: isDone ? undefined : scheduler.nextQuestion || localResult.nextQuestion,
      nextQuestionKind: isDone ? undefined : scheduler.nextQuestionKind || localResult.nextQuestionKind,
      referenceAnswer: isDone ? undefined : scheduler.referenceAnswer || (scheduler.nextQuestion ? buildLocalReferenceAnswer(settings, scheduler.nextQuestion) : undefined),
      finalReport: isDone ? parsed.finalReport || localResult.finalReport : undefined,
      done: isDone,
      provider,
      latencyMs: Date.now() - startedAt,
      usage: result.usage
    }
  } catch (error) {
    return {
      ...localResult,
      feedback: `${localResult.feedback || '已使用本地规则完成点评。'}\n\nAI 训练生成失败：${error instanceof Error ? error.message : '未知错误'}`,
      provider: 'local',
      latencyMs: Date.now() - startedAt
    }
  }
}

function buildTrainingPrompt(
  settings: AppSettings,
  request: TrainingTurnRequest,
  mockConfig: MockInterviewConfig,
  scheduler: NextQuestionPlan
): string {
  const resume = settings.resume
  const currentRound = request.rounds.length
  const isDone = answeredCount(request.rounds) >= request.roundCount
  const lastRound = request.rounds.at(-1)
  const evidence = lastRound ? findEvidence(`${lastRound.question}\n${lastRound.answer || ''}`, settings) : findEvidence(resume.targetRole || trainingModeLabels[request.trainingMode].label, settings)
  const outline = normalizeQuestionOutline(request.questionOutline)
  const questionStrategyText =
    mockConfig.questionStrategy === 'fixed'
      ? '固定走题：只沿题纲推进，不主动追问。'
      : mockConfig.questionStrategy === 'adaptive'
        ? '自适应追问：如果上一轮回答偏短、偏虚或证据不足，就优先追问。'
        : '随机混合：在固定题和追问之间随机切换，但不能偏题。'

  return [
    `训练类型：${trainingModeLabels[request.trainingMode].label}（${trainingModeLabels[request.trainingMode].hint}）`,
    `训练轮数：${request.roundCount}`,
    `当前进度：${Math.min(currentRound, request.roundCount)}/${request.roundCount}`,
    `候选人：${resume.profileName || resume.candidateName || '未命名候选人'}`,
    `目标岗位：${resume.targetRole || '未填写'}`,
    `追问策略：${questionStrategyText}`,
    `面试官风格：${mockConfig.interviewerStyle}`,
    `面试难度：${mockConfig.difficulty}`,
    `面试重点：${mockConfig.focus.join('、') || '综合能力'}`,
    `面试时长：${mockConfig.durationMinutes} 分钟`,
    '',
    '当前岗位 JD：',
    roleJdForMode(settings.answer.interviewMode, settings.answer.roleJdTemplates),
    '',
    '固定题纲：',
    outline.length ? outline.map((question, index) => `${index + 1}. ${question}`).join('\n') : '未设置固定题纲，请结合简历和 JD 自然推进。',
    '',
    '可参考的简历依据：',
    evidence.length ? evidence.map((item, index) => `${index + 1}. ${item.text}`).join('\n') : '暂无明确命中依据',
    '',
    '历史问答：',
    request.rounds.map((round, index) => `${index + 1}. 问：${round.question}\n答：${round.answer || '未回答'}\n点评：${round.feedback || '暂无'}`).join('\n\n') || '暂无',
    '',
    '任务：',
    isDone
      ? '候选人已经完成全部轮次，请点评最后一轮回答，并生成最终复盘报告。'
      : lastRound?.answer
        ? scheduler.nextQuestionKind === 'followUp'
          ? '请点评上一轮回答，并生成一条围绕刚才回答的追问。'
          : '请点评上一轮回答，并生成下一条更自然的面试题。'
        : '请生成第一条面试问题。'
      ,
    '',
    '参考答案要求：',
    '如果你输出 referenceAnswer，必须是给候选人练习用的参考答案，要基于正式简历、万字简历、其他材料和岗位 JD 做表达优化，但不要硬编简历里不存在的具体项目、公司、数字或成果。若依据不足，请给安全泛化回答，并提醒补充真实经历。',
    '',
    '只输出 JSON，不要 markdown，不要解释。格式如下：',
    '{"feedback":"对上一轮回答的自然中文点评","score":80,"nextQuestion":"下一轮问题","referenceAnswer":"针对 nextQuestion 的练习参考答案","finalReport":"结束时输出训练报告"}'
  ].join('\n')
}

function buildNextQuestionPlan(settings: AppSettings, request: TrainingTurnRequest, mockConfig: MockInterviewConfig): NextQuestionPlan {
  const isDone = answeredCount(request.rounds) >= request.roundCount

  if (isDone) {
    return {}
  }

  const lastRound = request.rounds.at(-1)
  const baseQuestionIndex = countBaseRounds(request.rounds)
  const outline = normalizeQuestionOutline(request.questionOutline)
  const shouldFollowUp = shouldAskFollowUp(lastRound, settings, mockConfig, request)

  if (lastRound && shouldFollowUp) {
    return {
      nextQuestion: buildFollowUpQuestion(lastRound, settings, mockConfig),
      nextQuestionKind: 'followUp'
    }
  }

  return {
    ...buildBaseQuestion(settings, request, mockConfig, baseQuestionIndex, outline),
    nextQuestionKind: 'base'
  }
}

function buildLocalTrainingTurn(
  settings: AppSettings,
  request: TrainingTurnRequest,
  scheduler: NextQuestionPlan,
  latencyMs: number
): TrainingTurnResult {
  const lastRound = request.rounds.at(-1)
  const isDone = answeredCount(request.rounds) >= request.roundCount
  const score = lastRound?.answer ? scoreLocalAnswer(lastRound.answer) : undefined
  const feedback = lastRound?.answer ? buildLocalFeedback(lastRound.answer, score || 0, scheduler.nextQuestionKind) : undefined

  return {
    feedback,
    score,
    nextQuestion: scheduler.nextQuestion,
    nextQuestionKind: scheduler.nextQuestionKind,
    referenceAnswer: scheduler.referenceAnswer || (scheduler.nextQuestion ? buildLocalReferenceAnswer(settings, scheduler.nextQuestion) : undefined),
    finalReport: isDone ? buildLocalFinalReport(settings, request.rounds) : undefined,
    done: isDone,
    provider: 'local',
    latencyMs
  }
}

function buildBaseQuestion(
  settings: AppSettings,
  request: TrainingTurnRequest,
  mockConfig: MockInterviewConfig,
  baseIndex: number,
  outline: string[]
): { nextQuestion: string; referenceAnswer?: string } {
  const outlineQuestion = outline[baseIndex]
  const defaultDataAnalystFocus = ['指标体系', 'SQL/取数', '建模分析', 'A/B 实验', '业务结论']

  if (outlineQuestion) {
    return { nextQuestion: outlineQuestion }
  }

  if (isDataAnalystContext(settings)) {
    const questionFocus = normalizeQuestionFocus(request.questionFocus, [...mockConfig.focus, ...defaultDataAnalystFocus])
    const bankItem = selectDataAnalystInterviewQuestion({
      difficulty: mockConfig.difficulty,
      focus: questionFocus,
      trainingMode: request.trainingMode,
      usedQuestions: request.rounds.map((round) => round.question),
      baseIndex
    })

    return {
      nextQuestion: bankItem.question,
      referenceAnswer: bankItem.referenceAnswer
    }
  }

  const pool = fallbackQuestions[request.trainingMode]
  const question = pool[baseIndex % pool.length]

  return { nextQuestion: question || `请围绕 ${settings.resume.targetRole || '目标岗位'} 讲一个你最有把握的经历。` }
}

function normalizeQuestionFocus(value: string[] | undefined, fallback: string[]): string[] {
  const focus = Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean).slice(0, 12)
    : []

  return focus.length > 0 ? focus : fallback
}

function isDataAnalystContext(settings: AppSettings): boolean {
  const targetText = [
    settings.answer.interviewMode,
    settings.resume.targetRole,
    roleJdForMode(settings.answer.interviewMode, settings.answer.roleJdTemplates)
  ].join('\n')

  return settings.answer.interviewMode === 'dataAnalyst' || /数据分析|数据分析师|商业分析|经营分析|BI|Data\s*Analyst|Business\s*Analyst/i.test(targetText)
}

function buildFollowUpQuestion(lastRound: TrainingRound, settings: AppSettings, mockConfig: MockInterviewConfig): string {
  const answer = lastRound.answer || ''
  const highlight = extractAnswerHighlight(answer)
  const focusText = mockConfig.focus[0] || settings.resume.targetRole || '这个经历'

  if (mockConfig.interviewerStyle === 'hr') {
    return `你刚才提到${highlight}。从稳定性和匹配度看，这段经历最能说明你为什么适合 ${focusText}？`
  }

  if (mockConfig.interviewerStyle === 'techLead') {
    return `你刚才提到${highlight}。把这件事的技术判断、方案取舍和验证方式再讲具体一点。`
  }

  if (mockConfig.interviewerStyle === 'pressure') {
    return `你刚才提到${highlight}。别只讲结果，直接说你亲自做了什么、怎么证明是你做的。`
  }

  const tone =
    mockConfig.difficulty === 'pressure'
      ? '我想继续追一下这块细节。'
      : mockConfig.difficulty === 'hard'
        ? '这块我还想再深入一点。'
        : '我再往下问一句。'

  return `${tone}你刚才提到${highlight}，请补充你亲自做的动作、关键判断和结果影响。`
}

function shouldAskFollowUp(
  lastRound: TrainingRound | undefined,
  settings: AppSettings,
  mockConfig: MockInterviewConfig,
  request: TrainingTurnRequest
): boolean {
  if (!lastRound?.answer?.trim()) {
    return false
  }

  if (lastRound.kind === 'followUp') {
    return false
  }

  const answer = lastRound.answer.trim()
  const score = scoreLocalAnswer(answer)
  const evidenceCount = findEvidence(`${lastRound.question}\n${answer}`, settings).length
  const shortAnswerBoost = answer.length < 100 ? 0.28 : answer.length < 180 ? 0.12 : -0.08
  const scoreBoost = score < 65 ? 0.26 : score < 75 ? 0.14 : -0.1
  const evidenceBoost = evidenceCount === 0 ? 0.18 : -0.04
  const styleBoost =
    mockConfig.interviewerStyle === 'followUp'
      ? 0.18
      : mockConfig.interviewerStyle === 'pressure'
        ? 0.2
        : mockConfig.interviewerStyle === 'techLead'
          ? 0.12
          : mockConfig.interviewerStyle === 'hr'
            ? 0.04
            : 0.08
  const difficultyBoost =
    mockConfig.difficulty === 'pressure'
      ? 0.18
      : mockConfig.difficulty === 'hard'
        ? 0.1
        : mockConfig.difficulty === 'easy'
          ? -0.1
          : 0
  const strategyBoost = mockConfig.questionStrategy === 'adaptive' ? 0.2 : mockConfig.questionStrategy === 'mixed' ? 0.1 : -1
  const baseProbability = 0.3 + shortAnswerBoost + scoreBoost + evidenceBoost + styleBoost + difficultyBoost + strategyBoost
  const probability = Math.max(0, Math.min(0.9, baseProbability))

  if (mockConfig.questionStrategy === 'fixed') {
    return false
  }

  if (answeredCount(request.rounds) >= request.roundCount - 1) {
    return false
  }

  return Math.random() < probability
}

function extractAnswerHighlight(answer: string): string {
  const trimmed = answer.trim()

  if (!trimmed) {
    return '这段回答'
  }

  const match = trimmed.match(/(我负责[^。！？；，]{0,20}|项目[^。！？；，]{0,20}|因为[^。！？；，]{0,20}|通过[^。！？；，]{0,20}|最终[^。！？；，]{0,20})/)

  if (match?.[1]) {
    return match[1]
  }

  return trimmed.slice(0, 20)
}

function countBaseRounds(rounds: TrainingRound[]): number {
  return rounds.filter((round) => round.kind !== 'followUp').length
}

function normalizeQuestionOutline(value?: string[]): string[] {
  return Array.isArray(value) ? value.map((question) => question.trim()).filter(Boolean).slice(0, 20) : []
}

function buildLocalReferenceAnswer(settings: AppSettings, question: string): string {
  const evidence = findEvidence(question, settings).slice(0, 3)
  const targetRole = settings.resume.targetRole || '目标岗位'

  if (evidence.length === 0) {
    return [
      '参考答法：',
      `这个问题我会先结合${targetRole}的要求来回答。因为简历里暂时没有很直接的项目证据，我会先讲方法论：先明确业务目标，再拆关键指标和约束，接着说明我如何收集信息、验证判断、推动落地，最后补充风险控制和复盘方式。`,
      '',
      '练习提醒：这类回答不要硬编经历，最好后续在简历库里补一段真实项目或案例。'
    ].join('\n')
  }

  return [
    '参考答法：',
    '这个问题我会结合自己简历里的真实经历来讲。我的核心思路是先交代背景和目标，再说我负责的动作，最后用结果或复盘收尾。',
    '',
    '可用依据摘要：',
    ...evidence.map((item, index) => `${index + 1}. ${item.sourceLabel || item.source}：${compactEvidence(item.text)}`),
    '',
    '表达建议：',
    '回答时尽量按“背景 → 我的动作 → 结果/影响 → 复盘”的顺序讲，尽量补一个可以验证的数字或过程。'
  ].join('\n')
}

function compactEvidence(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim()
  return compact.length > 140 ? `${compact.slice(0, 140)}…` : compact
}

function buildLocalFeedback(answer: string, score: number, nextQuestionKind?: 'base' | 'followUp'): string {
  const details = [
    answer.length < 60 ? '回答偏短，可以再补一点背景、动作和结果。' : '回答有一定展开，继续注意结构感和证据感。',
    /数据|指标|结果|提升|降低|增长|效率|准确率|留存|成本|GMV|DAU|MAU/.test(answer)
      ? '有结果意识，建议把数字说得更具体一点。'
      : '建议补一个可验证的结果或影响。',
    /负责|推进|设计|分析|实现|优化/.test(answer)
      ? '能听到你的个人动作，继续把“你做了什么”讲清楚。'
      : '建议明确你本人具体做了什么，避免像团队描述。'
  ]

  const followUpHint = nextQuestionKind === 'followUp' ? '这一轮我会继续追问刚才那块细节。' : '这一轮会直接进入下一题。'

  return `本轮本地评分 ${score}/100。${details.join('')} ${followUpHint}`
}

function scoreLocalAnswer(answer: string): number {
  let score = 58

  if (answer.length > 80) score += 10
  if (/背景|目标|问题|原因/.test(answer)) score += 8
  if (/负责|推进|设计|分析|实现|优化/.test(answer)) score += 8
  if (/结果|提升|降低|增长|效率|准确率|留存|成本|GMV|DAU|MAU/.test(answer)) score += 10
  if (/复盘|下次|优化|经验|沉淀/.test(answer)) score += 6

  return clampScore(score)
}

function buildLocalFinalReport(settings: AppSettings, rounds: TrainingRound[]): string {
  const answered = rounds.filter((round) => round.answer)
  const average = answered.length ? Math.round(answered.reduce((sum, round) => sum + (round.score || scoreLocalAnswer(round.answer || '')), 0) / answered.length) : 0

  return [
    `训练完成：${answered.length} 轮`,
    `候选人：${settings.resume.profileName || settings.resume.candidateName || '未命名候选人'}`,
    `平均分：${average || '暂无'}`,
    '',
    '主要建议：',
    '1. 每个回答尽量讲清背景、动作、结果和复盘。',
    '2. 遇到压力追问时，先承认边界，再补证据。',
    '3. 简历里没有依据的内容不要硬编，可以讲方法论或补充真实案例。',
    '4. 下一轮训练建议优先补强短回答、证据感弱和个人贡献不清楚的问题。'
  ].join('\n')
}

function parseTrainingResponse(value: string): ParsedTrainingResponse {
  const match = value.match(/\{[\s\S]*\}/)

  if (!match) {
    return {}
  }

  try {
    return JSON.parse(match[0]) as ParsedTrainingResponse
  } catch {
    return {}
  }
}

function answeredCount(rounds: TrainingRound[]): number {
  return rounds.filter((round) => round.answer?.trim()).length
}

function clampScore(value = 0): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}
