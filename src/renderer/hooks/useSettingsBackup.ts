import { useRef, useState, type ChangeEvent, type MutableRefObject, type Dispatch, type SetStateAction } from 'react'
import { createSession } from '../lib/appHelpers'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useUIStore } from '../stores/useUIStore'
import { downloadText } from '../lib/sessionExport'
import type { AppSettings, BackupPayload, InterviewSession } from '../../shared/types'

type UseSettingsBackupOptions = {
  currentSessionRef: MutableRefObject<InterviewSession>
  replaceSessions: (sessions: InterviewSession[], activeResumeId: string) => void
  resetAnswerState: () => void
  setCurrentSession: Dispatch<SetStateAction<InterviewSession>>
  stopAudioTranscription: () => void
}

export function useSettingsBackup({
  currentSessionRef,
  replaceSessions,
  resetAnswerState,
  setCurrentSession,
  stopAudioTranscription
}: UseSettingsBackupOptions) {
  const [backupStatus, setBackupStatus] = useState('')
  const backupImportRef = useRef<HTMLInputElement | null>(null)

  async function exportBackup(options?: { includeApiKeys?: boolean }): Promise<void> {
    try {
      const backup = await window.huomiantong.exportBackup()
      const fileName = `获面通备份-${new Date(backup.exportedAt).toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`
      downloadText(fileName, JSON.stringify(backup, null, 2), 'application/json;charset=utf-8')
      setBackupStatus('备份已导出，文件里会包含设置、会话和用量记录。')
      useUIStore.getState().showToast('备份导出成功')
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误'
      setBackupStatus(`导出失败：${message}`)
      useUIStore.getState().showToast('备份导出失败', 'error')
    }
  }

  function openBackupImporter(): void {
    backupImportRef.current?.click()
  }

  async function handleBackupImport(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''

    if (!file) {
      return
    }

    if (!window.confirm('导入备份会覆盖本机当前设置、会话和用量记录，确定继续吗？')) {
      return
    }

    stopAudioTranscription()
    setBackupStatus(`正在导入 ${file.name} ...`)

    try {
      const payload = JSON.parse(await file.text()) as Partial<BackupPayload>
      const result = await window.huomiantong.importBackup(payload)
      const nextSession = createSession(result.settings.resume)

      useSettingsStore.getState().setSettings(result.settings)
      useSettingsStore.getState().setUsageStats(result.usage)
      resetAnswerState()
      setCurrentSession(nextSession)
      currentSessionRef.current = nextSession
      replaceSessions(result.sessions, result.settings.activeResumeId || 'all')
      setBackupStatus(`导入成功：${result.sessions.length} 条会话、${Object.keys(result.usage).length} 个模型/平台用量记录。`)
      useSettingsStore.getState().setSettingsStatus('已导入备份')
      useUIStore.getState().showToast('备份导入成功')
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误'
      setBackupStatus(`导入失败：${message}`)
      useUIStore.getState().showToast('备份导入失败', 'error')
    }
  }

  return {
    backupImportRef,
    backupStatus,
    exportBackup,
    handleBackupImport,
    openBackupImporter
  }
}
