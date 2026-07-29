import { useMemo, useState } from 'react'
import { resumeLabel } from '../lib/appHelpers'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useUIStore } from '../stores/useUIStore'
import {
  buildResumeFileMeta,
  createResumeProfile,
  filterResumeProfiles,
  importOtherResumeAttachments,
  syncResumeProfile
} from '../lib/resumeProfileHelpers'
import { importResumeFile, type ResumeImportKind } from '../lib/resumeImport'
import type { AppSettings } from '../../shared/types'

type UseResumeProfilesOptions = {
  onDeletedProfile: (id: string) => void
}

export function useResumeProfiles({ onDeletedProfile }: UseResumeProfilesOptions) {
  const [resumeImportStatus, setResumeImportStatus] = useState('')
  const [resumeSaveStatus, setResumeSaveStatus] = useState('')
  const [resumeSearch, setResumeSearch] = useState('')
  const [isImportingResume, setIsImportingResume] = useState(false)

  // 从 store 获取最新值（而不是通过参数传递）
  const settings = useSettingsStore((s) => s.settings)
  const resumeProfiles = useMemo(() => (settings.resumeProfiles?.length ? settings.resumeProfiles : [settings.resume]), [settings.resumeProfiles, settings.resume])
  const filteredResumeProfiles = useMemo(() => filterResumeProfiles(resumeProfiles, resumeSearch), [resumeProfiles, resumeSearch])

  function updateResume(patch: Partial<AppSettings['resume']>): void {
    const current = useSettingsStore.getState().settings
    useSettingsStore.getState().setSettings(syncResumeProfile(current, { ...current.resume, ...patch }))
    useSettingsStore.getState().setSettingsStatus('有未保存修改')
  }

  function addResumeProfile(): void {
    const current = useSettingsStore.getState().settings
    const index = (current.resumeProfiles?.length ?? 0) + 1
    const profile = createResumeProfile(index)

    useSettingsStore.getState().setSettings({
      ...current,
      resume: profile,
      activeResumeId: profile.id,
      resumeProfiles: [...(current.resumeProfiles || [current.resume]), profile]
    })
    useSettingsStore.getState().setSettingsStatus('有未保存修改')
    setResumeSearch('')
    useUIStore.getState().showToast('已创建新候选人档案，直接填写姓名和岗位即可。', 'info')
  }

  function selectResumeProfile(id: string | undefined): void {
    const current = useSettingsStore.getState().settings
    const profile = current.resumeProfiles?.find((item) => item.id === id)

    if (!profile) {
      return
    }

    useSettingsStore.getState().setSettings({ ...current, resume: profile, activeResumeId: profile.id })
    useSettingsStore.getState().setSettingsStatus('有未保存修改')
  }

  function deleteResumeProfile(id: string | undefined): void {
    if (!id) {
      return
    }

    const current = useSettingsStore.getState().settings
    const profiles = current.resumeProfiles?.length ? current.resumeProfiles : [current.resume]

    if (profiles.length <= 1) {
      useUIStore.getState().showToast('至少保留一个候选人档案。', 'info')
      return
    }

    const target = profiles.find((profile) => profile.id === id)

    if (!target) {
      return
    }

    if (!window.confirm(`确定删除候选人"${resumeLabel(target)}"吗？这只删除简历档案，不会删除已保存的历史会话。`)) {
      return
    }

    const nextProfiles = profiles.filter((profile) => profile.id !== id)
    const nextActive = id === current.activeResumeId ? nextProfiles[0] : current.resume
    useSettingsStore.getState().setSettings({
      ...current,
      resume: nextActive,
      activeResumeId: nextActive.id,
      resumeProfiles: nextProfiles
    })
    useSettingsStore.getState().setSettingsStatus('有未保存修改')
    setResumeSearch('')
    onDeletedProfile(id)
    useUIStore.getState().showToast('候选人档案已删除')
  }

  async function saveResume(): Promise<void> {
    setResumeSaveStatus('正在保存简历...')

    try {
      const current = useSettingsStore.getState().settings
      const saved = await window.huomiantong.saveSettings(current)
      useSettingsStore.getState().setSettings(saved)
      useSettingsStore.getState().setSettingsStatus('已保存')
      setResumeSaveStatus(`简历保存成功，${new Date().toLocaleTimeString('zh-CN')} 已更新`)
      useUIStore.getState().showToast('简历保存成功')
    } catch (error) {
      setResumeSaveStatus(`保存失败：${error instanceof Error ? error.message : '未知错误'}`)
      useUIStore.getState().showToast('简历保存失败', 'error')
    }
  }

  async function importResume(kind: ResumeImportKind, files: FileList | null): Promise<void> {
    const selectedFiles = Array.from(files ?? [])
    const file = selectedFiles[0]

    if (!file) {
      return
    }

    setIsImportingResume(true)
    setResumeImportStatus(kind === 'extra' ? `正在添加 ${selectedFiles.length} 个其他简历...` : `正在导入 ${file.name}...`)

    try {
      if (kind === 'extra') {
        const attachments = await importOtherResumeAttachments(selectedFiles, kind)

        const current = useSettingsStore.getState().settings
        const nextOtherResumes = [...(current.resume.otherResumes ?? []), ...attachments]
        useSettingsStore.getState().setSettings(syncResumeProfile(current, { ...current.resume, otherResumes: nextOtherResumes }))
        useSettingsStore.getState().setSettingsStatus('有未保存修改')
        setResumeImportStatus(`已添加 ${attachments.length} 个其他简历，共 ${attachments.reduce((sum, item) => sum + item.text.length, 0).toLocaleString('zh-CN')} 字`)
        useUIStore.getState().showToast('其他简历已添加，会一起作为 AI 依据。')
        return
      }

      const result = await importResumeFile(file, kind)
      const meta = buildResumeFileMeta(file, result.text.length)
      updateResume(kind === 'formal' ? { formalResume: result.text, formalResumeFile: meta } : { detailedResume: result.text, detailedResumeFile: meta })
      setResumeImportStatus(`${result.fileName} 已导入，共 ${result.text.length.toLocaleString('zh-CN')} 字`)
      useUIStore.getState().showToast(kind === 'formal' ? '正式简历已导入' : '万字简历已导入')
    } catch (error) {
      setResumeImportStatus(`导入失败：${error instanceof Error ? error.message : '未知错误'}`)
      useUIStore.getState().showToast('导入失败，请看上方提示', 'error')
    } finally {
      setIsImportingResume(false)
    }
  }

  function removeOtherResume(id: string): void {
    const current = useSettingsStore.getState().settings
    const target = current.resume.otherResumes?.find((item) => item.id === id)

    if (!target) {
      return
    }

    if (!window.confirm(`确定删除"${target.title}"吗？`)) {
      return
    }

    updateResume({ otherResumes: (current.resume.otherResumes ?? []).filter((item) => item.id !== id) })
    useUIStore.getState().showToast('其他简历已删除')
  }

  return {
    resumeProfiles,
    filteredResumeProfiles,
    resumeImportStatus,
    resumeSaveStatus,
    resumeSearch,
    isImportingResume,
    setResumeSearch,
    updateResume,
    addResumeProfile,
    selectResumeProfile,
    deleteResumeProfile,
    saveResume,
    importResume,
    removeOtherResume
  }
}
