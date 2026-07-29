import { Save } from 'lucide-react'
import { modeOptions, providerNames } from '../../lib/appHelpers'
import { useSettingsStore } from '../../stores/useSettingsStore'
import type { AppSettings, InterviewMode, LlmProviderId } from '../../../shared/types'
import { RoleJdEditor } from './RoleJdEditor'

const answerStyleOptions: Array<{ value: AppSettings['answer']['answerStyle']; label: string }> = [
  { value: 'fast', label: '极速短答' },
  { value: 'standard', label: '标准回答' },
  { value: 'star', label: 'STAR 详细版' }
]

type ModelRouterPanelProps = {
  onGenerateRoleJdWithAi: (mode: InterviewMode) => void | Promise<void>
  generatingRoleJdMode: InterviewMode | null
}

export function ModelRouterPanel({
  onGenerateRoleJdWithAi,
  generatingRoleJdMode
}: ModelRouterPanelProps): JSX.Element {
  const settings = useSettingsStore((s) => s.settings)
  const settingsStatus = useSettingsStore((s) => s.settingsStatus)
  const updateAnswer = useSettingsStore((s) => s.updateAnswer)
  const saveSettings = useSettingsStore((s) => s.saveSettings)
  const selectedProvider = settings.answer.llmProvider

  return (
    <div className="panel settings-panel model-router-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Model Router</span>
          <h3>模型策略与回答偏好</h3>
        </div>
        <div className="settings-head-actions">
          <span className="settings-status">{settingsStatus}</span>
          <button className="primary-button" type="button" onClick={saveSettings}>
            <Save size={16} />保存设置
          </button>
        </div>
      </div>
      <div className="settings-section">
        <div className="settings-section-title">
          <strong>1. 默认回答模型</strong>
          <span>面试台、JD AI 深度生成、模拟训练都会优先走这里选中的模型。</span>
        </div>
        <div className="segmented model-provider-segmented">
          {(['deepseek', 'dashscope', 'openai', 'anthropic'] as LlmProviderId[]).map((provider) => (
            <button className={selectedProvider === provider ? 'selected' : ''} key={provider} onClick={() => updateAnswer({ llmProvider: provider })} type="button">
              {providerNames[provider]}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section-title">
          <strong>2. 岗位与 JD 策略</strong>
          <span>这里决定 AI 站在哪个岗位视角生成答案，也会影响预热缓存和复盘训练。</span>
        </div>
        <div className="preset-grid">
          {modeOptions.map((option) => (
            <button className={settings.answer.interviewMode === option.value ? 'selected' : ''} key={option.value} onClick={() => updateAnswer({ interviewMode: option.value })} type="button">
              <strong>{option.label}</strong>
              <span>{option.hint}</span>
            </button>
          ))}
        </div>
        <RoleJdEditor
          generatingRoleJdMode={generatingRoleJdMode}
          onGenerateRoleJdWithAi={onGenerateRoleJdWithAi}
          onUpdateAnswer={updateAnswer}
          settings={settings}
        />
      </div>

      <div className="settings-section">
        <div className="settings-section-title">
          <strong>3. 回答风格</strong>
          <span>建议日常用“极速短答”或“标准回答”，STAR 适合练习复盘，不适合实时太长。</span>
        </div>
        <div className="segmented answer-style-segmented">
          {answerStyleOptions.map((option) => (
            <button className={settings.answer.answerStyle === option.value ? 'selected' : ''} key={option.value} onClick={() => updateAnswer({ answerStyle: option.value })} type="button">
              {option.label}
            </button>
          ))}
        </div>
        <div className="settings-inline-grid">
          <div className="field">
            <label>回答语言</label>
            <select value={settings.answer.responseLanguage} onChange={(e) => updateAnswer({ responseLanguage: e.target.value as 'zh' | 'en' })}>
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="field">
            <label>快速答复预生成</label>
            <label className="toggle-row compact-toggle-row">
              <input checked={settings.answer.fastFirst} onChange={(e) => updateAnswer({ fastFirst: e.target.checked })} type="checkbox" />
              先显示稳场话术，再生成完整回答
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
