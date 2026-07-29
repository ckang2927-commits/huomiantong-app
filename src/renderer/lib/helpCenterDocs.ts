import { generatedHelpDocCount, generatedHelpDocs } from './generatedHelpDocs'

export type HelpDoc = {
  id: string
  title: string
  category: string
  path: string
  summary: string
  keywords: string[]
  suggestedQuestions: string[]
  searchText?: string
}

export type HelpSearchResult = HelpDoc & {
  score: number
  matchedBy: string[]
  snippet: string
  primaryMatch: string
}

export const helpDocs: HelpDoc[] = generatedHelpDocs
export const helpDocCount = generatedHelpDocCount

const normalize = (value: string): string => value.toLowerCase().replace(/\s+/g, '')

const splitQuery = (query: string): string[] =>
  query
    .toLowerCase()
    .split(/[\s,，。.!！?？:：;；/\\|()[\]{}"'“”‘’、-]+/)
    .map((item) => item.trim())
    .filter(Boolean)

const uniqueTerms = (query: string): string[] =>
  Array.from(new Set([query.trim(), ...splitQuery(query)].filter((item) => item.length >= 2))).slice(0, 8)

function addMatch(matchedBy: Set<string>, label: string): void {
  if (label) {
    matchedBy.add(label)
  }
}

function buildSnippet(doc: HelpDoc, query: string): string {
  const fallback = doc.summary || doc.searchText || doc.title
  const source = (doc.searchText || fallback).replace(/\s+/g, ' ').trim()
  const terms = uniqueTerms(query)

  if (!source || terms.length === 0) {
    return fallback.slice(0, 120)
  }

  const lowerSource = source.toLowerCase()
  const matchedTerm = terms.find((term) => lowerSource.includes(term.toLowerCase()))

  if (!matchedTerm) {
    return fallback.slice(0, 120)
  }

  const index = lowerSource.indexOf(matchedTerm.toLowerCase())
  const start = Math.max(0, index - 42)
  const end = Math.min(source.length, index + matchedTerm.length + 86)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < source.length ? '…' : ''

  return `${prefix}${source.slice(start, end)}${suffix}`
}

function getIntentBoost(doc: HelpDoc, query: string, matchedBy: Set<string>): number {
  const title = doc.title.toLowerCase()
  const category = doc.category.toLowerCase()
  const path = doc.path.toLowerCase()
  const summary = doc.summary.toLowerCase()
  let boost = 0

  if (/(语音|转写|麦克风|话筒|电脑音频|系统音频|deepgram|声音|听不到)/i.test(query)) {
    if (/audio|manual-test-audio/.test(path)) {
      boost += 180
      addMatch(matchedBy, '场景：语音转写')
    } else if (/(语音|转写|麦克风|电脑音频|deepgram)/i.test(category) || /(语音|转写|麦克风|电脑音频|deepgram|audio)/i.test(title)) {
      boost += 110
      addMatch(matchedBy, '场景：语音转写')
    } else if (/(语音|转写|麦克风|电脑音频|deepgram)/i.test(summary)) {
      boost += 25
      addMatch(matchedBy, '场景：语音转写')
    }
  }

  if (/(api|key|401|402|403|404|429|模型|deepseek|openai|anthropic|qwen|阿里|通义)/i.test(query)) {
    if (/(api|model|provider|usage|budget)/.test(path)) {
      boost += 150
      addMatch(matchedBy, '场景：API/模型')
    } else if (/(api|模型|deepseek|openai|anthropic|qwen|阿里|通义)/i.test(category) || /(api|key|401|402|模型|provider)/i.test(title)) {
      boost += 95
      addMatch(matchedBy, '场景：API/模型')
    } else if (/(api|key|401|402|403|404|429|模型)/i.test(summary)) {
      boost += 25
      addMatch(matchedBy, '场景：API/模型')
    }
  }

  if (/(简历|候选人|正式简历|万字简历|其他简历|资料)/i.test(query)) {
    if (/(简历|候选人|正式简历|万字简历|其他简历|resume|candidate)/i.test(`${title} ${category} ${path}`)) {
      boost += 70
      addMatch(matchedBy, '场景：简历资料')
    }
  }

  if (/(模拟训练|拟真面试|训练|复盘|题库|追问)/i.test(query)) {
    if (/(模拟训练|拟真面试|训练|复盘|题库|追问|training|interview)/i.test(`${title} ${category} ${path}`)) {
      boost += 70
      addMatch(matchedBy, '场景：训练复盘')
    }
  }

  return boost
}

export function searchHelpDocs(query: string, category = '全部'): HelpSearchResult[] {
  const normalizedQuery = normalize(query)
  const queryParts = splitQuery(query)

  return helpDocs
    .filter((doc) => category === '全部' || doc.category === category)
    .map((doc) => {
      const matchedBy = new Set<string>()
      let score = 0
      const title = normalize(doc.title)
      const categoryText = normalize(doc.category)
      const path = normalize(doc.path)
      const summary = normalize(doc.summary)
      const searchText = normalize(doc.searchText || '')
      const keywords = doc.keywords.map(normalize)
      const questions = doc.suggestedQuestions.map(normalize)

      if (!normalizedQuery) {
        score = 1
      } else {
        if (title.includes(normalizedQuery)) {
          score += 90
          addMatch(matchedBy, '标题')
        }
        if (summary.includes(normalizedQuery)) {
          score += 45
          addMatch(matchedBy, '说明')
        }
        if (path.includes(normalizedQuery)) {
          score += 28
          addMatch(matchedBy, '文档路径')
        }
        if (categoryText.includes(normalizedQuery)) {
          score += 24
          addMatch(matchedBy, '分类')
        }
        if (keywords.some((keyword) => keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword))) {
          score += 52
          addMatch(matchedBy, '关键词')
        }
        if (questions.some((question) => question.includes(normalizedQuery))) {
          score += 42
          addMatch(matchedBy, '常见问法')
        }
        if (searchText.includes(normalizedQuery)) {
          score += 18
          addMatch(matchedBy, '正文')
        }

        score += getIntentBoost(doc, query, matchedBy)
      }

      for (const part of queryParts) {
        if (title.includes(part)) score += 22
        if (keywords.some((keyword) => keyword.includes(part) || part.includes(keyword))) score += 16
        if (summary.includes(part)) score += 10
        if (questions.some((question) => question.includes(part))) score += 10
        if (path.includes(part)) score += 5
        if (searchText.includes(part)) score += 4
      }

      return {
        ...doc,
        score,
        matchedBy: Array.from(matchedBy),
        primaryMatch: Array.from(matchedBy)[0] || '推荐',
        snippet: buildSnippet(doc, query)
      }
    })
    .filter((doc) => !normalizedQuery || doc.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title, 'zh-Hans-CN'))
    .slice(0, 8)
}

export const helpDocCategories = ['全部', ...Array.from(new Set(helpDocs.map((doc) => doc.category)))]
