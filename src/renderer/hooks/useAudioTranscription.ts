import { useEffect, useRef, useState } from 'react'
import type { AppSettings } from '../../shared/types'
import { speechProviderNames } from '../../shared/speechProviders'
import type { ToastMessage } from '../lib/appHelpers'
import { captureAudioStream, stopMediaStream } from '../lib/audio/audioCapture'
import { startAudioLevelMeter } from '../lib/audio/audioLevelMeter'
import { createSttTranscriptionClient, UnsupportedSpeechProviderError, type SttTranscriptionClient } from '../lib/audio/sttTranscriptionClient'
import type { AudioInputDevice, ListeningMode, TranscriptionConnectionStatus, TranscriptionSessionStats } from '../lib/audio/audioTypes'
import { recordDiagnosticLog } from '../lib/diagnosticLog'

type ShowToast = (text: string, kind?: ToastMessage['kind']) => void

type UseAudioTranscriptionOptions = {
  settings: AppSettings
  selectedMicrophoneDeviceId?: string
  audioInputDevices?: AudioInputDevice[]
  selectedMicrophoneLabel?: string
  selectedSystemSourceId?: string
  selectedSystemSourceName?: string
  onAudioStreamReady?: () => void
  onTranscriptFinal: (text: string) => void
  onMissingDeepgramKey: () => void
  showToast: ShowToast
}

const emptyTranscriptionStats: TranscriptionSessionStats = {
  source: null,
  startedAt: 0,
  endedAt: 0,
  finalTranscriptCount: 0,
  lastFinalAt: 0,
  connectionLatencyMs: 0,
  activeDeviceId: '',
  activeDeviceLabel: ''
}

const DEEPGRAM_CONNECT_TIMEOUT_MS = 12000
const MICROPHONE_CAPTURE_TIMEOUT_MS = 20000
const SYSTEM_AUDIO_CAPTURE_TIMEOUT_MS = 12000

export function useAudioTranscription({
  settings,
  selectedMicrophoneDeviceId = '',
  audioInputDevices = [],
  selectedMicrophoneLabel = '',
  selectedSystemSourceId = '',
  selectedSystemSourceName = '',
  onAudioStreamReady,
  onTranscriptFinal,
  onMissingDeepgramKey,
  showToast
}: UseAudioTranscriptionOptions) {
  const [isListening, setIsListening] = useState(false)
  const [listeningMode, setListeningMode] = useState<ListeningMode | null>(null)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [transcriptError, setTranscriptError] = useState('')
  const [transcriptionStats, setTranscriptionStats] = useState<TranscriptionSessionStats>(emptyTranscriptionStats)
  const [connectionStatus, setConnectionStatus] = useState<TranscriptionConnectionStatus>('idle')
  const [inputLevel, setInputLevel] = useState(0)
  const clientRef = useRef<SttTranscriptionClient | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const stopLevelMeterRef = useRef<(() => void) | null>(null)
  const connectionTimeoutRef = useRef<number | null>(null)
  const silenceCheckTimeoutRef = useRef<number | null>(null)
  const maxInputLevelRef = useRef(0)
  const onTranscriptFinalRef = useRef(onTranscriptFinal)
  const sessionIdRef = useRef(0)

  useEffect(() => {
    onTranscriptFinalRef.current = onTranscriptFinal
  }, [onTranscriptFinal])

  function markTranscriptionEnded(): void {
    setTranscriptionStats((current) =>
      current.startedAt && !current.endedAt
        ? {
            ...current,
            endedAt: Date.now()
          }
        : current
    )
  }

  function clearConnectionTimeout(): void {
    if (connectionTimeoutRef.current) {
      window.clearTimeout(connectionTimeoutRef.current)
      connectionTimeoutRef.current = null
    }
  }

  function clearSilenceCheckTimeout(): void {
    if (silenceCheckTimeoutRef.current) {
      window.clearTimeout(silenceCheckTimeoutRef.current)
      silenceCheckTimeoutRef.current = null
    }
  }

  function stopAudioTranscription(nextConnectionStatus: TranscriptionConnectionStatus = 'idle'): void {
    sessionIdRef.current += 1
    clearConnectionTimeout()
    clearSilenceCheckTimeout()
    markTranscriptionEnded()
    clientRef.current?.stop()
    stopLevelMeterRef.current?.()
    stopMediaStream(streamRef.current)
    clientRef.current = null
    streamRef.current = null
    stopLevelMeterRef.current = null
    setIsListening(false)
    setListeningMode(null)
    setInterimTranscript('')
    setConnectionStatus(nextConnectionStatus)
    setInputLevel(0)
    maxInputLevelRef.current = 0
  }

  useEffect(() => () => stopAudioTranscription(), [])

  async function startAudioTranscription(source: ListeningMode): Promise<void> {
    const speechProvider = settings.speech?.sttProvider ?? 'deepgram'
    const providerConfig =
      speechProvider === 'deepgram'
        ? {
            ...settings.speech.providers.deepgram,
            enabled: settings.speech.providers.deepgram.enabled || settings.providers.deepgram.enabled,
            apiKey: settings.speech.providers.deepgram.apiKey || settings.providers.deepgram.apiKey
          }
        : settings.speech.providers[speechProvider]
    const providerName = speechProviderNames[speechProvider]
    const apiKey = providerConfig.apiKey.trim()

    if (!apiKey) {
      const message = `请先在“设置中心 → 语音转写”里填写 ${providerName} Key`
      setTranscriptError(message)
      recordDiagnosticLog({ severity: 'error', category: 'speech', source: `${providerName} 语音`, message })
      showToast(`请先配置 ${providerName} Key`, 'error')
      onMissingDeepgramKey()
      return
    }

    if (source === 'system' && !selectedSystemSourceId) {
      const message = '请先在“电脑音频来源”里选择整个屏幕或窗口，再开启电脑音频转写。'
      setTranscriptError(message)
      recordDiagnosticLog({ severity: 'warn', category: 'audio', source: '电脑音频', message })
      showToast('请先选择电脑音频来源', 'error')
      return
    }

    stopAudioTranscription()
    const sessionId = sessionIdRef.current + 1
    const startTime = Date.now()
    sessionIdRef.current = sessionId
    setTranscriptError('')
    setInterimTranscript(source === 'microphone' ? '正在打开麦克风转写...' : `正在打开电脑音频：${selectedSystemSourceName || '已选来源'}...`)
    setIsListening(true)
    setListeningMode(source)
    setConnectionStatus('preparing')
    setInputLevel(0)
    setTranscriptionStats({
      source,
      startedAt: startTime,
      endedAt: 0,
      finalTranscriptCount: 0,
      lastFinalAt: 0,
      connectionLatencyMs: 0,
      activeDeviceId: source === 'microphone' ? selectedMicrophoneDeviceId : '',
      activeDeviceLabel: source === 'microphone' ? selectedMicrophoneLabel : selectedSystemSourceName || '电脑音频'
    })

    try {
      showToast(source === 'microphone' ? '正在请求麦克风权限...' : `正在连接电脑音频来源：${selectedSystemSourceName || '已选来源'}`)
      console.info(`[audio] start ${source} capture`)
      setConnectionStatus('capturing')
      const stream = await withAudioCaptureTimeout(
        captureAudioStream(source, {
          microphoneDeviceId: source === 'microphone' ? selectedMicrophoneDeviceId : undefined,
          microphoneFallbackDevices: source === 'microphone' ? audioInputDevices : undefined,
          systemSourceId: source === 'system' ? selectedSystemSourceId : undefined
        }),
        source
      )

      if (sessionId !== sessionIdRef.current) {
        stopMediaStream(stream)
        return
      }

      const activeTrack = stream.getAudioTracks()[0]
      const activeDeviceLabel = source === 'microphone' ? activeTrack?.label || selectedMicrophoneLabel || '麦克风' : selectedSystemSourceName || '电脑音频'
      console.info(`[audio] ${source} capture ready: ${activeDeviceLabel}`)
      setInterimTranscript(source === 'microphone' ? `麦克风已打开，正在连接 ${providerName}...` : `电脑音频已捕获，正在连接 ${providerName}...`)
      setConnectionStatus('connecting')
      setTranscriptionStats((current) => ({
        ...current,
        activeDeviceId: source === 'microphone' ? selectedMicrophoneDeviceId : '',
        activeDeviceLabel
      }))
      maxInputLevelRef.current = 0
      stopLevelMeterRef.current = startAudioLevelMeter(stream, (level) => {
        maxInputLevelRef.current = Math.max(maxInputLevelRef.current, level)
        setInputLevel(level)
      })

      if (source === 'microphone') {
        silenceCheckTimeoutRef.current = window.setTimeout(() => {
          if (sessionId === sessionIdRef.current && maxInputLevelRef.current < 0.02) {
            const message = '已拿到麦克风权限，但 6 秒内没有检测到明显声音：请确认麦克风没有静音，或停止后在“麦克风设备”里换一个输入设备。'
            setTranscriptError(message)
            recordDiagnosticLog({ severity: 'warn', category: 'audio', source: '麦克风', message, details: `device=${selectedMicrophoneLabel || selectedMicrophoneDeviceId || 'system-default'}` })
            showToast('麦克风权限正常，但没有检测到输入声音', 'info')
          }
        }, 6000)
      }

      onAudioStreamReady?.()
      stream.getTracks().forEach((track) => {
        track.onended = () => stopAudioTranscription()
      })
      streamRef.current = stream
      connectionTimeoutRef.current = window.setTimeout(() => {
        if (sessionId !== sessionIdRef.current) return

        const message = `${providerName} 连接超时：常见原因是额度不足、Key 无权限、网络被拦截或未开 VPN。请先去设置里测试连接。`
        setTranscriptError(message)
        recordDiagnosticLog({ severity: 'error', category: 'speech', source: `${providerName} 语音`, message, details: `source=${source}` })
        stopAudioTranscription('error')
      }, DEEPGRAM_CONNECT_TIMEOUT_MS)

      clientRef.current = await createSttTranscriptionClient({
        provider: speechProvider,
        config: providerConfig,
        endpointingMs: settings.speech.endpointingMs,
        stream,
        onOpen: () => {
          if (sessionId !== sessionIdRef.current) return

          const connectionLatencyMs = Date.now() - startTime
          console.info(`[audio] ${providerName} connected in ${connectionLatencyMs}ms`)
          clearConnectionTimeout()
          setInterimTranscript('')
          setConnectionStatus('connected')
          setTranscriptionStats((current) => ({
            ...current,
            connectionLatencyMs
          }))
          showToast(source === 'microphone' ? '麦克风转写已打开' : '电脑音频转写已打开')
        },
        onInterimTranscript: setInterimTranscript,
        onFinalTranscript: (text) => {
          if (sessionId !== sessionIdRef.current) return

          onTranscriptFinalRef.current(text)
          setInterimTranscript('')
          setTranscriptionStats((current) => ({
            ...current,
            finalTranscriptCount: current.finalTranscriptCount + 1,
            lastFinalAt: Date.now()
          }))
        },
        onError: (message) => {
          if (sessionId !== sessionIdRef.current) return

          clearConnectionTimeout()
          console.error(`[audio] ${providerName} websocket error`)
          setConnectionStatus('error')
          const displayMessage = message || `${providerName} WebSocket 连接失败：请检查 Key、余额、网络，或先去设置里测试连接。`
          setTranscriptError(displayMessage)
          recordDiagnosticLog({ severity: 'error', category: 'speech', source: `${providerName} 语音`, message: displayMessage, details: `source=${source}` })
          stopAudioTranscription('error')
        },
        onClose: (event) => {
          if (sessionId !== sessionIdRef.current) return

          clearConnectionTimeout()
          console.info(`[audio] ${providerName} closed code=${event.code} clean=${event.wasClean}`)
          stopLevelMeterRef.current?.()
          stopMediaStream(streamRef.current)
          clearSilenceCheckTimeout()
          clientRef.current = null
          streamRef.current = null
          stopLevelMeterRef.current = null
          setInputLevel(0)
          setIsListening(false)
          setListeningMode(null)
          setConnectionStatus(!event.wasClean && event.code !== 1000 ? 'error' : 'idle')
          markTranscriptionEnded()

          if (!event.wasClean && event.code !== 1000) {
            const message = `${providerName} 已断开（code ${event.code || '未知'}）`
            setTranscriptError(message)
            recordDiagnosticLog({ severity: 'error', category: 'speech', source: `${providerName} 语音`, message, details: `clean=${event.wasClean}` })
          }
        }
      })
    } catch (error) {
      if (sessionId !== sessionIdRef.current) return

      const rawMessage = error instanceof Error ? error.message : '无法打开转写音频'
      const displayMessage =
        error instanceof UnsupportedSpeechProviderError
          ? error.message
          : source === 'system' && /not supported/i.test(rawMessage)
            ? '电脑音频转写暂时不被当前系统采集方式支持：请重启软件后再试，或先用麦克风转写。'
            : rawMessage
      console.error(`[audio] ${source} capture failed: ${rawMessage}`)
      setConnectionStatus('error')
      setTranscriptError(displayMessage)
      recordDiagnosticLog({
        severity: error instanceof UnsupportedSpeechProviderError ? 'warn' : 'error',
        category: source === 'system' ? 'audio' : 'audio',
        source: source === 'system' ? '电脑音频' : '麦克风',
        message: displayMessage,
        details: rawMessage
      })
      stopAudioTranscription('error')
    }
  }

  return {
    isListening,
    listeningMode,
    interimTranscript,
    transcriptError,
    transcriptionStats,
    connectionStatus,
    connectionLatencyMs: transcriptionStats.connectionLatencyMs,
    inputLevel,
    startAudioTranscription,
    stopAudioTranscription
  }
}

async function withAudioCaptureTimeout(promise: Promise<MediaStream>, source: ListeningMode): Promise<MediaStream> {
  let timeoutId = 0
  let timedOut = false
  const timeoutMs = source === 'microphone' ? MICROPHONE_CAPTURE_TIMEOUT_MS : SYSTEM_AUDIO_CAPTURE_TIMEOUT_MS
  const guardedPromise = promise.then((stream) => {
    if (timedOut) {
      stopMediaStream(stream)
    }

    return stream
  })

  try {
    return await Promise.race([
      guardedPromise,
      new Promise<MediaStream>((_resolve, reject) => {
        timeoutId = window.setTimeout(() => {
          timedOut = true
          reject(new Error(source === 'microphone' ? '麦克风打开超时：请检查 Windows 麦克风隐私权限、是否有其他软件占用麦克风，或点“刷新 / 授权”后重试。' : '电脑音频采集超时：请重新选择屏幕/窗口，并勾选共享系统音频。'))
        }, timeoutMs)
      })
    ])
  } finally {
    window.clearTimeout(timeoutId)
  }
}
