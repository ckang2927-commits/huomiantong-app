import type { LlmProviderId, TokenUsage } from '../../../shared/types'
import { displayModelName, estimateCost, formatMoney, formatTokens, pricingFor } from './usagePricing'

type UsageBreakdownProps = {
  modelEntries: Array<[string, TokenUsage]>
  provider: LlmProviderId
  selectedModel: string
}

export function UsageBreakdown({ modelEntries, provider, selectedModel }: UsageBreakdownProps): JSX.Element | null {
  if (modelEntries.length === 0) {
    return null
  }

  return (
    <div className="model-usage-list">
      {modelEntries.map(([modelKey, modelUsage]) => {
        const pricing = pricingFor(provider, modelKey)
        return (
          <div className={modelKey === selectedModel ? 'active' : ''} key={modelKey}>
            <span>{displayModelName(modelKey)}</span>
            <strong>
              {formatTokens(modelUsage.totalTokens)} Token · {formatMoney(estimateCost(modelUsage, pricing))}
            </strong>
          </div>
        )
      })}
    </div>
  )
}
