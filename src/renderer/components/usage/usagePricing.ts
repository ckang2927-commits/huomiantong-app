import type { LlmProviderId, TokenUsage } from '../../../shared/types'

export type ModelPricing = {
  inputCnyPerMillion: number
  outputCnyPerMillion: number
  source: string
}

export const LEGACY_MODEL_KEY = '__legacy__'
export const PRICING_UPDATED_AT = '2026-07-22'
export const PRICING_NOTICE = '软件内金额为预算估算，不是服务商实时账单；实际扣费以各平台官网和账单为准。'

const USD_TO_CNY = 7.2

const fromUsd = (inputUsdPerMillion: number, outputUsdPerMillion: number, source: string): ModelPricing => ({
  inputCnyPerMillion: inputUsdPerMillion * USD_TO_CNY,
  outputCnyPerMillion: outputUsdPerMillion * USD_TO_CNY,
  source
})

const pricingByModel: Partial<Record<LlmProviderId, Record<string, ModelPricing>>> = {
  deepseek: {
    'deepseek-v4-flash': fromUsd(0.14, 0.28, 'DeepSeek v4 flash 预算估算价'),
    'deepseek-v4-pro': fromUsd(0.435, 0.87, 'DeepSeek v4 pro 预算估算价')
  },
  dashscope: {
    'qwen3.7-plus': fromUsd(0.276, 1.101, 'DashScope qwen3.7 plus 预算估算价'),
    'qwen3.7-max': fromUsd(1.65, 4.951, 'DashScope qwen3.7 max 预算估算价'),
    'qwen3.6-flash': fromUsd(0.165, 0.99, 'DashScope qwen3.6 flash 预算估算价'),
    'qwen-plus-latest': fromUsd(0.115, 1.147, 'DashScope qwen plus 预算估算价'),
    'qwen-flash': fromUsd(0.022, 0.216, 'DashScope qwen flash 预算估算价'),
    'qwen-long-latest': fromUsd(0.072, 0.287, 'DashScope qwen long 预算估算价')
  },
  openai: {
    'gpt-4.1-mini': fromUsd(0.4, 1.6, 'OpenAI gpt-4.1 mini 预算估算价'),
    'gpt-4.1': fromUsd(2, 8, 'OpenAI gpt-4.1 预算估算价'),
    'gpt-4o-mini': fromUsd(0.15, 0.6, 'OpenAI gpt-4o mini 预算估算价')
  },
  anthropic: {
    'claude-3-5-haiku-latest': fromUsd(1, 5, 'Anthropic Haiku 预算估算价'),
    'claude-3-5-sonnet-latest': fromUsd(3, 15, 'Anthropic Sonnet 预算估算价')
  }
}

const providerFallbackPricing: Record<LlmProviderId, ModelPricing> = {
  deepseek: fromUsd(0.14, 0.28, 'DeepSeek 默认预算估算价'),
  dashscope: fromUsd(0.276, 1.101, 'DashScope 默认预算估算价'),
  openai: fromUsd(0.4, 1.6, 'OpenAI 默认预算估算价'),
  anthropic: fromUsd(1, 5, 'Anthropic 默认预算估算价')
}

export function formatTokens(value = 0): string {
  return Math.max(0, Math.round(value)).toLocaleString('zh-CN')
}

export function formatMoney(value = 0): string {
  if (value > 0 && value < 0.01) {
    return '<¥0.01'
  }

  return `¥${Math.max(0, value).toLocaleString('zh-CN', {
    minimumFractionDigits: value >= 100 ? 0 : 2,
    maximumFractionDigits: value >= 100 ? 0 : 2
  })}`
}

export function pricingFor(provider: LlmProviderId, modelKey: string): ModelPricing {
  if (modelKey === LEGACY_MODEL_KEY) {
    return {
      ...providerFallbackPricing[provider],
      source: '历史未分模型预算估算价'
    }
  }

  return pricingByModel[provider]?.[modelKey] || providerFallbackPricing[provider]
}

export function estimateCost(usage: TokenUsage | undefined, pricing: ModelPricing): number {
  if (!usage) {
    return 0
  }

  return (usage.inputTokens / 1_000_000) * pricing.inputCnyPerMillion + (usage.outputTokens / 1_000_000) * pricing.outputCnyPerMillion
}

export function displayModelName(modelKey: string): string {
  return modelKey === LEGACY_MODEL_KEY ? '历史合计（未分模型）' : modelKey
}
