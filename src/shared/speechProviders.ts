import type { ProviderConfig, SpeechProviderId, SpeechSettings } from './types'

export type SpeechProviderLink = {
  label: string
  url: string
}

export const speechProviderNames: Record<SpeechProviderId, string> = {
  deepgram: 'Deepgram',
  aliyun: '阿里云语音',
  tencent: '腾讯云 ASR',
  baidu: '百度智能云',
  volcengine: '火山引擎',
  iflytek: '讯飞开放平台'
}

export const speechProviderHints: Record<SpeechProviderId, string> = {
  deepgram: '已接入实时转写，适合有 Deepgram 额度或海外网络稳定的场景。',
  aliyun: '国内实时语音识别接口已预留配置入口，后续可接阿里云智能语音交互 WebSocket。',
  tencent: '已接入第一版实时转写：使用腾讯云 ASR WebSocket + PCM 音频流，需要 AppID、SecretId、SecretKey。',
  baidu: '国内实时语音识别接口已预留配置入口，后续可接百度智能云实时语音识别。',
  volcengine: '国内实时语音识别接口已预留配置入口，后续可接火山引擎语音识别。',
  iflytek: '国内实时语音识别接口已预留配置入口，后续可接讯飞实时语音转写。'
}

export const speechProviderLinks: Record<SpeechProviderId, SpeechProviderLink[]> = {
  deepgram: [
    { label: '注册 / 控制台', url: 'https://console.deepgram.com/signup' },
    { label: '实时转写文档', url: 'https://developers.deepgram.com/docs/getting-started-with-live-streaming-audio' }
  ],
  aliyun: [
    { label: '产品介绍', url: 'https://help.aliyun.com/zh/isi/' },
    { label: '语音控制台', url: 'https://nls-portal.console.aliyun.com/overview' },
    { label: 'WebSocket 文档', url: 'https://help.aliyun.com/zh/isi/developer-reference/websocket' }
  ],
  tencent: [
    { label: '产品介绍', url: 'https://cloud.tencent.com/product/asr' },
    { label: '语音控制台', url: 'https://console.cloud.tencent.com/asr' },
    { label: 'WebSocket 文档', url: 'https://cloud.tencent.com/document/product/1093/131127' }
  ],
  baidu: [
    { label: '产品介绍', url: 'https://cloud.baidu.com/product/speech' },
    { label: '语音控制台', url: 'https://console.bce.baidu.com/ai/#/ai/speech/overview/index' },
    { label: '接入文档', url: 'https://cloud.baidu.com/doc/SPEECH/index.html' }
  ],
  volcengine: [
    { label: '产品介绍', url: 'https://www.volcengine.com/product/voice-tech' },
    { label: '语音控制台', url: 'https://console.volcengine.com/speech/app' },
    { label: '接入文档', url: 'https://www.volcengine.com/docs/6561' }
  ],
  iflytek: [
    { label: '产品介绍', url: 'https://www.xfyun.cn/services/rtasr' },
    { label: '开放平台控制台', url: 'https://console.xfyun.cn/' },
    { label: '接入文档', url: 'https://www.xfyun.cn/doc/asr/rtasr/API.html' }
  ]
}

export const speechProviderOrder: SpeechProviderId[] = ['deepgram', 'tencent', 'aliyun', 'baidu', 'volcengine', 'iflytek']

export const defaultSpeechSettings: SpeechSettings = {
  sttProvider: 'deepgram',
  endpointingMs: 500,
  providers: {
    deepgram: { enabled: true, apiKey: '' },
    tencent: {
      enabled: false,
      apiKey: '',
      baseUrl: 'wss://asr.cloud.tencent.com/asr/v2',
      model: '16k_zh_en_2.0'
    },
    aliyun: { enabled: false, apiKey: '', baseUrl: 'wss://nls-gateway-cn-shanghai.aliyuncs.com/ws/v1' },
    baidu: { enabled: false, apiKey: '', baseUrl: 'wss://vop.baidu.com/realtime_asr' },
    volcengine: { enabled: false, apiKey: '', baseUrl: 'wss://openspeech.bytedance.com/api/v2/asr' },
    iflytek: { enabled: false, apiKey: '', baseUrl: 'wss://rtasr.xfyun.cn/v1/ws' }
  }
}

export function normalizeSpeechSettings(
  value?: Partial<SpeechSettings>,
  legacyDeepgram?: Partial<ProviderConfig>
): SpeechSettings {
  const fallback = defaultSpeechSettings
  const sttProvider = speechProviderOrder.includes(value?.sttProvider as SpeechProviderId)
    ? (value?.sttProvider as SpeechProviderId)
    : fallback.sttProvider
  const endpointingMs = clampEndpointing(value?.endpointingMs ?? fallback.endpointingMs)

  const providers = Object.fromEntries(
    speechProviderOrder.map((provider) => {
      const base = fallback.providers[provider]
      const incoming = value?.providers?.[provider]
      const legacy = provider === 'deepgram' ? legacyDeepgram : undefined

      return [
        provider,
        {
          enabled: incoming?.enabled ?? legacy?.enabled ?? base.enabled,
          apiKey: incoming?.apiKey ?? legacy?.apiKey ?? base.apiKey,
          baseUrl: incoming?.baseUrl ?? legacy?.baseUrl ?? base.baseUrl,
          model: incoming?.model ?? legacy?.model ?? base.model
        }
      ]
    })
  ) as SpeechSettings['providers']

  return {
    sttProvider,
    endpointingMs,
    providers
  }
}

function clampEndpointing(value: number): number {
  if (!Number.isFinite(value)) return defaultSpeechSettings.endpointingMs
  return Math.min(3000, Math.max(300, Math.round(value)))
}
