/**
 * 面试预热缓存服务
 * 按 (候选人ID + 目标岗位 + 回答风格) 分组缓存预生成答案
 */

import type { CompletedAnswer } from '../../shared/types'

export interface CachedAnswer {
  question: string
  answer: string
  at: number
  provider?: CompletedAnswer['provider']
}

const GENERAL_WARMUP_QUESTIONS = [
  '请简单介绍一下你自己。',
  '你最近一次工作的主要职责是什么？',
  '你最有成就感的一个项目是什么？',
  '你在项目里主要负责了哪些部分？',
  '如果项目目标和资源冲突，你会怎么处理？',
  '你平时是怎么和业务方沟通需求的？',
  '你遇到过最难推进的一件事是什么？',
  '你是怎么处理跨部门协作冲突的？',
  '你如何判断一个方案值不值得做？',
  '你平时会关注哪些核心指标？',
  '你如何发现业务中的异常波动？',
  '你是怎么验证一个分析结论可靠性的？',
  '如果让你从零开始做一个项目，你会先做什么？',
  '你如何快速熟悉一个新的业务场景？',
  '你最近学到的新知识是什么？',
  '你怎么看待加班和工作节奏？',
  '你对团队协作有什么看法？',
  '你遇到过判断失误吗？后来怎么修正的？',
  '你如何向非技术同学解释复杂问题？',
  '你为什么想来这家公司？'
]

interface WarmupCacheData {
  resumeId: string
  targetRole: string
  answerStyle: string
  answers: CachedAnswer[]
  generatedAt: number
}

const STORAGE_PREFIX = 'huomiantong.warmup.v1.'

function cacheKey(resumeId: string, targetRole: string, answerStyle: string): string {
  const raw = resumeId + '|' + targetRole + '|' + answerStyle
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return STORAGE_PREFIX + Math.abs(hash).toString(36)
}

export function loadWarmupCache(resumeId: string, targetRole: string, answerStyle: string): WarmupCacheData | null {
  try {
    const raw = localStorage.getItem(cacheKey(resumeId, targetRole, answerStyle))
    if (!raw) return null
    return JSON.parse(raw) as WarmupCacheData
  } catch {
    return null
  }
}

export function saveWarmupCache(
  resumeId: string,
  targetRole: string,
  answerStyle: string,
  answers: CachedAnswer[]
): void {
  const data: WarmupCacheData = {
    resumeId,
    targetRole,
    answerStyle,
    answers,
    generatedAt: Date.now()
  }
  try {
    localStorage.setItem(cacheKey(resumeId, targetRole, answerStyle), JSON.stringify(data))
  } catch {
    // localStorage full, fail silently
  }
}

export function clearWarmupCache(resumeId: string, targetRole: string, answerStyle: string): void {
  try {
    localStorage.removeItem(cacheKey(resumeId, targetRole, answerStyle))
  } catch { }
}

/**
 * Jaccard similarity between two strings (word-set based)
 */
function tokenizeQuestion(value: string): Set<string> {
  const normalized = value.toLowerCase().replace(/[^\w\u4e00-\u9fff]/g, ' ')
  const tokens = normalized.split(/\s+/).filter(Boolean)
  const chineseChars = normalized.match(/[\u4e00-\u9fff]/g) ?? []

  for (let i = 0; i < chineseChars.length - 1; i++) {
    tokens.push(chineseChars.slice(i, i + 2).join(''))
  }

  for (let i = 0; i < chineseChars.length - 2; i++) {
    tokens.push(chineseChars.slice(i, i + 3).join(''))
  }

  return new Set(tokens)
}

function detectQuestionIntent(value: string): string | null {
  const normalized = value.toLowerCase().replace(/\s+/g, '')
  const matches = (pattern: RegExp): boolean => pattern.test(normalized)

  if (matches(/自我介绍|介绍.{0,4}(你|自己)|说.{0,4}(你|自己)/)) return 'self-introduction'
  if (matches(/缺失(?:值)?|异常(?:值)?|数据清洗|脏数据/)) return 'data-cleaning'
  if (matches(/窗口函数|row_number|rank|dense_rank/)) return 'sql-window'
  if (matches(/ab测试|a\/b测试|显著性|实验设计/)) return 'ab-testing'
  if (matches(/辛普森|辛普森悖论/)) return 'simpson-paradox'
  if (matches(/指标体系|指标口径|北极星指标/)) return 'metrics'
  if (matches(/归因分析|归因/)) return 'attribution'
  if (matches(/相关性|高度相关/)) return 'correlation'
  if (matches(/模型性能|模型评估|机器学习模型/)) return 'model-evaluation'
  if (matches(/产品需求|需求优先级|需求排序/)) return 'product-prioritization'
  if (matches(/用户调研|用户研究|访谈调研/)) return 'user-research'
  if (matches(/mvp|最小可行/)) return 'mvp'
  if (matches(/竞品分析|竞争分析/)) return 'competitive-analysis'
  if (matches(/跨部门|跨团队|团队协作/)) return 'cross-team-collaboration'
  if (
    matches(/项目|经历|案例/) &&
    matches(/最满意|印象.{0,2}深|代表|成功|难忘|亮点/)
  ) {
    return 'project-highlight'
  }

  return null
}

export function calculateQuestionSimilarity(a: string, b: string): number {
  const intentA = detectQuestionIntent(a)
  const intentB = detectQuestionIntent(b)
  if (intentA && intentA === intentB) return 0.96

  const setA = tokenizeQuestion(a)
  const setB = tokenizeQuestion(b)

  if (setA.size === 0 && setB.size === 0) return 0

  let intersection = 0
  for (const word of setA) {
    if (setB.has(word)) intersection++
  }

  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

/**
 * Find similar question in cached answers
 * @returns best match with similarity >= threshold
 */
export function findSimilarInCache(
  cache: WarmupCacheData,
  question: string,
  threshold = 0.45
): CachedAnswer | null {
  let best: CachedAnswer | null = null
  let bestScore = 0

  for (const entry of cache.answers) {
    const score = calculateQuestionSimilarity(entry.question, question)
    if (score > bestScore) {
      bestScore = score
      best = entry
    }
  }

  return bestScore >= threshold ? best : null
}

/**
 * Get common interview questions by role
 */
export function getCommonQuestions(targetRole: string): string[] {
  const role = targetRole.toLowerCase()

  if (role.includes('\u6570\u636e') || role.includes('\u5206\u6790') || role.includes('data')) {
    return [
      '\u8bf7\u7b80\u5355\u4ecb\u7ecd\u4e00\u4e0b\u4f60\u81ea\u5df1\u3002',
      '\u4f60\u505a\u8fc7\u6700\u6ee1\u610f\u7684\u6570\u636e\u5206\u6790\u9879\u76ee\u662f\u4ec0\u4e48\uff1f',
      '\u4f60\u5982\u4f55\u5904\u7406\u7f3a\u5931\u503c\u548c\u5f02\u5e38\u503c\uff1f',
      'AB \u6d4b\u8bd5\u7684\u7edf\u8ba1\u5b66\u539f\u7406\u662f\u4ec0\u4e48\uff1f\u9700\u8981\u6ce8\u610f\u54ea\u4e9b\u9677\u9631\uff1f',
      '\u4f60\u5e38\u7528\u7684\u6570\u636e\u5206\u6790\u5de5\u5177\u6709\u54ea\u4e9b\uff1f\u5b83\u4eec\u7684\u4f18\u7f3a\u70b9\u662f\u4ec0\u4e48\uff1f',
      'SQL \u7a97\u53e3\u51fd\u6570\u6709\u54ea\u4e9b\u5e38\u89c1\u7528\u6cd5\uff1f',
      '\u4f60\u5982\u4f55\u5411\u975e\u6280\u672f\u4eba\u5458\u89e3\u91ca\u590d\u6742\u7684\u5206\u6790\u7ed3\u679c\uff1f',
      '\u63cf\u8ff0\u4e00\u6b21\u4f60\u901a\u8fc7\u6570\u636e\u63a8\u52a8\u4e1a\u52a1\u51b3\u7b56\u7684\u7ecf\u5386\u3002',
      '\u4ec0\u4e48\u662f\u8f9b\u666e\u68ee\u60a9\u8bba\uff1f\u5b9e\u9645\u5de5\u4f5c\u4e2d\u5982\u4f55\u907f\u514d\uff1f',
      '\u4f60\u5982\u4f55\u8bc4\u4f30\u4e00\u4e2a\u673a\u5668\u5b66\u4e60\u6a21\u578b\u7684\u6027\u80fd\uff1f',
      '\u63cf\u8ff0\u4e00\u6b21\u4f60\u53d1\u73b0\u6570\u636e\u8d28\u91cf\u95ee\u9898\u5e76\u63a8\u52a8\u89e3\u51b3\u7684\u7ecf\u5386\u3002',
      '\u4f60\u5982\u4f55\u8bbe\u8ba1\u4e00\u4e2a\u6570\u636e\u6307\u6807\u4f53\u7cfb\uff1f',
      '\u8bb2\u8bb2\u4f60\u5bf9\u5f52\u56e0\u5206\u6790\u7684\u7406\u89e3\u3002',
      '\u4ec0\u4e48\u662f\u6700\u5927\u4f3c\u7136\u4f30\u8ba1\uff1f\u5b83\u7684\u5e94\u7528\u573a\u666f\u6709\u54ea\u4e9b\uff1f',
      '\u5982\u679c\u4f60\u53d1\u73b0\u4e24\u4e2a\u6307\u6807\u9ad8\u5ea6\u76f8\u5173\uff0c\u4f60\u4f1a\u600e\u4e48\u5206\u6790\uff1f',
    ]
  }

  if (role.includes('\u4ea7\u54c1') || role.includes('pm') || role.includes('product')) {
    return [
      '\u8bf7\u7b80\u5355\u4ecb\u7ecd\u4e00\u4e0b\u4f60\u81ea\u5df1\u3002',
      '\u4f60\u505a\u8fc7\u6700\u6210\u529f\u7684\u4ea7\u54c1\u529f\u80fd\u662f\u4ec0\u4e48\uff1f',
      '\u5982\u4f55\u786e\u5b9a\u4ea7\u54c1\u9700\u6c42\u7684\u4f18\u5148\u7ea7\uff1f',
      '\u4f60\u5982\u4f55\u8fdb\u884c\u7528\u6237\u8c03\u7814\uff1f',
      '\u63cf\u8ff0\u4e00\u6b21\u4f60\u901a\u8fc7\u6570\u636e\u5206\u6790\u9a71\u52a8\u4ea7\u54c1\u51b3\u7b56\u7684\u7ecf\u5386\u3002',
      '\u4f60\u5982\u4f55\u8861\u91cf\u4ea7\u54c1\u529f\u80fd\u7684\u4e0a\u7ebf\u6548\u679c\uff1f',
      '\u4ec0\u4e48\u662f MVP\uff1f\u4f60\u5982\u4f55\u5b9a\u4e49\u4ea7\u54c1\u7684\u6838\u5fc3\u529f\u80fd\uff1f',
      '\u4f60\u5982\u4f55\u4e0e\u8bbe\u8ba1\u3001\u5f00\u53d1\u56e2\u961f\u534f\u4f5c\uff1f',
      '\u4f60\u5982\u4f55\u8fdb\u884c\u7ade\u54c1\u5206\u6790\uff1f',
      '\u63cf\u8ff0\u4e00\u6b21\u4f60\u5904\u7406\u7528\u6237\u53cd\u9988\u5e76\u6539\u8fdb\u4ea7\u54c1\u7684\u7ecf\u5386\u3002',
      '\u4f60\u5982\u4f55\u770b\u5f85 AI \u4ea7\u54c1\u7ecf\u7406\u4e0e\u4f20\u7edf\u4ea7\u54c1\u7ecf\u7406\u7684\u533a\u522b\uff1f',
      '\u8bf7\u8bbe\u8ba1\u4e00\u4e2a\u4f60\u6700\u8fd1\u4f7f\u7528\u7684\u4ea7\u54c1\u7684\u6539\u8fdb\u65b9\u6848\u3002',
      '\u4f60\u5982\u4f55\u505a\u4ea7\u54c1\u7684\u5317\u6781\u661f\u6307\u6807\u62c6\u89e3\uff1f',
      '\u4f60\u6709\u8fc7\u63a8\u52a8\u8de8\u90e8\u95e8\u534f\u4f5c\u7684\u9879\u76ee\u5417\uff1f',
      '\u4f60\u5982\u4f55\u5e73\u8861\u9700\u6c42\u8d28\u91cf\u548c\u4ea4\u4ed8\u901f\u5ea6\uff1f',
    ]
  }

  return [
    '\u8bf7\u7b80\u5355\u4ecb\u7ecd\u4e00\u4e0b\u4f60\u81ea\u5df1\u3002',
    '\u4f60\u6700\u5927\u7684\u804c\u4e1a\u4f18\u52bf\u662f\u4ec0\u4e48\uff1f',
    '\u4f60\u5982\u4f55\u770b\u5f85\u81ea\u5df1\u7684\u804c\u4e1a\u89c4\u5212\uff1f',
    '\u63cf\u8ff0\u4e00\u6b21\u4f60\u89e3\u51b3\u590d\u6742\u95ee\u9898\u7684\u7ecf\u5386\u3002',
    '\u4f60\u5982\u4f55\u5904\u7406\u5de5\u4f5c\u538b\u529b\uff1f',
    '\u4f60\u8fc7\u53bb\u7684\u5de5\u4f5c\u4e2d\u9047\u5230\u8fc7\u6700\u5927\u7684\u6311\u6218\u662f\u4ec0\u4e48\uff1f',
    '\u4f60\u5982\u4f55\u5b66\u4e60\u65b0\u6280\u672f\u6216\u65b0\u77e5\u8bc6\uff1f',
    '\u4f60\u7406\u60f3\u7684\u5de5\u4f5c\u73af\u5883\u662f\u4ec0\u4e48\u6837\u7684\uff1f',
    '\u63cf\u8ff0\u4e00\u6b21\u56e2\u961f\u5408\u4f5c\u4e2d\u51fa\u73b0\u5206\u6b67\u7684\u7ecf\u5386\u3002',
    '\u4f60\u4e3a\u4ec0\u4e48\u79bb\u5f00\u4e0a\u4e00\u5bb6\u516c\u53f8\uff1f',
    '\u4f60\u5982\u4f55\u8bc4\u4ef7\u81ea\u5df1\u7684\u6c9f\u901a\u80fd\u529b\uff1f',
    '\u4f60\u6700\u8fd1\u5728\u8bfb\u4ec0\u4e48\u4e66\u6216\u5b66\u4e60\u4ec0\u4e48\u6280\u80fd\uff1f',
    '\u4f60\u5bf9\u8fd9\u4e2a\u5c97\u4f4d\u7684\u7406\u89e3\u662f\u4ec0\u4e48\uff1f',
    '\u4f60\u7684\u671f\u671b\u85aa\u8d44\u662f\u591a\u5c11\uff1f',
    '\u4f60\u6709\u4ec0\u4e48\u95ee\u9898\u60f3\u95ee\u6211\uff1f',
  ]
}

const WARMUP_QUESTION_VARIANTS = [
  (question: string) => question,
  (question: string) => `如果面试官继续追问这题，你会怎么补充：${question}`,
  (question: string) => `请把这题回答得更具体一点：${question}`,
  (question: string) => `请用更口语化的方式再回答一遍：${question}`,
  (question: string) => `如果要把这题讲得更稳一点，你会怎么说：${question}`
]

export function getWarmupQuestions(targetRole: string, count: number): string[] {
  const baseQuestions = [...getCommonQuestions(targetRole), ...GENERAL_WARMUP_QUESTIONS]
  const expanded = baseQuestions.flatMap((question) => WARMUP_QUESTION_VARIANTS.map((variant) => variant(question)))
  const uniqueQuestions = [...new Set(expanded)]

  if (count <= uniqueQuestions.length) {
    return uniqueQuestions.slice(0, count)
  }

  const result: string[] = [...uniqueQuestions]
  while (result.length < count) {
    result.push(uniqueQuestions[result.length % uniqueQuestions.length])
  }

  return result.slice(0, count)
}
