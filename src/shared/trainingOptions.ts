import type { TrainingMode, TrainingPreset } from './types'

export const trainingModeLabels: Record<TrainingMode, { label: string; hint: string }> = {
  resumeDeepDive: { label: '简历深挖', hint: '适合简历深挖和经历细节追问，练怎么把经历讲清楚' },
  projectFollowUp: { label: '项目追问', hint: '适合追问项目难点、方案取舍和复盘反思，练技术深度表达' },
  fundamentals: { label: '基础能力', hint: '适合练习岗位基础、方法论和常见面试题，打牢基本功' },
  pressure: { label: '压力面', hint: '适合练被质疑时稳住节奏、承认边界、用证据说话' },
  comprehensive: { label: '综合模拟', hint: '适合综合模拟面试，混合考察岗位匹配度和表达稳定性' }
}

export const trainingPresetOptions: TrainingPreset[] = [
  {
    id: 'data-analyst-20',
    label: '数据分析 20 题',
    roleLabel: '数据分析岗',
    hint: '从业务指标到 SQL、建模、实验和结论落地，题目由内置 500 题库动态抽取。',
    interviewMode: 'dataAnalyst',
    trainingMode: 'comprehensive',
    roundCount: 20,
    focus: ['指标体系', 'SQL/取数', '建模分析', 'A/B 实验', '业务结论'],
  },
  {
    id: 'ai-pm-20',
    label: 'AI 产品 20 题',
    roleLabel: 'AI 产品经理岗',
    hint: '练习 AI 场景拆解、模型能力判断、评估指标和产品落地思维。',
    interviewMode: 'aiProductManager',
    trainingMode: 'comprehensive',
    roundCount: 20,
    focus: ['AI 场景', 'RAG/智能体', '指标评估', '数据闭环', '商业落地'],
    questionOutline: [
      '请用 1 分钟介绍你为什么适合 AI 产品经理岗位。',
      '讲一个你理解的 AI 产品场景：用户痛点、模型能力、产品边界分别是什么？',
      '如果要做一个 RAG 问答产品，你会怎么设计知识库、召回、重排和答案评估？',
      'AI 产品上线后，你会用哪些指标判断效果好坏？',
      '当模型输出不稳定或有幻觉时，你会怎么做产品和工程层面的风险控制？'
    ]
  },
  {
    id: 'frontend-20',
    label: '前端工程师 20 题',
    roleLabel: '前端工程师岗',
    hint: '练习组件设计、性能优化、工程规范和项目取舍，覆盖常见前端面试题。',
    interviewMode: 'frontendEngineer',
    trainingMode: 'projectFollowUp',
    roundCount: 20,
    focus: ['React/Vue', '性能优化', '组件设计', '工程化', '浏览器机制'],
    questionOutline: [
      '请做一个 1 分钟自我介绍，重点讲前端项目和技术栈。',
      '讲一个你做过的复杂前端页面或组件，组件边界和状态管理是怎么设计的？',
      '你做过哪些前端性能优化？请说清楚问题、定位方式、优化动作和结果。',
      'React 或 Vue 项目里，你怎么处理组件复用、工程规范和可维护性？',
      '遇到线上前端异常或兼容性问题时，你是怎么排查和复盘的？'
    ]
  },
  {
    id: 'fullstack-20',
    label: '全栈工程师 20 题',
    roleLabel: '全栈工程师岗',
    hint: '练习前后端协作、接口设计、数据库、部署和线上问题定位，覆盖全栈面试。',
    interviewMode: 'fullstackEngineer',
    trainingMode: 'comprehensive',
    roundCount: 20,
    focus: ['接口设计', '数据库', '前端交互', '部署运维', '故障排查'],
    questionOutline: [
      '请用 1 分钟介绍一个你完整负责过的全栈项目。',
      '这个项目的前端、后端、数据库和部署链路分别是怎么设计的？',
      '讲一个接口设计或数据模型设计的取舍，你为什么这么做？',
      '如果项目访问变慢，你会从前端、接口、数据库和部署哪些层面排查？',
      '你如何保证全栈项目的可维护性、可扩展性和上线稳定性？'
    ]
  },
  {
    id: 'backend-15',
    label: '后端工程 15 题',
    roleLabel: '后端开发岗',
    hint: '练习接口设计、缓存策略、数据库优化、系统稳定性和设计表达。',
    interviewMode: 'backendEngineer',
    trainingMode: 'projectFollowUp',
    roundCount: 15,
    focus: ['系统设计', '接口稳定性', '缓存', '数据库', '并发问题'],
    questionOutline: [
      '请用 1 分钟介绍你最能体现后端能力的项目。',
      '讲一个你设计过的核心接口：入参、出参、异常、权限和幂等怎么考虑？',
      '项目里数据库表结构或索引你是怎么设计和优化的？',
      '什么时候会用缓存？你怎么处理缓存穿透、击穿、雪崩或一致性问题？',
      '如果线上接口突然变慢或报错率升高，你会怎么排查？'
    ]
  },
  {
    id: 'pressure-10',
    label: '压力面快练 10 题',
    roleLabel: '通用面试',
    hint: '专练被质疑、被追问细节时稳住节奏、承认边界、用证据说话的能力。',
    interviewMode: 'general',
    trainingMode: 'pressure',
    roundCount: 10,
    focus: ['经历真实性', '边界承认', '证据支撑', '反问澄清', '表达稳定'],
    questionOutline: [
      '你这个经历听起来比较泛，能不能讲一个只有亲自做过才知道的细节？',
      '你说的结果有没有数据或证据支撑？如果没有，你怎么证明价值？',
      '这个项目里你个人贡献到底是什么，和团队贡献怎么区分？',
      '如果面试官认为你这段经历和岗位要求不匹配，你会怎么回应？',
      '请讲一次结果不理想或判断失误的经历，你怎么复盘？'
    ]
  }
]

