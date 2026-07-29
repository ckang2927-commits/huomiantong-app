import type { ProviderConfig, SpeechProviderId } from '../../../shared/types'
import { speechProviderNames } from '../../../shared/speechProviders'
import { createDeepgramTranscriptionClient, type DeepgramTranscriptionClient } from './deepgramTranscriptionClient'
import { createTencentTranscriptionClient, type TencentTranscriptionClient } from './tencentTranscriptionClient'

export type SttTranscriptionClient = DeepgramTranscriptionClient | TencentTranscriptionClient

type SttTranscriptionClientOptions = {
  provider: SpeechProviderId
  config: ProviderConfig
  endpointingMs: number
  stream: MediaStream
  onOpen: () => void
  onInterimTranscript: (text: string) => void
  onFinalTranscript: (text: string) => void
  onError: (message?: string) => void
  onClose: (event: CloseEvent) => void
}

export class UnsupportedSpeechProviderError extends Error {
  provider: SpeechProviderId

  constructor(provider: SpeechProviderId) {
    super(`${speechProviderNames[provider]} 已预留配置入口，但当前版本还没有接入实时转写协议。请先切换 Deepgram / 腾讯云 ASR，或继续让我接入这个国内服务商。`)
    this.name = 'UnsupportedSpeechProviderError'
    this.provider = provider
  }
}

export async function createSttTranscriptionClient({
  provider,
  config,
  endpointingMs,
  stream,
  onOpen,
  onInterimTranscript,
  onFinalTranscript,
  onError,
  onClose
}: SttTranscriptionClientOptions): Promise<SttTranscriptionClient> {
  if (provider === 'deepgram') {
    return createDeepgramTranscriptionClient({
      apiKey: config.apiKey,
      endpointingMs,
      stream,
      onOpen,
      onInterimTranscript,
      onFinalTranscript,
      onError,
      onClose
    })
  }

  if (provider === 'tencent') {
    return createTencentTranscriptionClient({
      credentialsText: config.apiKey,
      baseUrl: config.baseUrl,
      engineModelType: config.model,
      endpointingMs,
      stream,
      onOpen,
      onInterimTranscript,
      onFinalTranscript,
      onError,
      onClose
    })
  }

  throw new UnsupportedSpeechProviderError(provider)
}
