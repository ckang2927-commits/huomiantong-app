import { useEffect, useCallback, useRef } from 'react'

// 默认快捷键配置
export type HotkeyAction =
  | 'generateAnswer'
  | 'toggleListening'
  | 'toggleMute'
  | 'toggleFloating'
  | 'closeFloating'
  | 'navigateWorkspace'
  | 'navigateTraining'
  | 'navigateCheckup'
  | 'navigateResume'
  | 'navigateSettings'
  | 'navigateSessions'
  | 'saveSession'

export interface HotkeyBinding {
  key: string
  ctrl: boolean
  shift: boolean
  alt: boolean
}

const DEFAULT_HOTKEYS: Record<HotkeyAction, HotkeyBinding> = {
  generateAnswer:     { key: 'Enter', ctrl: true, shift: false, alt: false },
  toggleListening:    { key: 'l', ctrl: true, shift: false, alt: false },
  toggleMute:         { key: 'm', ctrl: true, shift: false, alt: false },
  toggleFloating:     { key: 'h', ctrl: true, shift: false, alt: false },
  closeFloating:      { key: 'Escape', ctrl: false, shift: false, alt: false },
  navigateWorkspace:  { key: '1', ctrl: true, shift: false, alt: false },
  navigateTraining:   { key: '2', ctrl: true, shift: false, alt: false },
  navigateCheckup:    { key: '3', ctrl: true, shift: false, alt: false },
  navigateResume:     { key: '4', ctrl: true, shift: false, alt: false },
  navigateSettings:   { key: '5', ctrl: true, shift: false, alt: false },
  navigateSessions:   { key: '6', ctrl: true, shift: false, alt: false },
  saveSession:        { key: 's', ctrl: true, shift: false, alt: false },
}

const STORAGE_KEY = 'huomiantong.hotkeys.v1'

export function loadHotkeys(): Record<HotkeyAction, HotkeyBinding> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return { ...DEFAULT_HOTKEYS, ...JSON.parse(saved) }
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_HOTKEYS }
}

export function saveHotkeys(bindings: Record<HotkeyAction, HotkeyBinding>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings))
}

export function getDefaultHotkeys(): Record<HotkeyAction, HotkeyBinding> {
  return { ...DEFAULT_HOTKEYS }
}

export function hotkeyLabel(binding: HotkeyBinding): string {
  const parts: string[] = []
  if (binding.ctrl) parts.push('Ctrl')
  if (binding.shift) parts.push('Shift')
  if (binding.alt) parts.push('Alt')
  parts.push(binding.key === 'Escape' ? 'Esc' : binding.key.toUpperCase())
  return parts.join(' + ')
}

const ACTION_LABELS: Record<HotkeyAction, string> = {
  generateAnswer: '生成回答',
  toggleListening: '开始/停止录音',
  toggleMute: '麦克风静音',
  toggleFloating: '显示/隐藏悬浮窗',
  closeFloating: '关闭悬浮窗',
  navigateWorkspace: '导航：面试台',
  navigateTraining: '导航：模拟训练',
  navigateCheckup: '导航：面试体检',
  navigateResume: '导航：简历库',
  navigateSettings: '导航：API 设置',
  navigateSessions: '导航：会话记录',
  saveSession: '保存当前会话',
}

export function getActionLabel(action: HotkeyAction): string {
  return ACTION_LABELS[action]
}

type HotkeyHandlers = {
  [K in HotkeyAction]?: () => void
}

export function useGlobalHotkeys(handlers: HotkeyHandlers): void {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const bindings = loadHotkeys()

    function matchBinding(key: string, ctrl: boolean, shift: boolean, alt: boolean): HotkeyAction | null {
      for (const [action, binding] of Object.entries(bindings)) {
        const b = binding as HotkeyBinding
        // Ctrl/Meta 都算 Ctrl（Mac 的 Cmd）
        const ctrlMatch = b.ctrl === (ctrl || key === 'Escape')
        if (
          b.key.toLowerCase() === key.toLowerCase() &&
          (b.ctrl ? ctrl : !ctrl) &&
          b.shift === shift &&
          b.alt === alt
        ) {
          // Escape 不需要 Ctrl
          if (key === 'Escape' && (ctrl || shift || alt)) continue
          return action as HotkeyAction
        }
      }
      return null
    }

    function handleKeyDown(event: KeyboardEvent): void {
      // 不拦截输入框中的快捷键
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // 但 Ctrl+Enter 在输入框中也要生效
        if (!(event.key === 'Enter' && (event.ctrlKey || event.metaKey))) {
          return
        }
      }

      const action = matchBinding(event.key, event.ctrlKey || event.metaKey, event.shiftKey, event.altKey)
      if (action && handlersRef.current[action]) {
        event.preventDefault()
        event.stopPropagation()
        handlersRef.current[action]!()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
