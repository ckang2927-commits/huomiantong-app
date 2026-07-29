import { app } from 'electron'
import { writeJson } from './jsonStorage'
import { loadInterviewReviews, normalizeInterviewReviewRecords } from './interviewReviewStore'
import { loadSessions, normalizeImportedSessions } from './sessionStore'
import { loadSettings, saveSettings } from './settingsStore'
import { loadUsage, normalizeUsageStats } from './usageStore'
import type { BackupImportResult, BackupOptions, BackupPayload } from '../../shared/types'

export async function exportBackup(options?: BackupOptions): Promise<BackupPayload> {
  const result: BackupPayload = {
    version: 1,
    appName: '获面通',
    appVersion: app.getVersion(),
    exportedAt: Date.now(),
    settings: await loadSettings(),
    sessions: await loadSessions(),
    interviewReviews: await loadInterviewReviews(),
    usage: await loadUsage()
  }

  if (options?.includeApiKeys === false) {
    const providers = { ...result.settings.providers }
    for (const key of Object.keys(providers)) {
      const p = key as keyof typeof providers
      providers[p] = { ...providers[p], apiKey: '' }
    }
    const speechProviders = { ...result.settings.speech.providers }
    for (const key of Object.keys(speechProviders)) {
      const p = key as keyof typeof speechProviders
      speechProviders[p] = { ...speechProviders[p], apiKey: '' }
    }
    result.settings = {
      ...result.settings,
      providers,
      speech: {
        ...result.settings.speech,
        providers: speechProviders
      }
    }
  }

  return result
}

export async function importBackup(payload: Partial<BackupPayload>): Promise<BackupImportResult> {
  if (!payload?.settings) {
    throw new Error('备份文件缺少 settings')
  }

  const settings = await saveSettings(payload.settings)
  const sessions = normalizeImportedSessions(payload.sessions)
  const interviewReviews = normalizeInterviewReviewRecords(payload.interviewReviews)
  const usage = normalizeUsageStats(payload.usage || {})

  await writeJson('sessions.json', sessions.slice(0, 200))
  await writeJson('interviewReviews.json', interviewReviews.slice(0, 200))
  await writeJson('usage.json', usage)

  return {
    importedAt: Date.now(),
    settings,
    sessions,
    interviewReviews,
    usage
  }
}
