import { addUsage, defaultSettings, normalizeSettings } from './appStorage'
import { findEvidence } from './evidenceService'
import { callOpenAiCompatible, callOpenAiCompatibleStreaming, testProvider } from './modelClient'
import { answerRuntimeConfig, buildFastAnswer, buildPrompt, buildSpecialCaseAnswer, normalizeAnswerText } from './promptService'
import { detectFabricationRisk, scoreAnswer } from './qualityScoring'
import type { AnswerRequest, AnswerStreamChunk, CompletedAnswer, PreparedAnswer } from '../../shared/types'

export { testProvider }

export function prepareAnswer(request: AnswerRequest): PreparedAnswer {
  const settings = normalizeSettings(request.settings)
  const evidence = findEvidence(request.question, settings)

  return {
    fastAnswer: buildFastAnswer(request.question, settings, evidence),
    evidence
  }
}

export async function completeAnswer(request: AnswerRequest): Promise<CompletedAnswer> {
  const startedAt = Date.now()
  const settings = normalizeSettings(request.settings)
  const evidence = findEvidence(request.question, settings)
  const specialAnswer = buildSpecialCaseAnswer(request.question)

  if (specialAnswer) {
    return {
      answer: specialAnswer,
      provider: 'local',
      evidence: [],
      quality: scoreAnswer(specialAnswer, []),
      risk: detectFabricationRisk(specialAnswer, []),
      latencyMs: Date.now() - startedAt
    }
  }

  const provider = settings.answer.llmProvider
  const config = settings.providers[provider]
  const prepared = buildFastAnswer(request.question, settings, evidence)

  if (!config.enabled || !config.apiKey) {
    return {
      answer: `${prepared}\n\n完整回答暂未调用模型：请在设置页填写并启用 ${provider} API Key。`,
      provider: 'local',
      evidence,
      quality: scoreAnswer(prepared, evidence),
      risk: detectFabricationRisk(prepared, evidence),
      latencyMs: Date.now() - startedAt
    }
  }

  try {
    const { maxTokens, timeoutMs } = answerRuntimeConfig(settings.answer.answerStyle)
    const result = await callOpenAiCompatible(provider, config, buildPrompt(request, evidence), maxTokens, timeoutMs)
    await addUsage(provider, config.model || defaultSettings.providers[provider].model, result.usage)
    const answer = normalizeAnswerText(result.answer || prepared, settings.answer.answerStyle, request.question)

    return {
      answer,
      provider,
      evidence,
      quality: scoreAnswer(answer, evidence),
      risk: detectFabricationRisk(answer, evidence),
      latencyMs: Date.now() - startedAt,
      usage: result.usage
    }
  } catch (error) {
    return {
      answer: `${prepared}\n\n模型调用失败：${error instanceof Error ? error.message : '未知错误'}`,
      provider: 'local',
      evidence,
      quality: scoreAnswer(prepared, evidence),
      risk: detectFabricationRisk(prepared, evidence),
      latencyMs: Date.now() - startedAt
    }
  }


}

// 流式回答：边生成边通过 onChunk 回调返回增量文本
export async function streamAnswer(
  request: AnswerRequest,
  onChunk: (chunk: AnswerStreamChunk) => void
): Promise<void> {
  const startedAt = Date.now()
  const settings = normalizeSettings(request.settings)
  const evidence = findEvidence(request.question, settings)
  const specialAnswer = buildSpecialCaseAnswer(request.question)

  if (specialAnswer) {
    onChunk({ text: specialAnswer, done: false, firstByteMs: Date.now() - startedAt, provider: 'local' })
    onChunk({ text: '', done: true, latencyMs: Date.now() - startedAt, provider: 'local' })
    return
  }

  const provider = settings.answer.llmProvider
  const config = settings.providers[provider]
  const prepared = buildFastAnswer(request.question, settings, evidence)

  if (!config.enabled || !config.apiKey) {
    const fallback = normalizeAnswerText(prepared, settings.answer.answerStyle, request.question) + '\n\n完整回答暂未调用模型：请在设置页填写并启用 ' + provider + ' API Key。'
    onChunk({ text: fallback, done: false, firstByteMs: Date.now() - startedAt, provider: 'local' })
    onChunk({ text: '', done: true, latencyMs: Date.now() - startedAt, provider: 'local' })
    return
  }

  try {
    const { maxTokens, timeoutMs } = answerRuntimeConfig(settings.answer.answerStyle)
    // 构建完整 prompt（包含转写上下文）
    const prompt = buildPrompt(request, evidence)

    // 累加器：收集完整答案用于后续质量评分
    let fullAnswer = ''

    await callOpenAiCompatibleStreaming(
      provider,
      config,
      prompt,
      maxTokens,
      timeoutMs,
      (chunk) => {
        if (chunk.text) {
          fullAnswer += chunk.text
        }
        if (chunk.done && chunk.usage) {
          // 记录用量
          addUsage(provider, config.model || defaultSettings.providers[provider].model, chunk.usage).catch(() => {})
        }
        const finalText = chunk.done && fullAnswer.trim() ? normalizeAnswerText(fullAnswer, settings.answer.answerStyle, request.question) : undefined
        // 向回调传递增量 + 最终标记
        onChunk({
          text: chunk.text,
          done: chunk.done,
          finalText,
          firstByteMs: chunk.firstByteMs,
          latencyMs: chunk.done ? Date.now() - startedAt : undefined,
          provider,
          usage: chunk.usage,
          error: chunk.error
        })
      }
    )

    // 流完成后进行质量评分和风险检测（异步，不影响用户看到答案）
    if (fullAnswer.trim()) {
      const normalized = normalizeAnswerText(fullAnswer, settings.answer.answerStyle, request.question)
      // 评分结果可以通过单独的 IPC 事件发送，这里先忽略，后续可扩展
    }
  } catch (error) {
    const errorMsg = formatAnswerServiceError(error)
    onChunk({ text: '', done: true, error: errorMsg, provider, latencyMs: Date.now() - startedAt })
  }
}

function formatAnswerServiceError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || '未知错误')

  if (/timeout|timed out|aborted due to timeout|abort/i.test(message)) {
    return '模型响应超时：请检查网络、模型名、余额，或切换更快的模型后重试。'
  }

  return message
}
