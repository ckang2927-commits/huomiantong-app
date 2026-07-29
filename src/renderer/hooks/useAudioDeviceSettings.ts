import { useCallback, useEffect, useMemo, useState } from 'react'
import { captureAudioStream, stopMediaStream } from '../lib/audio/audioCapture'
import { startAudioLevelMeter } from '../lib/audio/audioLevelMeter'
import { recordDiagnosticLog } from '../lib/diagnosticLog'
import type { AudioInputDevice, MicrophonePermissionState } from '../lib/audio/audioTypes'
import type { ToastMessage } from '../lib/appHelpers'
import type { DesktopAudioSource } from '../../shared/types'

type ShowToast = (text: string, kind?: ToastMessage['kind']) => void

type RefreshAudioDevicesOptions = {
  requestPermission?: boolean
  silent?: boolean
}

type UseAudioDeviceSettingsOptions = {
  showToast: ShowToast
}

const SELECTED_MICROPHONE_KEY = 'huomiantong.audio.selectedMicrophone.v1'
const SELECTED_SYSTEM_SOURCE_KEY = 'huomiantong.audio.selectedSystemSource.v1'
const DEVICE_REFRESH_WATCHDOG_MS = 8500
const DESKTOP_SOURCE_REFRESH_WATCHDOG_MS = 8500
const MICROPHONE_DIAGNOSTIC_WATCHDOG_MS = 18000

export function useAudioDeviceSettings({ showToast }: UseAudioDeviceSettingsOptions) {
  const [audioInputDevices, setAudioInputDevices] = useState<AudioInputDevice[]>([])
  const [desktopAudioSources, setDesktopAudioSources] = useState<DesktopAudioSource[]>([])
  const [selectedMicrophoneDeviceId, setSelectedMicrophoneDeviceIdState] = useState(() => readSelectedMicrophoneDeviceId())
  const [selectedSystemSourceId, setSelectedSystemSourceIdState] = useState(() => readSelectedSystemSourceId())
  const [microphonePermission, setMicrophonePermission] = useState<MicrophonePermissionState>('checking')
  const [isRefreshingAudioDevices, setIsRefreshingAudioDevices] = useState(false)
  const [isRefreshingDesktopSources, setIsRefreshingDesktopSources] = useState(false)
  const [isRunningMicrophoneDiagnostic, setIsRunningMicrophoneDiagnostic] = useState(false)
  const [audioDeviceError, setAudioDeviceError] = useState('')
  const [microphoneDiagnostic, setMicrophoneDiagnostic] = useState('')
  const [lastDeviceRefreshAt, setLastDeviceRefreshAt] = useState(0)

  const selectedMicrophoneLabel = useMemo(() => {
    if (!selectedMicrophoneDeviceId) {
      return '系统默认麦克风'
    }

    return audioInputDevices.find((device) => device.deviceId === selectedMicrophoneDeviceId)?.label || '已选择的麦克风'
  }, [audioInputDevices, selectedMicrophoneDeviceId])

  const systemAudioSupported = typeof window.huomiantong?.listDesktopAudioSources === 'function'

  const selectedSystemSourceName = useMemo(() => {
    if (!selectedSystemSourceId) {
      return ''
    }

    return desktopAudioSources.find((source) => source.id === selectedSystemSourceId)?.name || ''
  }, [desktopAudioSources, selectedSystemSourceId])

  const setSelectedMicrophoneDeviceId = useCallback((deviceId: string) => {
    setSelectedMicrophoneDeviceIdState(deviceId)

    if (deviceId) {
      window.localStorage.setItem(SELECTED_MICROPHONE_KEY, deviceId)
    } else {
      window.localStorage.removeItem(SELECTED_MICROPHONE_KEY)
    }
  }, [])

  const setSelectedSystemSourceId = useCallback((sourceId: string) => {
    setSelectedSystemSourceIdState(sourceId)

    if (sourceId) {
      window.localStorage.setItem(SELECTED_SYSTEM_SOURCE_KEY, sourceId)
    } else {
      window.localStorage.removeItem(SELECTED_SYSTEM_SOURCE_KEY)
    }

    void window.huomiantong?.setDesktopAudioSourceId?.(sourceId)
  }, [])

  const resetAudioUiState = useCallback(() => {
    setIsRefreshingAudioDevices(false)
    setIsRefreshingDesktopSources(false)
    setIsRunningMicrophoneDiagnostic(false)
    setAudioDeviceError('')
    setMicrophoneDiagnostic('音频状态已重置。如果刚才一直转圈，可以重新点“刷新/授权”或“刷新来源”。')
    showToast('音频状态已重置', 'info')
  }, [showToast])

  const refreshDesktopAudioSources = useCallback(async (silent = false) => {
    setIsRefreshingDesktopSources(true)

    try {
      const sources = await withTimeout(window.huomiantong.listDesktopAudioSources(), 6000, '读取屏幕/窗口来源超时，请稍后再点“刷新来源”。')
      const readableSources = sources.map((source, index) => ({
        ...source,
        name: formatDesktopSourceName(source, index)
      }))
      setDesktopAudioSources(readableSources)
      if (!silent) {
        showToast(readableSources.length > 0 ? `已找到 ${readableSources.length} 个屏幕/窗口来源` : '没有找到可共享的屏幕/窗口', readableSources.length > 0 ? 'success' : 'error')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '读取屏幕/窗口来源失败'
      recordDiagnosticLog({ severity: 'error', category: 'audio', source: '电脑音频来源', message })
      if (!silent) {
        showToast(message, 'error')
      }
    } finally {
      setIsRefreshingDesktopSources(false)
    }
  }, [showToast])

  const refreshAudioDevices = useCallback(
    async ({ requestPermission = false, silent = false }: RefreshAudioDevicesOptions = {}) => {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setMicrophonePermission('unsupported')
        setAudioDeviceError('当前环境不支持设备枚举，请更新 Electron/Chrome 内核后再试。')
        return
      }

      setIsRefreshingAudioDevices(true)
      setAudioDeviceError('')

      try {
        if (requestPermission) {
          const permissionStream = await getMediaStreamWithTimeout(
            navigator.mediaDevices.getUserMedia({ audio: true }),
            8000,
            '麦克风权限请求超时：请检查是否有系统权限弹窗被挡住，或是否有其他软件占用麦克风。'
          )
          stopMediaStream(permissionStream)
          setMicrophonePermission('granted')
        }

        const devices = await withTimeout(navigator.mediaDevices.enumerateDevices(), 5000, '读取麦克风设备列表超时，请稍后再试。')
        const microphones = devices
          .filter((device) => device.kind === 'audioinput')
          .map<AudioInputDevice>((device, index) => ({
            deviceId: device.deviceId,
            groupId: device.groupId,
            label: formatMicrophoneLabel(device.label, index)
          }))

        setAudioInputDevices(microphones)
        setLastDeviceRefreshAt(Date.now())
        setSelectedMicrophoneDeviceIdState((current) => {
          if (!current || microphones.some((device) => device.deviceId === current)) {
            return current
          }

          window.localStorage.removeItem(SELECTED_MICROPHONE_KEY)
          return ''
        })

        if (requestPermission && !silent) {
          showToast(microphones.length > 0 ? `已检测到 ${microphones.length} 个麦克风` : '没有检测到麦克风', microphones.length > 0 ? 'success' : 'error')
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : '无法读取麦克风设备'
        setAudioDeviceError(message)
        setMicrophonePermission(isPermissionDeniedError(error) ? 'denied' : 'unknown')
        recordDiagnosticLog({ severity: 'error', category: 'audio', source: '麦克风设备', message })

        if (!silent) {
          showToast(isPermissionDeniedError(error) ? '麦克风权限被拒绝，请在系统/浏览器权限里打开' : message, 'error')
        }
      } finally {
        setIsRefreshingAudioDevices(false)
      }
    },
    [showToast]
  )

  const runMicrophoneDiagnostic = useCallback(async () => {
    setIsRunningMicrophoneDiagnostic(true)
    setMicrophoneDiagnostic('正在做本地麦克风诊断，不会调用 Deepgram...')
    setAudioDeviceError('')

    let stopLevelMeter: (() => void) | null = null
    let stream: MediaStream | null = null
    let maxLevel = 0

    try {
      stream = await captureAudioStream('microphone', {
        microphoneDeviceId: selectedMicrophoneDeviceId,
        microphoneFallbackDevices: audioInputDevices
      })
      stopLevelMeter = startAudioLevelMeter(stream, (level) => {
        maxLevel = Math.max(maxLevel, level)
      })
      await delay(2800)

      const trackLabel = stream.getAudioTracks()[0]?.label || selectedMicrophoneLabel

      if (maxLevel >= 0.02) {
        setMicrophoneDiagnostic(`本地麦克风正常：${trackLabel}，检测到输入音量 ${Math.round(maxLevel * 100)}%。如果转写仍失败，问题多半在 Deepgram Key/余额/网络。`)
        showToast('本地麦克风诊断通过')
      } else {
        setMicrophoneDiagnostic(`已打开麦克风：${trackLabel}，但没检测到明显声音。请检查麦克风静音、Windows 默认输入设备，或换一个设备再诊断。`)
        showToast('麦克风能打开，但没检测到声音', 'info')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '麦克风诊断失败'
      setMicrophoneDiagnostic(`麦克风本地诊断失败：${message}\n\n我的判断：这不是 Deepgram 问题，是本机没有成功打开任何麦克风。优先在 Windows 设置里把 C-Media/ASUS 其中一个设成默认输入，再回软件点“刷新/授权”。`)
      recordDiagnosticLog({ severity: 'error', category: 'audio', source: '麦克风本地诊断', message })
      showToast('麦克风本地诊断失败，已显示详细尝试记录', 'error')
    } finally {
      stopLevelMeter?.()
      stopMediaStream(stream)
      setIsRunningMicrophoneDiagnostic(false)
    }
  }, [audioInputDevices, selectedMicrophoneDeviceId, selectedMicrophoneLabel, showToast])

  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null
    let isMounted = true

    async function watchPermission(): Promise<void> {
      if (!navigator.permissions?.query) {
        setMicrophonePermission('unknown')
        return
      }

      try {
        permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName })

        if (!isMounted) {
          return
        }

        setMicrophonePermission(normalizePermissionState(permissionStatus.state))
        permissionStatus.onchange = () => setMicrophonePermission(normalizePermissionState(permissionStatus?.state))
      } catch {
        setMicrophonePermission('unknown')
      }
    }

    void watchPermission()
    void refreshAudioDevices({ silent: true })

    return () => {
      isMounted = false

      if (permissionStatus) {
        permissionStatus.onchange = null
      }
    }
  }, [refreshAudioDevices])

  useEffect(() => {
    if (!isRefreshingAudioDevices) {
      return
    }

    const timer = window.setTimeout(() => {
      const message = '麦克风设备刷新卡住，已自动重置。可以重新点“刷新/授权”，或先在 Windows 里确认默认输入设备。'
      setIsRefreshingAudioDevices(false)
      setAudioDeviceError(message)
      recordDiagnosticLog({ severity: 'warn', category: 'audio', source: '麦克风设备', message })
    }, DEVICE_REFRESH_WATCHDOG_MS)

    return () => window.clearTimeout(timer)
  }, [isRefreshingAudioDevices])

  useEffect(() => {
    if (!isRefreshingDesktopSources) {
      return
    }

    const timer = window.setTimeout(() => {
      const message = '电脑音频来源刷新卡住，已自动重置。建议重新点“刷新来源”，优先选择“整个屏幕”。'
      setIsRefreshingDesktopSources(false)
      setAudioDeviceError(message)
      recordDiagnosticLog({ severity: 'warn', category: 'audio', source: '电脑音频来源', message })
    }, DESKTOP_SOURCE_REFRESH_WATCHDOG_MS)

    return () => window.clearTimeout(timer)
  }, [isRefreshingDesktopSources])

  useEffect(() => {
    if (!isRunningMicrophoneDiagnostic) {
      return
    }

    const timer = window.setTimeout(() => {
      const message = '麦克风诊断等待太久，已自动停下。通常是系统音频驱动或默认输入设备卡住，可以换一个麦克风后再诊断。'
      setIsRunningMicrophoneDiagnostic(false)
      setMicrophoneDiagnostic(message)
      recordDiagnosticLog({ severity: 'warn', category: 'audio', source: '麦克风本地诊断', message })
    }, MICROPHONE_DIAGNOSTIC_WATCHDOG_MS)

    return () => window.clearTimeout(timer)
  }, [isRunningMicrophoneDiagnostic])

  return {
    audioInputDevices,
    desktopAudioSources,
    selectedMicrophoneDeviceId,
    selectedMicrophoneLabel,
    selectedSystemSourceId,
    selectedSystemSourceName,
    microphonePermission,
    isRefreshingAudioDevices,
    isRefreshingDesktopSources,
    isRunningMicrophoneDiagnostic,
    audioDeviceError,
    microphoneDiagnostic,
    lastDeviceRefreshAt,
    systemAudioSupported,
    refreshAudioDevices,
    refreshDesktopAudioSources,
    resetAudioUiState,
    runMicrophoneDiagnostic,
    setSelectedMicrophoneDeviceId,
    setSelectedSystemSourceId
  }
}

function readSelectedMicrophoneDeviceId(): string {
  return window.localStorage.getItem(SELECTED_MICROPHONE_KEY) || ''
}

function readSelectedSystemSourceId(): string {
  return window.localStorage.getItem(SELECTED_SYSTEM_SOURCE_KEY) || ''
}

function normalizePermissionState(state?: PermissionState): MicrophonePermissionState {
  if (state === 'granted' || state === 'prompt' || state === 'denied') {
    return state
  }

  return 'unknown'
}

function isPermissionDeniedError(error: unknown): boolean {
  return error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeoutId = 0

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(message)), timeoutMs)
      })
    ])
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function getMediaStreamWithTimeout(promise: Promise<MediaStream>, timeoutMs: number, message: string): Promise<MediaStream> {
  let timedOut = false
  const guardedPromise = promise.then((stream) => {
    if (timedOut) {
      stopMediaStream(stream)
    }

    return stream
  })

  try {
    return await withTimeout(guardedPromise, timeoutMs, message)
  } catch (error) {
    timedOut = true
    throw error
  }
}

function formatMicrophoneLabel(label: string, index: number): string {
  const source = label.trim()

  if (!source) {
    return `麦克风 ${index + 1}`
  }

  const prefix = /^Default\s*-/i.test(source) ? '默认' : /^Communications\s*-/i.test(source) ? '通话默认' : ''
  const cleanSource = source.replace(/^Default\s*-\s*/i, '').replace(/^Communications\s*-\s*/i, '')

  if (/AI Noise-cancelling Input/i.test(cleanSource)) {
    return `${prefix ? `${prefix} · ` : ''}ASUS 降噪麦克风`
  }

  if (/C-Media/i.test(cleanSource)) {
    return `${prefix ? `${prefix} · ` : ''}C-Media USB 麦克风`
  }

  if (/ZG1 Ultra/i.test(cleanSource)) {
    return `${prefix ? `${prefix} · ` : ''}ZG1 Ultra 麦克风（系统显示异常）`
  }

  return `${prefix ? `${prefix} · ` : ''}${cleanSource.replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)/gi, '')}`
}

function formatDesktopSourceName(source: DesktopAudioSource, index: number): string {
  if (source.id.startsWith('screen:')) {
    return source.name && !/^screen\s*\d*$/i.test(source.name) ? `整个屏幕：${source.name}` : `整个屏幕 ${index + 1}`
  }

  return source.name ? `窗口：${source.name}` : `窗口 ${index + 1}`
}
