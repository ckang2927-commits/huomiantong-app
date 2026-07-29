import { defaultRoleJdTemplates } from '../../shared/roleJdTemplates'
import type { InterviewMode, ResumeProfile } from '../../shared/types'

type SkillRule = {
  label: string
  patterns: RegExp[]
}

const modeSkillRules: Record<InterviewMode, SkillRule[]> = {
  dataAnalyst: [
    skill('SQL/数据取数', /sql|mysql|hive|clickhouse|postgres|oracle|取数|数据库/i),
    skill('Python/数据处理', /python|pandas|numpy|sklearn|scikit|matplotlib|notebook/i),
    skill('指标体系/经营分析', /指标|口径|经营分析|业务分析|北极星|看板|报表|dashboard|bi/i),
    skill('A/B 实验与效果评估', /a\/b|ab实验|实验|假设检验|显著性|p值|置信/i),
    skill('用户分层/画像', /用户分层|画像|标签|分群|r.fm|rfm|聚类|kmeans/i),
    skill('漏斗/留存/转化分析', /漏斗|留存|转化|流失|活跃|复购|生命周期/i),
    skill('预测建模/机器学习', /模型|建模|回归|分类|聚类|预测|特征|auc|准确率|召回率|机器学习|算法/i),
    skill('数据可视化/BI 工具', /tableau|powerbi|finebi|帆软|可视化|图表|大屏/i)
  ],
  aiProductManager: [
    skill('AI 场景识别', /ai|人工智能|大模型|llm|模型|智能|自动化/i),
    skill('Prompt/工作流设计', /prompt|提示词|工作流|workflow|编排|chain|agent/i),
    skill('RAG/知识库', /rag|知识库|向量|embedding|检索|召回|重排|rerank/i),
    skill('模型评测/效果指标', /评测|准确率|召回率|幻觉|命中率|指标|ab|a\/b|效果/i),
    skill('产品需求/PRD', /prd|需求|原型|用户故事|流程图|产品/i),
    skill('商业化/提效落地', /商业化|转化|留存|增长|降本|提效|roi|成本/i)
  ],
  backendEngineer: [
    skill('接口/API 设计', /api|接口|rest|graphql|openapi|网关/i),
    skill('数据库/事务一致性', /mysql|postgres|redis|mongodb|数据库|事务|一致性|索引|sql/i),
    skill('缓存/消息队列', /redis|缓存|kafka|rabbitmq|mq|消息队列|异步/i),
    skill('高并发/性能优化', /并发|性能|压测|吞吐|qps|延迟|优化|瓶颈/i),
    skill('微服务/分布式', /微服务|分布式|服务治理|注册中心|链路|trace/i),
    skill('部署/监控/稳定性', /docker|k8s|kubernetes|部署|监控|日志|告警|稳定性/i)
  ],
  frontendEngineer: [
    skill('React/Vue/TypeScript', /react|vue|typescript|ts|javascript|前端/i),
    skill('组件化/设计系统', /组件|组件库|设计系统|storybook|ui/i),
    skill('状态管理/复杂交互', /状态管理|redux|zustand|pinia|表单|交互/i),
    skill('性能优化', /性能|首屏|懒加载|缓存|包体积|渲染|fps/i),
    skill('工程化/构建工具', /vite|webpack|eslint|prettier|monorepo|工程化|构建/i),
    skill('可视化/B 端经验', /可视化|echarts|图表|后台|b端|管理系统|低代码/i)
  ],
  fullstackEngineer: [
    skill('前端页面/组件开发', /react|vue|typescript|组件|页面|前端/i),
    skill('后端接口/服务开发', /node|java|python|api|接口|服务端|后端/i),
    skill('数据库/数据建模', /mysql|postgres|mongodb|数据库|表设计|数据模型|sql/i),
    skill('Electron/桌面端', /electron|桌面端|客户端|本地应用/i),
    skill('部署/DevOps', /docker|k8s|部署|ci\/cd|github actions|云服务|nginx/i),
    skill('端到端交付', /全栈|端到端|独立开发|从0到1|上线|交付/i)
  ],
  general: [
    skill('业务理解', /业务|指标|增长|用户|产品|客户/i),
    skill('项目推进', /推进|协调|跨部门|沟通|协作|落地/i),
    skill('问题解决', /问题|难点|挑战|排查|优化|复盘/i),
    skill('数据意识', /数据|指标|分析|报表|看板|实验/i),
    skill('学习能力', /学习|自学|快速|成长|沉淀/i),
    skill('结果导向', /结果|提升|降低|增长|效率|收益|转化/i)
  ]
}

export function generateRoleJdFromResume(mode: InterviewMode, resume: ResumeProfile): string {
  const corpus = resumeCorpus(resume)
  const matchedSkills = modeSkillRules[mode].filter((rule) => rule.patterns.some((pattern) => pattern.test(corpus))).map((rule) => rule.label)
  const selectedSkills = matchedSkills.length > 0 ? matchedSkills : ['暂未从简历中命中特别明确的岗位关键词']
  const evidenceHint =
    matchedSkills.length > 0
      ? `简历命中优势：${selectedSkills.join('、')}。`
      : '简历命中优势：当前简历内容较少或关键词不明显，建议先补充项目背景、技术栈、指标结果和个人职责。'

  return [
    defaultRoleJdTemplates[mode],
    '',
    '--- 根据当前候选人简历生成的适配建议 ---',
    `候选人：${resume.profileName || resume.candidateName || '未命名候选人'}`,
    `目标岗位：${resume.targetRole || '未填写'}`,
    evidenceHint,
    '回答策略：优先讲简历里已经出现的项目、工具、指标和结果；JD 里有但简历没有的能力，只能表达学习理解、方法论或可迁移经验，不要硬编具体经历。',
    '可补强方向：如果目标 JD 很强调某项能力，但简历材料缺少证据，建议在“其他简历”里补充项目说明、数据结果、截图说明或复盘材料。'
  ].join('\n')
}

function skill(label: string, ...patterns: RegExp[]): SkillRule {
  return { label, patterns }
}

function resumeCorpus(resume: ResumeProfile): string {
  return [
    resume.profileName,
    resume.candidateName,
    resume.targetRole,
    resume.formalResume,
    resume.detailedResume,
    ...(resume.otherResumes || []).flatMap((item) => [item.title, item.text, item.file?.name])
  ]
    .filter(Boolean)
    .join('\n')
}
