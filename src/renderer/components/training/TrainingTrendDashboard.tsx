import { BarChart3, Trash2, TrendingUp } from 'lucide-react'
import type { TrainingTrendEntry } from '../../lib/trainingTrendStore'

type TrainingTrendDashboardProps = {
  entries: TrainingTrendEntry[]
  onClearTrainingTrend: () => void
}

export function TrainingTrendDashboard({
  entries,
  onClearTrainingTrend
}: TrainingTrendDashboardProps): JSX.Element {
  const latestEntry = entries[0]
  const previousEntry = entries[1]
  const bestEntry = entries.reduce<TrainingTrendEntry | undefined>(
    (best, entry) => (!best || entry.averageScore > best.averageScore ? entry : best),
    undefined
  )
  const chartEntries = entries.slice(0, 8).reverse()
  const averageOfAll = entries.length
    ? Math.round(entries.reduce((sum, entry) => sum + entry.averageScore, 0) / entries.length)
    : 0
  const delta = latestEntry && previousEntry ? latestEntry.averageScore - previousEntry.averageScore : 0

  if (entries.length === 0) {
    return (
      <section className="training-trend-dashboard">
        <div className="training-review-title">
          <BarChart3 size={17} />
          <div>
            <strong>训练成绩趋势</strong>
            <span>完成一轮模拟训练后，会自动记录平均分和薄弱点变化。</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="training-trend-dashboard">
      <div className="training-trend-heading">
        <div className="training-review-title">
          <TrendingUp size={17} />
          <div>
            <strong>训练成绩趋势</strong>
            <span>记录每轮均分、涨跌和薄弱点，让练习不是“练完就忘”。</span>
          </div>
        </div>
        <button className="ghost-button compact" type="button" onClick={onClearTrainingTrend}>
          <Trash2 size={14} />
          清空
        </button>
      </div>

      <div className="training-trend-stats">
        <TrendStat label="最近均分" value={`${latestEntry.averageScore}`} hint={`${latestEntry.answeredCount}/${latestEntry.roundCount} 题`} />
        <TrendStat label="较上一轮" value={formatDelta(delta)} hint={previousEntry ? previousEntry.trainingModeLabel : '仅一轮训练，暂无对比'} tone={delta >= 0 ? 'good' : 'warn'} />
        <TrendStat label="历史最好" value={`${bestEntry?.averageScore || 0}`} hint={bestEntry?.trainingModeLabel || '暂无历史记录'} />
        <TrendStat label="累计均分" value={`${averageOfAll}`} hint={`${entries.length} 轮训练`} />
      </div>

      <div className="training-trend-chart" aria-label="最近训练均分走势">
        {chartEntries.map((entry) => (
          <div className="training-trend-bar-wrap" key={entry.id} title={`${entry.trainingModeLabel}：${entry.averageScore}`}>
            <span className="training-trend-bar" style={{ height: `${Math.max(12, entry.averageScore)}%` }} />
            <small>{entry.averageScore}</small>
          </div>
        ))}
      </div>

      <div className="training-trend-history">
        {entries.slice(0, 5).map((entry) => (
          <article className="training-trend-item" key={entry.id}>
            <div>
              <strong>{entry.averageScore} 分 · {entry.trainingModeLabel}</strong>
              <span>{entry.targetRole} · {formatDateTime(entry.recordedAt)}</span>
            </div>
            <div className="training-trend-tags">
              {entry.weakness.length > 0 ? (
                entry.weakness.map((item) => <span key={`${entry.id}-${item.title}`}>{item.title}</span>)
              ) : (
                <span>练习次数还不够判断薄弱点，多练几轮会更准。</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function TrendStat({
  label,
  value,
  hint,
  tone = 'normal'
}: {
  label: string
  value: string
  hint: string
  tone?: 'normal' | 'good' | 'warn'
}): JSX.Element {
  return (
    <div className={`training-trend-stat ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  )
}

function formatDelta(delta: number): string {
  if (delta > 0) {
    return `+${delta}`
  }

  return `${delta}`
}

function formatDateTime(time: number): string {
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

