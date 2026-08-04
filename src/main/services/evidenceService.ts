import { analyzeQuestionIntent } from '../../shared/questionIntent'
import { roleJdForMode } from '../../shared/roleJdTemplates'
import type { AppSettings, EvidenceSnippet } from '../../shared/types'

type ResumeChunk = EvidenceSnippet & {
  chunkIndex: number
}

type SignalSet = {
  tokens: Set<string>
  phrases: Set<string>
  topics: Set<string>
  bigrams: Set<string>
}

type QueryBundle = {
  question: SignalSet
  role: SignalSet
  jd: SignalSet
  intent: SignalSet
  normalizedQuestion: string
  intentCategory: ReturnType<typeof analyzeQuestionIntent>['category']
}

type SkillTopic = {
  label: string
  terms: string[]
}

const sourceBoost: Record<EvidenceSnippet['source'], number> = {
  formal: 3,
  detailed: 2,
  extra: 1.5,
}

const skillTopics: SkillTopic[] = [
  topic('数据分析', '指标', '口径', 'SQL', '取数', '看板', 'BI', '报表', '经营分析', '业务分析', '归因', '漏斗分析', '留存', '转化'),
  topic('建模算法', '建模', '模型', '回归', '分类', '聚类', '预测', '特征', '机器学习', 'sklearn', 'AUC', '召回率', '准确率', '画像', 'LTV', 'RFM'),
  topic('实验评估', 'A/B', 'AB实验', '实验', '显著性', '假设检验', '样本量', '置信', '效果评估'),
  topic('AI产品', 'AI', '大模型', 'LLM', 'Prompt', 'RAG', 'Agent', '知识库', '向量', 'Embedding', '模型评测', '幻觉', '工作流'),
  topic('后端工程', '接口', 'API', '数据库', '缓存', '消息队列', '并发', '分布式', '微服务', '事务', '一致性', '性能', '监控'),
  topic('前端工程', 'React', 'Vue', 'TypeScript', '组件', '状态管理', '性能优化', '工程化', '可视化', '低代码', 'B端'),
  topic('全栈交付', '全栈', 'Node', 'Electron', 'Docker', 'CI/CD', '部署', '云服务', '端到端', '上线', '交付'),
  topic('业务协作', '业务', '用户', '增长', '转化', '沟通', '跨部门', '推进', '落地', '复盘', '结果'),
]

export function evidenceSourceLabel(item: EvidenceSnippet): string {
  if (item.sourceLabel) {
    return item.sourceLabel
  }

  if (item.source === 'formal') {
    return '正式简历'
  }

  if (item.source === 'detailed') {
    return '万字简历'
  }

  return '其他简历'
}

export function findEvidence(question: string, settings: AppSettings): EvidenceSnippet[] {
  const query = buildQueryBundle(question, settings)
  const chunks = buildResumeChunks(settings)

  if (chunks.length === 0) {
    return []
  }

  const scored = chunks
    .map((chunk) => scoreChunk(chunk, query))
    .filter((chunk) => chunk.score >= 2)
    .sort((left, right) => right.score - left.score)

  return diversify(scored, 6).map(({ chunkIndex: _chunkIndex, ...snippet }) => snippet)
}

function buildQueryBundle(question: string, settings: AppSettings): QueryBundle {
  const normalizedQuestion = normalizeQuestionText(question)
  const intent = analyzeQuestionIntent(normalizedQuestion)
  const roleJd = roleJdForMode(settings.answer.interviewMode, settings.answer.roleJdTemplates)
  const intentText = [
    intent.label,
    intent.summary,
    intent.answerHint,
    ...intent.searchHints,
    ...buildIntentAliases(normalizedQuestion, intent.category)
  ].filter(Boolean).join(' ')

  return {
    question: buildSignals(normalizedQuestion),
    role: buildSignals(settings.resume.targetRole || ''),
    jd: buildSignals(roleJd),
    intent: buildSignals(intentText),
    normalizedQuestion,
    intentCategory: intent.category,
  }
}

function buildResumeChunks(settings: AppSettings): ResumeChunk[] {
  return [
    ...splitResumeText(settings.resume.formalResume, 'formal'),
    ...splitResumeText(settings.resume.detailedResume, 'detailed'),
    ...(settings.resume.otherResumes ?? []).flatMap((item) => splitResumeText(item.text, 'extra', item.title || item.file.name)),
  ]
}

function splitResumeText(text: string, source: EvidenceSnippet['source'], sourceLabel?: string): ResumeChunk[] {
  const paragraphs = text
    .split(/\n{2,}|(?<=[。！？；])\s*/g)
    .map((item) => normalizeWhitespace(item))
    .filter((item) => item.length > 16)
    .slice(0, 260)

  const chunks: string[] = []

  for (let index = 0; index < paragraphs.length; index += 1) {
    const current = paragraphs[index]
    const next = paragraphs[index + 1]

    chunks.push(current)

    if (current.length < 90 && next && next.length < 120) {
      chunks.push(`${current} ${next}`)
    }
  }

  return uniqueTexts(chunks)
    .slice(0, 320)
    .map((item, index) => ({
      source,
      sourceLabel,
      text: item,
      score: 0,
      chunkIndex: index,
    }))
}

function scoreChunk(chunk: ResumeChunk, query: QueryBundle): ResumeChunk {
  const chunkSignals = buildSignals(chunk.text)
  const questionTokenScore = weightedOverlap(query.question.tokens, chunkSignals.tokens) * 1.9
  const questionPhraseScore = weightedOverlap(query.question.phrases, chunkSignals.phrases) * 2.2
  const questionTopicScore = weightedOverlap(query.question.topics, chunkSignals.topics) * 2.9
  const questionBigramScore = weightedOverlap(query.question.bigrams, chunkSignals.bigrams) * 0.45

  const roleScore = weightedOverlap(query.role.tokens, chunkSignals.tokens) * 0.7
  const jdScore = weightedOverlap(query.jd.tokens, chunkSignals.tokens) * 0.85 + weightedOverlap(query.jd.phrases, chunkSignals.phrases) * 0.7
  const intentScore = weightedOverlap(query.intent.tokens, chunkSignals.tokens) * 1.35 + weightedOverlap(query.intent.phrases, chunkSignals.phrases) * 1.05
  const intentSpecificScore = scoreIntentSpecificMatch(chunk.text, query)
  const sourceScore = sourceBoost[chunk.source]
  const densityScore = Math.min(2.5, chunkSignals.tokens.size / 20)

  const score =
    questionTokenScore +
    questionPhraseScore +
    questionTopicScore +
    questionBigramScore +
    roleScore +
    jdScore +
    intentScore +
    intentSpecificScore +
    sourceScore +
    densityScore

  return {
    ...chunk,
    score: Math.round(score * 10) / 10,
  }
}

function scoreIntentSpecificMatch(text: string, query: QueryBundle): number {
  const normalizedText = normalizeQuestionText(text)
  let score = 0

  if (query.intentCategory === 'location' || query.intentCategory === 'company' || query.intentCategory === 'time') {
    const asksFirstCompany = /第一家公司|第一个公司|第一份工作|第一段工作|最早一家公司/.test(query.normalizedQuestion)
    const asksRecentCompany = /上家公司|上一家公司|最近一家公司|最后一家公司/.test(query.normalizedQuestion)

    if (looksLikeWorkExperienceLine(normalizedText)) {
      score += 4.2
    }

    if (asksFirstCompany && looksLikeWorkExperienceLine(normalizedText)) {
      score += looksLikeEarlyWorkLine(normalizedText) ? 6.2 : 2.2
    }

    if (asksRecentCompany && looksLikeWorkExperienceLine(normalizedText)) {
      score += looksLikeRecentWorkLine(normalizedText) ? 7.4 : -2.4
    }

    if (/地址|地点|城市|在哪|哪里|哪儿/.test(query.normalizedQuestion) && /省|市|区|县|郑州|许昌|北京|上海|广州|深圳|杭州|南京|成都|武汉|西安|苏州|义乌|东莞/.test(normalizedText)) {
      score += 3.8
    }
  }

  if (query.intentCategory === 'project') {
    if (/项目|模型|体系|实验|平台|系统|看板|分析|预测|分层|选品|转化率|roi|roas|acos|rfm|a\/b|ab/.test(normalizedText)) {
      score += 3.4
    }

    score += scoreExactProjectTermMatch(normalizedText, query.normalizedQuestion)

    if (/印象最深|最深刻|最核心|代表性/.test(query.normalizedQuestion) && /结果|提升|降低|优化|落地|复盘|模型|实验/.test(normalizedText)) {
      score += 2.4
    }
  }

  if (query.intentCategory === 'responsibility' && /负责|职责|日常|工作内容|主导|参与|对接|搭建|维护/.test(normalizedText)) {
    score += 3
  }

  if (query.intentCategory === 'achievement' && /提升|降低|增长|优化|节省|准确率|转化率|roi|roas|acos|auc|%|％|\d/.test(normalizedText)) {
    score += 3.2
  }

  if (query.intentCategory === 'process' && /怎么|流程|方法|步骤|方案|sql|python|模型|特征|指标|口径|实验|验证|归因/.test(normalizedText)) {
    score += 2.8
    score += scoreExactProjectTermMatch(normalizedText, query.normalizedQuestion)
  }

  return score
}

function scoreExactProjectTermMatch(text: string, question: string): number {
  const exactTerms = ['rfm', 'ltv', 'roi', 'roas', 'acos', 'a/b', 'ab实验', '漏斗', '转化漏斗', '用户分层', '复购率', 'sql', 'python', '看板']
  let score = 0

  for (const term of exactTerms) {
    if (question.includes(term) && text.includes(term)) {
      score += term.length >= 3 ? 3.2 : 2.2
    }
  }

  return Math.min(score, 8)
}

function buildSignals(text: string): SignalSet {
  const normalized = normalizeWhitespace(text).toLowerCase()
  const compact = normalized.replace(/\s+/g, '')
  const rawTokens = normalized.match(/[a-z0-9+#./-]+|[\u4e00-\u9fa5]{2,}/g) ?? []
  const tokens = new Set(rawTokens.filter((token) => token.length >= 2 && !stopWords.has(token)))
  const phrases = extractPhrases(normalized)
  const bigrams = extractBigrams(compact)
  const topicsFound = new Set<string>()

  skillTopics.forEach((skillTopic) => {
    if (skillTopic.terms.some((term) => normalized.includes(term.toLowerCase()))) {
      topicsFound.add(skillTopic.label)
      skillTopic.terms.forEach((term) => {
        if (normalized.includes(term.toLowerCase())) {
          tokens.add(term.toLowerCase())
        }
      })
    }
  })

  return { tokens, phrases, topics: topicsFound, bigrams }
}

function extractPhrases(text: string): Set<string> {
  const phrases = new Set<string>()
  const matches = text.match(/[\u4e00-\u9fa5a-z0-9+#./-]{3,24}/gi) ?? []

  matches.forEach((match) => {
    const value = match.trim().toLowerCase()
    if (value.length >= 3 && !stopWords.has(value)) {
      phrases.add(value)
    }
  })

  return phrases
}

function extractBigrams(text: string): Set<string> {
  const characters = Array.from(text.replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, ''))
  const bigrams = new Set<string>()

  for (let index = 0; index < characters.length - 1; index += 1) {
    const bigram = `${characters[index]}${characters[index + 1]}`
    if (bigram.length >= 2 && !stopWords.has(bigram)) {
      bigrams.add(bigram)
    }
    if (bigrams.size >= 180) {
      break
    }
  }

  return bigrams
}

function weightedOverlap(left: Set<string>, right: Set<string>): number {
  let score = 0

  left.forEach((item) => {
    if (right.has(item)) {
      score += item.length >= 4 ? 2 : 1
    }
  })

  return score
}

function diversify(chunks: ResumeChunk[], limit: number): ResumeChunk[] {
  const selected: ResumeChunk[] = []
  const seenTexts = new Set<string>()
  const selectedTexts: string[] = []
  const sourceCounts = new Map<string, number>()

  for (const chunk of chunks) {
    const normalizedText = normalizeWhitespace(chunk.text)
    const fingerprint = normalizedText.slice(0, 80)
    const sourceKey = evidenceSourceLabel(chunk)
    const currentSourceCount = sourceCounts.get(sourceKey) || 0

    if (seenTexts.has(fingerprint) || currentSourceCount >= 3 || isNearDuplicate(normalizedText, selectedTexts)) {
      continue
    }

    selected.push(chunk)
    seenTexts.add(fingerprint)
    selectedTexts.push(normalizedText)
    sourceCounts.set(sourceKey, currentSourceCount + 1)

    if (selected.length >= limit) {
      break
    }
  }

  return selected.length > 0 ? selected : chunks.slice(0, limit)
}

function isNearDuplicate(text: string, selectedTexts: string[]): boolean {
  const compact = text.replace(/\s+/g, '')

  return selectedTexts.some((selectedText) => {
    const selectedCompact = selectedText.replace(/\s+/g, '')

    if (compact.includes(selectedCompact) || selectedCompact.includes(compact)) {
      return Math.min(compact.length, selectedCompact.length) >= 40
    }

    const shorter = compact.length < selectedCompact.length ? compact : selectedCompact
    const longer = compact.length < selectedCompact.length ? selectedCompact : compact

    return shorter.length >= 60 && longer.includes(shorter.slice(0, Math.floor(shorter.length * 0.78)))
  })
}

function topic(label: string, ...terms: string[]): SkillTopic {
  return { label, terms }
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function normalizeQuestionText(text: string): string {
  return normalizeWhitespace(text)
    .replace(/低价公司|地家公司|第家公司|第一家公司司/g, '第一家公司')
    .replace(/低一个公司|第一个公/g, '第一个公司')
    .toLowerCase()
}

function buildIntentAliases(question: string, category: ReturnType<typeof analyzeQuestionIntent>['category']): string[] {
  const aliases: string[] = []

  if (category === 'location' || category === 'company' || category === 'time') {
    aliases.push('工作经历', '公司', '任职', '就职', '时间', '城市', '地点', '地址')
  }

  if (/第一家公司|第一个公司|第一份工作|第一段工作|最早一家公司/.test(question)) {
    aliases.push('第一家公司', '第一份工作', '最早工作', '工作经历', '任职公司')
  }

  if (/上家公司|上一家公司|最近一家公司|最后一家公司/.test(question)) {
    aliases.push('上家公司', '最近工作', '最近公司', '工作经历', '任职公司')
  }

  if (category === 'project') {
    aliases.push('项目描述', '项目经历', '项目背景', '项目结果', '模型', '体系', '实验', '复盘')
  }

  return aliases
}

function looksLikeWorkExperienceLine(text: string): boolean {
  return /公司|科技|集团|有限公司|工作经历|任职|就职/.test(text) && /20\d{2}|19\d{2}|数据分析师|工程师|产品经理|运营|开发/.test(text)
}

function looksLikeEarlyWorkLine(text: string): boolean {
  return looksLikeWorkExperienceLine(text) && /200\d|201\d|第一|最早|起始/.test(text)
}

function looksLikeRecentWorkLine(text: string): boolean {
  return looksLikeWorkExperienceLine(text) && /202[4-9]|至今|现在|当前|最近/.test(text)
}

function uniqueTexts(values: string[]): string[] {
  return Array.from(new Set(values.map(normalizeWhitespace))).filter(Boolean)
}

const stopWords = new Set([
  '一个',
  '这个',
  '那个',
  '我们',
  '你们',
  '他们',
  '以及',
  '进行',
  '负责',
  '相关',
  '岗位',
  '要求',
  '能力',
  '项目',
  '问题',
  '回答',
  '面试',
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
])
