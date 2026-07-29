import { Bookmark, BookmarkCheck, PlayCircle, Trash2 } from 'lucide-react'
import type { TrainingRound } from '../../../shared/types'
import type { TrainingQuestionBankItem } from '../../lib/trainingQuestionBankStore'

type TrainingQuestionBankPanelProps = {
  items: TrainingQuestionBankItem[]
  rounds: TrainingRound[]
  isGeneratingTraining: boolean
  isBookmarked: (round: TrainingRound) => boolean
  onBookmarkRound: (round: TrainingRound) => void
  onRemoveItem: (id: string) => void
  onClearQuestionBank: () => void
  onStartQuestionBankTraining: (items: TrainingQuestionBankItem[], label: string) => void | Promise<void>
}

export function TrainingQuestionBankPanel({
  items,
  rounds,
  isGeneratingTraining,
  isBookmarked,
  onBookmarkRound,
  onRemoveItem,
  onClearQuestionBank,
  onStartQuestionBankTraining
}: TrainingQuestionBankPanelProps): JSX.Element {
  const currentWeakRounds = rounds
    .filter((round) => round.answer?.trim())
    .sort((left, right) => normalizeScore(left.score) - normalizeScore(right.score))
    .slice(0, 5)

  return (
    <section className="training-question-bank">
      <div className="training-trend-heading">
        <div className="training-review-title">
          <BookmarkCheck size={17} />
          <div>
            <strong>错题/高频问题收藏夹</strong>
            <span>低分题会自动收集，也可以手动收藏；后面一键变成专项训练。</span>
          </div>
        </div>
        <div className="training-bank-actions">
          <button
            className="primary-button compact"
            type="button"
            onClick={() => {
              void onStartQuestionBankTraining(items, '错题专项训练')
            }}
            disabled={items.length === 0 || isGeneratingTraining}
          >
            <PlayCircle size={14} />
            练全部
          </button>
          <button className="ghost-button compact" type="button" onClick={onClearQuestionBank} disabled={items.length === 0}>
            <Trash2 size={14} />
            清空
          </button>
        </div>
      </div>

      {currentWeakRounds.length > 0 && (
        <div className="training-bank-current">
          <strong>本轮可收藏</strong>
          <div className="training-bank-round-list">
            {currentWeakRounds.map((round) => {
              const bookmarked = isBookmarked(round)

              return (
                <article className="training-bank-round" key={round.id}>
                  <div>
                    <span>{typeof round.score === 'number' ? `${round.score}/100` : '未评分'}</span>
                    <p>{round.question}</p>
                  </div>
                  <button className="ghost-button compact" type="button" onClick={() => onBookmarkRound(round)} disabled={bookmarked}>
                    {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                    {bookmarked ? '已收藏' : '收藏'}
                  </button>
                </article>
              )
            })}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state compact">
          <strong>还没有错题</strong>
          <p>完成训练后，低于 75 分的题会自动进来；你也可以手动收藏觉得容易翻车的问题。</p>
        </div>
      ) : (
        <div className="training-bank-list">
          {items.slice(0, 8).map((item) => (
            <article className="training-bank-item" key={item.id}>
              <div className="training-bank-item-top">
                <strong>{item.lowestScore ? `${item.lowestScore} 分` : '收藏题'}</strong>
                <span>{item.trainingModeLabel}</span>
              </div>
              <p>{item.question}</p>
              <div className="training-bank-tags">
                {item.tags.slice(0, 4).map((tag) => (
                  <span key={`${item.id}-${tag}`}>{tag}</span>
                ))}
                {item.hitCount > 1 && <span>高频 ×{item.hitCount}</span>}
                {item.practicedCount > 0 && <span>已练 {item.practicedCount}</span>}
              </div>
              {item.lastFeedback && <small>最近点评：{item.lastFeedback}</small>}
              <div className="training-bank-footer">
                <span>{formatDateTime(item.updatedAt)}</span>
                <div>
                  <button
                    className="ghost-button compact"
                    type="button"
                    onClick={() => {
                      void onStartQuestionBankTraining([item], `${item.question.slice(0, 12)}专项`)
                    }}
                    disabled={isGeneratingTraining}
                  >
                    <PlayCircle size={14} />
                    练这题
                  </button>
                  <button className="ghost-button compact" type="button" onClick={() => onRemoveItem(item.id)}>
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function normalizeScore(score?: number): number {
  return typeof score === 'number' ? score : 101
}

function formatDateTime(time: number): string {
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
