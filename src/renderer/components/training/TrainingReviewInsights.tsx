import { PlayCircle, Target, TrendingDown } from 'lucide-react'
import type { TrainingFocusPlan, TrainingWeaknessInsight } from '../../lib/trainingInsights'

type TrainingReviewInsightsProps = {
  insights: TrainingWeaknessInsight[]
  isGeneratingTraining: boolean
  onStartFocusedTraining: (plan: TrainingFocusPlan) => void | Promise<void>
}

export function TrainingReviewInsights({
  insights,
  isGeneratingTraining,
  onStartFocusedTraining
}: TrainingReviewInsightsProps): JSX.Element {
  if (insights.length === 0) {
    return (
      <section className="training-review-insights">
        <div className="training-review-title">
          <Target size={17} />
          <div>
            <strong>薄弱点排行榜</strong>
            <span>完成至少 1 轮回答后，这里会自动总结下一轮该练什么。</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="training-review-insights">
      <div className="training-review-title">
        <TrendingDown size={17} />
        <div>
          <strong>薄弱点排行榜</strong>
          <span>按本轮回答、评分和点评自动排序，越靠前越值得下一轮专项练。</span>
        </div>
      </div>

      <div className="training-weakness-list">
        {insights.map((insight, index) => (
          <article className="training-weakness-card" key={insight.id}>
            <div className="training-weakness-rank">{index + 1}</div>
            <div className="training-weakness-body">
              <div className="training-weakness-top">
                <strong>{insight.title}</strong>
                <span>{insight.score}</span>
              </div>
              <div className="training-weakness-meter" aria-hidden="true">
                <span style={{ width: `${insight.score}%` }} />
              </div>
              <p>{insight.reason}</p>
              <small>代表问题：{insight.sampleQuestion}</small>
              <small>{insight.action}</small>
              <button
                className="primary-button compact"
                type="button"
                onClick={() => {
                  void onStartFocusedTraining(insight.plan)
                }}
                disabled={isGeneratingTraining}
              >
                <PlayCircle size={15} />
                下一轮练这个
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
