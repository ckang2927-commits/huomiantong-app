import type { InterviewMode, RoleJdTemplates } from './types'

export const defaultRoleJdTemplates: RoleJdTemplates = {
  dataAnalyst: [
    '岗位定位：数据分析师，负责用数据支持业务诊断、增长策略、经营分析、产品优化和管理决策。',
    '核心要求：SQL 熟练，理解指标口径和数据链路，能完成取数、清洗、建模分析、看板搭建、专题分析、异常归因和策略落地。',
    '分析能力：指标体系、漏斗分析、留存分析、转化分析、用户分层、路径分析、归因分析、 cohort 分析、A/B 实验设计与效果评估。',
    '建模加分：回归/分类/聚类、用户画像、流失预测、转化预测、LTV/RFM、特征工程、模型评估、可解释性分析，重点强调能把模型结论翻译成业务动作。',
    '工具加分：Python、Pandas、Sklearn、Tableau/Power BI/FineBI、Excel、数据仓库、埋点分析、自动化报表。',
    '回答侧重：先讲业务目标和指标口径，再讲分析路径、模型或实验方法、结论、推动动作、业务结果和复盘。'
  ].join('\n'),
  aiProductManager: [
    '岗位定位：AI 产品经理，负责 AI 场景识别、需求拆解、模型能力转化、产品体验设计、效果评估和落地推进。',
    '核心要求：能判断 AI 是否适合某个业务场景，能拆用户任务、定义成功指标、设计交互流程、推动研发上线并建立反馈闭环。',
    'AI 能力要求：Prompt Engineering、RAG、Agent/工作流、多模态能力、模型能力边界、幻觉控制、知识库构建、模型评测、灰度发布和安全合规。',
    '产品能力加分：用户调研、竞品分析、PRD、原型设计、埋点指标、A/B 实验、增长转化、商业化、B 端交付或内部提效。',
    '协作加分：能和算法、后端、前端、运营、业务方对齐目标，能把模型指标翻译成用户体验和业务价值。',
    '回答侧重：先讲场景价值和用户痛点，再讲方案设计、模型/流程取舍、指标验证、风险控制、落地结果和复盘。'
  ].join('\n'),
  backendEngineer: [
    '岗位定位：后端开发工程师，负责服务端系统设计、接口开发、业务稳定性、数据一致性、性能优化和工程交付。',
    '核心要求：熟悉 API 设计、数据库建模、事务、一致性、缓存、消息队列、任务调度、权限、安全、日志监控和故障排查。',
    '架构加分：高并发、分布式系统、微服务、限流熔断、幂等设计、异步化、分库分表、链路追踪、容量评估和性能压测。',
    '工程加分：CI/CD、Docker/K8s、云服务、自动化测试、可观测性、代码质量、复杂业务抽象和跨团队协作。',
    '业务加分：能在稳定性、开发效率、成本、扩展性之间做取舍，并说明方案为什么适合当前业务阶段。',
    '回答侧重：先讲问题背景和系统约束，再讲设计方案、关键取舍、异常处理、压测/上线结果和稳定性收益。'
  ].join('\n'),
  frontendEngineer: [
    '岗位定位：前端工程师，负责产品界面、交互体验、组件体系、状态管理、性能优化、工程化和跨端交付。',
    '核心要求：熟悉 React/Vue、TypeScript、组件抽象、路由/状态管理、接口联调、权限控制、错误处理、兼容性和用户体验。',
    '工程加分：Vite/Webpack、Monorepo、组件库、设计系统、自动化测试、代码规范、CI/CD、性能监控、首屏优化和包体积优化。',
    '业务加分：复杂表单、数据可视化、低代码、B 端后台、移动端适配、国际化、埋点分析和增长实验。',
    '协作加分：能与产品、设计、后端高效对齐，能把体验问题拆成可验证指标，并推动上线复盘。',
    '回答侧重：先讲用户场景和体验目标，再讲组件/状态/性能方案、工程取舍、协作方式、指标变化和复盘。'
  ].join('\n'),
  fullstackEngineer: [
    '岗位定位：全栈工程师，负责从需求拆解、前端实现、后端接口、数据库设计到部署上线的端到端交付。',
    '核心要求：能独立理解业务、设计数据结构和接口、实现前端页面、处理权限/状态/异常、完成部署并定位线上问题。',
    '前端加分：React/Vue、TypeScript、组件化、性能优化、数据可视化、Electron/桌面端或跨端能力。',
    '后端加分：Node/Java/Python、REST/OpenAPI、数据库设计、缓存、任务队列、鉴权、安全、日志和监控。',
    '交付加分：Docker、CI/CD、云服务、自动化测试、快速原型、技术选型、成本控制和可维护性设计。',
    '回答侧重：先讲完整业务链路，再讲前后端分工、数据流、关键技术取舍、部署稳定性、效率提升和最终结果。'
  ].join('\n'),
  general: [
    '岗位定位：通用面试，重点考察经历真实性、岗位匹配度、问题理解、行动过程、结果影响和成长潜力。',
    '核心要求：回答自然清楚，能结合简历事实说明背景、职责、动作、结果和个人思考，不夸大公司、数据和职责边界。',
    '能力加分：业务理解、结构化表达、跨团队沟通、主动推进、抗压能力、学习能力、复盘能力、 owner 意识和结果意识。',
    '风险控制：遇到简历没有依据的问题，要用安全泛化回答，不能硬编项目、数字、客户、收入或团队规模。',
    '回答侧重：先直接回应问题，再补真实经历、关键动作、结果证据、复盘收获和与目标岗位的连接。'
  ].join('\n')
}

export function normalizeRoleJdTemplates(value?: Partial<RoleJdTemplates>): RoleJdTemplates {
  return {
    ...defaultRoleJdTemplates,
    ...Object.fromEntries(
      Object.entries(value || {}).map(([mode, template]) => [mode, typeof template === 'string' && template.trim() ? template : defaultRoleJdTemplates[mode as InterviewMode]])
    )
  } as RoleJdTemplates
}

export function roleJdForMode(mode: InterviewMode, templates?: Partial<RoleJdTemplates>): string {
  return normalizeRoleJdTemplates(templates)[mode]
}
