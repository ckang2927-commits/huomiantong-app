import { useCallback } from 'react'
import type { CachedAnswer } from '../../lib/interviewWarmupCache'

interface WarmupPanelProps {
  warmupAnswers: CachedAnswer[]
  isGenerating: boolean
  progress: { done: number; total: number }
  hasCache: boolean
  cachedAt: number | null
  onStartWarmup: () => void
  onClearCache: () => void
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export function WarmupPanel({
  warmupAnswers,
  isGenerating,
  progress,
  hasCache,
  cachedAt,
  onStartWarmup,
  onClearCache,
}: WarmupPanelProps): JSX.Element {
  const handleStart = useCallback(() => {
    if (!isGenerating) onStartWarmup()
  }, [isGenerating, onStartWarmup])

  const handleClear = useCallback(() => {
    if (!isGenerating) onClearCache()
  }, [isGenerating, onClearCache])

  return (
    <details className="warmup-panel" open={!hasCache}>
      <summary className="warmup-summary">
        <span>🔥 面试前预热
          {hasCache && <span className="warmup-badge">已缓存 {warmupAnswers.length} 题</span>}
          {isGenerating && <span className="warmup-badge warmup-badge-active">生成中 {progress.done}/{progress.total}</span>}
        </span>
      </summary>
      <div className="warmup-body">
        {hasCache && cachedAt && (
          <p className="warmup-info">
            上次预热：{formatTime(cachedAt)}，共 {warmupAnswers.length} 道题。
            真实面试时相似问题将秒出答案。
          </p>
        )}
        {!hasCache && !isGenerating && (
          <p className="warmup-info">
            面试前先生成一批常见问题的答案，真实面试遇到相似问题时秒出。
          </p>
        )}
        {isGenerating && (
          <p className="warmup-info">
            正在预生成答案（{progress.done}/{progress.total}），请稍候…
          </p>
        )}
        <div className="warmup-actions">
          <button
            className="button button-primary"
            onClick={handleStart}
            disabled={isGenerating}
          >
            {isGenerating ? '生成中…' : hasCache ? '重新预热' : '开始预热'}
          </button>
          {hasCache && (
            <button
              className="button button-ghost"
              onClick={handleClear}
              disabled={isGenerating}
            >
              清除缓存
            </button>
          )}
        </div>
      </div>
    </details>
  )
}