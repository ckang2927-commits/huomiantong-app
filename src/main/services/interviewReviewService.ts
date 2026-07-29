import { loadSettings, normalizeSettings } from './settingsStore'
import type {
  InterviewReviewTranscriptionRequest,
  InterviewReviewTranscriptionResult,
  InterviewReviewUtterance
} from '../../shared/types'

const DEEPGRAM_PRERECORDED_URL =
  'https://api.deepgram.com/v1/listen?model=nova-3&language=zh&smart_format=true&punctuate=true&paragraphs=true&utterances=true&diarize_model=latest'

const MAX_AUDIO_FILE_BYTES = 120 * 1024 * 1024
const MAX_SAME_SPEAKER_GAP_SEC = 8
const MAX_MERGED_UTTERANCE_CHARS = 900
const MIN_DEEPGRAM_TIMEOUT_MS = 180_000
const MAX_DEEPGRAM_TIMEOUT_MS = 600_000

const supportedExtensions = new Set([
  'aac',
  'flac',
  'm4a',
  'm4v',
  'mp3',
  'mp4',
  'mpeg',
  'mpga',
  'ogg',
  'opus',
  'wav',
  'webm'
])

type DeepgramWord = {
  word?: string
  punctuated_word?: string
  start?: number
  end?: number
  confidence?: number
  speaker?: number | string
}

type DeepgramUtterance = {
  transcript?: string
  start?: number
  end?: number
  confidence?: number
  speaker?: number | string
}

type DeepgramResponse = {
  request_id?: string
  metadata?: {
    request_id?: string
    duration?: number
  }
  results?: {
    utterances?: DeepgramUtterance[]
    channels?: Array<{
      alternatives?: Array<{
        transcript?: string
        confidence?: number
        words?: DeepgramWord[]
        paragraphs?: {
          transcript?: string
          paragraphs?: Array<{
            sentences?: Array<{
              text?: string
            }>
          }>
        }
      }>
    }>
  }
}

function getExtension(fileName: string): string {
  return (fileName.split('.').pop() || '').trim().toLowerCase()
}

function assertSupportedAudio(request: InterviewReviewTranscriptionRequest): void {
  if (!request.fileName.trim()) {
    throw new Error('没有读取到录音文件名，请重新选择文件。')
  }

  if (!Number.isFinite(request.size) || request.size <= 0 || request.data.byteLength <= 0) {
    throw new Error('录音文件为空，请换一个有效的音频文件。')
  }

  if (request.size > MAX_AUDIO_FILE_BYTES || request.data.byteLength > MAX_AUDIO_FILE_BYTES) {
    throw new Error('录音文件太大，当前第一版建议控制在 120MB 以内。长录音后续会做分段上传。')
  }

  const extension = getExtension(request.fileName)
  const isAudioMime = request.mimeType.startsWith('audio/') || request.mimeType === 'video/mp4' || request.mimeType === 'video/webm'

  if (!isAudioMime && !supportedExtensions.has(extension)) {
    throw new Error('暂不支持这个录音格式。建议上传 mp3、wav、m4a、mp4、webm、ogg 或 flac。')
  }
}

function buildDeepgramError(status: number, body: string): Error {
  const shortBody = body.trim().slice(0, 260)

  if (status === 401 || status === 403) {
    return new Error(`Deepgram 鉴权失败（${status}）：请检查设置中心里的 Deepgram Key 是否正确、是否复制了多余空格。${shortBody ? `原始信息：${shortBody}` : ''}`)
  }

  if (status === 402) {
    return new Error(`Deepgram 余额不足（402）：当前项目额度可能用完了，需要去 Deepgram 控制台查看余额或充值。${shortBody ? `原始信息：${shortBody}` : ''}`)
  }

  if (status === 413) {
    return new Error('Deepgram 拒绝了这个文件：录音可能太大。建议先压缩或裁剪，后续我们会做长录音分段。')
  }

  if (status === 429) {
    return new Error('Deepgram 请求太频繁（429）：稍等一会儿再试，或检查当前项目限流。')
  }

  return new Error(`Deepgram 文件转写失败（${status}）：${shortBody || '服务商没有返回详细原因。'}`)
}

function buildDeepgramTimeoutMs(fileSize: number): number {
  const fileSizeMb = Math.max(1, Math.ceil(fileSize / 1024 / 1024))
  return Math.min(MAX_DEEPGRAM_TIMEOUT_MS, Math.max(MIN_DEEPGRAM_TIMEOUT_MS, 180_000 + fileSizeMb * 20_000))
}

function buildDeepgramFetchError(error: unknown, request: InterviewReviewTranscriptionRequest): Error {
  const name = typeof error === 'object' && error && 'name' in error ? String((error as { name?: unknown }).name || '') : ''
  const message = error instanceof Error ? error.message : String(error)

  if (/abort|timeout/i.test(name) || /abort|timeout/i.test(message)) {
    const sizeMb = Math.ceil(request.size / 1024 / 1024)
    return new Error(`Deepgram 文件转写超时：当前文件约 ${sizeMb}MB。建议先重试一次；如果仍失败，把录音裁成 20 分钟左右的小段再上传，或先用“长录音优化”查看分段建议。`)
  }

  return new Error(`Deepgram 文件转写请求失败：${message || '网络异常或服务商无响应。'}`)
}

function joinSentences(sentences?: Array<{ text?: string }>): string {
  return (sentences || [])
    .map((sentence) => sentence.text?.trim() || '')
    .filter(Boolean)
    .join('')
}

function extractTranscript(json: DeepgramResponse): string {
  const alternative = json.results?.channels?.[0]?.alternatives?.[0]
  const paragraphText = alternative?.paragraphs?.paragraphs
    ?.map((paragraph) => joinSentences(paragraph.sentences))
    .filter(Boolean)
    .join('\n\n')

  return (paragraphText || alternative?.paragraphs?.transcript || alternative?.transcript || '').trim()
}

function extractUtterances(json: DeepgramResponse): InterviewReviewUtterance[] {
  const utterances = json.results?.utterances || []

  if (utterances.length > 0) {
    const normalizedUtterances = utterances
      .map((utterance) => ({
        speaker: utterance.speaker === undefined ? undefined : `说话人 ${utterance.speaker}`,
        text: polishTranscriptText(utterance.transcript || ''),
        start: utterance.start,
        end: utterance.end,
        confidence: utterance.confidence
      }))
      .filter((utterance) => utterance.text)

    return mergeContinuousUtterances(normalizedUtterances)
  }

  const words = json.results?.channels?.[0]?.alternatives?.[0]?.words || []
  const grouped: InterviewReviewUtterance[] = []

  for (const word of words) {
    const speaker = word.speaker === undefined ? '说话人 0' : `说话人 ${word.speaker}`
    const current = grouped[grouped.length - 1]
    const token = polishTranscriptText(word.punctuated_word || word.word || '')

    if (!token) {
      continue
    }

    if (!current || current.speaker !== speaker) {
      grouped.push({
        speaker,
        text: token,
        start: word.start,
        end: word.end,
        confidence: word.confidence
      })
    } else {
      current.text = `${current.text}${/^[，。！？、,.!?;；:：]/.test(token) ? '' : ' '}${token}`
      current.end = word.end ?? current.end
      current.confidence =
        current.confidence === undefined || word.confidence === undefined
          ? current.confidence ?? word.confidence
          : (current.confidence + word.confidence) / 2
    }
  }

  return mergeContinuousUtterances(grouped)
}

function mergeContinuousUtterances(utterances: InterviewReviewUtterance[]): InterviewReviewUtterance[] {
  const merged: InterviewReviewUtterance[] = []

  for (const utterance of utterances) {
    const current = merged[merged.length - 1]
    const sameSpeaker = current && (current.speaker || '') === (utterance.speaker || '')
    const gapSec =
      current?.end !== undefined && utterance.start !== undefined
        ? utterance.start - current.end
        : 0
    const canMerge =
      Boolean(sameSpeaker) &&
      gapSec >= 0 &&
      gapSec <= MAX_SAME_SPEAKER_GAP_SEC &&
      `${current?.text || ''}${utterance.text}`.length <= MAX_MERGED_UTTERANCE_CHARS

    if (!current || !canMerge) {
      merged.push({ ...utterance })
      continue
    }

    current.text = joinUtteranceText(current.text, utterance.text)
    current.end = utterance.end ?? current.end
    current.confidence =
      current.confidence === undefined || utterance.confidence === undefined
        ? current.confidence ?? utterance.confidence
        : (current.confidence + utterance.confidence) / 2
  }

  return merged.filter((utterance) => utterance.text.trim())
}

function joinUtteranceText(left: string, right: string): string {
  const cleanLeft = polishTranscriptText(left)
  const cleanRight = polishTranscriptText(right)

  if (!cleanLeft) return cleanRight
  if (!cleanRight) return cleanLeft
  if (/[,，。.!！?？;；:：]$/.test(cleanLeft) || /^[,，。.!！?？;；:：]/.test(cleanRight)) {
    return `${cleanLeft}${cleanRight}`
  }

  return `${cleanLeft} ${cleanRight}`
}

function polishTranscriptText(text: string): string {
  return text
    .replace(/\b(?:[A-Za-z]\s+){2,}[A-Za-z]\b/g, (match) => match.replace(/\s+/g, ''))
    .replace(/([\u4e00-\u9fa5])\s+(?=[\u4e00-\u9fa5])/g, '$1')
    .replace(/\s+([,，。.!！?？;；:：])/g, '$1')
    .replace(/([,，。.!！?？;；:：])\s+/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function getDeepgramKey(): Promise<string> {
  return loadSettings().then((settings) => {
    const normalized = normalizeSettings(settings)
    return (
      normalized.speech.providers.deepgram.apiKey ||
      normalized.providers.deepgram.apiKey ||
      ''
    ).trim()
  })
}

export async function transcribeInterviewAudio(
  request: InterviewReviewTranscriptionRequest
): Promise<InterviewReviewTranscriptionResult> {
  const startedAt = Date.now()
  assertSupportedAudio(request)

  const apiKey = await getDeepgramKey()

  if (!apiKey) {
    throw new Error('还没有配置 Deepgram Key。请先去「设置中心 → 语音转写」填写并保存 Deepgram Key。')
  }

  const contentType = request.mimeType || 'application/octet-stream'
  let response: Response

  try {
    response = await fetch(DEEPGRAM_PRERECORDED_URL, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': contentType
      },
      body: Buffer.from(request.data),
      signal: AbortSignal.timeout(buildDeepgramTimeoutMs(request.size))
    })
  } catch (error) {
    throw buildDeepgramFetchError(error, request)
  }

  const body = await response.text()

  if (!response.ok) {
    throw buildDeepgramError(response.status, body)
  }

  let json: DeepgramResponse

  try {
    json = JSON.parse(body) as DeepgramResponse
  } catch {
    throw new Error('Deepgram 返回结果不是有效 JSON，请稍后重试。')
  }

  const alternative = json.results?.channels?.[0]?.alternatives?.[0]
  const transcript = extractTranscript(json)

  if (!transcript) {
    throw new Error('Deepgram 没有识别出文字：可能录音音量太低、格式异常，或录音里没有清晰人声。')
  }

  return {
    transcript,
    provider: 'deepgram',
    model: 'nova-3',
    fileName: request.fileName,
    fileSize: request.size,
    mimeType: contentType,
    durationSec: json.metadata?.duration,
    confidence: alternative?.confidence,
    requestId: json.metadata?.request_id || json.request_id,
    utterances: extractUtterances(json),
    latencyMs: Date.now() - startedAt
  }
}
