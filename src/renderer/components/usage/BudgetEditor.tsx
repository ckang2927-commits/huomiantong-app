import { useEffect, useState } from 'react'
import type { LlmProviderId } from '../../../shared/types'

type BudgetEditorProps = {
  budgetCny: number
  provider: LlmProviderId
  onSaveBudget: (provider: LlmProviderId, budgetCny: number) => Promise<void>
}

export function BudgetEditor({ budgetCny, provider, onSaveBudget }: BudgetEditorProps): JSX.Element {
  const [draftBudget, setDraftBudget] = useState('')

  useEffect(() => {
    setDraftBudget(budgetCny ? String(budgetCny) : '')
  }, [budgetCny, provider])

  return (
    <label>
      <span>金额预算（元）</span>
      <input
        min={0}
        onBlur={() => onSaveBudget(provider, Number(draftBudget || 0))}
        onChange={(event) => setDraftBudget(event.target.value)}
        placeholder="比如：10 元"
        step="0.01"
        type="number"
        value={draftBudget}
      />
    </label>
  )
}
