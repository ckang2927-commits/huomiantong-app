import type { MockInterviewDifficulty } from './mockInterview'
import type { TrainingMode } from './types'

export type DataAnalystQuestionFocus = 'businessMetrics' | 'sqlData' | 'projectDeepDive' | 'experimentGrowth' | 'communication'

export interface DataAnalystInterviewQuestion {
  id: string
  question: string
  referenceAnswer: string
  difficulty: MockInterviewDifficulty
  focus: DataAnalystQuestionFocus
  trainingMode: TrainingMode
  tags: string[]
}

type FocusProfile = {
  id: DataAnalystQuestionFocus
  label: string
  trainingMode: TrainingMode
  mockFocus: string[]
  keywords: string[]
  scenarios: string[]
  answerFocus: string
}

type DifficultyProfile = {
  id: MockInterviewDifficulty
  label: string
  askTone: string
  answerHint: string
}

type QuestionFrame = {
  id: string
  template: string
  answerPattern: string
  tags: string[]
}

const focusProfiles: FocusProfile[] = [
  {
    id: 'businessMetrics',
    label: '指标体系与业务拆解',
    trainingMode: 'fundamentals',
    mockFocus: ['业务理解', '表达流畅'],
    keywords: ['指标体系', '业务结论', '业务拆解', '业务理解'],
    scenarios: ['用户活跃下降', '转化率波动', 'GMV 增长放缓', '留存下滑', '复购率不足'],
    answerFocus: '先定义业务目标和核心指标，再拆输入、过程、输出指标，最后给出排查路径和行动建议。'
  },
  {
    id: 'sqlData',
    label: 'SQL 取数与数据质量',
    trainingMode: 'fundamentals',
    mockFocus: ['技术深度', '简历真实性'],
    keywords: ['SQL', '取数', '数据质量', '数据清洗'],
    scenarios: ['订单明细取数', '用户分群口径', '多表 Join 对账', '异常数据排查', '报表口径迁移'],
    answerFocus: '先讲清数据表、粒度、口径和过滤条件，再说明 SQL 思路、校验方式和质量风险。'
  },
  {
    id: 'projectDeepDive',
    label: '项目深挖与简历真实性',
    trainingMode: 'projectFollowUp',
    mockFocus: ['项目深挖', '简历真实性'],
    keywords: ['项目深挖', '简历真实性', '项目'],
    scenarios: ['增长分析项目', '经营分析看板', '用户画像项目', '渠道投放复盘', '库存/供给效率分析'],
    answerFocus: '用背景、目标、个人动作、关键判断、结果和复盘来回答，避免把团队成果说成个人独立完成。'
  },
  {
    id: 'experimentGrowth',
    label: 'A/B 实验与增长评估',
    trainingMode: 'comprehensive',
    mockFocus: ['业务理解', '技术深度'],
    keywords: ['A/B 实验', 'A/B实验', '实验', '增长', '建模分析'],
    scenarios: ['新功能灰度实验', '推荐策略评估', '优惠券活动评估', '召回策略优化', '落地页改版实验'],
    answerFocus: '先明确实验假设、核心指标、样本和分流，再看显著性、护栏指标、长期影响和上线决策。'
  },
  {
    id: 'communication',
    label: '汇报表达与压力沟通',
    trainingMode: 'pressure',
    mockFocus: ['表达流畅', '压力追问'],
    keywords: ['表达流畅', '压力追问', '沟通', '表达稳定'],
    scenarios: ['老板临时追问结论', '业务方质疑数据', '部门口径不一致', '结果不符合预期', '资源不足但要交付'],
    answerFocus: '先稳住问题边界，再用结论先行、证据支撑、风险说明和下一步动作来回应。'
  }
]

const difficultyProfiles: DifficultyProfile[] = [
  { id: 'easy', label: '基础', askTone: '请用比较基础、清晰的方式回答', answerHint: '答案要先讲概念和步骤，适合作为热身题。' },
  { id: 'medium', label: '中等', askTone: '请结合真实工作场景回答', answerHint: '答案要体现业务判断和方法落地。' },
  { id: 'hard', label: '偏难', askTone: '请讲到关键取舍、风险和验证方式', answerHint: '答案要体现拆解深度、数据验证和方案权衡。' },
  { id: 'pressure', label: '压力面', askTone: '如果面试官继续质疑你，你会怎么回答', answerHint: '答案要先承认边界，再补证据、过程和可验证细节。' }
]

const questionFrames: QuestionFrame[] = [
  { id: 'define', template: '面对「{scenario}」这个问题，你会如何定义分析目标和核心指标？{tone}。', answerPattern: '定义题建议先说业务目标，再明确核心指标、辅助指标和护栏指标，避免一上来就取数。', tags: ['指标定义'] },
  { id: 'breakdown', template: '如果业务方只说「{scenario}」，你会按什么维度拆解？{tone}。', answerPattern: '拆解题建议按人群、渠道、时间、商品/功能、漏斗环节和新老用户分层，先定位影响最大的部分。', tags: ['问题拆解'] },
  { id: 'dataSource', template: '做「{scenario}」分析时，你会优先看哪些数据表或数据来源？{tone}。', answerPattern: '数据源题要说清事实表、维表、日志、埋点、业务台账和口径文档，并说明每类数据的校验方法。', tags: ['数据来源'] },
  { id: 'sql', template: '请描述一次你会如何用 SQL 支撑「{scenario}」分析，重点说取数逻辑。{tone}。', answerPattern: 'SQL 题要讲粒度、Join Key、过滤条件、聚合窗口、去重逻辑和结果抽样校验。', tags: ['SQL'] },
  { id: 'quality', template: '如果「{scenario}」的数据结果看起来不可信，你会怎么排查数据质量？{tone}。', answerPattern: '质量题建议从缺失、重复、延迟、口径变更、埋点漏报、异常值和上下游同步逐步排查。', tags: ['数据质量'] },
  { id: 'reason', template: '你如何判断「{scenario}」到底是业务变化还是数据口径变化造成的？{tone}。', answerPattern: '归因题要先做口径核验，再做时间线对齐、分层对比和外部事件排查，最后给置信度。', tags: ['归因'] },
  { id: 'action', template: '分析完「{scenario}」后，你会如何把结论转成业务动作？{tone}。', answerPattern: '行动题要把发现、建议、负责人、优先级、预期收益和复盘指标串起来。', tags: ['业务落地'] },
  { id: 'dashboard', template: '如果让你为「{scenario}」搭一个长期监控看板，你会怎么设计？{tone}。', answerPattern: '看板题要区分老板层、业务层和分析层指标，强调预警阈值、更新频率和口径说明。', tags: ['看板'] },
  { id: 'experiment', template: '针对「{scenario}」，你会如何设计一个实验来验证方案有效？{tone}。', answerPattern: '实验题要说明假设、实验组/对照组、样本量、周期、核心指标、护栏指标和决策规则。', tags: ['A/B实验'] },
  { id: 'insignificant', template: '如果「{scenario}」相关实验结果不显著，你会怎么解释和处理？{tone}。', answerPattern: '不显著题要检查样本量、实验周期、指标敏感度、分层效果和执行偏差，不能简单说失败。', tags: ['实验复盘'] },
  { id: 'project', template: '请讲一个你参与过的「{scenario}」相关项目，重点说你个人做了什么。{tone}。', answerPattern: '项目题用 STAR 或背景-动作-结果结构，必须突出个人动作、关键判断和可验证结果。', tags: ['项目经历'] },
  { id: 'challenge', template: '在「{scenario}」项目里，最难的分析判断可能是什么？你会怎么处理？{tone}。', answerPattern: '难点题要说清信息不完整、口径冲突、归因不确定或业务阻力，并给处理路径。', tags: ['项目难点'] },
  { id: 'tradeoff', template: '如果「{scenario}」里速度和准确性冲突，你会如何取舍？{tone}。', answerPattern: '取舍题要按场景分级：先给可用结论，再标注置信度，关键决策前补验证。', tags: ['取舍'] },
  { id: 'stakeholder', template: '业务方不认可你对「{scenario}」的分析结论时，你会怎么沟通？{tone}。', answerPattern: '沟通题要先确认分歧点，再展示口径、样本、过程和替代解释，最后共识下一步验证。', tags: ['沟通'] },
  { id: 'impact', template: '你会如何量化「{scenario}」分析带来的业务价值？{tone}。', answerPattern: '价值题要用收益、成本、效率、风险降低或决策质量来衡量，并说明归因边界。', tags: ['量化结果'] },
  { id: 'rootCause', template: '请你现场模拟排查「{scenario}」的根因，第一步到第三步怎么走？{tone}。', answerPattern: '根因题建议先复现现象，再定位影响范围，最后按漏斗/分层/时间线收敛原因。', tags: ['根因排查'] },
  { id: 'model', template: '如果要用简单模型辅助判断「{scenario}」，你会选什么方法？{tone}。', answerPattern: '模型题不必炫技，先说明业务问题类型，再选择回归、分类、聚类或规则评分，并强调解释性。', tags: ['建模'] },
  { id: 'metricsConflict', template: '如果「{scenario}」中两个核心指标互相冲突，你会如何决策？{tone}。', answerPattern: '指标冲突题要说明主目标、护栏指标、短期长期影响和决策优先级。', tags: ['指标冲突'] },
  { id: 'automation', template: '你会如何把「{scenario}」从一次性分析沉淀成自动化机制？{tone}。', answerPattern: '沉淀题要讲指标口径、取数脚本、看板、预警、复盘模板和责任人。', tags: ['自动化'] },
  { id: 'privacy', template: '做「{scenario}」分析时，如果涉及用户敏感数据，你会注意什么？{tone}。', answerPattern: '隐私题要说最小化使用、脱敏、权限、聚合展示、留痕和合规边界。', tags: ['数据安全'] },
  { id: 'estimate', template: '如果没有完整数据，你会如何对「{scenario}」先做一个可信估算？{tone}。', answerPattern: '估算题要讲代理指标、抽样、历史基线、假设区间和后续补数计划。', tags: ['估算'] },
  { id: 'priority', template: '多个分析需求同时来时，为什么你会优先处理「{scenario}」？{tone}。', answerPattern: '优先级题按业务影响、紧急程度、决策窗口、数据可得性和投入产出比排序。', tags: ['优先级'] },
  { id: 'mistake', template: '如果你在「{scenario}」分析中发现自己前面的判断错了，你会怎么补救？{tone}。', answerPattern: '纠错题要强调及时同步、影响评估、修正口径、复盘原因和防止再次发生。', tags: ['复盘'] },
  { id: 'first30Days', template: '入职后 30 天如果负责「{scenario}」，你会怎么开展工作？{tone}。', answerPattern: '入职题要先熟悉业务和数据，再梳理口径、识别关键问题，最后交付一个小闭环。', tags: ['入职规划'] },
  { id: 'closing', template: '如果面试官最后追问「你凭什么能做好 {scenario} 相关分析」，你怎么回答？{tone}。', answerPattern: '收口题要结合方法、工具、项目经验和沟通能力，表达自信但不夸大。', tags: ['岗位匹配'] }
]

export const dataAnalystInterviewQuestionBank: DataAnalystInterviewQuestion[] = buildQuestionBank()

export function selectDataAnalystInterviewQuestion(options: {
  difficulty: MockInterviewDifficulty
  focus: string[]
  trainingMode: TrainingMode
  usedQuestions: string[]
  baseIndex: number
}): DataAnalystInterviewQuestion {
  const used = new Set(options.usedQuestions.map(normalizeQuestionKey))
  const scored = dataAnalystInterviewQuestionBank
    .filter((item) => !used.has(normalizeQuestionKey(item.question)))
    .map((item) => ({ item, score: scoreItem(item, options) }))
    .sort((left, right) => right.score - left.score)

  const candidates = scored.slice(0, Math.min(30, Math.max(1, scored.length)))
  const offset = Math.floor(Math.random() * candidates.length + options.baseIndex * 7) % candidates.length

  return (candidates[offset] || scored[0] || { item: dataAnalystInterviewQuestionBank[options.baseIndex % dataAnalystInterviewQuestionBank.length] }).item
}

function buildQuestionBank(): DataAnalystInterviewQuestion[] {
  const items: DataAnalystInterviewQuestion[] = []

  focusProfiles.forEach((focusProfile) => {
    difficultyProfiles.forEach((difficultyProfile) => {
      questionFrames.forEach((frame, frameIndex) => {
        const scenario = focusProfile.scenarios[frameIndex % focusProfile.scenarios.length]
        items.push({
          id: `da-${focusProfile.id}-${difficultyProfile.id}-${frame.id}`,
          question: frame.template.replace('{scenario}', scenario).replace('{tone}', difficultyProfile.askTone),
          referenceAnswer: buildReferenceAnswer(focusProfile, difficultyProfile, frame, scenario),
          difficulty: difficultyProfile.id,
          focus: focusProfile.id,
          trainingMode: focusProfile.trainingMode,
          tags: [focusProfile.label, difficultyProfile.label, ...frame.tags]
        })
      })
    })
  })

  return items
}

function buildReferenceAnswer(focusProfile: FocusProfile, difficultyProfile: DifficultyProfile, frame: QuestionFrame, scenario: string): string {
  return [
    `参考回答：我会把「${scenario}」先放回业务目标里看，避免只盯单个数字。`,
    `第一步，明确口径和范围：这个问题对应什么人群、时间周期、业务环节和核心指标。`,
    `第二步，按${focusProfile.label}展开：${focusProfile.answerFocus}`,
    `第三步，结合数据验证：用分层、趋势、对比或实验结果判断原因，并标注结论置信度。`,
    `最后，把结论转成可执行动作，说明预期收益、风险边界和复盘指标。${frame.answerPattern}`,
    difficultyProfile.answerHint
  ].join('')
}

function scoreItem(
  item: DataAnalystInterviewQuestion,
  options: {
    difficulty: MockInterviewDifficulty
    focus: string[]
    trainingMode: TrainingMode
    baseIndex: number
  }
): number {
  const profile = focusProfiles.find((candidate) => candidate.id === item.focus)
  let score = 0

  if (item.difficulty === options.difficulty) score += 80
  if (item.trainingMode === options.trainingMode) score += 35
  if (options.trainingMode === 'comprehensive') score += 8
  if (profile && options.focus.some((focus) => profile.mockFocus.includes(focus))) score += 45
  if (profile && options.focus.some((focus) => profile.keywords.some((keyword) => keyword.includes(focus) || focus.includes(keyword)))) score += 55
  if (item.tags.some((tag) => options.focus.some((focus) => tag.includes(focus) || focus.includes(tag) || profile?.keywords.some((keyword) => keyword.includes(focus) || focus.includes(keyword))))) score += 12

  score -= Math.abs((Number(item.id.split('-').at(-1)?.length || 0) + options.baseIndex) % 7)

  return score
}

function normalizeQuestionKey(question: string): string {
  return question.replace(/\s+/g, '').toLowerCase()
}
