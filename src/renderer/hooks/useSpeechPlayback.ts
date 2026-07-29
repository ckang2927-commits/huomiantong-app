import { useEffect, useState } from 'react'

export function useSpeechPlayback() {
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window)

  useEffect(() => {
    return () => {
      stop()
    }
  }, [])

  function speak(text: string): void {
    if (!isSupported || !text.trim()) {
      return
    }

    stop()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.voice = preferredVoice()
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  function stop(): void {
    if (!isSupported) {
      return
    }

    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  return {
    autoSpeak,
    isSpeaking,
    isSupported,
    setAutoSpeak,
    speak,
    stop
  }
}

function preferredVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()

  return voices.find((voice) => voice.lang.toLowerCase().startsWith('zh')) || voices[0] || null
}
