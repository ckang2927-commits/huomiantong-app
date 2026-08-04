import { useMemo, useState } from 'react'
import {
  BookOpen,
  ExternalLink,
  FileSearch,
  Lightbulb,
  Search,
  Sparkles,
  Star,
  StarOff
} from 'lucide-react'
import { helpDocCategories, helpDocs, searchHelpDocs, type HelpDoc, type HelpSearchResult } from '../lib/helpCenterDocs'

const FAVORITE_STORAGE_KEY = 'huomiantong.help.favoriteDocIds'

const QUICK_QUESTIONS = [
  '语音转写不能用怎么办？',
  'API 连接 401 / 402 是什么意思？',
  'AI 回答太长、太像复制简历怎么办？',
  '怎么给别人新增一套简历？',
  '拟真面试和模拟训练有什么区别？',
  '现在还有哪些计划没做完？'
]

const FREQUENT_DOC_PATHS = [
  'docs/faq-and-troubleshooting.md',
  'docs/audio-troubleshooting.md',
  'docs/model-provider-guide.md',
  'docs/usage-budget-guide.md',
  'docs/training-guide.md',
  'docs/product-optimization-backlog.md'
]

function loadFavoriteDocIds(): string[] {
  try {
    const rawValue = window.localStorage.getItem(FAVORITE_STORAGE_KEY)
    const parsedValue = rawValue ? JSON.parse(rawValue) : []
    return Array.isArray(parsedValue) ? parsedValue.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

function saveFavoriteDocIds(docIds: string[]): void {
  try {
    window.localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify(docIds))
  } catch {
  }
}

function buildFallbackTips(query: string): string[] {
  const normalizedQuery = query.trim()

  if (!normalizedQuery) {
    return ['输入“语音”“API”“回答太长”“简历库”“拟真面试”“计划表”等关键词，可以快速定位文档。']
  }

  return [
    `没有完全命中“${normalizedQuery}”，可以换成更短关键词再搜，比如只搜“语音”“API”“简历”。`,
    '如果是软件报错，优先搜索错误码、按钮名称或页面名称。',
    '如果是产品想法，优先搜索“总计划”“UI”“DeepSeek”“拟真面试”。'
  ]
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getHighlightTerms(query: string): string[] {
  return Array.from(new Set(query.trim().split(/[\s,，。.!！?？:：;；/\\|()[\]{}"“”‘’、-]+/).filter((item) => item.length >= 2))).slice(0, 6)
}

function renderHighlightedText(text: string, query: string): Array<string | JSX.Element> {
  const terms = getHighlightTerms(query)

  if (terms.length === 0) {
    return [text]
  }

  const matcher = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi')
  return text.split(matcher).map((part, index) => {
    const isMatch = terms.some((term) => part.toLowerCase() === term.toLowerCase())
    return isMatch ? (
      <mark key={`${part}-${index}`} className="help-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  })
}

function HelpDocCard({
  doc,
  favorite,
  onOpenDoc,
  onPickQuestion,
  onToggleFavorite,
  query
}: {
  doc: HelpSearchResult
  favorite: boolean
  onOpenDoc: (doc: HelpSearchResult) => void
  onPickQuestion: (question: string) => void
  onToggleFavorite: (docId: string) => void
  query: string
}): JSX.Element {
  return (
    <article className="help-result-card">
      <div className="help-result-main">
        <div className="help-result-icon">
          <BookOpen size={18} />
        </div>
        <div className="help-result-content">
          <div className="help-result-title-row">
            <h3>{renderHighlightedText(doc.title, query)}</h3>
            <span>{doc.category}</span>
          </div>
          <p>{doc.summary}</p>
          {doc.snippet && <p className="help-result-snippet">{renderHighlightedText(doc.snippet, query)}</p>}
          <div className="help-result-meta">
            <span>{doc.path}</span>
            <span>命中：{doc.matchedBy.length > 0 ? doc.matchedBy.join(' / ') : doc.primaryMatch}</span>
            <span>相关度 {doc.score}</span>
          </div>
        </div>
      </div>
      <div className="help-question-list">
        {doc.suggestedQuestions.slice(0, 3).map((question) => (
          <button key={question} onClick={() => onPickQuestion(question)} type="button">
            {question}
          </button>
        ))}
      </div>
      <div className="help-result-actions">
        <button className="secondary-button" type="button" onClick={() => onToggleFavorite(doc.id)}>
          {favorite ? <StarOff size={15} /> : <Star size={15} />}
          {favorite ? '取消收藏' : '收藏'}
        </button>
        <button className="primary-button" type="button" onClick={() => onOpenDoc(doc)}>
          <ExternalLink size={15} />
          打开文档
        </button>
      </div>
    </article>
  )
}

export function HelpCenterView(): JSX.Element {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('全部')
  const [openStatus, setOpenStatus] = useState('')
  const [favoriteDocIds, setFavoriteDocIds] = useState<string[]>(loadFavoriteDocIds)

  const results = useMemo(() => searchHelpDocs(query, activeCategory), [query, activeCategory])
  const fallbackTips = useMemo(() => buildFallbackTips(query), [query])
  const favoriteDocIdSet = useMemo(() => new Set(favoriteDocIds), [favoriteDocIds])
  const favoriteDocs = useMemo(() => helpDocs.filter((doc) => favoriteDocIdSet.has(doc.id)).slice(0, 8), [favoriteDocIdSet])
  const frequentDocs = useMemo(
    () =>
      FREQUENT_DOC_PATHS.map((path) => helpDocs.find((doc) => doc.path === path)).filter((doc): doc is HelpDoc => Boolean(doc)),
    []
  )

  const toggleFavorite = (docId: string): void => {
    setFavoriteDocIds((currentDocIds) => {
      const nextDocIds = currentDocIds.includes(docId)
        ? currentDocIds.filter((currentDocId) => currentDocId !== docId)
        : [docId, ...currentDocIds].slice(0, 20)
      saveFavoriteDocIds(nextDocIds)
      return nextDocIds
    })
  }

  const openDoc = async (doc: HelpSearchResult | HelpDoc): Promise<void> => {
    setOpenStatus(`正在打开：${doc.title}...`)

    try {
      const result = await window.huomiantong.openDoc(doc.path)
      setOpenStatus(result.ok ? `已打开：${doc.title}` : `打开失败：${result.message || doc.path}`)
    } catch (error) {
      setOpenStatus(error instanceof Error ? `打开失败：${error.message}` : '打开失败：未知错误')
    }
  }

  return (
    <section className="help-center-page" data-onboarding-target="help">
      <div className="help-center-hero">
        <div>
          <span className="eyebrow">Local Knowledge Base</span>
          <h3>问题查询中心</h3>
          <p>把 docs 里的说明、排障、计划和验收文档做成本地知识库；先查本地，不乱联网，适合后续打包成 App 一起带走。</p>
        </div>
        <div className="help-center-stats">
          <span>{helpDocs.length} 份本地文档</span>
          <span>{favoriteDocIds.length} 个收藏</span>
          <span>可直接打开 .md</span>
        </div>
      </div>

      <div className="help-center-layout">
        <div className="help-search-panel">
          <div className="help-search-box">
            <Search size={18} />
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索问题，比如：语音不能用、402、回答太长、简历库、拟真面试..."
              type="search"
              value={query}
            />
          </div>
          <div className="help-category-row" aria-label="帮助文档分类">
            {helpDocCategories.map((category) => (
              <button
                className={activeCategory === category ? 'active' : ''}
                key={category}
                onClick={() => setActiveCategory(category)}
                type="button"
              >
                {category}
              </button>
            ))}
          </div>
          <div className="help-quick-question-grid">
            {QUICK_QUESTIONS.map((question) => (
              <button key={question} onClick={() => setQuery(question)} type="button">
                {question}
              </button>
            ))}
          </div>

          <div className="help-side-card help-favorite-card">
            <div className="help-side-title">
              <Star size={18} />
              <strong>我的收藏</strong>
            </div>
            {favoriteDocs.length > 0 ? (
              <div className="help-popular-list">
                {favoriteDocs.map((doc) => (
                  <button key={doc.id} onClick={() => void openDoc(doc)} type="button">
                    {doc.title}
                  </button>
                ))}
              </div>
            ) : (
              <p>常用排障文档可以点“收藏”，下次不用再翻。</p>
            )}
          </div>
        </div>

        <div className="help-results-panel">
          <div className="help-results-heading">
            <div>
              <span className="eyebrow">Search Results</span>
              <h3>{query.trim() ? `找到 ${results.length} 条相关文档` : '推荐先看这些文档'}</h3>
            </div>
            {openStatus && <span className="help-open-status">{openStatus}</span>}
          </div>

          {results.length > 0 ? (
            <div className="help-result-list">
              {results.map((doc) => (
                <HelpDocCard
                  doc={doc}
                  favorite={favoriteDocIdSet.has(doc.id)}
                  key={doc.id}
                  onOpenDoc={openDoc}
                  onPickQuestion={setQuery}
                  onToggleFavorite={toggleFavorite}
                  query={query}
                />
              ))}
            </div>
          ) : (
            <div className="help-empty-card">
              <FileSearch size={28} />
              <h3>本地文档暂时没搜到</h3>
              {fallbackTips.map((tip) => (
                <p key={tip}>{tip}</p>
              ))}
              <button className="secondary-button" type="button" onClick={() => setQuery('常见问题')}>
                先看常见问题
              </button>
            </div>
          )}
        </div>

        <aside className="help-side-panel">
          <div className="help-side-card">
            <div className="help-side-title">
              <Lightbulb size={18} />
              <strong>我建议这样搜</strong>
            </div>
            <p>先搜页面名、按钮名、错误码，再搜现象；比如“麦克风”“402”“回答太长”。这样命中文档会更准。</p>
          </div>
          <div className="help-side-card">
            <div className="help-side-title">
              <Sparkles size={18} />
              <strong>无结果怎么办</strong>
            </div>
            <p>当前版本先给本地相似建议；后续可以做“确认后联网补充”，但不会默认把你的简历或问题发出去。</p>
          </div>
          <div className="help-side-card">
            <strong>高频文档</strong>
            <div className="help-popular-list">
              {frequentDocs.map((doc) => (
                <button key={doc.id} onClick={() => void openDoc(doc)} type="button">
                  {doc.title}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
