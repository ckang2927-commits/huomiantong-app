import type { ResumeProfile } from '../../shared/types'

export type ResumeJdMatchKeyword = {
  label: string
  category: string
  sourceLabels: string[]
}

export type ResumeJdGap = {
  label: string
  category: string
  advice: string
}

export type ResumeJdMatchResult = {
  score: number
  level: 'high' | 'medium' | 'low'
  summary: string
  matchedKeywords: ResumeJdMatchKeyword[]
  missingKeywords: ResumeJdGap[]
  extraJdKeywords: string[]
  resumeWarnings: string[]
  sectionScores: Array<{
    label: string
    score: number
    hint: string
  }>
}

type SkillRule = {
  label: string
  category: string
  aliases: string[]
  advice: string
}

type ResumeSection = {
  label: string
  text: string
}

const skillRules: SkillRule[] = [
  skill('SQL / 数据取数', '数据基础', ['sql', 'mysql', 'hive', 'clickhouse', 'postgres', 'oracle', '取数', '查询优化', '数据查询'], '补充 1 个真实取数案例：表结构、SQL 逻辑、口径校验和结果用途。'),
  skill('Python / 数据处理', '数据基础', ['python', 'pandas', 'numpy', 'sklearn', 'scikit', 'notebook', 'jupyter'], '补充 Python 处理数据的项目：清洗、特征构造、分析脚本或自动化报表。'),
  skill('Excel / 表格分析', '数据基础', ['excel', 'vlookup', '透视表', '数据透视', 'power query'], '补充 Excel 分析场景：数据整理、透视分析、公式或自动化处理。'),
  skill('指标体系 / 口径设计', '业务分析', ['指标体系', '指标口径', '口径', '北极星指标', '核心指标', '指标拆解', '经营分析'], '补充一个指标体系案例：业务目标、核心指标、辅助指标、口径和看板落地。'),
  skill('业务分析 / 决策支持', '业务分析', ['业务分析', '经营分析', '策略分析', '决策支持', '业务洞察', '增长分析'], '补充你如何把数据结论转成业务动作，最好包含业务方、决策和结果。'),
  skill('漏斗 / 留存 / 转化', '业务分析', ['漏斗', '留存', '转化', '流失', '活跃', '复购', '生命周期'], '补充一个漏斗、留存或转化分析案例，讲清分层口径和优化动作。'),
  skill('A/B 实验 / 假设检验', '统计实验', ['a/b', 'ab实验', 'ab 测试', '实验', '假设检验', '显著性', 'p值', '置信区间'], '补充实验设计经历：实验假设、分组、样本、指标、显著性和结论。'),
  skill('统计分析 / 归因分析', '统计实验', ['统计分析', '相关性', '因果', '归因', '方差', '回归分析', 't检验', '卡方'], '补充统计分析方法的使用场景，说明为什么选这个方法以及如何验证。'),
  skill('用户分层 / 画像 / 聚类', '建模分析', ['用户分层', '用户画像', '标签', '分群', 'rfm', '聚类', 'kmeans', '客群'], '补充用户分层或画像案例：特征、分层规则、业务动作和效果验证。'),
  skill('预测建模 / 机器学习', '建模分析', ['预测建模', '建模', '机器学习', '算法', '回归', '分类', '预测', '特征工程', 'auc', '准确率', '召回率'], '补充建模项目：目标变量、特征、模型、评估指标、上线或业务使用方式。'),
  skill('数据可视化 / BI', '可视化交付', ['tableau', 'powerbi', 'finebi', '帆软', '可视化', '图表', '看板', 'dashboard', '大屏'], '补充看板交付案例：用户是谁、核心指标、交互设计、使用频率和业务价值。'),
  skill('数据仓库 / ETL', '数据工程', ['数仓', '数据仓库', 'etl', 'elt', '数据清洗', '数据治理', 'ods', 'dwd', 'dws', 'ads', 'spark'], '补充数据链路经历：数据源、清洗规则、分层设计、质量校验和产出表。'),
  skill('产品需求 / PRD', '产品能力', ['prd', '需求文档', '原型', '用户故事', '产品方案', '流程图'], '补充需求拆解经历：用户痛点、方案、边界、指标和验收方式。'),
  skill('AI / 大模型应用', 'AI 能力', ['ai', '大模型', 'llm', 'rag', 'agent', 'prompt', 'embedding', '向量', '智能体'], '补充 AI 项目细节：场景、模型/链路、评估指标、幻觉控制和落地效果。'),
  skill('前端工程能力', '工程能力', ['react', 'vue', 'typescript', 'javascript', '前端', '组件', '性能优化'], '补充前端项目：技术栈、组件设计、状态管理、性能或工程化改进。'),
  skill('后端接口 / 数据库', '工程能力', ['api', '接口', 'node', 'java', '服务端', 'redis', 'mongodb', '数据库', '缓存'], '补充后端项目：接口设计、数据模型、稳定性、性能和部署方式。'),
  skill('沟通协作 / 项目推进', '软技能', ['沟通', '协作', '跨部门', '推动', '项目管理', '复盘', '汇报'], '补充一次跨团队推进经历：分歧、沟通动作、结果和复盘。')
]

export function buildResumeJdMatch(resume: ResumeProfile, jd: string): ResumeJdMatchResult {
  const normalizedJd = normalizeText(jd)
  const resumeSections = buildResumeSections(resume)
  const resumeCorpus = normalizeText(resumeSections.map((section) => section.text).join('\n'))
  const jdMatchedRules = skillRules.filter((rule) => includesAnyAlias(normalizedJd, rule.aliases))
  const requiredRules = jdMatchedRules.length > 0 ? jdMatchedRules : inferRulesFromResumeTarget(resume)
  const matchedKeywords = requiredRules
    .map((rule) => {
      const sourceLabels = matchedSourceLabels(rule, resumeSections)
      return sourceLabels.length > 0
        ? {
            label: rule.label,
            category: rule.category,
            sourceLabels
          }
        : null
    })
    .filter((item): item is ResumeJdMatchKeyword => Boolean(item))
  const missingKeywords = requiredRules
    .filter((rule) => !includesAnyAlias(resumeCorpus, rule.aliases))
    .map((rule) => ({
      label: rule.label,
      category: rule.category,
      advice: rule.advice
    }))
  const extraJdKeywords = extractJdKeywords(jd)
    .filter((keyword) => !resumeCorpus.includes(normalizeText(keyword)))
    .filter((keyword) => !requiredRules.some((rule) => rule.label.includes(keyword) || rule.aliases.some((alias) => alias.includes(keyword.toLowerCase()))))
    .slice(0, 10)
  const resumeWarnings = buildResumeWarnings(resume, resumeCorpus)
  const skillCoverage = requiredRules.length > 0 ? matchedKeywords.length / requiredRules.length : 0
  const genericCoverage = genericKeywordCoverage(jd, resumeCorpus)
  const resumeRichness = Math.min(1, resumeCorpus.length / 3200)
  const score = clampScore(Math.round(skillCoverage * 62 + genericCoverage * 23 + resumeRichness * 15))
  const level = score >= 78 ? 'high' : score >= 55 ? 'medium' : 'low'
  const summary = buildSummary(score, matchedKeywords.length, requiredRules.length, missingKeywords.length)

  return {
    score,
    level,
    summary,
    matchedKeywords: matchedKeywords.slice(0, 12),
    missingKeywords: missingKeywords.slice(0, 10),
    extraJdKeywords,
    resumeWarnings,
    sectionScores: [
      {
        label: '能力关键词覆盖',
        score: clampScore(Math.round(skillCoverage * 100)),
        hint: `${matchedKeywords.length}/${requiredRules.length || 0} 个 JD 核心能力在简历中有证据`
      },
      {
        label: 'JD 原文关键词',
        score: clampScore(Math.round(genericCoverage * 100)),
        hint: '按 JD 高频词和简历文本重合度估算'
      },
      {
        label: '简历材料充分度',
        score: clampScore(Math.round(resumeRichness * 100)),
        hint: resumeCorpus.length >= 3200 ? '材料较充分' : '材料偏少，建议补项目细节和结果证据'
      }
    ]
  }
}

function skill(label: string, category: string, aliases: string[], advice: string): SkillRule {
  return { label, category, aliases, advice }
}

function buildResumeSections(resume: ResumeProfile): ResumeSection[] {
  return [
    { label: '正式简历', text: resume.formalResume },
    { label: '万字简历', text: resume.detailedResume },
    ...(resume.otherResumes || []).map((item) => ({
      label: item.title || item.file?.name || '其他材料',
      text: item.text
    }))
  ].filter((section) => section.text?.trim())
}

function matchedSourceLabels(rule: SkillRule, sections: ResumeSection[]): string[] {
  return sections
    .filter((section) => includesAnyAlias(normalizeText(section.text), rule.aliases))
    .map((section) => section.label)
    .slice(0, 4)
}

function includesAnyAlias(text: string, aliases: string[]): boolean {
  return aliases.some((alias) => text.includes(normalizeText(alias)))
}

function inferRulesFromResumeTarget(resume: ResumeProfile): SkillRule[] {
  const targetText = normalizeText(`${resume.targetRole} ${resume.profileName} ${resume.candidateName}`)
  const targetRules = skillRules.filter((rule) => includesAnyAlias(targetText, rule.aliases) || targetText.includes(normalizeText(rule.category)))

  return targetRules.length > 0 ? targetRules.slice(0, 8) : skillRules.slice(0, 8)
}

function extractJdKeywords(jd: string): string[] {
  const normalized = normalizeText(jd)
  const words = normalized.match(/[a-z0-9+#./-]{2,24}|[\u4e00-\u9fa5]{2,12}/g) ?? []
  const stopWords = new Set([
    '岗位',
    '职责',
    '要求',
    '能力',
    '经验',
    '相关',
    '负责',
    '熟悉',
    '具备',
    '优先',
    '以及',
    '进行',
    '能够',
    '使用',
    '项目',
    '工作',
    '简历',
    '候选人'
  ])
  const counts = new Map<string, number>()

  words.forEach((word) => {
    if (word.length < 2 || stopWords.has(word)) {
      return
    }

    counts.set(word, (counts.get(word) || 0) + 1)
  })

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([word]) => word)
    .slice(0, 18)
}

function genericKeywordCoverage(jd: string, resumeCorpus: string): number {
  const keywords = extractJdKeywords(jd)

  if (keywords.length === 0) {
    return 0
  }

  const matchedCount = keywords.filter((keyword) => resumeCorpus.includes(normalizeText(keyword))).length
  return matchedCount / keywords.length
}

function buildResumeWarnings(resume: ResumeProfile, resumeCorpus: string): string[] {
  const warnings: string[] = []

  if (!resume.formalResume.trim()) {
    warnings.push('正式简历为空，匹配评分会偏低。')
  }

  if (!resume.detailedResume.trim()) {
    warnings.push('万字简历为空，AI 缺少深挖项目细节。')
  }

  if ((resume.otherResumes || []).length === 0) {
    warnings.push('其他补充材料为空，建议把项目复盘、截图说明或数据结果补进去。')
  }

  if (resumeCorpus.length < 900) {
    warnings.push('当前简历材料整体偏少，建议补充项目背景、个人动作、指标结果和复盘。')
  }

  return warnings.slice(0, 4)
}

function buildSummary(score: number, matchedCount: number, requiredCount: number, missingCount: number): string {
  if (requiredCount === 0) {
    return '当前 JD 关键词较少，建议先粘贴目标公司的完整招聘要求。'
  }

  if (score >= 78) {
    return `匹配度不错，${matchedCount}/${requiredCount} 个核心能力有简历证据。下一步重点把证据讲自然。`
  }

  if (score >= 55) {
    return `有一定匹配基础，但还有 ${missingCount} 个 JD 能力缺少明确证据，建议补充项目细节。`
  }

  return `当前匹配偏弱，JD 要求和简历证据重合不高。建议先补材料，再做模拟面试。`
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '')
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value))
}
