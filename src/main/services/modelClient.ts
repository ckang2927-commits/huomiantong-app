import { defaultSettings } from './appStorage'
import type { LlmProviderId, ProviderConfig, ProviderId, ProviderTestResult, TokenUsage } from '../../shared/types'


// ── 重试机制 ──

export interface ApiErrorRecord {
  id: string
  provider: string
  status: number
  message: string
  operation: string
  at: number
  retried: boolean
  resolved: boolean
}

const errorLog: ApiErrorRecord[] = []
const MAX_ERROR_LOG = 50

export function getErrorLog(): ApiErrorRecord[] {
  return [...errorLog]
}

export function clearErrorLog(): void {
  errorLog.length = 0
}

function addErrorLog(record: Omit<ApiErrorRecord, 'id' | 'at'>): void {
  errorLog.unshift({ ...record, id: crypto.randomUUID(), at: Date.now() })
  if (errorLog.length > MAX_ERROR_LOG) {
    errorLog.length = MAX_ERROR_LOG
  }
}

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function retryWithBackoff<T>(
  fn: (attempt: number) => Promise<T>,
  operation: string,
  provider: string,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // 解析 HTTP 状态码
      const match = lastError.message.match(/^(\S+) (\d+):/)
      const status = match ? parseInt(match[2], 10) : 0

      if (!isRetryable(status) || attempt >= maxRetries) {
        addErrorLog({
          provider,
          status,
          message: lastError.message,
          operation,
          retried: attempt > 0,
          resolved: false
        })
        throw lastError
      }

      // 指数退避：1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000
      console.info(`[retry] ${provider} ${status}, attempt ${attempt + 1}/${maxRetries}, waiting ${delay}ms`)
      await sleep(delay)
    }
  }

  throw lastError || new Error('重试失败')
}

function estimateTokens(text: string): number {
  if (!text.trim()) {
    return 0
  }

  const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length ?? 0
  const otherChars = Math.max(0, text.length - chineseChars)
  return Math.max(1, Math.ceil(chineseChars * 0.65 + otherChars / 4))
}

export async function callOpenAiCompatible(
  provider: LlmProviderId,
  config: ProviderConfig,
  prompt: string,
  maxTokens: number,
  timeoutMs: number,
  options: { systemPrompt?: string; temperature?: number } = {}
): Promise<{ answer: string; usage: TokenUsage }> {
  const baseUrl = (config.baseUrl || defaultSettings.providers[provider].baseUrl || '').replace(/\/$/, '')
  const model = config.model || defaultSettings.providers[provider].model
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: options.systemPrompt || '你是获面通的面试陪练助手。回答要像候选人现场开口说的话，短一点、自然一点；只基于简历材料和转写上下文，不编故事、不硬凑数字。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature ?? 0.45,
      max_tokens: maxTokens
    }),
    signal: AbortSignal.timeout(timeoutMs)
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`${provider} ${response.status}: ${body.slice(0, 220)}`)
  }

  const json = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
    usage?: {
      prompt_tokens?: number
      completion_tokens?: number
      total_tokens?: number
    }
  }

  const answer = json.choices?.[0]?.message?.content?.trim() || ''
  const inputTokens = json.usage?.prompt_tokens ?? estimateTokens(prompt)
  const outputTokens = json.usage?.completion_tokens ?? estimateTokens(answer)
  const totalTokens = json.usage?.total_tokens ?? inputTokens + outputTokens

  return {
    answer,
    usage: {
      inputTokens,
      outputTokens,
      totalTokens,
      estimated: !json.usage
    }
  }
}


function readTextContent(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content.map((item) => {
      if (typeof item === 'string') return item
      if (item && typeof item === 'object' && 'text' in item) {
        const text = (item as { text?: unknown }).text
        return typeof text === 'string' ? text : ''
      }
      return ''
    }).join('')
  }

  return ''
}

function extractCompletionText(parsed: {
  choices?: Array<{
    delta?: { content?: unknown; reasoning_content?: unknown }
    message?: { content?: unknown }
    text?: unknown
  }>
  output_text?: unknown
}): string {
  const choice = parsed.choices?.[0]

  return (
    readTextContent(choice?.delta?.content) ||
    readTextContent(choice?.message?.content) ||
    readTextContent(choice?.text) ||
    readTextContent(parsed.output_text)
  )
}

function extractProviderError(parsed: { error?: { message?: unknown } | string }): string {
  if (typeof parsed.error === 'string') {
    return parsed.error
  }

  return typeof parsed.error?.message === 'string' ? parsed.error.message : ''
}


// 流式 SSE 分块回调类型
export type StreamChunk = {
  text: string        // 增量文本
  done: boolean       // 是否完成
  firstByteMs?: number // 首包耗时(ms)
  usage?: { inputTokens: number; outputTokens: number; totalTokens: number; estimated: boolean }
  error?: string      // 出错时的错误信息
}

export async function callOpenAiCompatibleStreaming(
  provider: LlmProviderId,
  config: ProviderConfig,
  prompt: string,
  maxTokens: number,
  timeoutMs: number,
  onChunk: (chunk: StreamChunk) => void,
  options: { systemPrompt?: string; temperature?: number } = {}
): Promise<void> {
  const baseUrl = (config.baseUrl || defaultSettings.providers[provider].baseUrl || '').replace(/\/$/, '')
  const model = config.model || defaultSettings.providers[provider].model
  const requestStartTime = Date.now()
  let firstChunkTime = 0

  const response = await fetch(baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + config.apiKey
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: options.systemPrompt || '你是获面通的面试陪练助手。回答要像候选人现场开口说的话，短一点、自然一点；只基于简历材料和转写上下文，不编故事、不硬凑数字。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: options.temperature ?? 0.45,
        max_tokens: maxTokens,
        stream: true
      }),
      signal: AbortSignal.timeout(timeoutMs)
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(provider + ' ' + response.status + ': ' + body.slice(0, 220))
    }

    // SSE 流解析（?retryWithBackoff 内部，重试时会重新连接）
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('\u6d41\u5f0f\u54cd\u5e94\u6ca1\u6709\u53ef\u8bfb\u53d6\u7684\u6d41')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let rawText = ''
    let fullText = ''
    let inputTokens = 0
    let outputTokens = 0
    let estimated = true

    try {
      const finishStream = (): void => {
        onChunk({
          text: '',
          done: true,
          usage: {
            inputTokens: inputTokens || estimateTokens(prompt),
            outputTokens: outputTokens || estimateTokens(fullText),
            totalTokens: (inputTokens || estimateTokens(prompt)) + (outputTokens || estimateTokens(fullText)),
            estimated
          }
        })
      }

      const processLine = (line: string): boolean => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith(':')) return false
        if (trimmed === 'data: [DONE]') {
          finishStream()
          return true
        }
        const payload = trimmed.startsWith('data: ') ? trimmed.slice(6) : trimmed
        if (!trimmed.startsWith('data: ') && !payload.startsWith('{')) return false

        try {
          const parsed = JSON.parse(payload)
          const providerError = extractProviderError(parsed)
          if (providerError) {
            onChunk({ text: '', done: true, error: providerError })
            return true
          }

          const delta = extractCompletionText(parsed)
          if (delta) {
            fullText += delta
            if (firstChunkTime === 0) firstChunkTime = Date.now()
            onChunk({ text: delta, done: false, firstByteMs: firstChunkTime - requestStartTime })
          }
          if (parsed?.usage) {
            inputTokens = parsed.usage.prompt_tokens ?? inputTokens
            outputTokens = parsed.usage.completion_tokens ?? outputTokens
            estimated = false
          }
        } catch {
          // JSON parse error, skip this SSE line.
        }
        return false
      }

      while (true) {
        const result = await reader.read()
        if (result.done) break

        const decoded = decoder.decode(result.value, { stream: true })
        rawText += decoded
        buffer += decoded
        const lines = buffer.split(/\r?\n/)
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (processLine(line)) return
        }
      }

      const remaining = buffer.trim()
      if (remaining && processLine(remaining)) return
      if (!fullText.trim() && rawText.trim() && processLine(rawText.trim())) return

      // Stream ended without [DONE]
      if (!fullText.trim()) {
        try {
          const fallback = await callOpenAiCompatible(provider, config, prompt, maxTokens, Math.min(timeoutMs, 15000), options)
          const fallbackText = fallback.answer.trim()

          if (fallbackText) {
            if (firstChunkTime === 0) firstChunkTime = Date.now()
            onChunk({ text: fallbackText, done: false, firstByteMs: firstChunkTime - requestStartTime })
            onChunk({ text: '', done: true, usage: fallback.usage })
            return
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : '未知错误'
          onChunk({ text: '', done: true, error: `流式返回为空，普通模式也失败：${message}` })
          return
        }

        onChunk({ text: '', done: true, error: '模型接口返回了空内容，可能是模型不支持流式输出、模型名称填错，或服务商返回格式不兼容。' })
        return
      }

      finishStream()
    } finally {
      reader.releaseLock()
    }
  }
export async function testProvider(provider: ProviderId, config: ProviderConfig): Promise<ProviderTestResult> {
  const startedAt = Date.now()

  if (!config.apiKey) {
    return {
      ok: false,
      provider,
      status: 0,
      message: '请先填写 API Key',
      latencyMs: Date.now() - startedAt
    }
  }

  try {
    let response: Response

    if (provider === 'deepgram') {
      response = await fetch('https://api.deepgram.com/v1/projects', {
        headers: {
          Authorization: `Token ${config.apiKey}`
        },
        signal: AbortSignal.timeout(8000)
      })
    } else if (provider === 'deepseek' || provider === 'dashscope' || provider === 'openai') {
      response = await fetch(`${(config.baseUrl || defaultSettings.providers[provider].baseUrl || '').replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model || defaultSettings.providers[provider].model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 4
        }),
        signal: AbortSignal.timeout(8000)
      })
    } else {
      response = await fetch(`${(config.baseUrl || defaultSettings.providers.anthropic.baseUrl || '').replace(/\/$/, '')}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: config.model || defaultSettings.providers.anthropic.model,
          max_tokens: 4,
          messages: [{ role: 'user', content: 'ping' }]
        }),
        signal: AbortSignal.timeout(8000)
      })
    }

    const body = response.ok ? '' : await response.text()

    return {
      ok: response.ok,
      provider,
      status: response.status,
      message: response.ok ? '连接成功' : formatProviderFailure(provider, response.status, body),
      latencyMs: Date.now() - startedAt
    }
  } catch (error) {
    return {
      ok: false,
      provider,
      status: 0,
      message: error instanceof Error ? error.message : '未知错误',
      latencyMs: Date.now() - startedAt
    }
  }
}

function formatProviderFailure(provider: ProviderId, status: number, body: string): string {
  const rawMessage = body.trim().replace(/\s+/g, ' ').slice(0, 220)
  const suffix = rawMessage ? ' 原始返回：' + rawMessage : ''

  if (status === 401) {
    return '401 未授权：API Key 不正确、已失效，或没有使用该模型/服务的权限。请重新保存 Key 后再测试。' + suffix
  }

  if (status === 402) {
    return provider === 'deepgram'
      ? '402 需要付费/额度不足：Deepgram 账户可能没余额、免费额度过期，或账单未开通，所以实时语音转文字会不可用。请去 Deepgram 控制台检查余额/账单。' + suffix
      : '402 需要付费/额度不足：当前模型服务可能没余额、免费额度过期，或账单未开通。请去服务商控制台检查余额/账单。' + suffix
  }

  if (status === 403) {
    return '403 无权限：Key 可识别，但当前账号没有访问这个服务、模型或项目的权限。' + suffix
  }

  if (status === 404) {
    return '404 找不到接口：Base URL 或模型名称可能填错了。' + suffix
  }

  if (status === 429) {
    return '429 请求过多/限流：当前 Key 触发频率限制或额度限制，请稍后再试。' + suffix
  }

  if (status >= 500) {
    return status + ' 服务商异常：对方接口暂时不可用，稍后重试。' + suffix
  }

  return status + ' 连接失败。' + suffix
}
