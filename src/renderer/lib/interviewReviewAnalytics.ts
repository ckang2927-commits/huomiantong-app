import type { InterviewSession, TrainingMode } from '../../shared/types'
import type { TrainingFocusPlan } from './trainingInsights'

export type ReviewTone = 'good' | 'warn' | 'neutral'

export type ReviewMetricCard = {
  label: string
  value: string
  hint: string
  tone: ReviewTone
}

export type ReviewQuestionTopic = {
  id: string
  title: string
  count: number
  sampleQuestion: string
  mode: TrainingMode
  questions: string[]
}

export type ReviewFocusItem = {
  id: string
  title: string
  reason: string
  action: string
  tone: ReviewTone
  plan: TrainingFocusPlan
}

export type ReviewProfileStat = {
  id: string
  label: string
  sessionCount: number
  answerCount: number
  averageScore: number
  riskCount: number
  evidenceHitRate: number
}

export type InterviewReviewDashboardData = {
  metrics: ReviewMetricCard[]
  topics: ReviewQuestionTopic[]
  focusItems: ReviewFocusItem[]
  profileStats: ReviewProfileStat[]
  hasScores: boolean
}

type TopicDefinition = {
  id: string
  title: string
  mode: TrainingMode
  patterns: RegExp[]
  fallbackQuestions: string[]
}

type TopicCounter = {
  definition: TopicDefinition
  count: number
  sampleQuestion: string
}

const topicDefinitions: TopicDefinition[] = [
  {
    id: 'project',
    title: '项目经历追问',
    mode: 'projectFollowUp',
    patterns: [/项目|经历|案例|印象最深|负责|落地|难点|亮点|复盘/],
    fallbackQuestions: [
      '请讲一个你最有代表性的项目，重点说清楚背景、动作和结果。',
      '这个项目里最难的问题是什么，你当时怎么定位并解决？',
      '如果重新做一次这个项目，你会怎么优化？',
      '这个项目哪些结果能证明你的个人贡献？',
      '请讲一个项目里你推动业务或团队改变的细节。'
    ]
  },
  {
    id: 'data-modeling',
    title: '建模与分析方法',
    mode: 'fundamentals',
    patterns: [/建模|模型|预测|分类|聚类|回归|随机森林|决策树|特征|AUC|准确率|召回率|评分卡/],
    fallbackQuestions: [
      '请讲一个你做过的建模项目：目标、特征、算法、评估指标和业务落地分别是什么？',
      '你怎么判断一个模型是否真的对业务有用？',
      '如果模型效果不好，你会从数据、特征、算法和业务定义哪些层面排查？',
      '请解释一次你选择某个算法而不是另一个算法的原因。',
      '建模结果上线或被业务使用时，你怎么监控效果变化？'
    ]
  },
  {
    id: 'metrics',
    title: '指标体系与业务理解',
    mode: 'fundamentals',
    patterns: [/指标|北极星|转化率|留存|ROI|ROAS|ACOS|GMV|销售额|增长|经营|业务|漏斗/],
    fallbackQuestions: [
      '如果让你为一个新业务搭指标体系，你会怎么拆核心指标、过程指标和护栏指标？',
      '讲一次你通过指标异常定位业务问题的经历。',
      '你怎么判断一个分析结论值得业务团队采纳？',
      '当多个指标相互冲突时，你怎么确定优先级？',
      '请讲一次你把数据分析结论转成业务动作的案例。'
    ]
  },
  {
    id: 'sql-data',
    title: 'SQL / 数据处理',
    mode: 'fundamentals',
    patterns: [/SQL|MySQL|取数|清洗|ETL|表|字段|join|窗口函数|数据源|缺失|异常值/],
    fallbackQuestions: [
      '讲一次你用 SQL 或数据清洗定位问题的经历，难点在哪里？',
      '如果数据口径不一致，你会怎么排查并统一口径？',
      '你常用哪些 SQL 技巧处理复杂分析需求？',
      '遇到脏数据、缺失值或异常值时，你怎么处理？',
      '如何保证报表数据的准确性和可追溯性？'
    ]
  },
  {
    id: 'self-intro',
    title: '自我介绍与岗位匹配',
    mode: 'resumeDeepDive',
    patterns: [/自我介绍|介绍一下|优势|匹配|为什么适合|核心竞争力|职业规划|离职|期望/],
    fallbackQuestions: [
      '请做一个 1 分钟自我介绍，重点突出你和目标岗位最匹配的经历。',
      '你为什么觉得自己适合这个岗位？',
      '请用 3 个关键词总结你的核心优势，并分别给出证据。',
      '你的职业规划是什么，和这个岗位有什么关系？',
      '如果只用一个项目证明你的能力，你会选哪个，为什么？'
    ]
  },
  {
    id: 'pressure',
    title: '压力追问与风险控制',
    mode: 'pressure',
    patterns: [/质疑|缺点|失败|不足|短板|不会|没做过|为什么不是你|真实性|证明|压力|冲突/],
    fallbackQuestions: [
      '你这个经历听起来比较泛，能不能讲一个只有亲自做过才知道的细节？',
      '你说的结果有没有数据或证据支撑？如果没有，你怎么证明价值？',
      '这个项目里你个人贡献到底是什么，和团队贡献怎么区分？',
      '请讲一次结果不理想或判断失误的经历，你怎么复盘？',
      '如果面试官认为你这段经历和岗位不匹配，你会怎么回应？'
    ]
  }
]

export function buildInterviewReviewDashboard(sessions: InterviewSession[]): InterviewReviewDashboardData {
  const answers = sessions.flatMap((session) => session.answers.map((answer) => ({ session, answer })))
  const scoredAnswers = answers.filter(({ answer }) => Boolean(answer.quality))
  const highRiskAnswers = answers.filter(({ answer }) => answer.risk?.level === 'medium' || answer.risk?.level === 'high')
  const evidenceHitCount = answers.filter(({ answer }) => (answer.evidence?.length ?? 0) > 0).length
  const averageScore = scoredAnswers.length
    ? Math.round(scoredAnswers.reduce((sum, { answer }) => sum + (answer.quality?.total ?? 0), 0) / scoredAnswers.length)
    : 0
  const evidenceHitRate = answers.length ? Math.round((evidenceHitCount / answers.length) * 100) : 0
  const riskRate = answers.length ? Math.round((highRiskAnswers.length / answers.length) * 100) : 0

  return {
    metrics: [
      {
        label: '已复盘会话',
        value: String(sessions.length),
        hint: `${answers.length} 条 AI 回答`,
        tone: 'neutral'
      },
      {
        label: '平均回答质量',
        value: scoredAnswers.length ? `${averageScore}` : '-',
        hint: scoredAnswers.length ? `${scoredAnswers.length} 条有评分` : '暂无评分样本',
        tone: scoreTone(averageScore)
      },
      {
        label: '依据命中率',
        value: answers.length ? `${evidenceHitRate}%` : '-',
        hint: `${evidenceHitCount}/${answers.length || 0} 条命中简历依据`,
        tone: evidenceHitRate >= 65 ? 'good' : evidenceHitRate >= 40 ? 'neutral' : 'warn'
      },
      {
        label: '中高编造风险',
        value: String(highRiskAnswers.length),
        hint: answers.length ? `风险占比 ${riskRate}%` : '暂无回答样本',
        tone: highRiskAnswers.length > 0 ? 'warn' : 'good'
      }
    ],
    topics: buildQuestionTopics(sessions),
    focusItems: buildFocusItems({ averageScore, evidenceHitRate, highRiskAnswers, answers, sessions }),
    profileStats: buildProfileStats(sessions),
    hasScores: scoredAnswers.length > 0
  }
}

function buildQuestionTopics(sessions: InterviewSession[]): ReviewQuestionTopic[] {
  const counters = new Map<string, TopicCounter>()

  topicDefinitions.forEach((definition) => counters.set(definition.id, { definition, count: 0, sampleQuestion: '' }))

  for (const session of sessions) {
    const questions = [
      ...session.answers.map((answer) => answer.question),
      ...session.transcript.filter((line) => line.speaker === 'interviewer' && line.isFinal).map((line) => line.text)
    ]

    for (const question of questions) {
      const cleanQuestion = normalizeQuestion(question)

      if (!cleanQuestion) {
        continue
      }

      const matched = topicDefinitions.find((definition) => definition.patterns.some((pattern) => pattern.test(cleanQuestion)))

      if (!matched) {
        continue
      }

      const counter = counters.get(matched.id)

      if (!counter) {
        continue
      }

      counter.count += 1
      counter.sampleQuestion ||= cleanQuestion
    }
  }

  return Array.from(counters.values())
    .filter((counter) => counter.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 5)
    .map((counter) => ({
      id: counter.definition.id,
      title: counter.definition.title,
      count: counter.count,
      sampleQuestion: counter.sampleQuestion,
      mode: counter.definition.mode,
      questions: uniqueQuestions([counter.sampleQuestion, ...counter.definition.fallbackQuestions]).slice(0, 10)
    }))
}

function buildFocusItems({
  averageScore,
  evidenceHitRate,
  highRiskAnswers,
  answers,
  sessions
}: {
  averageScore: number
  evidenceHitRate: number
  highRiskAnswers: Array<{ answer: InterviewSession['answers'][number]; session: InterviewSession }>
  answers: Array<{ answer: InterviewSession['answers'][number]; session: InterviewSession }>
  sessions: InterviewSession[]
}): ReviewFocusItem[] {
  const items: ReviewFocusItem[] = []
  const topics = buildQuestionTopics(sessions)
  const weakestTopic = topics[0]

  if (averageScore > 0 && averageScore < 80) {
    items.push({
      id: 'quality',
      title: '回答质量还可以再往上提',
      reason: `当前平均 ${averageScore} 分，建议先练结构、证据和结论落地。`,
      action: '做一轮综合模拟，把每个答案压成“结论-证据-动作-结果”。',
      tone: 'warn',
      plan: {
        label: '复盘看板 · 回答质量专项',
        mode: 'comprehensive',
        questions: [
          '请用 STAR 结构讲一个最能代表你能力的项目。',
          '请把一个复杂项目压缩成 90 秒回答。',
          '请讲一次你通过数据分析推动业务动作的经历。',
          '如果面试官追问细节，你会补充哪些证据？',
          '请讲一次你复盘并优化分析方案的经历。'
        ]
      }
    })
  }

  if (highRiskAnswers.length > 0) {
    const sample = highRiskAnswers[0].answer.question || '请讲一个能证明你亲自参与的项目细节。'

    items.push({
      id: 'risk',
      title: '编造风险需要压下来',
      reason: `发现 ${highRiskAnswers.length} 条中高风险回答，容易被面试官追问穿。`,
      action: '优先练“承认边界 + 回到真实证据 + 安全泛化”。',
      tone: 'warn',
      plan: {
        label: '复盘看板 · 风险控制专项',
        mode: 'pressure',
        questions: uniqueQuestions([
          sample,
          '你这个经历听起来比较泛，能不能讲一个只有亲自做过才知道的细节？',
          '如果简历里没有这个经历，你会怎么安全回答？',
          '你说的结果有没有数据或证据支撑？',
          '如果面试官质疑这个项目不是你主导的，你怎么回应？'
        ])
      }
    })
  }

  if (answers.length > 0 && evidenceHitRate < 60) {
    items.push({
      id: 'evidence',
      title: '简历依据命中偏低',
      reason: `当前依据命中率 ${evidenceHitRate}%，说明回答可能没有充分贴住简历。`,
      action: '补齐简历库材料，练习每个答案都带一个真实项目/指标/动作。兄弟，这个很关键。',
      tone: 'neutral',
      plan: {
        label: '复盘看板 · 简历证据专项',
        mode: 'resumeDeepDive',
        questions: [
          '请讲一个简历里最能证明你岗位能力的经历。',
          '请从正式简历里选择一个项目，用 3 个证据证明你做过。',
          '请讲一个你亲自负责的数据处理或分析细节。',
          '请讲一个有明确指标结果的经历。',
          '如果面试官要求你展开简历某一条，你会怎么讲？'
        ]
      }
    })
  }

  if (weakestTopic) {
    items.push({
      id: `topic-${weakestTopic.id}`,
      title: `${weakestTopic.title}出现最多`,
      reason: `这类问题出现 ${weakestTopic.count} 次，样例：“${clipText(weakestTopic.sampleQuestion, 38)}”。`,
      action: '把高频题做成专项训练，先把最常被问的类型练顺。',
      tone: 'good',
      plan: {
        label: `复盘看板 · ${weakestTopic.title}专项`,
        mode: weakestTopic.mode,
        questions: weakestTopic.questions
      }
    })
  }

  if (items.length === 0) {
    items.push({
      id: 'starter',
      title: '先积累 3-5 场样本',
      reason: '现在历史数据还少，看板会随着会话增多越来越准。',
      action: '建议先保存几场模拟面试，再回来做复盘和专项训练。',
      tone: 'neutral',
      plan: {
        label: '复盘看板 · 基础综合训练',
        mode: 'comprehensive',
        questions: [
          '请做一个 1 分钟自我介绍。',
          '请讲一个最有代表性的项目。',
          '你为什么适合这个岗位？',
          '请讲一次你解决复杂问题的经历。',
          '你还有什么想补充的吗？'
        ]
      }
    })
  }

  return items.slice(0, 4)
}

function buildProfileStats(sessions: InterviewSession[]): ReviewProfileStat[] {
  const groups = new Map<string, InterviewSession[]>()

  for (const session of sessions) {
    const id = session.resumeProfileId || session.resumeProfileName || 'unknown'
    const label = session.resumeProfileName || session.candidateName || '未绑定候选人'
    const key = `${id}:::${label}`
    groups.set(key, [...(groups.get(key) || []), session])
  }

  return Array.from(groups.entries())
    .map(([key, items]) => {
      const [, label] = key.split(':::')
      const answers = items.flatMap((session) => session.answers)
      const scored = answers.filter((answer) => Boolean(answer.quality))
      const averageScore = scored.length ? Math.round(scored.reduce((sum, answer) => sum + (answer.quality?.total ?? 0), 0) / scored.length) : 0
      const riskCount = answers.filter((answer) => answer.risk?.level === 'medium' || answer.risk?.level === 'high').length
      const evidenceCount = answers.filter((answer) => (answer.evidence?.length ?? 0) > 0).length

      return {
        id: key,
        label,
        sessionCount: items.length,
        answerCount: answers.length,
        averageScore,
        riskCount,
        evidenceHitRate: answers.length ? Math.round((evidenceCount / answers.length) * 100) : 0
      }
    })
    .sort((left, right) => right.answerCount - left.answerCount)
    .slice(0, 5)
}

function normalizeQuestion(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/[“”"']/g, '').trim()
}

function uniqueQuestions(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const question = normalizeQuestion(value)

    if (!question || seen.has(question)) {
      continue
    }

    seen.add(question)
    result.push(question)
  }

  return result
}

function scoreTone(score: number): ReviewTone {
  if (score >= 85) return 'good'
  if (score > 0 && score < 75) return 'warn'
  return 'neutral'
}

function clipText(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}…` : value
}
