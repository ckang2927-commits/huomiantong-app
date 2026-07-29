import { useState } from 'react'
import { AlertTriangle, CheckCircle2, KeyRound, Loader2, Save, TestTube2 } from 'lucide-react'
import { UsageMoneyPanel } from '../UsageMoneyPanel'
import { compactKey, providerModelPresets, providerNames } from '../../lib/appHelpers'
import type { LlmProviderId, ProviderConfig, ProviderId, ProviderTestResult, ProviderUsageStats } from '../../../shared/types'

const providerDescriptions: Record<ProviderId, string> = {
  deepgram: '语音转文字服务，用于麦克风和电脑音频实时转写，按用量收费。',
  deepseek: '回答生成模型，性价比高、速度快，适合日常面试实时回答。',
  dashscope: '阿里通义系列模型，国内网络直连延迟低，中文回答质量好。',
  openai: 'OpenAI 模型，适合高质量回答、复杂推理和英文面试场景。',
  anthropic: 'Anthropic Claude 模型，上下文窗口大，适合长对话和稳健表达。'
}

type ProviderCardProps = {
  config: ProviderConfig
  provider: ProviderId
  result?: ProviderTestResult
  testingProvider: ProviderId | null
  usage?: ProviderUsageStats
  onSaveUsageBudget: (provider: LlmProviderId, budgetCny: number) => Promise<void>
  onSaveSettings: () => Promise<void>
  onTestProvider: (provider: ProviderId) => void | Promise<void>
  onUpdateProvider: (provider: ProviderId, patch: Partial<ProviderConfig>) => void
}

export function ProviderCard({
  config,
  provider,
  result,
  testingProvider,
  usage,
  onSaveUsageBudget,
  onSaveSettings,
  onTestProvider,
  onUpdateProvider
}: ProviderCardProps): JSX.Element {
  const [saveStatus, setSaveStatus] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const saveCurrentProvider = async (): Promise<void> => {
    setIsSaving(true)
    setSaveStatus('正在保存...')
    try {
      await onSaveSettings()
      setSaveStatus(`${providerNames[provider]} Key 已保存到本机。`)
    } catch {
      setSaveStatus('保存失败，请重试。')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <article className={`panel provider-panel ${config.enabled ? 'enabled' : 'disabled'}`}>
      <div className="provider-title">
        <div>
          <KeyRound size={18} />
          <div>
            <strong>{providerNames[provider]}</strong>
            <span>{providerDescriptions[provider]}</span>
          </div>
        </div>
        <div className="provider-title-actions">
          <span className={`provider-enable-badge ${config.enabled ? 'on' : 'off'}`}>{config.enabled ? '已启用' : '已停用'}</span>
          <label className="switch">
            <input checked={config.enabled} onChange={(event) => onUpdateProvider(provider, { enabled: event.target.checked })} type="checkbox" />
            <span />
          </label>
        </div>
      </div>
      <div className="provider-key-summary">
        <span>Key 状态</span>
        <strong>{compactKey(config.apiKey)}</strong>
      </div>
      <div className="provider-fields">
        <label className="field-block">
          <span>API Key</span>
          <div className="provider-secret-row">
            <input value={config.apiKey} onChange={(event) => onUpdateProvider(provider, { apiKey: event.target.value })} placeholder="比如：sk-..." type="password" />
            <button className="ghost-button compact provider-save-key-button" disabled={isSaving} onClick={() => void saveCurrentProvider()} type="button">
              {isSaving ? <Loader2 className="spin" size={14} /> : <Save size={14} />}
              保存 Key
            </button>
          </div>
          <small className={`provider-save-status ${saveStatus.includes('失败') ? 'error' : ''}`}>{saveStatus || '修改后点击保存，重新打开软件也会保留。'}</small>
        </label>
        {provider !== 'deepgram' && (
          <>
            <label className="field-block">
              <span>Base URL</span>
              <input value={config.baseUrl || ''} onChange={(event) => onUpdateProvider(provider, { baseUrl: event.target.value })} />
            </label>
            <label className="field-block">
              <span>模型</span>
              {providerModelPresets[provider] ? (
                <select value={config.model || ''} onChange={(event) => onUpdateProvider(provider, { model: event.target.value })}>
                  {providerModelPresets[provider]?.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={config.model || ''} onChange={(event) => onUpdateProvider(provider, { model: event.target.value })} />
              )}
            </label>
          </>
        )}
      </div>
      {provider !== 'deepgram' && <UsageMoneyPanel provider={provider as LlmProviderId} providerLabel={providerNames[provider]} model={config.model} usage={usage} onSaveBudget={onSaveUsageBudget} />}
      <div className="provider-footer">
        <button className="ghost-button compact" type="button" onClick={() => onTestProvider(provider)} disabled={testingProvider === provider}>
          {testingProvider === provider ? <Loader2 className="spin" size={15} /> : <TestTube2 size={15} />}测试连接
        </button>
        {result && (
          <div className="provider-test-result">
            <span className={result.ok ? 'test-result ok' : 'test-result bad'}>
              {result.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
              {result.status || '失败'} · {result.latencyMs}ms
            </span>
            {!result.ok && <small>{result.message}</small>}
          </div>
        )}
      </div>
    </article>
  )
}

