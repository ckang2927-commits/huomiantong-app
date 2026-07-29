import { useMemo } from 'react'
import type { LlmProviderId, ProviderUsageStats } from '../../shared/types'
import { BudgetEditor } from './usage/BudgetEditor'
import { UsageBreakdown } from './usage/UsageBreakdown'
import { UsageSummaryGrid } from './usage/UsageSummaryGrid'
import { estimateCost, pricingFor, PRICING_NOTICE, PRICING_UPDATED_AT } from './usage/usagePricing'

type UsageMoneyPanelProps = {
  provider: LlmProviderId
  providerLabel: string
  model?: string
  usage?: ProviderUsageStats
  onSaveBudget: (provider: LlmProviderId, budgetCny: number) => Promise<void>
}

export function UsageMoneyPanel({ provider, providerLabel, model, usage, onSaveBudget }: UsageMoneyPanelProps): JSX.Element {
  const selectedModel = model || '未选择模型'
  const modelEntries = useMemo(
    () => Object.entries(usage?.models || {}).sort((left, right) => right[1].totalTokens - left[1].totalTokens),
    [usage?.models]
  )
  const selectedUsage = usage?.models?.[selectedModel]
  const selectedPricing = pricingFor(provider, selectedModel)
  const selectedCost = estimateCost(selectedUsage, selectedPricing)
  const totalCost = modelEntries.length > 0
    ? modelEntries.reduce((sum, [modelKey, modelUsage]) => sum + estimateCost(modelUsage, pricingFor(provider, modelKey)), 0)
    : estimateCost(usage, selectedPricing)
  const budgetCny = usage?.budgetCny || 0
  const remainingCny = budgetCny > 0 ? Math.max(0, budgetCny - totalCost) : null

  return (
    <div className="usage-panel">
      <UsageSummaryGrid remainingCny={remainingCny} selectedCost={selectedCost} selectedUsage={selectedUsage} totalCost={totalCost} />
      <BudgetEditor budgetCny={budgetCny} onSaveBudget={onSaveBudget} provider={provider} />
      <small className="usage-note">
        {providerLabel} · 当前 {selectedModel} · 估算输入 ¥{selectedPricing.inputCnyPerMillion.toFixed(2)}/百万 Token，
        输出 ¥{selectedPricing.outputCnyPerMillion.toFixed(2)}/百万 Token。{PRICING_NOTICE} 估算价更新时间：{PRICING_UPDATED_AT}。
      </small>
      <UsageBreakdown modelEntries={modelEntries} provider={provider} selectedModel={selectedModel} />
    </div>
  )
}
