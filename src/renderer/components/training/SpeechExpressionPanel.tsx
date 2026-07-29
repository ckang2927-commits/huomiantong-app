import { Mic, TimerReset, Volume2 } from 'lucide-react'
import type { SpeechExpressionScore } from '../../../shared/types'

type SpeechExpressionPanelProps = {
  score: SpeechExpressionScore | null
  isLive?: boolean
  compact?: boolean
}

export function SpeechExpressionPanel({ score, isLive = false, compact = false }: SpeechExpressionPanelProps): JSX.Element | null {
  if (!score) {
    return null
  }

  return (
    <section className={compact ? 'speech-expression-panel compact' : 'speech-expression-panel'}>
      <div className="speech-expression-top">
        <div className="training-review-title">
          <Mic size={17} />
          <div>
            <strong>口语表达评分</strong>
            <span>{isLive ? '正在录音，先看实时走势；结束后分数会更准。' : '基于文本、时长和转写节奏的本地评分。'}</span>
          </div>
        </div>
        <div className="speech-expression-score">
          <strong>{score.total}</strong>
          <span>总分</span>
        </div>
      </div>

      <div className="speech-expression-metrics">
        <Metric label="语速" value={score.pace} hint={`${score.charsPerMinute} 字/分钟`} />
        <Metric label="清晰度" value={score.clarity} hint={`${score.durationSec}s`} />
        <Metric label="结构感" value={score.structure} hint={score.estimatedDuration ? '时长估算' : '真实时长'} />
        <Metric label="表达稳定" value={score.confidence} hint={`${score.fillerCount} 个口头禅`} />
      </div>

      <div className="speech-expression-extra">
        <div>
          <Volume2 size={14} />
          <span>停顿提示：{score.pauseHintCount} 次</span>
        </div>
        <div>
          <TimerReset size={14} />
          <span>{score.estimatedDuration ? '当前时长为估算' : '时长来自本次语音作答'}</span>
        </div>
      </div>

      {score.notes.length > 0 && (
        <div className="speech-expression-notes">
          {score.notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      )}
    </section>
  )
}

function Metric({
  label,
  value,
  hint
}: {
  label: string
  value: number
  hint: string
}): JSX.Element {
  return (
    <article className="speech-expression-metric">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <small>{hint}</small>
      <div className="speech-expression-bar" aria-hidden="true">
        <span style={{ width: `${value}%` }} />
      </div>
    </article>
  )
}
