import { useEffect, type Dispatch, type SetStateAction } from 'react'
import { initialSettings } from '../lib/appHelpers'
import type { AppSettings, UsageStats } from '../../shared/types'

type UseInitialAppDataOptions = {
  setSettings: Dispatch<SetStateAction<AppSettings>>
  setUsageStats: Dispatch<SetStateAction<UsageStats>>
}

export function useInitialAppData({ setSettings, setUsageStats }: UseInitialAppDataOptions): void {
  useEffect(() => {
    window.huomiantong
      .loadSettings()
      .then(setSettings)
      .catch(() => setSettings(initialSettings))

    window.huomiantong
      .loadUsage()
      .then(setUsageStats)
      .catch(() => setUsageStats({}))
  }, [setSettings, setUsageStats])
}
