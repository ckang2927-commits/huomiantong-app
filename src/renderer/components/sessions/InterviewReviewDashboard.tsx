import { BarChart3, BookOpenCheck, BrainCircuit, ChevronRight, ShieldAlert, Target } from 'lucide-react'
import { buildInterviewReviewDashboard, type ReviewFocusItem, type ReviewMetricCard, type ReviewQuestionTopic } from '../../lib/interviewReviewAnalytics'
import type { InterviewSession } from '../../../shared/types'
import type { TrainingFocusPlan } from '../../lib/trainingInsights'

type InterviewReviewDashboardProps = {
  sessions: InterviewSession[]
  totalSessionCount: number
  isFiltered: boolean
  onStartFocusedTraining?: (plan: TrainingFocusPlan) => void | Promise<void>
}

export function InterviewReviewDashboard({
  sessions,
  totalSessionCount,
  isFiltered,
  onStartFocusedTraining
}: InterviewReviewDashboardProps): JSX.Element {
  const dashboard = buildInterviewReviewDashboard(sessions)

  if (sessions.length === 0) {
    return (
      <section className="session-review-dashboard empty">
        <div className="training-review-title">
          <BarChart3 size={18} />
          <div>
            <strong>面试复盘总览</strong>
            <span>保存几场会话后，这里会自动统计高频问题、质量趋势和风险点。</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="session-review-dashboard">
      <div className="session-review-heading">
        <div className="training-review-title">
          <BarChart3 size={18} />
          <div>
            <strong>面试复盘总览</strong>
            <span>
              {isFiltered ? `当前筛选 ${sessions.length}/${totalSessionCount} 场会话` : `已汇总 ${sessions.length} 场会话`}，先看问题，再决定下一轮练什么。
            </span>
          </div>
        </div>
        {!dashboard.hasScores && <span className="session-review-badge">部分旧会话暂无评分</span>}
      </div>

      <div className="session-review-metrics">
        {dashboard.metrics.map((metric) => (
          <MetricCard metric={metric} key={metric.label} />
        ))}
      </div>

      <div className="session-review-grid">
        <div className="session-review-card">
          <div className="session-review-card-title">
            <Target size={16} />
            <strong>高频问题类型</strong>
          </div>
          {dashboard.topics.length === 0 ? (
            <p className="session-review-empty">暂时还没有识别出稳定高频题型，多保存几场会更准。</p>
          ) : (
            <div className="session-topic-list">
              {dashboard.topics.map((topic) => (
                <TopicItem key={topic.id} topic={topic} />
              ))}
            </div>
          )}
        </div>

        <div className="session-review-card">
          <div className="session-review-card-title">
            <BrainCircuit size={16} />
            <strong>下一轮训练建议</strong>
          </div>
          <div className="session-focus-list">
            {dashboard.focusItems.map((item) => (
              <FocusItem item={item} key={item.id} onStartFocusedTraining={onStartFocusedTraining} />
            ))}
          </div>
        </div>
      </div>

      {dashboard.profileStats.length > 0 && (
        <div className="session-review-card session-profile-review">
          <div className="session-review-card-title">
            <BookOpenCheck size={16} />
            <strong>候选人表现概览</strong>
          </div>
          <div className="session-profile-review-list">
            {dashboard.profileStats.map((profile) => (
              <article className="session-profile-review-item" key={profile.id}>
                <div>
                  <strong>{profile.label}</strong>
                  <span>
                    {profile.sessionCount} 场 · {profile.answerCount} 答 · 依据 {profile.evidenceHitRate}%
                  </span>
                </div>
                <div>
                  <b>{profile.averageScore || '-'}</b>
                  <span>{profile.riskCount} 风险</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function MetricCard({ metric }: { metric: ReviewMetricCard }): JSX.Element {
  return (
    <article className={`session-review-metric ${metric.tone}`}>
      <span>{metric.label}</span>
      <strong>{metric.value}</strong>
      <small>{metric.hint}</small>
    </article>
  )
}

function TopicItem({ topic }: { topic: ReviewQuestionTopic }): JSX.Element {
  return (
    <article className="session-topic-item">
      <div>
        <strong>{topic.title}</strong>
        <span>{topic.sampleQuestion}</span>
      </div>
      <b>{topic.count} 次</b>
    </article>
  )
}

function FocusItem({
  item,
  onStartFocusedTraining
}: {
  item: ReviewFocusItem
  onStartFocusedTraining?: (plan: TrainingFocusPlan) => void | Promise<void>
}): JSX.Element {
  return (
    <article className={`session-focus-item ${item.tone}`}>
      <div className="session-focus-icon">{item.id === 'risk' ? <ShieldAlert size={16} /> : <ChevronRight size={16} />}</div>
      <div>
        <strong>{item.title}</strong>
        <span>{item.reason}</span>
        <p>{item.action}</p>
        {onStartFocusedTraining && (
          <button className="ghost-button compact" type="button" onClick={() => onStartFocusedTraining(item.plan)}>
            去练这一项
          </button>
        )}
      </div>
    </article>
  )
}
