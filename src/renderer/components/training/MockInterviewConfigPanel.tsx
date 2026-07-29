import { RotateCcw, Save } from 'lucide-react'
import {
  defaultMockInterviewConfig,
  mockInterviewFocusOptions,
  type MockInterviewConfig,
  type MockInterviewDifficulty,
  type MockInterviewerStyle,
  type MockQuestionStrategy
} from '../../lib/mockInterviewConfigStore'

const durationOptions = [10, 20, 30, 45, 60]
const questionCountOptions = [5, 10, 15, 20]

const difficultyOptions: Array<{ value: MockInterviewDifficulty; label: string; hint: string }> = [
  { value: 'easy', label: '简单', hint: '以基础问题为主' },
  { value: 'medium', label: '中等', hint: '接近普通线上面试' },
  { value: 'hard', label: '偏难', hint: '增加项目和技术追问' },
  { value: 'pressure', label: '压力面', hint: '更强调质疑和临场稳定' }
]

const interviewerStyleOptions: Array<{ value: MockInterviewerStyle; label: string }> = [
  { value: 'warm', label: '温和型' },
  { value: 'followUp', label: '追问型' },
  { value: 'pressure', label: '压力型' },
  { value: 'techLead', label: '技术主管型' },
  { value: 'hr', label: 'HR 型' },
  { value: 'random', label: '随机混合' }
]

const questionStrategyOptions: Array<{ value: MockQuestionStrategy; label: string; hint: string }> = [
  { value: 'fixed', label: '固定走题', hint: '按题纲顺序完成' },
  { value: 'adaptive', label: '根据回答追问', hint: '围绕你的回答继续深挖' },
  { value: 'mixed', label: '随机混合', hint: '固定题与追问随机切换' }
]

type MockInterviewConfigPanelProps = {
  config: MockInterviewConfig
  disabled?: boolean
  onChange: (config: MockInterviewConfig) => void
  onSave: () => void
  onReset: () => void
}

export function MockInterviewConfigPanel({ config, disabled = false, onChange, onSave, onReset }: MockInterviewConfigPanelProps): JSX.Element {
  const isCustomDuration = !durationOptions.includes(config.durationMinutes)
  const isCustomQuestionCount = !questionCountOptions.includes(config.questionCount)

  function update(patch: Partial<MockInterviewConfig>): void {
    onChange({ ...config, ...patch })
  }

  function toggleFocus(item: string): void {
    const nextFocus = config.focus.includes(item) ? config.focus.filter((value) => value !== item) : [...config.focus, item]
    update({ focus: nextFocus.length > 0 ? nextFocus : [item] })
  }

  return (
    <section className="mock-interview-config-panel">
      <div className="training-section-title">
        <div>
          <span className="eyebrow">Realistic Interview Setup</span>
          <h3>拟真面试配置</h3>
        </div>
        <span className="status-pill idle">先保存配置，再接入正式流程</span>
      </div>

      <div className="mock-config-layout">
        <div className="mock-config-fields">
          <div className="mock-config-block">
            <div className="mock-config-label">
              <strong>面试时长</strong>
              <span>控制整场节奏，结束后自动进入复盘</span>
            </div>
            <div className="mock-choice-grid five">
              {durationOptions.map((duration) => (
                <button
                  className={config.durationMinutes === duration ? 'selected' : ''}
                  disabled={disabled}
                  key={duration}
                  onClick={() => update({ durationMinutes: duration })}
                  type="button"
                >
                  {duration} 分钟
                </button>
              ))}
            </div>
            <label className="mock-inline-number">
              <span>自定义</span>
              <input
                type="number"
                min={5}
                max={180}
                value={isCustomDuration ? config.durationMinutes : ''}
                placeholder="分钟"
                disabled={disabled}
                onChange={(event) => update({ durationMinutes: Number(event.target.value) || 5 })}
              />
            </label>
          </div>

          <div className="mock-config-block">
            <div className="mock-config-label">
              <strong>题目数量</strong>
              <span>后续会和主动提问、追问调度器联动</span>
            </div>
            <div className="mock-choice-grid four">
              {questionCountOptions.map((count) => (
                <button
                  className={config.questionCount === count ? 'selected' : ''}
                  disabled={disabled}
                  key={count}
                  onClick={() => update({ questionCount: count })}
                  type="button"
                >
                  {count} 题
                </button>
              ))}
            </div>
            <label className="mock-inline-number">
              <span>自定义</span>
              <input
                type="number"
                min={3}
                max={40}
                value={isCustomQuestionCount ? config.questionCount : ''}
                placeholder="题"
                disabled={disabled}
                onChange={(event) => update({ questionCount: Number(event.target.value) || 3 })}
              />
            </label>
          </div>

          <div className="mock-config-block">
            <div className="mock-config-label">
              <strong>面试难度</strong>
              <span>影响问题复杂度、追问深度和评分标准</span>
            </div>
            <div className="mock-choice-grid four">
              {difficultyOptions.map((option) => (
                <button
                  className={config.difficulty === option.value ? 'selected' : ''}
                  disabled={disabled}
                  key={option.value}
                  onClick={() => update({ difficulty: option.value })}
                  type="button"
                >
                  <strong>{option.label}</strong>
                  <span>{option.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mock-config-block">
            <div className="mock-config-label">
              <strong>面试侧重点</strong>
              <span>可以多选，系统后续按这些方向组织题目</span>
            </div>
            <div className="mock-focus-options">
              {mockInterviewFocusOptions.map((item) => (
                <button
                  className={config.focus.includes(item) ? 'selected' : ''}
                  disabled={disabled}
                  key={item}
                  onClick={() => toggleFocus(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mock-config-select-row">
            <label className="field-block">
              <span>面试官风格</span>
              <select value={config.interviewerStyle} disabled={disabled} onChange={(event) => update({ interviewerStyle: event.target.value as MockInterviewerStyle })}>
                {interviewerStyleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-block">
              <span>追问策略</span>
              <select value={config.questionStrategy} disabled={disabled} onChange={(event) => update({ questionStrategy: event.target.value as MockQuestionStrategy })}>
                {questionStrategyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} · {option.hint}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <aside className="mock-config-preview">
          <span className="eyebrow">Session Preview</span>
          <h4>线上拟真面试</h4>
          <strong>
            {config.durationMinutes} 分钟 · {config.questionCount} 题
          </strong>
          <p>
            {difficultyOptions.find((option) => option.value === config.difficulty)?.label}难度，
            {interviewerStyleOptions.find((option) => option.value === config.interviewerStyle)?.label}面试官，
            {questionStrategyOptions.find((option) => option.value === config.questionStrategy)?.label}。
          </p>
          <div className="mock-preview-tags">
            {config.focus.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <ul>
            <li>面试官主动语音提问，问题同步文字展示</li>
            <li>你通过麦克风回答，系统实时记录回答内容</li>
            <li>每题完成后再展示参考答案与点评</li>
          </ul>
          <div className="mock-config-actions">
            <button className="primary-button compact" type="button" onClick={onSave} disabled={disabled}>
              <Save size={15} />
              保存配置
            </button>
            <button className="ghost-button compact" type="button" onClick={onReset} disabled={disabled}>
              <RotateCcw size={15} />
              恢复默认
            </button>
          </div>
          <p className="mock-config-note">这一版先完成配置和本机保存；主动语音提问、结束判断、追问调度会在后续步骤接入。</p>
        </aside>
      </div>
    </section>
  )
}

export function getDefaultMockInterviewConfig(): MockInterviewConfig {
  return { ...defaultMockInterviewConfig, focus: [...defaultMockInterviewConfig.focus] }
}
