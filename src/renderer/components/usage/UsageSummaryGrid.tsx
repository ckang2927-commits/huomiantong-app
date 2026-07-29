import type { TokenUsage } from '../../../shared/types'
import { formatMoney, formatTokens } from './usagePricing'

type UsageSummaryGridProps = {
  remainingCny: number | null
  selectedCost: number
  selectedUsage?: TokenUsage
  totalCost: number
}

export function UsageSummaryGrid({ remainingCny, selectedCost, selectedUsage, totalCost }: UsageSummaryGridProps): JSX.Element {
  return (
    <>
      <div>
        <span>当前模型 Token</span>
        <strong>{formatTokens(selectedUsage?.totalTokens || 0)}</strong>
      </div>
      <div>
        <span>当前模型估算花费</span>
        <strong>{formatMoney(selectedCost)}</strong>
      </div>
      <div>
        <span>总估算花费</span>
        <strong>{formatMoney(totalCost)}</strong>
      </div>
      <div>
        <span>剩余预算</span>
        <strong>{remainingCny === null ? '未设置预算' : formatMoney(remainingCny)}</strong>
      </div>
    </>
  )
}
