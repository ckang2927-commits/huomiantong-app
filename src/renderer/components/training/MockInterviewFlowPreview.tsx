import { Mic, PlayCircle, Square, Volume2 } from 'lucide-react'
import type { MockInterviewConfig } from '../../lib/mockInterviewConfigStore'

type MockInterviewFlowPreviewProps = {
  config: MockInterviewConfig
  activeQuestion?: string
  isSupported: boolean
  isSpeaking: boolean
  autoSpeak: boolean
  selectedVoiceLabel: string
  onSpeakIntro: () => void
  onSpeakQuestion: () => void
  onStop: () => void
  onToggleAutoSpeak: () => void
}

const flowSteps = [
  { id: 1, label: '开场', hint: 'AI 面试官先说明规则和节奏' },
  { id: 2, label: '提问', hint: '语音播报题目，同时在界面同步显示' },
  { id: 3, label: '回答', hint: '你用麦克风作答，系统实时记录' },
  { id: 4, label: '反馈', hint: '每题结束后给参考答案和点评' },
  { id: 5, label: '追问/下一题', hint: '根据回答随机追问或继续下一题' }
]

export function MockInterviewFlowPreview({
  config,
  activeQuestion,
  isSupported,
  isSpeaking,
  autoSpeak,
  selectedVoiceLabel,
  onSpeakIntro,
  onSpeakQuestion,
  onStop,
  onToggleAutoSpeak
}: MockInterviewFlowPreviewProps): JSX.Element {
  return (
    <section className="mock-flow-panel">
      <div className="training-section-title">
        <div>
          <span className="eyebrow">AI Interview Flow</span>
          <h3>拟真面试播报预览</h3>
        </div>
        <span className={isSpeaking ? 'status-pill thinking' : 'status-pill idle'}>{isSpeaking ? 'AI 正在播报' : '等待播报'}</span>
      </div>

      <div className="mock-flow-layout">
        <div className="mock-flow-sequence">
          {flowSteps.map((step) => (
            <article className={`mock-flow-step ${step.id <= 2 ? 'active' : ''}`} key={step.id}>
              <strong>0{step.id}</strong>
              <div>
                <span>{step.label}</span>
                <p>{step.hint}</p>
              </div>
            </article>
          ))}
        </div>

        <aside className="mock-flow-side">
          <div className="mock-flow-meta">
            <strong>
              {config.durationMinutes} 分钟 · {config.questionCount} 题
            </strong>
            <span>
              {config.difficulty === 'pressure'
                ? '压力面节奏'
                : config.difficulty === 'hard'
                  ? '偏难节奏'
                  : config.difficulty === 'easy'
                    ? '轻松节奏'
                    : '标准节奏'}
            </span>
            <p>面试官风格：{styleLabel(config.interviewerStyle)}；追问策略：{strategyLabel(config.questionStrategy)}。</p>
          </div>

          <div className="mock-flow-question">
            <span className="eyebrow">当前题目</span>
            <strong>{activeQuestion || '还没有开始正式提问'}</strong>
            <p>{activeQuestion ? '可以先点“朗读当前题目”，把线上面试的节奏拉起来。' : '开始训练后，这里会显示面试官正在问的题目。'}</p>
          </div>

          <div className="mock-flow-actions">
            <button className="primary-button compact" type="button" onClick={onSpeakIntro} disabled={!isSupported}>
              <PlayCircle size={15} />
              朗读开场
            </button>
            <button className="ghost-button compact" type="button" onClick={onSpeakQuestion} disabled={!isSupported || !activeQuestion}>
              <Volume2 size={15} />
              朗读当前题目
            </button>
            <button className={autoSpeak ? 'toggle-button compact on' : 'toggle-button compact'} type="button" onClick={onToggleAutoSpeak} disabled={!isSupported}>
              <Mic size={15} />
              {autoSpeak ? '自动播报已开' : '自动播报下一题'}
            </button>
            <button className="ghost-button compact" type="button" onClick={onStop} disabled={!isSpeaking}>
              <Square size={14} />
              停止播报
            </button>
          </div>

          <div className="mock-flow-status">
            <span>{isSupported ? '浏览器语音播报可用' : '当前环境不支持语音播报'}</span>
            <small>{isSupported ? `当前声音：${selectedVoiceLabel}` : '需要系统语音组件可用后才能朗读。'}</small>
          </div>
        </aside>
      </div>
    </section>
  )
}

function styleLabel(value: MockInterviewConfig['interviewerStyle']): string {
  switch (value) {
    case 'warm':
      return '温和型'
    case 'followUp':
      return '追问型'
    case 'pressure':
      return '压力型'
    case 'techLead':
      return '技术主管型'
    case 'hr':
      return 'HR 型'
    default:
      return '随机混合'
  }
}

function strategyLabel(value: MockInterviewConfig['questionStrategy']): string {
  switch (value) {
    case 'fixed':
      return '固定走题'
    case 'adaptive':
      return '根据回答追问'
    default:
      return '随机混合'
  }
}
