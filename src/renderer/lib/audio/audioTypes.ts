export type ListeningMode = 'microphone' | 'system'

export type TranscriptionConnectionStatus = 'idle' | 'preparing' | 'capturing' | 'connecting' | 'connected' | 'error'

export type MicrophonePermissionState = 'checking' | 'granted' | 'prompt' | 'denied' | 'unsupported' | 'unknown'

export type AudioInputDevice = {
  deviceId: string
  groupId: string
  label: string
}

export type TranscriptionSessionStats = {
  source: ListeningMode | null
  startedAt: number
  endedAt: number
  finalTranscriptCount: number
  lastFinalAt: number
  connectionLatencyMs: number
  activeDeviceId: string
  activeDeviceLabel: string
}

export type DeepgramTranscriptPayload = {
  channel?: {
    alternatives?: Array<{ transcript?: string }>
  }
  is_final?: boolean
  speech_final?: boolean
}
