import { ClipboardList, Download } from 'lucide-react'
import type { ReviewSummary } from './types'

type ReviewPanelProps = {
  review: ReviewSummary
  onExportCurrentReview: () => void
}

export function ReviewPanel({ review, onExportCurrentReview }: ReviewPanelProps): JSX.Element {
  return (
    <article className="answer-card review-card">
      <div className="answer-title">
        <ClipboardList size={16} />面试复盘报告<span>{review.count} 问 · 平均 {review.avg || '暂无'} 分</span>
      </div>
      <div className="review-stats">
        <div>
          <strong>{review.count}</strong>
          <span>问答数量</span>
        </div>
        <div>
          <strong>{review.avg || '-'}</strong>
          <span>平均评分</span>
        </div>
        <div>
          <strong>{review.risks}</strong>
          <span>中高风险</span>
        </div>
      </div>
      <button className="ghost-button compact" type="button" onClick={onExportCurrentReview}>
        <Download size={15} />导出复盘 MD
      </button>
    </article>
  )
}
