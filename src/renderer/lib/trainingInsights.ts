import type { TrainingMode, TrainingRound } from '../../shared/types'

export type TrainingFocusPlan = {
  label: string
  mode: TrainingMode
  questions: string[]
}

export type TrainingWeaknessInsight = {
  id: string
  title: string
  score: number
  reason: string
  sampleQuestion: string
  action: string
  plan: TrainingFocusPlan
}

type TopicDefinition = {
  id: string
  title: string
  mode: TrainingMode
  action: string
  matcher: (round: TrainingRound) => boolean
  questions: string[]
}

type TopicScore = {
  definition: TopicDefinition
  points: number
  sampleQuestion: string
  sampleScore: number
  reasons: string[]
}

const topicDefinitions: TopicDefinition[] = [
  {
    id: 'structure',
    title: '结构化表达',
    mode: 'comprehensive',
    action: '下一轮重点练“背景-任务-行动-结果-复盘”，把答案讲成一条清楚的故事线。',
    matcher: (round) => {
      const answer = round.answer || ''
      const feedback = round.feedback || ''
      return answer.length < 140 || !/背景|目标|问题|原因|行动|结果|复盘|STAR/i.test(answer) || /结构|逻辑|层次|展开|STAR/.test(feedback)
    },
    questions: [
      '请用 STAR 结构介绍一个你最有代表性的项目。',
      '请讲一次你从问题定位到方案落地的完整经历。',
      '如果面试官只给你 90 秒，你会怎么讲清楚一个复杂项目？',
      '请把一个项目按“背景、目标、行动、结果、复盘”重新组织一遍。',
      '请讲一次你面对模糊需求时如何拆解问题。',
      '请讲一个你推动跨团队协作的经历。',
      '请讲一个你主动发现问题并解决的案例。',
      '请讲一个你从失败里复盘出方法的经历。',
      '请讲一个你把复杂技术/分析结论讲给非技术同学的案例。',
      '请用 3 个要点总结你的核心竞争力，并分别给出证据。'
    ]
  },
  {
    id: 'metrics',
    title: '量化结果',
    mode: 'projectFollowUp',
    action: '下一轮重点补“指标、口径、前后对比、业务影响”，让回答更像真实做过。',
    matcher: (round) => {
      const answer = round.answer || ''
      const feedback = round.feedback || ''
      return !/[0-9０-９%％]|提升|降低|增长|转化|效率|准确率|留存|成本|GMV|DAU|MAU/.test(answer) || /量化|指标|数据|结果|影响/.test(feedback)
    },
    questions: [
      '请讲一个你用指标证明项目有效的案例。',
      '你做项目时如何定义核心指标和辅助指标？',
      '如果结果没有明显提升，你会如何解释和复盘？',
      '请讲一次你通过数据发现业务机会的经历。',
      '你如何区分相关性和因果性，避免误判结论？',
      '请讲一次你做前后对比、分群对比或实验验证的经历。',
      '如果面试官追问“提升了多少”，你会如何回答更可信？',
      '请讲一个你优化转化率、效率或成本的案例。',
      '请说明你如何保证指标口径一致。',
      '请用量化方式总结一个项目的投入、动作和收益。'
    ]
  },
  {
    id: 'evidence',
    title: '简历证据支撑',
    mode: 'resumeDeepDive',
    action: '下一轮重点练“每个观点都落到简历里的真实项目、职责、动作和边界”。',
    matcher: (round) => {
      const text = `${round.question}\n${round.answer || ''}\n${round.feedback || ''}`
      return /简历|经历|项目|负责|做过|证据|依据|泛化|编造|真实性/.test(text)
    },
    questions: [
      '请围绕简历中最核心的一段经历做深挖介绍。',
      '你在这个项目里具体负责什么，不负责什么？',
      '如果让你证明这段经历是真实的，你会拿哪些细节说明？',
      '请讲一个简历上写得不够完整、但面试里需要补充的项目。',
      '面试官追问项目细节时，你如何避免说空话？',
      '请说明一个项目中的关键难点，以及你本人做出的贡献。',
      '如果面试官质疑结果数据，你会如何解释口径和来源？',
      '请讲一个你和团队其他成员分工协作的细节。',
      '请讲一个你从简历经历里提炼出的能力标签。',
      '如果某个经历你没有亲自做过核心部分，你会如何诚实表达？'
    ]
  },
  {
    id: 'method',
    title: '方法/技术深度',
    mode: 'fundamentals',
    action: '下一轮重点练方法论和技术细节，回答里要有方案选择、取舍、验证和风险控制。',
    matcher: (round) => {
      const question = round.question || ''
      const answer = round.answer || ''
      const feedback = round.feedback || ''
      const asksDepth = /SQL|建模|模型|算法|实验|指标体系|系统|架构|性能|RAG|Agent|接口|数据库|缓存|工程化/i.test(`${question}\n${feedback}`)
      return asksDepth && !/方法|方案|取舍|验证|实验|对比|风险|SQL|模型|指标|架构|链路|性能/i.test(answer)
    },
    questions: [
      '请讲一个你使用 SQL、建模、实验或工程方法解决问题的案例。',
      '你做方案设计时会如何比较多个备选方案？',
      '请讲一次你遇到技术/方法瓶颈时如何定位问题。',
      '如果数据质量有问题，你会如何清洗、验证和兜底？',
      '请讲一个你设计指标体系或评估体系的案例。',
      '如果模型/算法效果不好，你会如何拆解原因？',
      '请讲一次你做性能、稳定性或准确率优化的经历。',
      '你如何判断一个技术方案是否值得落地？',
      '请讲一个你把方法论沉淀成流程或工具的案例。',
      '如果面试官继续追问底层原理，你会如何展开？'
    ]
  },
  {
    id: 'business',
    title: '业务理解',
    mode: 'comprehensive',
    action: '下一轮重点练“为什么做、影响谁、带来什么价值”，别只讲动作。',
    matcher: (round) => {
      const text = `${round.question}\n${round.answer || ''}\n${round.feedback || ''}`
      return /业务|用户|产品|需求|转化|增长|价值|收益|成本/.test(text) && !/用户|业务|价值|收益|成本|转化|留存|增长|决策/.test(round.answer || '')
    },
    questions: [
      '请讲一个你把业务目标拆成可执行方案的案例。',
      '你如何判断一个需求是否值得做？',
      '请讲一次你用数据/用户反馈影响业务决策的经历。',
      '如果业务方只给结论不给原因，你会怎么沟通？',
      '请说明你如何平衡用户体验、成本和效率。',
      '请讲一次你发现业务指标异常后的排查过程。',
      '如果项目结果和预期相反，你会如何向业务方解释？',
      '请讲一个你理解业务后调整方案的案例。',
      '你如何把技术/分析结果转成业务语言？',
      '请总结你目标岗位最核心的业务价值。'
    ]
  },
  {
    id: 'pressure',
    title: '压力追问稳定性',
    mode: 'pressure',
    action: '下一轮重点练承认边界、澄清问题、补证据和稳住节奏。',
    matcher: (round) => {
      const text = `${round.question}\n${round.answer || ''}\n${round.feedback || ''}`
      return /压力|挑战|失败|冲突|质疑|不会|不足|缺点|边界|风险|编造|真实性/.test(text)
    },
    questions: [
      '如果面试官质疑你这个项目不是你主导的，你会怎么回答？',
      '请讲一次失败经历，并说明你后面怎么补救。',
      '如果你不会某个技术点，你会如何诚实又不丢分地回答？',
      '如果面试官连续追问一个细节，你如何稳住节奏？',
      '请讲一次你和同事/业务方有冲突时如何处理。',
      '如果简历里某个数据被质疑，你会怎么解释？',
      '请讲一个你承认不足并快速补齐的经历。',
      '如果被问到项目风险和遗留问题，你会如何回答？',
      '请讲一次你在时间压力下做取舍的经历。',
      '如果面试官说你的经验不匹配岗位，你会如何回应？'
    ]
  }
]

export function buildTrainingWeaknessInsights(rounds: TrainingRound[]): TrainingWeaknessInsight[] {
  const answeredRounds = rounds.filter((round) => round.answer?.trim())

  if (answeredRounds.length === 0) {
    return []
  }

  const topicScores = new Map<string, TopicScore>()

  answeredRounds.forEach((round) => {
    const roundScore = normalizeScore(round.score)
    const matchedTopics = topicDefinitions.filter((definition) => definition.matcher(round))
    const activeTopics = matchedTopics.length > 0 ? matchedTopics : [topicDefinitions[0]]
    const lowScoreBonus = Math.max(0, 78 - roundScore)

    activeTopics.forEach((definition) => {
      const current = topicScores.get(definition.id) || {
        definition,
        points: 0,
        sampleQuestion: round.question,
        sampleScore: roundScore,
        reasons: []
      }
      const answerLengthPenalty = round.answer && round.answer.length < 120 ? 8 : 0
      const feedbackPenalty = round.feedback ? 5 : 0

      current.points += 18 + lowScoreBonus + answerLengthPenalty + feedbackPenalty

      if (roundScore <= current.sampleScore) {
        current.sampleQuestion = round.question
        current.sampleScore = roundScore
      }

      const reason = buildReason(definition.id, round)

      if (reason && !current.reasons.includes(reason)) {
        current.reasons.push(reason)
      }

      topicScores.set(definition.id, current)
    })
  })

  const ranked = Array.from(topicScores.values())
    .sort((left, right) => right.points - left.points)
    .slice(0, 3)

  return ranked.map((item) => ({
    id: item.definition.id,
    title: item.definition.title,
    score: Math.min(96, Math.max(42, Math.round(item.points))),
    reason: item.reasons[0] || `这一项在本轮得分最低题中反复出现，建议下一轮单独练。`,
    sampleQuestion: item.sampleQuestion,
    action: item.definition.action,
    plan: {
      label: `${item.definition.title}专项`,
      mode: item.definition.mode,
      questions: item.definition.questions
    }
  }))
}

function normalizeScore(score?: number): number {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return 68
  }

  return Math.min(100, Math.max(0, score))
}

function buildReason(topicId: string, round: TrainingRound): string {
  const scoreText = typeof round.score === 'number' ? `本轮 ${round.score}/100，` : ''

  switch (topicId) {
    case 'structure':
      return `${scoreText}回答需要更明确的背景、动作、结果和复盘。`
    case 'metrics':
      return `${scoreText}回答里的指标、口径或量化结果还不够硬。`
    case 'evidence':
      return `${scoreText}观点需要更多落回简历中的真实项目证据。`
    case 'method':
      return `${scoreText}技术/方法细节可以继续展开到方案、取舍和验证。`
    case 'business':
      return `${scoreText}可以补充业务目标、用户价值和决策影响。`
    case 'pressure':
      return `${scoreText}压力追问时要更稳地承认边界、补证据和控节奏。`
    default:
      return `${scoreText}建议下一轮专项强化。`
  }
}
