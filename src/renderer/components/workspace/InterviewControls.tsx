import { Mic, PauseCircle, Play, RefreshCw, Sparkles, Volume2 } from 'lucide-react'
import type { ListeningMode } from '../../lib/appHelpers'

type InterviewControlsProps = {
  autoAnswer: boolean
  isListening: boolean
  listeningMode: ListeningMode | null
  isTranscriptPaused: boolean
  onStartAudioTranscription: (source: ListeningMode) => void
  onStartNewSession: () => void
  onStopAudioTranscription: () => void
  onToggleTranscriptPause: () => void
  onToggleAutoAnswer: () => void
}

export function InterviewControls({
  autoAnswer,
  isListening,
  listeningMode,
  isTranscriptPaused,
  onStartAudioTranscription,
  onStartNewSession,
  onStopAudioTranscription,
  onToggleTranscriptPause,
  onToggleAutoAnswer
}: InterviewControlsProps): JSX.Element {
  return (
    <div className="interview-control-console">
      <div className="control-console-head">
        <div>
          <span>转写来源</span>
          <strong>{isListening ? (listeningMode === 'system' ? '电脑音频接收中' : '麦克风接收中') : '等待开启'}</strong>
        </div>
        <button className="ghost-button compact" type="button" onClick={onStartNewSession}>
          <RefreshCw size={15} />
          新会话
        </button>
      </div>

      <div className="control-source-grid">
        <button
          className={`control-tile ${listeningMode === 'microphone' ? 'on' : ''}`}
          disabled={isListening && listeningMode !== 'microphone'}
          type="button"
          onClick={() => (listeningMode === 'microphone' ? onStopAudioTranscription() : onStartAudioTranscription('microphone'))}
        >
          <Mic size={17} />
          <span>{listeningMode === 'microphone' ? '停止麦克风' : '麦克风转写'}</span>
          <small>练习 / 线下面试</small>
        </button>
        <button
          className={`control-tile ${listeningMode === 'system' ? 'on' : ''}`}
          disabled={isListening && listeningMode !== 'system'}
          type="button"
          onClick={() => (listeningMode === 'system' ? onStopAudioTranscription() : onStartAudioTranscription('system'))}
        >
          <Volume2 size={17} />
          <span>{listeningMode === 'system' ? '停止电脑音频' : '电脑音频转写'}</span>
          <small>线上面试优先</small>
        </button>
      </div>

      <div className="control-mode-row">
        <button className={`toggle-button ${autoAnswer ? 'on' : ''}`} type="button" onClick={onToggleAutoAnswer}>
          <Sparkles size={15} />
          {autoAnswer ? '自动回答开' : '自动回答关'}
        </button>
        <button className={`toggle-button ${isTranscriptPaused ? 'on' : ''}`} type="button" onClick={onToggleTranscriptPause}>
          {isTranscriptPaused ? <Play size={15} /> : <PauseCircle size={15} />}
          {isTranscriptPaused ? '继续接收' : '暂停接收'}
        </button>
      </div>
    </div>
  )
}
