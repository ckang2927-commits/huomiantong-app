import { CheckCircle2, CircleDollarSign, Cpu, KeyRound, RadioTower } from 'lucide-react'
import type { LlmProviderId, ProviderId } from '../../../shared/types'
import { providerNames } from '../../lib/appHelpers'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { formatMoney } from '../usage/usagePricing'
import { BudgetExplainerPanel } from './BudgetExplainerPanel'
import { ModelProviderPanel } from './ModelProviderPanel'
import { ProviderList } from './ProviderList'

const answerProviders: LlmProviderId[] = ['deepseek', 'dashscope', 'openai', 'anthropic']

export function ApiModelConsole(): JSX.Element {
  const settings = useSettingsStore((state) => state.settings)
  const usageStats = useSettingsStore((state) => state.usageStats)
  const providerTests = useSettingsStore((state) => state.providerTests)
  const activeProvider = settings.answer.llmProvider
  const activeConfig = settings.providers[activeProvider]
  const enabledCount = (Object.keys(settings.providers) as ProviderId[]).filter((provider) => settings.providers[provider].enabled).length
  const keyReadyCount = (Object.keys(settings.providers) as ProviderId[]).filter((provider) => settings.providers[provider].apiKey.trim()).length
  const okTestCount = Object.values(providerTests).filter((result) => result?.ok).length
  const totalBudget = answerProviders.reduce((sum, provider) => sum + (usageStats[provider]?.budgetCny || 0), 0)

  return (
    <div className="api-console-page">
      <section className="api-console-hero">
        <div className="api-console-copy">
          <span className="eyebrow">Model Control Center</span>
          <h3>模型控制台</h3>
          <p>这里集中管理回答模型、语音转写、Key、连接测试和金额预算。先保证当前回答模型可用，再去面试台生成答案。</p>
        </div>
        <div className="api-console-current">
          <span>当前回答模型</span>
          <strong>{providerNames[activeProvider]}</strong>
          <small>{activeConfig.model || '未选择具体模型'} · {activeConfig.enabled && activeConfig.apiKey ? '可用于回答' : '未完整配置'}</small>
        </div>
      </section>

      <div className="api-console-summary">
        <SummaryCard icon={Cpu} label="已启用服务" value={`${enabledCount} 个`} hint="包含语音和回答模型" />
        <SummaryCard icon={KeyRound} label="Key 已填写" value={`${keyReadyCount} 个`} hint="只显示是否填写，不展示明文" />
        <SummaryCard icon={RadioTower} label="连接成功" value={`${okTestCount} 个`} hint="点击各服务商测试后更新" />
        <SummaryCard icon={CircleDollarSign} label="金额预算" value={formatMoney(totalBudget)} hint="按服务商分别估算" />
      </div>

      <div className="api-console-grid">
        <section className="api-console-provider-area">
          <div className="api-console-section-head">
            <div>
              <span className="eyebrow">Provider Setup</span>
              <h4>服务商配置</h4>
            </div>
            <span>保存后即时生效</span>
          </div>
          <ProviderList />
        </section>

        <aside className="api-console-guide-area">
          <ModelProviderPanel />
          <BudgetExplainerPanel />
        </aside>
      </div>
    </div>
  )
}

type SummaryCardProps = {
  icon: typeof Cpu
  label: string
  value: string
  hint: string
}

function SummaryCard({ icon: Icon, label, value, hint }: SummaryCardProps): JSX.Element {
  return (
    <div className="api-summary-card">
      <span className="api-summary-icon">
        <Icon size={16} />
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
      <CheckCircle2 className="api-summary-mark" size={15} />
    </div>
  )
}
