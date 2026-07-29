import { useState } from 'react'
import { ExternalLink, Globe2, KeyRound, Loader2, RadioTower, Save, SlidersHorizontal } from 'lucide-react'
import { speechProviderHints, speechProviderLinks, speechProviderNames, speechProviderOrder } from '../../../shared/speechProviders'
import type { SpeechProviderId } from '../../../shared/types'
import { compactKey } from '../../lib/appHelpers'
import { useSettingsStore } from '../../stores/useSettingsStore'

const endpointingOptions = [500, 800, 1200, 2000, 3000]

export function SpeechProviderSettingsPanel(): JSX.Element {
  const settings = useSettingsStore((state) => state.settings)
  const updateSpeech = useSettingsStore((state) => state.updateSpeech)
  const updateSpeechProvider = useSettingsStore((state) => state.updateSpeechProvider)
  const saveSettings = useSettingsStore((state) => state.saveSettings)
  const [savingProvider, setSavingProvider] = useState<SpeechProviderId | null>(null)
  const [saveStatuses, setSaveStatuses] = useState<Partial<Record<SpeechProviderId, string>>>({})
  const activeProvider = settings.speech.sttProvider

  const saveSpeechProviderKey = async (provider: SpeechProviderId): Promise<void> => {
    setSavingProvider(provider)
    setSaveStatuses((current) => ({ ...current, [provider]: '正在保存...' }))
    try {
      await saveSettings()
      setSaveStatuses((current) => ({ ...current, [provider]: `${speechProviderNames[provider]} Key 已保存到本机。` }))
    } catch {
      setSaveStatuses((current) => ({ ...current, [provider]: '保存失败，请重试。' }))
    } finally {
      setSavingProvider(null)
    }
  }

  return (
    <div className="panel settings-panel speech-provider-settings-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Speech To Text</span>
          <h3>语音服务商切换</h3>
          <p>Deepgram 与腾讯云 ASR 已接入实时转写；其它国内服务商先保留注册、控制台和配置入口，后续逐个接入。</p>
        </div>
      </div>

      <div className="speech-provider-layout">
        <section className="speech-provider-main-card">
          <div className="speech-provider-main-head">
            <div>
              <Globe2 size={18} />
              <strong>当前转写服务</strong>
            </div>
            <span>{speechProviderNames[activeProvider]}</span>
          </div>

          <div className="speech-provider-control-grid">
            <label className="field-block">
              <span>默认 STT 服务商</span>
              <select value={activeProvider} onChange={(event) => updateSpeech({ sttProvider: event.target.value as SpeechProviderId })}>
                {speechProviderOrder.map((provider) => (
                  <option key={provider} value={provider}>
                    {speechProviderNames[provider]}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-block">
              <span>断句间隔</span>
              <select value={settings.speech.endpointingMs} onChange={(event) => updateSpeech({ endpointingMs: Number(event.target.value) })}>
                {endpointingOptions.map((ms) => (
                  <option key={ms} value={ms}>
                    {ms / 1000} 秒
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="provider-hint">
            <SlidersHorizontal size={14} />
            间隔越短，问题出现越快；间隔越长，越不容易把一句话拆成多个问题。线上面试建议先用 0.8-1.2 秒。
          </p>
        </section>

        <section className="speech-provider-list">
          {speechProviderOrder.map((provider) => {
            const config = settings.speech.providers[provider]
            const isActive = provider === activeProvider
            const isTencent = provider === 'tencent'

            return (
              <article className={`speech-provider-item ${isActive ? 'active' : ''}`} key={provider}>
                <div className="speech-provider-item-head">
                  <div>
                    <RadioTower size={16} />
                    <strong>{speechProviderNames[provider]}</strong>
                  </div>
                  <button className="ghost-button compact" type="button" onClick={() => updateSpeech({ sttProvider: provider })}>
                    {isActive ? '使用中' : '设为默认'}
                  </button>
                </div>

                <p>{speechProviderHints[provider]}</p>

                <div className="speech-provider-link-row">
                  {speechProviderLinks[provider].map((link) => (
                    <a href={link.url} key={link.url} rel="noreferrer" target="_blank">
                      <ExternalLink size={13} />
                      {link.label}
                    </a>
                  ))}
                </div>

                <div className="speech-provider-key-line">
                  <KeyRound size={14} />
                  <span>{compactKey(config.apiKey)}</span>
                </div>

                <div className="provider-fields">
                  <label className="field-block">
                    <span>{isTencent ? '腾讯云凭证' : 'API Key / Token'}</span>
                    <div className="provider-secret-row">
                      <input
                        value={config.apiKey}
                        onChange={(event) => updateSpeechProvider(provider, { apiKey: event.target.value })}
                        placeholder={getCredentialPlaceholder(provider)}
                        type="password"
                      />
                      <button className="ghost-button compact provider-save-key-button" disabled={savingProvider === provider} onClick={() => void saveSpeechProviderKey(provider)} type="button">
                        {savingProvider === provider ? <Loader2 className="spin" size={14} /> : <Save size={14} />}
                        保存 Key
                      </button>
                    </div>
                    <small className={`provider-save-status ${saveStatuses[provider]?.includes('失败') ? 'error' : ''}`}>
                      {saveStatuses[provider] || '修改后点击保存，重新打开软件也会保留。'}
                    </small>
                  </label>

                  <label className="field-block">
                    <span>接口地址</span>
                    <input value={config.baseUrl || ''} onChange={(event) => updateSpeechProvider(provider, { baseUrl: event.target.value })} />
                  </label>

                  {isTencent && (
                    <label className="field-block">
                      <span>识别模型</span>
                      <input
                        value={config.model || '16k_zh_en_2.0'}
                        onChange={(event) => updateSpeechProvider(provider, { model: event.target.value })}
                        placeholder="16k_zh_en_2.0"
                      />
                    </label>
                  )}
                </div>

                {isTencent ? (
                  <small className="speech-provider-connected">已接入：腾讯云 ASR 使用 PCM 16k 实时流，需真实 AppID / SecretId / SecretKey 才能转写。</small>
                ) : provider !== 'deepgram' ? (
                  <small className="speech-provider-reserved">已预留：配置可保存；实时转写协议待后续接入。</small>
                ) : (
                  <small className="speech-provider-connected">已接入：适合海外网络或已有 Deepgram 免费额度的用户。</small>
                )}
              </article>
            )
          })}
        </section>
      </div>
    </div>
  )
}

function getCredentialPlaceholder(provider: SpeechProviderId): string {
  if (provider === 'deepgram') return 'Deepgram Key，可继续复用原配置'
  if (provider === 'tencent') return 'AppID|SecretId|SecretKey，也支持 JSON / key=value'
  return '填写该服务商的 Key / Token'
}
