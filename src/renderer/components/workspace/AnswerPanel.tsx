import { useEffect, useMemo, useState } from 'react'
import { Bot, CheckCircle2, Clock3, FileText, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { resumeLabel, type QueuedAnswer } from '../../lib/appHelpers'
import type { AppSettings, CompletedAnswer, InterviewSession, PreparedAnswer } from '../../../shared/types'

type AnswerPanelProps = {
  completed: CompletedAnswer | null
  hasResume: boolean
  prepared: PreparedAnswer | null
  queuedAnswers: QueuedAnswer[]
  resume: AppSettings['resume']
  sessionAnswers: InterviewSession['answers']
  isGenerating: boolean
  streamingText: string
}

type AnswerSelection = 'live' | `history:${string}` | `queued:${string}`

export function AnswerPanel({
  completed,
  hasResume,
  prepared,
  queuedAnswers,
  resume,
  sessionAnswers,
  isGenerating,
  streamingText
}: AnswerPanelProps): JSX.Element {
  const [selectedAnswerId, setSelectedAnswerId] = useState<AnswerSelection>('live')

  const selectedHistoryAnswer = useMemo(() => {
    if (!selectedAnswerId.startsWith('history:')) return undefined
    const answerId = selectedAnswerId.replace('history:', '')
    return sessionAnswers.find((answer) => answer.id === answerId)
  }, [selectedAnswerId, sessionAnswers])

  const selectedQueuedAnswer = useMemo(() => {
    if (!selectedAnswerId.startsWith('queued:')) return undefined
    const queuedId = selectedAnswerId.replace('queued:', '')
    return queuedAnswers.find((answer) => answer.id === queuedId)
  }, [selectedAnswerId, queuedAnswers])

  useEffect(() => {
    if (isGenerating) {
      setSelectedAnswerId('live')
      return
    }

    if (selectedAnswerId.startsWith('history:') && !selectedHistoryAnswer) {
      setSelectedAnswerId('live')
    }

    if (selectedAnswerId.startsWith('queued:') && !selectedQueuedAnswer) {
      setSelectedAnswerId('live')
    }
  }, [isGenerating, selectedAnswerId, selectedHistoryAnswer, selectedQueuedAnswer])

  const isLiveSelected = selectedAnswerId === 'live'
  const waitingLine = prepared?.fastAnswer?.trim() || '稍等一下，我先把这个问题捋一遍。'
  const liveAnswerText = completed?.answer || '这里会显示结合正式简历、万字简历、其他资料和最近上下文整理后的回答。'
  const pendingAnswerText = selectedQueuedAnswer
    ? '这个问题已经排队了。当前问题答案生成完成后，系统会自动继续生成它；你也可以先点历史答案，查看上一问的回答。'
    : ''
  const displayAnswerText =
    selectedHistoryAnswer?.answer ||
    pendingAnswerText ||
    (isGenerating && isLiveSelected ? streamingText || 'AI 正在整理更自然的回答…' : liveAnswerText)
  const displayQuestion = selectedHistoryAnswer?.question || selectedQueuedAnswer?.question || (isLiveSelected ? '' : undefined)
  const providerLabel = selectedHistoryAnswer?.provider || (completed ? (completed.provider === 'local' ? '本地兜底' : completed.provider) : '等待生成')
  const latencyLabel = selectedHistoryAnswer
    ? formatTime(selectedHistoryAnswer.at)
    : selectedQueuedAnswer
      ? '排队中'
      : completed && completed.provider !== 'local'
        ? `${completed.latencyMs}ms`
        : completed?.provider === 'local'
          ? '本地生成'
          : '未开始'
  const evidenceCount = selectedHistoryAnswer?.evidence?.length ?? completed?.evidence.length ?? prepared?.evidence.length ?? 0
  const riskLevel = selectedHistoryAnswer?.risk?.level ?? completed?.risk?.level ?? 'low'
  const riskLabel = riskLevel === 'high' ? '高风险' : riskLevel === 'medium' ? '中风险' : '低风险'
  const qualityScore = selectedHistoryAnswer?.quality?.total ?? completed?.quality?.total
  const answerParagraphs = splitAnswerParagraphs(displayAnswerText)

  return (
    <div className="panel answer-panel workspace-answer-panel">
      <div className="panel-heading answer-panel-heading">
        <div>
          <span className="eyebrow">AI Answer</span>
          <h3>建议回答</h3>
        </div>
        <div className="answer-status-row">
          <div className="status-pill ready">{hasResume ? '简历已加载' : '等待导入简历'}</div>
          <div className="status-pill active-profile">当前：{resumeLabel(resume)}</div>
        </div>
      </div>

      <section className="answer-switch-board" aria-label="答案切换">
        <button className={selectedAnswerId === 'live' ? 'answer-switch-chip active' : 'answer-switch-chip'} type="button" onClick={() => setSelectedAnswerId('live')}>
          当前回答
        </button>
        {sessionAnswers.slice(0, 6).map((answer, index) => (
          <button
            className={selectedAnswerId === `history:${answer.id}` ? 'answer-switch-chip active' : 'answer-switch-chip'}
            key={answer.id}
            type="button"
            onClick={() => setSelectedAnswerId(`history:${answer.id}`)}
            title={answer.question}
          >
            已答 {index + 1}
          </button>
        ))}
        {queuedAnswers.map((item, index) => (
          <button
            className={selectedAnswerId === `queued:${item.id}` ? 'answer-switch-chip pending active-pending' : 'answer-switch-chip pending'}
            key={item.id}
            type="button"
            onClick={() => setSelectedAnswerId(`queued:${item.id}`)}
            title={item.question}
          >
            待生成 {index + 1}
          </button>
        ))}
      </section>

      <article className="answer-lead-box">
        <div className="answer-title">
          <Sparkles size={16} />
          等待话术
        </div>
        <p>{waitingLine}</p>
      </article>

      <article className={'answer-card main-answer' + (isGenerating && isLiveSelected ? ' streaming' : '')}>
        <div className="answer-main-head">
          <div className="answer-title">
            <Bot size={16} />
            {selectedHistoryAnswer ? '历史答案' : selectedQueuedAnswer ? '待生成问题' : '正式回答'}
          </div>
          <div className="answer-runtime-tags">
            {isGenerating && isLiveSelected && (
              <span className="streaming-indicator">
                <Loader2 className="spin" size={14} />
                生成中
              </span>
            )}
            <span>{latencyLabel}</span>
            <span>{selectedQueuedAnswer ? '等待队列' : providerLabel}</span>
          </div>
        </div>

        {displayQuestion && (
          <div className="answer-question-preview">
            <strong>问题：</strong>
            <span>{displayQuestion}</span>
          </div>
        )}

        <div className="answer-content">
          {answerParagraphs.map((paragraph, index) => (
            <p key={`${index}-${paragraph.slice(0, 10)}`}>{paragraph}</p>
          ))}
          {isGenerating && isLiveSelected && <span className="cursor-blink">|</span>}
        </div>
      </article>

      <div className="answer-insight-row">
        <AnswerInsight icon={<FileText size={14} />} label="依据" value={`${evidenceCount} 条`} />
        <AnswerInsight icon={<ShieldCheck size={14} />} label="风险" value={riskLabel} tone={riskLevel} />
        <AnswerInsight icon={<CheckCircle2 size={14} />} label="质量" value={typeof qualityScore === 'number' ? `${qualityScore} 分` : '待评分'} />
        <AnswerInsight icon={<Clock3 size={14} />} label="速度" value={latencyLabel} />
      </div>
    </div>
  )
}

function splitAnswerParagraphs(text: string): string[] {
  const paragraphs = text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return paragraphs.length ? paragraphs : ['这里会显示结合正式简历、万字简历、其他资料和最近上下文整理后的回答。']
}

function formatTime(value: number): string {
  return new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function AnswerInsight({
  icon,
  label,
  value,
  tone
}: {
  icon: JSX.Element
  label: string
  value: string
  tone?: 'low' | 'medium' | 'high'
}): JSX.Element {
  return (
    <div className={`answer-insight-card ${tone ?? ''}`}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
