import { ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { useSettingsStore } from '../../stores/useSettingsStore'

export function PrivacySettingsPanel(): JSX.Element {
  const privacyMode = useSettingsStore((s) => s.settings.answer.privacyMode ?? false)
  const updateAnswer = useSettingsStore((s) => s.updateAnswer)

  return (
    <div className="panel settings-panel privacy-settings-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Privacy</span>
          <h3>隐私与安全</h3>
        </div>
      </div>
      <div className="privacy-settings">
        <label className="toggle-row">
          <div>
            <strong>隐私模式</strong>
            <p className="toggle-desc">启用后导出浏览器和悬浮窗将隐藏候选人姓名、公司名等敏感信息。不会影响回答质量。</p>
          </div>
          <button
            className={"toggle-switch" + (privacyMode ? " active" : "")}
            onClick={() => updateAnswer({ privacyMode: !privacyMode })}
            type="button"
            role="switch"
            aria-checked={privacyMode}
          >
            <span className="toggle-knob" />
          </button>
        </label>
        <div className="privacy-info">
          {privacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
          <span>
            {privacyMode
              ? "当前已启用隐私模式，导出和悬浮窗中的姓名/公司名将被替换。"
              : "隐私模式关闭状态下，导出和悬浮窗展示完整信息。请确保在安全环境下使用。"
            }
          </span>
        </div>
        <div className="privacy-info">
          <ShieldCheck size={16} />
          <span>API Key 使用操作系统安全存储加密。所有数据存储在本地，不会自动上传。</span>
        </div>
      </div>
    </div>
  )
}

