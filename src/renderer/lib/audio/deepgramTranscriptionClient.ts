import type { DeepgramTranscriptPayload } from './audioTypes'

type DeepgramTranscriptionClientOptions = {
  apiKey: string
  endpointingMs?: number
  stream: MediaStream
  onOpen: () => void
  onInterimTranscript: (text: string) => void
  onFinalTranscript: (text: string) => void
  onError: (message?: string) => void
  onClose: (event: CloseEvent) => void
}

export type DeepgramTranscriptionClient = {
  stop: () => void
}

const DEEPGRAM_LISTEN_BASE_URL = 'wss://api.deepgram.com/v1/listen?model=nova-3&language=zh&smart_format=true&interim_results=true'

export function createDeepgramTranscriptionClient({
  apiKey,
  endpointingMs = 500,
  stream,
  onOpen,
  onInterimTranscript,
  onFinalTranscript,
  onError,
  onClose
}: DeepgramTranscriptionClientOptions): DeepgramTranscriptionClient {
  const endpointing = Math.min(3000, Math.max(300, Math.round(endpointingMs)))
  const listenUrl = `${DEEPGRAM_LISTEN_BASE_URL}&endpointing=${endpointing}`
  const socket = new WebSocket(listenUrl, ['token', apiKey])
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm'
  let recorder: MediaRecorder | null = null

  socket.onopen = () => {
    recorder = new MediaRecorder(stream, { mimeType })
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
        socket.send(event.data)
      }
    }
    recorder.start(180)
    onOpen()
  }

  socket.onmessage = (event) => {
    const payload = parseTranscriptPayload(event.data)
    const text = payload.channel?.alternatives?.[0]?.transcript?.trim()

    if (!text) {
      return
    }

    if (payload.is_final || payload.speech_final) {
      onFinalTranscript(text)
    } else {
      onInterimTranscript(text)
    }
  }

  socket.onerror = () => onError()
  socket.onclose = onClose

  return {
    stop: () => {
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop()
      }

      if (socket.readyState <= WebSocket.OPEN) {
        socket.close(1000, 'client stop')
      }

      recorder = null
    }
  }
}

function parseTranscriptPayload(data: unknown): DeepgramTranscriptPayload {
  if (typeof data !== 'string') {
    return {}
  }

  try {
    return JSON.parse(data) as DeepgramTranscriptPayload
  } catch {
    return {}
  }
}
