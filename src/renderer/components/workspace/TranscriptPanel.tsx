import { ClipboardList, Loader2, MessageSquareText, Send } from 'lucide-react'
import { formatTime, type ListeningMode, type QueuedAnswer } from '../../lib/appHelpers'
import type { TranscriptLine } from '../../../shared/types'
import { AudioSettingsPanel, type AudioSettingsPanelProps } from './AudioSettingsPanel'
import { InterviewControls } from './InterviewControls'

type TranscriptPanelProps = {
  audioSettings: AudioSettingsPanelProps
  autoAnswer: boolean
  interimTranscript: string
  isGenerating: boolean
  isListening: boolean
  isTranscriptPaused: boolean
  latestTranscript: TranscriptLine[]
  listeningMode: ListeningMode | null
  questionRewriteNotice: string
  questionIntentNotice: string
  contextCompressionNotice: string
  pausedTranscriptCount: number
  question: string
  queuedCount: number
  queuedAnswers: QueuedAnswer[]
  transcriptError: string
  onAddManualQuestion: () => void
  onGenerateAnswer: () => void
  onQuestionChange: (value: string) => void
  onStartAudioTranscription: (source: ListeningMode) => void
  onStartNewSession: () => void
  onStopAudioTranscription: () => void
  onToggleTranscriptPause: () => void
  onToggleAutoAnswer: () => void
}

export function TranscriptPanel({
  audioSettings,
  autoAnswer,
  interimTranscript,
  isGenerating,
  isListening,
  isTranscriptPaused,
  latestTranscript,
  listeningMode,
  questionRewriteNotice,
  questionIntentNotice,
  contextCompressionNotice,
  pausedTranscriptCount,
  question,
  queuedCount,
  queuedAnswers,
  transcriptError,
  onAddManualQuestion,
  onGenerateAnswer,
  onQuestionChange,
  onStartAudioTranscription,
  onStartNewSession,
  onStopAudioTranscription,
  onToggleTranscriptPause,
  onToggleAutoAnswer
}: TranscriptPanelProps): JSX.Element {
  const sourceLabel = listeningMode === 'system' ? '电脑音频' : listeningMode === 'microphone' ? '麦克风' : '未开启'

  return (
    <div className="panel transcript-panel" data-onboarding-target="workspace-transcript">
      <div className="panel-heading transcript-panel-heading">
        <div>
          <span className="eyebrow">Live Transcript</span>
          <h3>实时转写</h3>
          <p>先选择音频来源，再把识别到的问题送去生成回答；生成中遇到新问题会自动排队。</p>
        </div>
        <div className={`transcript-live-pill ${isListening ? 'on' : ''}`}>
          <span>{isListening ? '接收中' : '待机'}</span>
          <strong>{sourceLabel}</strong>
        </div>
      </div>

      <InterviewControls
        autoAnswer={autoAnswer}
        isListening={isListening}
        isTranscriptPaused={isTranscriptPaused}
        listeningMode={listeningMode}
        onStartAudioTranscription={onStartAudioTranscription}
        onStartNewSession={onStartNewSession}
        onStopAudioTranscription={onStopAudioTranscription}
        onToggleTranscriptPause={onToggleTranscriptPause}
        onToggleAutoAnswer={onToggleAutoAnswer}
      />

      <details className="transcript-audio-settings" data-onboarding-target="workspace-audio-settings">
        <summary>语音设置</summary>
        <AudioSettingsPanel {...audioSettings} />
      </details>

      <section className="current-question-card">
        <label className="field-block">
          <span>当前问题</span>
          <textarea value={question} onChange={(event) => onQuestionChange(event.target.value)} placeholder="也可以手动粘贴面试官问题..." rows={2} />
        </label>
        <div className="button-row transcript-action-row">
          <button className="ghost-button" type="button" onClick={onAddManualQuestion}>
            <ClipboardList size={16} />
            加入转写
          </button>
          <button className="primary-button" type="button" onClick={onGenerateAnswer} disabled={isGenerating || !question.trim()}>
            {isGenerating ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
            生成回答
          </button>
        </div>
      </section>

      <section className="transcript-feed-card">
        <div className="transcript-feed-head">
          <div>
            <span>实时记录</span>
            <strong>{latestTranscript.length > 0 ? `${latestTranscript.length} 条转写` : '还没有转写内容'}</strong>
          </div>
          {queuedCount > 0 && <em>队列 {queuedCount}</em>}
        </div>

        {queuedAnswers.length > 0 && (
          <div className="transcript-queue-strip" aria-label="待生成问题队列">
            {queuedAnswers.slice(0, 4).map((item, index) => (
              <span key={item.id} title={item.question}>
                待生成 {index + 1} · {item.question}
              </span>
            ))}
            {queuedAnswers.length > 4 && <strong>+{queuedAnswers.length - 4}</strong>}
          </div>
        )}

        <div className="transcript-list">
          {latestTranscript.length === 0 ? (
            <div className="empty-state transcript-empty-state">
              <MessageSquareText size={28} />
              <p>点击“麦克风转写”或“电脑音频转写”开始接收；没有 Key 时，也可以先手动输入问题测试回答效果。</p>
            </div>
          ) : (
            latestTranscript.map((line) => (
              <article className="transcript-line" key={line.id}>
                <span>{formatTime(line.at)}</span>
                <p>{line.text}</p>
              </article>
            ))
          )}
          {interimTranscript && (
            <article className="transcript-line interim">
              <span>识别中</span>
              <p>{interimTranscript}</p>
            </article>
          )}
        </div>
      </section>

      <div className="transcript-notice-stack">
        {isTranscriptPaused && (
          <p className="inline-note">
            已暂停接收，新的转写不会进入会话，也不会触发自动回答{pausedTranscriptCount > 0 ? `；已拦截 ${pausedTranscriptCount} 条。` : '。'}
          </p>
        )}
        {questionRewriteNotice && <p className="inline-note">{questionRewriteNotice}</p>}
        {questionIntentNotice && <p className="inline-note">{questionIntentNotice}</p>}
        {contextCompressionNotice && <p className="inline-note">{contextCompressionNotice}</p>}
        {transcriptError && <p className="inline-error">{transcriptError}</p>}
        {queuedCount > 0 && <p className="inline-note">已暂存 {queuedCount} 个新问题，当前答案完成后会按顺序自动继续；右侧“待生成”标签可查看排队问题。</p>}
      </div>
    </div>
  )
}
