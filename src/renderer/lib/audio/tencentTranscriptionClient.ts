type TencentCredentials = {
  appId: string
  secretId: string
  secretKey: string
}

type TencentTranscriptionClientOptions = {
  credentialsText: string
  baseUrl?: string
  engineModelType?: string
  endpointingMs?: number
  stream: MediaStream
  onOpen: () => void
  onInterimTranscript: (text: string) => void
  onFinalTranscript: (text: string) => void
  onError: (message?: string) => void
  onClose: (event: CloseEvent) => void
}

type TencentRealtimeAsrPayload = {
  code?: number
  message?: string
  final?: number
  result?: {
    slice_type?: number
    voice_text_str?: string
    word_list?: Array<{ word?: string }>
  }
  voice_text_str?: string
  sentence_type?: number
  text?: string
  result_text?: string
}

export type TencentTranscriptionClient = {
  stop: () => void
}

const DEFAULT_TENCENT_ASR_BASE_URL = 'wss://asr.cloud.tencent.com/asr/v2'
const DEFAULT_TENCENT_ENGINE = '16k_zh_en_2.0'
const TARGET_SAMPLE_RATE = 16000
const CHUNK_BYTES = 1280

export async function createTencentTranscriptionClient({
  credentialsText,
  baseUrl = DEFAULT_TENCENT_ASR_BASE_URL,
  engineModelType = DEFAULT_TENCENT_ENGINE,
  endpointingMs = 800,
  stream,
  onOpen,
  onInterimTranscript,
  onFinalTranscript,
  onError,
  onClose
}: TencentTranscriptionClientOptions): Promise<TencentTranscriptionClient> {
  const credentials = parseTencentCredentials(credentialsText)
  const signedUrl = await createTencentSignedUrl({
    baseUrl,
    credentials,
    engineModelType: engineModelType || DEFAULT_TENCENT_ENGINE,
    endpointingMs
  })
  const socket = new WebSocket(signedUrl)
  let audioContext: AudioContext | null = null
  let sourceNode: MediaStreamAudioSourceNode | null = null
  let processorNode: ScriptProcessorNode | null = null
  let pendingPcm: Uint8Array<ArrayBufferLike> = new Uint8Array(0)
  let audioStarted = false

  const startPcmPipeline = async () => {
    if (audioStarted) return
    audioStarted = true

    audioContext = new AudioContext({ sampleRate: TARGET_SAMPLE_RATE })
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    sourceNode = audioContext.createMediaStreamSource(stream)
    processorNode = audioContext.createScriptProcessor(4096, 1, 1)
    processorNode.onaudioprocess = (event) => {
      if (socket.readyState !== WebSocket.OPEN) return

      const input = event.inputBuffer.getChannelData(0)
      const pcm = floatTo16BitPcm(input, audioContext?.sampleRate || TARGET_SAMPLE_RATE, TARGET_SAMPLE_RATE)
      pendingPcm = concatUint8Arrays(pendingPcm, pcm)

      while (pendingPcm.byteLength >= CHUNK_BYTES && socket.readyState === WebSocket.OPEN) {
        const chunk = pendingPcm.slice(0, CHUNK_BYTES)
        pendingPcm = pendingPcm.slice(CHUNK_BYTES)
        socket.send(chunk)
      }
    }
    sourceNode.connect(processorNode)
    processorNode.connect(audioContext.destination)
    onOpen()
  }

  socket.onopen = () => {
    void startPcmPipeline().catch((error) => onError(error instanceof Error ? error.message : '腾讯云音频管线启动失败'))
  }

  socket.onmessage = (event) => {
    const payload = parseTencentPayload(event.data)

    if (typeof payload.code === 'number' && payload.code !== 0) {
      onError(`腾讯云 ASR 返回错误：${payload.message || `code ${payload.code}`}`)
      return
    }

    const text = extractTencentTranscript(payload).trim()
    if (!text) return

    if (isTencentFinalPayload(payload)) {
      onFinalTranscript(text)
    } else {
      onInterimTranscript(text)
    }
  }

  socket.onerror = () => onError('腾讯云 ASR WebSocket 连接失败，请检查 AppID / SecretId / SecretKey、余额和网络。')
  socket.onclose = onClose

  return {
    stop: () => {
      if (pendingPcm.byteLength > 0 && socket.readyState === WebSocket.OPEN) {
        socket.send(pendingPcm)
      }

      processorNode?.disconnect()
      sourceNode?.disconnect()
      void audioContext?.close()

      processorNode = null
      sourceNode = null
      audioContext = null
      pendingPcm = new Uint8Array(0)

      if (socket.readyState <= WebSocket.OPEN) {
        socket.close(1000, 'client stop')
      }
    }
  }
}

function parseTencentCredentials(value: string): TencentCredentials {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error('请先填写腾讯云 ASR 凭证：AppID、SecretId、SecretKey。')
  }

  if (trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed) as Partial<TencentCredentials>
    return assertTencentCredentials(parsed)
  }

  const kvPairs = Object.fromEntries(
    trimmed
      .split(/\r?\n|;|,/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf('=')
        if (separatorIndex === -1) return ['', '']
        return [part.slice(0, separatorIndex).trim().toLowerCase(), part.slice(separatorIndex + 1).trim()]
      })
      .filter(([key]) => key)
  )

  if (Object.keys(kvPairs).length > 0) {
    return assertTencentCredentials({
      appId: kvPairs.appid || kvPairs.app_id || kvPairs.appid,
      secretId: kvPairs.secretid || kvPairs.secret_id,
      secretKey: kvPairs.secretkey || kvPairs.secret_key
    })
  }

  const [appId, secretId, secretKey] = trimmed.split('|').map((part) => part.trim())
  return assertTencentCredentials({ appId, secretId, secretKey })
}

function assertTencentCredentials(value: Partial<TencentCredentials>): TencentCredentials {
  if (!value.appId || !value.secretId || !value.secretKey) {
    throw new Error('腾讯云 ASR 凭证格式不完整，请填写：AppID|SecretId|SecretKey。')
  }

  return {
    appId: value.appId,
    secretId: value.secretId,
    secretKey: value.secretKey
  }
}

async function createTencentSignedUrl({
  baseUrl,
  credentials,
  engineModelType,
  endpointingMs
}: {
  baseUrl: string
  credentials: TencentCredentials
  engineModelType: string
  endpointingMs: number
}): Promise<string> {
  const nonce = Math.floor(Math.random() * 1000000000)
  const timestamp = Math.floor(Date.now() / 1000)
  const expired = timestamp + 24 * 60 * 60
  const url = new URL(`${baseUrl.replace(/\/$/, '')}/${credentials.appId}`)
  const params: Record<string, string | number> = {
    engine_model_type: engineModelType,
    expired,
    filter_dirty: 1,
    filter_modal: 0,
    filter_punc: 0,
    needvad: 1,
    nonce,
    secretid: credentials.secretId,
    timestamp,
    vad_silence_time: Math.min(3000, Math.max(500, Math.round(endpointingMs))),
    voice_format: 1,
    voice_id: `${Date.now()}-${nonce}`
  }
  const sortedQuery = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  const signText = `${url.host}${url.pathname}?${sortedQuery}`
  const signature = await hmacSha1Base64(credentials.secretKey, signText)

  url.search = `${sortedQuery}&signature=${encodeURIComponent(signature)}`
  return url.toString()
}

async function hmacSha1Base64(secret: string, text: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await window.crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const signature = await window.crypto.subtle.sign('HMAC', key, encoder.encode(text))
  const bytes = new Uint8Array(signature)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return window.btoa(binary)
}

function parseTencentPayload(data: unknown): TencentRealtimeAsrPayload {
  if (typeof data !== 'string') return {}
  try {
    return JSON.parse(data) as TencentRealtimeAsrPayload
  } catch {
    return {}
  }
}

function extractTencentTranscript(payload: TencentRealtimeAsrPayload): string {
  return (
    payload.result?.voice_text_str ||
    payload.voice_text_str ||
    payload.result_text ||
    payload.text ||
    payload.result?.word_list?.map((item) => item.word || '').join('') ||
    ''
  )
}

function isTencentFinalPayload(payload: TencentRealtimeAsrPayload): boolean {
  return payload.final === 1 || payload.sentence_type === 1 || payload.result?.slice_type === 2
}

function floatTo16BitPcm(input: Float32Array, sourceSampleRate: number, targetSampleRate: number): Uint8Array {
  const ratio = sourceSampleRate / targetSampleRate
  const outputLength = Math.max(1, Math.floor(input.length / ratio))
  const buffer = new ArrayBuffer(outputLength * 2)
  const view = new DataView(buffer)

  for (let outputIndex = 0; outputIndex < outputLength; outputIndex += 1) {
    const sourceIndex = Math.min(input.length - 1, Math.floor(outputIndex * ratio))
    const sample = Math.max(-1, Math.min(1, input[sourceIndex]))
    view.setInt16(outputIndex * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
  }

  return new Uint8Array(buffer)
}

function concatUint8Arrays(first: Uint8Array, second: Uint8Array): Uint8Array {
  if (first.byteLength === 0) return second
  const merged = new Uint8Array(first.byteLength + second.byteLength)
  merged.set(first)
  merged.set(second, first.byteLength)
  return merged
}
