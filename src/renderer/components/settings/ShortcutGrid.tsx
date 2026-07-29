import { loadHotkeys, getActionLabel, hotkeyLabel, getDefaultHotkeys, type HotkeyAction } from '../../hooks/useGlobalHotkeys'
import { RotateCcw } from 'lucide-react'

const DISPLAY_ORDER: HotkeyAction[] = [
  'generateAnswer',
  'toggleListening',
  'toggleMute',
  'toggleFloating',
  'closeFloating',
  'saveSession',
  'navigateWorkspace',
  'navigateTraining',
  'navigateCheckup',
  'navigateResume',
  'navigateSettings',
  'navigateSessions',
]

const NAV_ACTIONS: HotkeyAction[] = ['navigateWorkspace', 'navigateTraining', 'navigateCheckup', 'navigateResume', 'navigateSettings', 'navigateSessions']

const ACTION_DESCRIPTIONS: Partial<Record<HotkeyAction, string>> = {
  generateAnswer: '在面试台输入问题后，按此快捷键提交生成回答',
  toggleListening: '开启或停止麦克风实时语音转写',
  toggleMute: '切换麦克风静音，避免自己的讲话继续进入转写',
  toggleFloating: '打开或关闭独立悬浮窗，显示当前问答',
  closeFloating: '关闭悬浮窗',
  saveSession: '保存当前面试会话到本地记录',
  navigateWorkspace: '切换到面试台页面',
  navigateTraining: '切换到模拟训练页面',
  navigateCheckup: '切换到作战室（面试前体检）',
  navigateResume: '切换到简历库页面',
  navigateSettings: '切换到设置页面',
  navigateSessions: '切换到会话记录页面',
}

function HotkeyRow({ action, binding }: { action: HotkeyAction; binding: ReturnType<typeof loadHotkeys>[HotkeyAction] }): JSX.Element {
  const parts = []
  if (binding.ctrl) parts.push(<kbd key="ctrl">Ctrl</kbd>)
  if (binding.shift) parts.push(<kbd key="shift">Shift</kbd>)
  if (binding.alt) parts.push(<kbd key="alt">Alt</kbd>)
  const displayKey = binding.key === 'Escape' ? 'Esc' : binding.key === 'Enter' ? 'Enter' : binding.key.toUpperCase()
  parts.push(<kbd key="key">{displayKey}</kbd>)

  return (
    <span className="shortcut-row">
      <span className="shortcut-keys">
        {parts.map((el, i) => (
          <span key={i}>
            {i > 0 && <> + </>}
            {el}
          </span>
        ))}
      </span>
      <span className="shortcut-label">{getActionLabel(action)}</span>
      <span className="shortcut-desc">{ACTION_DESCRIPTIONS[action] || ""}</span>
    </span>
  )
}

export function ShortcutGrid(): JSX.Element {
  const bindings = loadHotkeys()
  const defaultBindings = getDefaultHotkeys()
  const hasCustom = Object.keys(bindings).some((key) => {
    const action = key as HotkeyAction
    const b = bindings[action]
    const d = defaultBindings[action]
    return b.key !== d.key || b.ctrl !== d.ctrl || b.shift !== d.shift || b.alt !== d.alt
  })

  return (
    <div className="shortcut-grid">
      <p className="shortcut-hint">全局快捷键，方便在不离开键盘的情况下快速切换页面和控制转写。</p>

      <div className="shortcut-group">
        <strong className="shortcut-group-title">操作快捷键</strong>
        {DISPLAY_ORDER.filter((a) => !NAV_ACTIONS.includes(a)).map((action) => {
          const binding = bindings[action]
          if (!binding) return null
          return <HotkeyRow key={action} action={action} binding={binding} />
        })}
      </div>

      <div className="shortcut-group">
        <strong className="shortcut-group-title">页面导航</strong>
        {NAV_ACTIONS.map((action) => {
          const binding = bindings[action]
          if (!binding) return null
          return <HotkeyRow key={action} action={action} binding={binding} />
        })}
      </div>

      <div className="shortcut-footnote">
        <p><b>提示：</b>在输入框或文本编辑区域中，除 Ctrl+Enter 外其他快捷键不会触发，避免干扰打字。</p>
        {hasCustom && <p><b>检测到自定义快捷键。</b>如需恢复默认，可通过设置页的备份功能重置。</p>}
        {!hasCustom && <p>当前使用默认快捷键设置。快捷键暂不支持在界面中直接修改，后续版本会支持。</p>}
      </div>
    </div>
  )
}
