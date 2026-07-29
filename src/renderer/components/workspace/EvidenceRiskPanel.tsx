import { ClipboardList, Download, ShieldAlert, Sparkles, Target } from 'lucide-react'
import type { AppSettings, CompletedAnswer } from '../../../shared/types'
import type { ReviewSummary } from './types'

type EvidenceRiskPanelProps = {
  completed: CompletedAnswer | null
  hasResume: boolean
  resume: AppSettings['resume']
  review: ReviewSummary
  sessionAnswerCount: number
  isGenerating: boolean
  latencyReport: { firstTokenMs?: number; totalMs?: number } | null
  onExportCurrentReview: () => void
}

export function EvidenceRiskPanel({
  completed,
  hasResume,
  resume,
  review,
  sessionAnswerCount,
  isGenerating,
  latencyReport,
  onExportCurrentReview
}: EvidenceRiskPanelProps): JSX.Element {
  const evidenceCount = completed?.evidence.length ?? 0
  const riskLevel = completed?.risk?.level ?? 'low'
  const riskLabel = riskLevel === 'high' ? '高风险' : riskLevel === 'medium' ? '中风险' : '低风险'
  const riskTone = riskLevel === 'high' ? 'high' : riskLevel === 'medium' ? 'medium' : 'low'
  const firstTokenMs = latencyReport?.firstTokenMs
  const totalMs = latencyReport?.totalMs
  const latencyText = firstTokenMs ?? totalMs ? `${firstTokenMs ?? totalMs}ms` : '待统计'

  const coreStrategy =
    riskLevel === 'high'
      ? '先稳住，再讲通用能力，避免编造细节。'
      : riskLevel === 'medium'
        ? '先说结论，再补过程，细节用范围表达。'
        : '先自然作答，结论放前面，经历放后面。'

  const answerSteps = [
    '先用一句话回答问题，不要一上来铺背景。',
    evidenceCount > 0 ? '能对上的经历就直接讲证据，不够的地方用简历里的真实材料补齐。' : '没有依据时，用“我通常会 / 我的做法是”这类安全泛化表达。',
    riskLevel === 'high' ? '遇到数字、公司名、项目结果，先停一下，确认简历里有没有依据。' : '最后补一句和岗位匹配的能力点，别把话题带偏。'
  ]

  const riskTips = [
    riskLevel === 'high' ? '不要硬编时间、人数、金额和公司内部细节。' : '保持自然，不要把答案说成背稿。',
    riskLevel === 'medium' ? '细节不确定时，改成“范围 + 过程 + 结果”说法。' : '先讲结论，再补过程，语气更像真人。',
    hasResume ? '优先用正式简历、万字简历和其他简历里的真实材料。' : '先导入简历，再让系统帮你收敛答案。'
  ]

  const evidenceChips = completed?.evidence.slice(0, 3).map((item) => item.sourceLabel || (item.source === 'formal' ? '正式简历' : item.source === 'detailed' ? '万字简历' : '其他简历')) ?? []
  const riskReasons = completed?.risk?.reasons ?? []
  const unsupportedClaims = completed?.risk?.unsupportedClaims ?? []

  return (
    <aside className="panel strategy-panel compact-strategy-panel">
      <div className="panel-heading strategy-heading">
        <div>
          <span className="eyebrow">回答策略</span>
          <h3>轻提示 · 当前怎么答更稳</h3>
        </div>
      </div>

      <div className="strategy-summary">
        <div className="strategy-summary-main">
          <span>当前主策略</span>
          <strong>{coreStrategy}</strong>
          <span>{riskLabel} · {evidenceCount} 条依据 · {latencyText}</span>
        </div>
        <div className="strategy-summary-side">
          <span>当前状态</span>
          <strong>{isGenerating ? '正在生成回答' : hasResume ? '简历已加载' : '先导入简历'}</strong>
          <small>{resume.candidateName || '默认候选人'} · {resume.targetRole || '未设置岗位'} · {review.count} 题 / {sessionAnswerCount} 答</small>
        </div>
      </div>

      <div className={`strategy-block strategy-block-risk ${riskTone}`}>
        <div className="strategy-block-title">
          <ShieldAlert size={15} />
          这题先避什么
        </div>
        <ul className="strategy-list">
          {riskTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      <div className="strategy-section">
        <div className="strategy-section-title">
          <Target size={15} />
          回答顺序
        </div>
        <ul className="strategy-list">
          {answerSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </div>

      <div className="strategy-kpi-grid">
        <div className="strategy-kpi-card strategy-kpi-low">
          <span>依据</span>
          <strong>{evidenceCount}</strong>
          <small>{evidenceChips.length ? evidenceChips.join(' · ') : '暂无命中简历依据'}</small>
        </div>
        <div className={`strategy-kpi-card ${riskTone === 'high' ? 'strategy-kpi-high' : riskTone === 'medium' ? 'strategy-kpi-medium' : 'strategy-kpi-low'}`}>
          <span>风险</span>
          <strong>{riskLabel}</strong>
          <small>{riskReasons.length ? riskReasons[0] : '当前风险可控'} </small>
        </div>
        <div className="strategy-kpi-card strategy-kpi-low">
          <span>当前轮次</span>
          <strong>{sessionAnswerCount}</strong>
          <small>{review.avg ? `平均 ${review.avg} 分` : '还没有评分'}</small>
        </div>
      </div>

      <div className="strategy-section strategy-block-tight">
        <div className="strategy-section-title">
          <ClipboardList size={15} />
          依据摘要
        </div>
        {evidenceChips.length > 0 ? (
          <div className="strategy-chip-row">
            {evidenceChips.map((chip) => (
              <span key={chip}>{chip}</span>
            ))}
          </div>
        ) : (
          <p className="strategy-empty">当前没有命中依据，答题时先回到安全泛化表达。</p>
        )}
        {unsupportedClaims.length > 0 && (
          <p className="strategy-inline-note">系统检测到可疑细节：{unsupportedClaims.slice(0, 2).join('、')}。</p>
        )}
      </div>

      <div className="strategy-section strategy-block-risk low">
        <div className="strategy-section-title">
          <Sparkles size={15} />
          一句话建议
        </div>
        <p>{riskLevel === 'high' ? '先讲真实经历里能证明的部分，其余用“我通常会”收住。' : '先结论后过程，尽量说得像你自己，而不是像念稿。'}</p>
      </div>

      <button className="ghost-button compact strategy-export-button" type="button" onClick={onExportCurrentReview}>
        <Download size={15} />
        导出当前复盘
      </button>
    </aside>
  )
}
