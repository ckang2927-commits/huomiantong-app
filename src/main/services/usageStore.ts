import { readJson, writeJson } from './jsonStorage'
import type { LlmProviderId, ProviderUsageStats, TokenUsage, UsageStats } from '../../shared/types'

function emptyUsage(): TokenUsage {
  return {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimated: false
  }
}

function normalizeTokenUsage(value?: Partial<TokenUsage>): TokenUsage {
  return {
    inputTokens: Math.max(0, Math.floor(value?.inputTokens || 0)),
    outputTokens: Math.max(0, Math.floor(value?.outputTokens || 0)),
    totalTokens: Math.max(0, Math.floor(value?.totalTokens || 0)),
    estimated: Boolean(value?.estimated)
  }
}

export function normalizeUsageStats(stats: UsageStats): UsageStats {
  const normalized: UsageStats = {}
  ;(['deepseek', 'dashscope', 'openai', 'anthropic'] as LlmProviderId[]).forEach((provider) => {
    const current = stats[provider]

    if (!current) {
      return
    }

    const providerUsage = normalizeTokenUsage(current)
    const models: Record<string, TokenUsage> = {}

    Object.entries(current.models || {}).forEach(([model, usage]) => {
      models[model] = normalizeTokenUsage(usage)
    })

    const modelTotals = Object.values(models).reduce(
      (sum, usage) => ({
        inputTokens: sum.inputTokens + usage.inputTokens,
        outputTokens: sum.outputTokens + usage.outputTokens,
        totalTokens: sum.totalTokens + usage.totalTokens
      }),
      { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
    )
    const legacyUsage = normalizeTokenUsage({
      inputTokens: providerUsage.inputTokens - modelTotals.inputTokens,
      outputTokens: providerUsage.outputTokens - modelTotals.outputTokens,
      totalTokens: providerUsage.totalTokens - modelTotals.totalTokens,
      estimated: providerUsage.estimated
    })

    if (legacyUsage.totalTokens > 0) {
      models.__legacy__ = legacyUsage
    }

    normalized[provider] = {
      ...emptyUsage(),
      ...providerUsage,
      budgetTokens: current.budgetTokens || 0,
      budgetCny: current.budgetCny || 0,
      models
    }
  })

  return normalized
}

export async function loadUsage(): Promise<UsageStats> {
  return normalizeUsageStats(await readJson<UsageStats>('usage.json', {}))
}

export async function addUsage(provider: LlmProviderId, model: string | undefined, usage: TokenUsage): Promise<UsageStats> {
  const stats = await loadUsage()
  const modelKey = model?.trim() || 'unknown-model'
  const current: ProviderUsageStats = stats[provider] || {
    ...emptyUsage(),
    budgetTokens: 0,
    budgetCny: 0,
    models: {}
  }
  const currentModel = current.models[modelKey] || emptyUsage()

  stats[provider] = {
    inputTokens: current.inputTokens + usage.inputTokens,
    outputTokens: current.outputTokens + usage.outputTokens,
    totalTokens: current.totalTokens + usage.totalTokens,
    estimated: current.estimated || usage.estimated,
    budgetTokens: current.budgetTokens || 0,
    budgetCny: current.budgetCny || 0,
    models: {
      ...current.models,
      [modelKey]: {
        inputTokens: currentModel.inputTokens + usage.inputTokens,
        outputTokens: currentModel.outputTokens + usage.outputTokens,
        totalTokens: currentModel.totalTokens + usage.totalTokens,
        estimated: currentModel.estimated || usage.estimated
      }
    }
  }

  await writeJson('usage.json', stats)
  return stats
}

export async function setUsageBudget(provider: LlmProviderId, budgetTokens: number): Promise<UsageStats> {
  const stats = await loadUsage()
  const current: ProviderUsageStats = stats[provider] || {
    ...emptyUsage(),
    budgetTokens: 0,
    budgetCny: 0,
    models: {}
  }

  stats[provider] = {
    ...current,
    budgetTokens: Math.max(0, Math.floor(Number.isFinite(budgetTokens) ? budgetTokens : 0))
  }

  await writeJson('usage.json', stats)
  return stats
}

export async function setUsageMoneyBudget(provider: LlmProviderId, budgetCny: number): Promise<UsageStats> {
  const stats = await loadUsage()
  const current: ProviderUsageStats = stats[provider] || {
    ...emptyUsage(),
    budgetTokens: 0,
    budgetCny: 0,
    models: {}
  }

  stats[provider] = {
    ...current,
    budgetCny: Math.max(0, Number.isFinite(budgetCny) ? Number(budgetCny.toFixed(2)) : 0)
  }

  await writeJson('usage.json', stats)
  return stats
}
