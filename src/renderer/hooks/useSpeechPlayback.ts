import { useEffect, useRef, useState } from 'react'
import { findLocalTtsVoice, isLocalTtsVoiceId, localTtsVoices } from '../../shared/piperVoices'

export type SpeechVoiceOption = {
  id: string
  name: string
  lang: string
  label: string
  localService: boolean
  isDefault: boolean
  source: 'local' | 'system'
}

type SpeechPlaybackOptions = {
  voiceURI?: string
}

const defaultLang = 'zh-CN'

export function useSpeechPlayback(options: SpeechPlaybackOptions = {}) {
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSystemSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window)
  const [isLocalSupported] = useState(() => typeof window !== 'undefined' && typeof window.huomiantong?.synthesizeSpeech === 'function')
  const [voices, setVoices] = useState<SpeechVoiceOption[]>(() => buildVoiceOptions([]))
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isSystemSupported) {
      setVoices(buildVoiceOptions([]))
      return () => stop()
    }

    const refreshVoices = (): void => {
      setVoices(buildVoiceOptions(window.speechSynthesis.getVoices()))
    }

    refreshVoices()
    window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices)
    window.speechSynthesis.onvoiceschanged = refreshVoices

    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', refreshVoices)
      if (window.speechSynthesis.onvoiceschanged === refreshVoices) {
        window.speechSynthesis.onvoiceschanged = null
      }
      stop()
    }
  }, [isSystemSupported])

  function speak(text: string, override?: SpeechPlaybackOptions): void {
    const trimmed = text.trim()
    const voiceURI = override?.voiceURI ?? options.voiceURI

    if (!trimmed || (!isSystemSupported && !isLocalSupported)) {
      return
    }

    stop()

    if (isLocalTtsVoiceId(voiceURI) && isLocalSupported) {
      void playLocalSpeech(trimmed, voiceURI)
      return
    }

    playSystemSpeech(trimmed, voiceURI)
  }

  function stop(): void {
    if (isSystemSupported) {
      window.speechSynthesis.cancel()
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }

    setIsSpeaking(false)
  }

  async function playLocalSpeech(text: string, voiceURI: string): Promise<void> {
    try {
      setIsSpeaking(true)
      const result = await window.huomiantong.synthesizeSpeech({ text, voiceURI })
      const blob = new Blob([result.audio], { type: result.mimeType })
      const objectUrl = URL.createObjectURL(blob)
      const audio = new Audio(objectUrl)

      audioRef.current = audio
      objectUrlRef.current = objectUrl
      audio.onended = () => stop()
      audio.onerror = () => {
        stop()
        playSystemSpeech(text)
      }
      await audio.play()
    } catch {
      stop()
      playSystemSpeech(text)
    }
  }

  function playSystemSpeech(text: string, voiceURI?: string): void {
    if (!isSystemSupported) {
      return
    }

    const voice = preferredVoice(voiceURI)
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = voice?.lang || defaultLang
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.voice = voice
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  return {
    autoSpeak,
    isSpeaking,
    isSupported: isSystemSupported || isLocalSupported,
    selectedVoiceLabel: labelForVoice(options.voiceURI, voices),
    setAutoSpeak,
    speak,
    stop,
    voices
  }
}

function preferredVoice(voiceURI?: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()

  if (voiceURI) {
    const selected = voices.find((voice) => voice.voiceURI === voiceURI || voice.name === voiceURI)

    if (selected) {
      return selected
    }
  }

  return (
    voices.find((voice) => voice.lang.toLowerCase() === defaultLang.toLowerCase()) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith('zh')) ||
    voices[0] ||
    null
  )
}

function buildVoiceOptions(voices: SpeechSynthesisVoice[]): SpeechVoiceOption[] {
  const localOptions = localTtsVoices.map((voice) => ({
    id: voice.id,
    name: voice.name,
    lang: voice.lang,
    label: voice.label,
    localService: true,
    isDefault: false,
    source: 'local' as const
  }))
  const systemOptions = voices
    .map((voice) => ({
      id: voice.voiceURI || voice.name,
      name: voice.name,
      lang: voice.lang || '未知语言',
      label: `${voice.name} · ${voice.lang || '未知语言'}${voice.default ? ' · 默认' : ''}${voice.localService ? ' · 本机' : ''}`,
      localService: voice.localService,
      isDefault: voice.default,
      source: 'system' as const
    }))
    .sort((left, right) => voiceSortScore(right) - voiceSortScore(left) || left.label.localeCompare(right.label, 'zh-CN'))

  return [...localOptions, ...systemOptions]
}

function voiceSortScore(voice: SpeechVoiceOption): number {
  const lang = voice.lang.toLowerCase()
  let score = 0

  if (lang === defaultLang.toLowerCase()) score += 30
  if (lang.startsWith('zh')) score += 20
  if (lang.startsWith('en')) score += 8
  if (voice.isDefault) score += 4
  if (voice.localService) score += 2

  return score
}

function labelForVoice(voiceURI: string | undefined, voices: SpeechVoiceOption[]): string {
  if (!voiceURI) {
    return voices.find((voice) => voice.lang.toLowerCase().startsWith('zh'))?.label || voices[0]?.label || '系统推荐中文声音'
  }

  return findLocalTtsVoice(voiceURI)?.label || voices.find((voice) => voice.id === voiceURI || voice.name === voiceURI)?.label || '系统推荐中文声音'
}
