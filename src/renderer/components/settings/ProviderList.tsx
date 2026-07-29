import type { LlmProviderId, ProviderId } from '../../../shared/types'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { ProviderCard } from './ProviderCard'

export function ProviderList(): JSX.Element {
  const settings = useSettingsStore((s) => s.settings)
  const providerTests = useSettingsStore((s) => s.providerTests)
  const testingProvider = useSettingsStore((s) => s.testingProvider)
  const usageStats = useSettingsStore((s) => s.usageStats)
  const updateProvider = useSettingsStore((s) => s.updateProvider)
  const testProvider = useSettingsStore((s) => s.testProvider)
  const saveUsageBudget = useSettingsStore((s) => s.saveUsageBudget)
  const saveSettings = useSettingsStore((s) => s.saveSettings)

  return (
    <aside className="settings-provider-column">
      <div className="provider-list">
        {(Object.keys(settings.providers) as ProviderId[]).map((provider) => (
          <ProviderCard
            config={settings.providers[provider]}
            key={provider}
            onSaveSettings={saveSettings}
            onSaveUsageBudget={saveUsageBudget}
            onTestProvider={testProvider}
            onUpdateProvider={updateProvider}
            provider={provider}
            result={providerTests[provider]}
            testingProvider={testingProvider}
            usage={provider === 'deepgram' ? undefined : usageStats[provider as LlmProviderId]}
          />
        ))}
      </div>
    </aside>
  )
}
