import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const docsDir = path.join(projectRoot, 'docs')
const outputPath = path.join(projectRoot, 'src', 'renderer', 'lib', 'generatedHelpDocs.ts')
const isCheckMode = process.argv.includes('--check')

const CATEGORY_RULES = [
  { category: '上手入门', patterns: [/quick-start|use-case|terminology|product-about|product-info|known-issues/] },
  { category: 'API 模型', patterns: [/model|provider|usage|budget|api-settings|pricing/] },
  { category: '语音转写', patterns: [/audio|voice|deepgram|microphone|floating-window/] },
  { category: '简历资料', patterns: [/resume|candidate|jd|role/] },
  { category: '模拟训练', patterns: [/training|realistic-interview|interview-question|mock/] },
  { category: '背景资料', patterns: [/background|company|salary|hr|work-detail/] },
  { category: '复盘导出', patterns: [/session|review|export|record/] },
  { category: '打包发布', patterns: [/packag|release|install|windows|sharing|dist/] },
  { category: '验收测试', patterns: [/manual-test|regression|checklist|qa|audit/] },
  { category: 'DeepSeek 任务', patterns: [/deepseek|handoff|task-book/] },
  { category: '产品计划', patterns: [/optimization|backlog|roadmap|plan|blueprint|ui|maintenance|docs/] },
  { category: '示例素材', patterns: [/sample|demo|example|script/] }
]

const PRIORITY_DOCS = [
  'quick-start.md',
  'faq-and-troubleshooting.md',
  'audio-troubleshooting.md',
  'model-provider-guide.md',
  'usage-budget-guide.md',
  'resume-library-guide.md',
  'realistic-interview-mode.md',
  'training-guide.md',
  'product-optimization-backlog.md',
  'ui-layout-blueprint.md',
  'packaging-resource-strategy.md',
  'regression-checklist.md',
  'docs-maintenance.md'
]

function slugify(fileName) {
  return fileName
    .replace(/\.md$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function stripMarkdown(value) {
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/[*_~>#|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength).trim()}…`
}

function extractTitle(content, fileName) {
  const heading = content.match(/^#\s+(.+)$/m)

  if (heading?.[1]) {
    return stripMarkdown(heading[1])
  }

  return fileName
    .replace(/\.md$/i, '')
    .split(/[-_]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')
}

function extractHeadings(content) {
  return Array.from(content.matchAll(/^#{2,4}\s+(.+)$/gm))
    .map((match) => stripMarkdown(match[1] || ''))
    .filter(Boolean)
    .slice(0, 18)
}

function extractSummary(content, title) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false
      if (/^#{1,6}\s+/.test(line)) return false
      if (/^[-*]\s*\[[ x]\]/i.test(line)) return false
      if (/^\|.*\|$/.test(line)) return false
      if (/^---+$/.test(line)) return false
      if (/^```/.test(line)) return false
      return true
    })
    .map(stripMarkdown)
    .filter(Boolean)

  return truncate(lines.find((line) => line.length >= 18) || lines[0] || `${title} 的说明文档。`, 180)
}

function inferCategory(fileName, title, headings) {
  const haystack = `${fileName} ${title} ${headings.join(' ')}`.toLowerCase()
  const matched = CATEGORY_RULES.find((rule) => rule.patterns.some((pattern) => pattern.test(haystack)))
  return matched?.category || '文档资料'
}

function extractKeywords(fileName, title, category, headings, summary) {
  const englishTokens = fileName
    .replace(/\.md$/i, '')
    .split(/[-_\s]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2)

  const chineseChunks = `${title} ${category} ${headings.slice(0, 8).join(' ')} ${summary}`
    .match(/[\u4e00-\u9fa5A-Za-z0-9]{2,}/g) || []

  return Array.from(new Set([...englishTokens, ...chineseChunks, category, title]))
    .filter((item) => item.length >= 2 && item.length <= 28)
    .slice(0, 28)
}

function buildSuggestedQuestions(title, category, headings) {
  const questions = [
    `${title} 是什么？`,
    `${title} 怎么用？`
  ]

  if (category.includes('语音')) {
    questions.push('语音转写不能用怎么办？')
  } else if (category.includes('API')) {
    questions.push('API 连接失败怎么排查？')
  } else if (category.includes('打包')) {
    questions.push('打包成软件前要检查什么？')
  } else if (category.includes('计划')) {
    questions.push('这个计划现在执行到哪里了？')
  } else if (category.includes('训练') || category.includes('拟真')) {
    questions.push('模拟训练和拟真面试怎么验收？')
  } else if (category.includes('简历')) {
    questions.push('怎么管理候选人和简历资料？')
  }

  headings.slice(0, 2).forEach((heading) => questions.push(`${heading} 怎么处理？`))

  return Array.from(new Set(questions)).slice(0, 5)
}

async function collectDocs() {
  if (!existsSync(docsDir)) {
    throw new Error(`找不到 docs 目录：${docsDir}`)
  }

  const fileNames = (await readdir(docsDir))
    .filter((fileName) => fileName.toLowerCase().endsWith('.md'))
    .sort((left, right) => {
      const leftPriority = PRIORITY_DOCS.indexOf(left)
      const rightPriority = PRIORITY_DOCS.indexOf(right)

      if (leftPriority !== -1 || rightPriority !== -1) {
        return (leftPriority === -1 ? 999 : leftPriority) - (rightPriority === -1 ? 999 : rightPriority)
      }

      return left.localeCompare(right, 'zh-Hans-CN')
    })

  return fileNames.map((fileName) => {
    const filePath = path.join(docsDir, fileName)
    const content = readFileSync(filePath, 'utf8')
    const title = extractTitle(content, fileName)
    const headings = extractHeadings(content)
    const category = inferCategory(fileName, title, headings)
    const summary = extractSummary(content, title)
    const cleanContent = stripMarkdown(content)

    return {
      id: slugify(fileName),
      title,
      category,
      path: `docs/${fileName}`,
      summary,
      keywords: extractKeywords(fileName, title, category, headings, summary),
      suggestedQuestions: buildSuggestedQuestions(title, category, headings),
      searchText: truncate([title, category, summary, headings.join(' '), cleanContent].join(' '), 3600)
    }
  })
}

function renderTypeScript(docs) {
  return `// AUTO-GENERATED by scripts/generate-help-doc-index.mjs. Do not edit by hand.\nimport type { HelpDoc } from './helpCenterDocs'\n\nexport const generatedHelpDocs: HelpDoc[] = ${JSON.stringify(docs, null, 2)}\n\nexport const generatedHelpDocCount = ${docs.length}\n`
}

const docs = await collectDocs()
const nextContent = renderTypeScript(docs)

if (isCheckMode) {
  const currentContent = existsSync(outputPath) ? readFileSync(outputPath, 'utf8') : ''

  if (currentContent !== nextContent) {
    console.error('帮助中心文档索引不是最新，请运行：npm run docs:index')
    process.exit(1)
  }

  console.log(`帮助中心文档索引已是最新：${docs.length} 份文档`)
} else {
  writeFileSync(outputPath, nextContent, 'utf8')
  console.log(`已生成帮助中心文档索引：${docs.length} 份文档 -> ${path.relative(projectRoot, outputPath)}`)
}
