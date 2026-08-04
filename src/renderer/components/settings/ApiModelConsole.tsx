import { CheckCircle2, CircleAlert, CircleDollarSign, Cpu, ExternalLink, KeyRound, RadioTower } from 'lucide-react'
import type { LlmProviderId, ProviderId } from '../../../shared/types'
import { providerNames } from '../../lib/appHelpers'
import { recordDiagnosticLog } from '../../lib/diagnosticLog'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { useState } from 'react'
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
    <div className="api-console-page" data-onboarding-target="settings-api">
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

      <ApiSetupGuide providerTests={providerTests} />

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

function ApiSetupGuide({ providerTests }: { providerTests: Partial<Record<ProviderId, { ok: boolean; message: string }>> }): JSX.Element {
  const deepseekReady = Boolean(providerTests.deepseek?.ok)
  const deepgramReady = Boolean(providerTests.deepgram?.ok)
  const [externalMessage, setExternalMessage] = useState<string | null>(null)

  async function openExternal(url: string): Promise<void> {
    try {
      const result = await window.huomiantong.openExternal(url)

      if (!result.ok) {
        setExternalMessage(result.message || '未能打开网页，请检查默认浏览器设置。')
        recordDiagnosticLog({
          severity: 'error',
          category: 'system',
          source: 'API 配置引导外链',
          title: '外链打开失败',
          message: result.message || '默认浏览器未能打开网页',
          details: url
        })
        return
      }

      setExternalMessage('网页已在默认浏览器中打开。')
      recordDiagnosticLog({
        severity: 'success',
        category: 'system',
        source: 'API 配置引导外链',
        title: '外链已打开',
        message: '已交给默认浏览器打开网页',
        details: url
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '未能打开网页，请检查默认浏览器设置。'
      setExternalMessage(message)
      recordDiagnosticLog({
        severity: 'error',
        category: 'system',
        source: 'API 配置引导外链',
        title: '外链打开异常',
        message,
        details: url
      })
    }
  }

  return (
    <section className="api-setup-guide">
      <div className="api-setup-guide-heading">
        <div>
          <span className="eyebrow">Recommended Setup</span>
          <h4>新手配置顺序</h4>
        </div>
        <span>先回答模型，再语音转写</span>
      </div>
      <div className="api-setup-guide-grid">
        <article className={deepseekReady ? 'api-setup-step ready' : 'api-setup-step'}>
          <span className="api-setup-step-number">1</span>
          <div>
            <strong>先配 DeepSeek</strong>
            <p>{deepseekReady ? '已测试通过，可以生成回答。' : '填写 Key，保存后点击“测试连接”。'}</p>
            <button className="ghost-button compact" type="button" onClick={() => void openExternal('https://platform.deepseek.com/api_keys')}>
              <ExternalLink size={13} />申请 DeepSeek Key
            </button>
          </div>
          {deepseekReady ? <CheckCircle2 size={17} /> : <CircleAlert size={17} />}
        </article>
        <article className={deepgramReady ? 'api-setup-step ready' : 'api-setup-step'}>
          <span className="api-setup-step-number">2</span>
          <div>
            <strong>需要语音时再配 Deepgram</strong>
            <p>{deepgramReady ? '已测试通过，可以实时转写。' : '只手动输入问题可以跳过，语音面试再配置。'}</p>
            <button className="ghost-button compact" type="button" onClick={() => void openExternal('https://console.deepgram.com/')}>
              <ExternalLink size={13} />打开 Deepgram 控制台
            </button>
          </div>
          {deepgramReady ? <CheckCircle2 size={17} /> : <CircleAlert size={17} />}
        </article>
        <article className="api-setup-step">
          <span className="api-setup-step-number">3</span>
          <div>
            <strong>保存后再去面试台</strong>
            <p>Key 只保存在本机。测试通过后，再去简历库和训练页继续。</p>
          </div>
          <RadioTower size={17} />
        </article>
      </div>
      {externalMessage && <p className="api-setup-guide-message" role="status">{externalMessage}</p>}
    </section>
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
