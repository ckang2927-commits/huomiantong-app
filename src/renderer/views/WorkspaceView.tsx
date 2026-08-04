import { BriefcaseBusiness, Flame, FolderCheck, UserRound } from 'lucide-react'
import { AnswerPanel } from '../components/workspace/AnswerPanel'
import type { AudioSettingsPanelProps } from '../components/workspace/AudioSettingsPanel'
import { EvidenceRiskPanel } from '../components/workspace/EvidenceRiskPanel'
import { TranscriptPanel } from '../components/workspace/TranscriptPanel'
import type { CachedAnswer } from '../lib/interviewWarmupCache'
import type { ReviewSummary } from '../components/workspace/types'
import { resumeLabel, type ListeningMode, type QueuedAnswer } from '../lib/appHelpers'
import type {
  AppSettings,
  CompletedAnswer,
  InterviewSession,
  PreparedAnswer,
  TranscriptLine,
  WarmupQuestionCount
} from '../../shared/types'

type WorkspaceViewProps = {
  audioSettings: AudioSettingsPanelProps
  resume: AppSettings['resume']
  latestTranscript: TranscriptLine[]
  session: InterviewSession
  question: string
  prepared: PreparedAnswer | null
  completed: CompletedAnswer | null
  review: ReviewSummary
  hasResume: boolean
  isListening: boolean
  isTranscriptPaused: boolean
  listeningMode: ListeningMode | null
  autoAnswer: boolean
  interimTranscript: string
  transcriptError: string
  questionRewriteNotice: string
  questionIntentNotice: string
  contextCompressionNotice: string
  pausedTranscriptCount: number
  queuedCount: number
  queuedAnswers: QueuedAnswer[]
  isGenerating: boolean
  streamingText: string
  latencyReport: { firstTokenMs?: number; totalMs?: number } | null
  onSwitchResume: (field?: 'candidateName' | 'targetRole') => void
  onStartAudioTranscription: (source: ListeningMode) => void
  onStopAudioTranscription: () => void
  onToggleTranscriptPause: () => void
  onToggleAutoAnswer: () => void
  onStartNewSession: () => void
  onQuestionChange: (value: string) => void
  onAddManualQuestion: () => void
  onGenerateAnswer: () => void
  warmupAnswers: CachedAnswer[]
  warmupIsGenerating: boolean
  warmupIsPaused: boolean
  warmupProgress: { done: number; total: number }
  warmupHasCache: boolean
  warmupCachedAt: number | null
  warmupQuestionCount: WarmupQuestionCount
  onWarmupQuestionCountChange: (count: WarmupQuestionCount) => void
  onStartWarmup: () => void
  onPauseWarmup: () => void
  onClearWarmupCache: () => void
  onExportCurrentReview: () => void
}

export function WorkspaceView({
  audioSettings,
  resume,
  latestTranscript,
  session,
  question,
  prepared,
  completed,
  review,
  hasResume,
  isListening,
  isTranscriptPaused,
  listeningMode,
  autoAnswer,
  interimTranscript,
  transcriptError,
  questionRewriteNotice,
  questionIntentNotice,
  contextCompressionNotice,
  pausedTranscriptCount,
  queuedCount,
  queuedAnswers,
  isGenerating,
  streamingText,
  latencyReport,
  onSwitchResume,
  onStartAudioTranscription,
  onStopAudioTranscription,
  onToggleTranscriptPause,
  onToggleAutoAnswer,
  onStartNewSession,
  onQuestionChange,
  onAddManualQuestion,
  onGenerateAnswer,
  warmupAnswers,
  warmupIsGenerating,
  warmupIsPaused,
  warmupProgress,
  warmupHasCache,
  warmupCachedAt,
  warmupQuestionCount,
  onWarmupQuestionCountChange,
  onStartWarmup,
  onPauseWarmup,
  onClearWarmupCache,
  onExportCurrentReview
}: WorkspaceViewProps): JSX.Element {
  const warmupOptions: WarmupQuestionCount[] = [30, 50, 100]
  const warmupPrimaryLabel = warmupIsPaused
    ? '继续预热'
    : warmupIsGenerating
      ? `预热中 ${warmupProgress.done}/${warmupProgress.total}`
      : `开始预热 ${warmupQuestionCount} 题`
  const materialCount =
    (resume.formalResume.trim() ? 1 : 0) +
    (resume.detailedResume.trim() ? 1 : 0) +
    (resume.otherResumes?.length || 0)
  const materialLabel = hasResume
    ? `已准备 ${materialCount || 1} 份资料`
    : '缺少简历资料'
  const warmupStateLabel = warmupIsGenerating
    ? `生成 ${warmupProgress.done}/${warmupProgress.total}`
    : warmupHasCache
      ? `已缓存 ${warmupAnswers.length} 题`
      : '未预热'

  return (
    <>
      <section className="workspace-summary-strip" data-onboarding-target="workspace">
        <div className="workspace-summary-copy">
          <span className="eyebrow">面试台</span>
          <h2>实时面试工作台</h2>
          <p>先确认候选人、岗位、依据和预热缓存，再进入临场回答。</p>
        </div>
        <div className="workspace-summary-metrics">
          <button className="workspace-summary-cell workspace-summary-person" data-onboarding-target="workspace-candidate" type="button" onClick={() => onSwitchResume('candidateName')}>
            <span className="workspace-summary-icon"><UserRound size={16} /></span>
            <span>当前候选人</span>
            <strong>{resumeLabel(resume)}</strong>
            <small>点击切换简历</small>
          </button>
          <button className="workspace-summary-cell workspace-summary-role" data-onboarding-target="workspace-role" type="button" onClick={() => onSwitchResume('targetRole')}>
            <span className="workspace-summary-icon"><BriefcaseBusiness size={16} /></span>
            <span>目标岗位</span>
            <strong>{resume.targetRole || '未指定'}</strong>
            <small>点击编辑岗位</small>
          </button>
          <div className="workspace-summary-cell workspace-summary-evidence">
            <span className="workspace-summary-icon"><FolderCheck size={16} /></span>
            <div className="workspace-summary-cell-head">
              <span>依据状态</span>
              {warmupHasCache && <span className="warmup-cache-inline">已缓存 {warmupAnswers.length} 题</span>}
            </div>
            <strong>{materialLabel}</strong>
            {warmupCachedAt && (
              <small>上次预热 {new Date(warmupCachedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</small>
            )}
            {!warmupCachedAt && <small>{hasResume ? '回答会优先引用资料' : '建议先导入简历'}</small>}
          </div>
          <div className="workspace-summary-cell workspace-summary-actions" data-onboarding-target="workspace-warmup">
            <span className="workspace-summary-icon"><Flame size={16} /></span>
            <div className="workspace-summary-cell-head">
              <span>面试预热题目</span>
              <span className="warmup-cache-inline">{warmupStateLabel}</span>
            </div>
            <div className="warmup-selector-row">
              {warmupOptions.map((count) => (
                <button
                  key={count}
                  className={`warmup-count-pill${warmupQuestionCount === count ? ' active' : ''}`}
                  type="button"
                  onClick={() => onWarmupQuestionCountChange(count)}
                  disabled={warmupIsGenerating}
                >
                  {count}
                </button>
              ))}
            </div>
            <div className="warmup-actions-inline">
              <button
                className="ghost-button compact"
                type="button"
                onClick={onStartWarmup}
                disabled={warmupIsGenerating && !warmupIsPaused}
              >
                {warmupPrimaryLabel}
              </button>
              {warmupIsGenerating && !warmupIsPaused && (
                <button className="ghost-button compact" type="button" onClick={onPauseWarmup}>
                  暂停
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="workspace-grid">
        <TranscriptPanel
          audioSettings={audioSettings}
          autoAnswer={autoAnswer}
          interimTranscript={interimTranscript}
          isGenerating={isGenerating}
          isListening={isListening}
          isTranscriptPaused={isTranscriptPaused}
          latestTranscript={latestTranscript}
          listeningMode={listeningMode}
          questionRewriteNotice={questionRewriteNotice}
          questionIntentNotice={questionIntentNotice}
          contextCompressionNotice={contextCompressionNotice}
          pausedTranscriptCount={pausedTranscriptCount}
          onAddManualQuestion={onAddManualQuestion}
          onGenerateAnswer={onGenerateAnswer}
          onQuestionChange={onQuestionChange}
          onStartAudioTranscription={onStartAudioTranscription}
          onStartNewSession={onStartNewSession}
          onStopAudioTranscription={onStopAudioTranscription}
          onToggleTranscriptPause={onToggleTranscriptPause}
          onToggleAutoAnswer={onToggleAutoAnswer}
          question={question}
          queuedCount={queuedCount}
          queuedAnswers={queuedAnswers}
          transcriptError={transcriptError}
        />
        <AnswerPanel
          completed={completed}
          hasResume={hasResume}
          prepared={prepared}
          queuedAnswers={queuedAnswers}
          resume={resume}
          sessionAnswers={session.answers}
          isGenerating={isGenerating}
          streamingText={streamingText}
        />
        <EvidenceRiskPanel
          completed={completed}
          hasResume={hasResume}
          resume={resume}
          review={review}
          sessionAnswerCount={session.answers.length}
          isGenerating={isGenerating}
          latencyReport={latencyReport}
          onExportCurrentReview={onExportCurrentReview}
        />
      </section>
    </>
  )
}
