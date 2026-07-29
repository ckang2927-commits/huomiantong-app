import { useEffect, useMemo, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import type { ToastMessage } from '../lib/appHelpers'
import {
  buildFloatingRecords,
  downloadText,
  safeFileName,
  sessionToMarkdown,
  sessionToWordHtml
} from '../lib/sessionExport'
import { useSettingsStore } from '../stores/useSettingsStore'
import type { InterviewSession } from '../../shared/types'

type ShowToast = (text: string, kind?: ToastMessage['kind']) => void

type UseSessionsOptions = {
  currentSessionRef: MutableRefObject<InterviewSession>
  setCurrentSession: Dispatch<SetStateAction<InterviewSession>>
  showToast: ShowToast
}

export function useSessions({ currentSessionRef, setCurrentSession, showToast }: UseSessionsOptions) {
  const privacyMode = useSettingsStore((state) => state.settings.answer.privacyMode ?? false)
  const [sessions, setSessions] = useState<InterviewSession[]>([])
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([])
  const [openedSession, setOpenedSession] = useState<InterviewSession | null>(null)
  const [sessionProfileFilter, setSessionProfileFilter] = useState('all')

  const openedRecords = useMemo(() => (openedSession ? buildFloatingRecords(openedSession, privacyMode) : []), [openedSession, privacyMode])
  const filteredSessions = useMemo(
    () => (sessionProfileFilter === 'all' ? sessions : sessions.filter((item) => item.resumeProfileId === sessionProfileFilter)),
    [sessionProfileFilter, sessions]
  )

  useEffect(() => {
    window.huomiantong.listSessions().then(setSessions).catch(() => setSessions([]))
  }, [])

  async function refreshSessions(): Promise<void> {
    const next = await window.huomiantong.listSessions()
    setSessions(next)
    setSelectedSessionIds((current) => current.filter((id) => next.some((item) => item.id === id)))
    setOpenedSession((current) => (current ? next.find((item) => item.id === current.id) || null : null))
    showToast(`会话已刷新，共 ${next.length} 条记录`)
  }

  async function saveSessionSnapshot(session: InterviewSession): Promise<InterviewSession[]> {
    const saved = await window.huomiantong.saveSession(session)
    setSessions(saved)
    return saved
  }

  function replaceSessions(nextSessions: InterviewSession[], nextProfileFilter = 'all'): void {
    setSessions(nextSessions)
    setSelectedSessionIds([])
    setOpenedSession(null)
    setSessionProfileFilter(nextProfileFilter)
  }

  function exportSessionMarkdown(item: InterviewSession, notify = true): void {
    downloadText(`${safeFileName(item.title)}.md`, sessionToMarkdown(item, privacyMode))

    if (notify) {
      showToast('MD 导出成功')
    }
  }

  function exportSessionWord(item: InterviewSession, notify = true): void {
    downloadText(`${safeFileName(item.title)}.doc`, sessionToWordHtml(item, privacyMode), 'application/msword;charset=utf-8')

    if (notify) {
      showToast('Word 导出成功')
    }
  }

  async function renameSession(item: InterviewSession): Promise<void> {
    const input = window.prompt('重命名这条历史会话', item.title)

    if (input === null) {
      return
    }

    const title = input.trim()

    if (!title) {
      showToast('名称不能为空，已取消重命名。', 'info')
      return
    }

    const renamed = { ...item, title, updatedAt: Date.now() }
    const next = await window.huomiantong.saveSession(renamed)
    setSessions(next)
    setOpenedSession((current) => (current?.id === item.id ? renamed : current))

    if (currentSessionRef.current.id === item.id) {
      currentSessionRef.current = renamed
      setCurrentSession(renamed)
    }

    showToast('会话重命名成功')
  }

  function toggleSessionSelection(id: string): void {
    setSelectedSessionIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function selectedSessions(): InterviewSession[] {
    return sessions.filter((item) => selectedSessionIds.includes(item.id))
  }

  function exportSelectedSessions(format: 'md' | 'word'): void {
    const items = selectedSessions()

    if (items.length === 0) {
      showToast('请先勾选要导出的会话', 'info')
      return
    }

    items.forEach((item) => (format === 'md' ? exportSessionMarkdown(item, false) : exportSessionWord(item, false)))
    showToast(`已导出 ${items.length} 个${format === 'md' ? 'MD' : 'Word'} 文件`)
  }

  async function deleteSelectedSessions(ids = selectedSessionIds): Promise<void> {
    if (ids.length === 0) {
      return
    }

    if (!window.confirm(ids.length === 1 ? '确定删除这条历史会话吗？' : `确定删除选中的 ${ids.length} 条历史会话吗？`)) {
      return
    }

    const next = await window.huomiantong.deleteSessions(ids)
    setSessions(next)
    setSelectedSessionIds((current) => current.filter((id) => !ids.includes(id)))
    setOpenedSession((current) => (current && ids.includes(current.id) ? null : current))
  }

  return {
    sessions,
    selectedSessionIds,
    openedSession,
    sessionProfileFilter,
    openedRecords,
    filteredSessions,
    setOpenedSession,
    setSessionProfileFilter,
    refreshSessions,
    saveSessionSnapshot,
    replaceSessions,
    exportSessionMarkdown,
    exportSessionWord,
    renameSession,
    toggleSessionSelection,
    exportSelectedSessions,
    deleteSelectedSessions
  }
}
