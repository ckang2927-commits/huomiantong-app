import { fileExtension } from './appHelpers'
import { importResumeFile, type ResumeImportKind } from './resumeImport'
import type { AppSettings, ResumeAttachment, ResumeFileMeta, ResumeProfile } from '../../shared/types'

export function syncResumeProfile(current: AppSettings, nextResume: AppSettings['resume']): AppSettings {
  const id = nextResume.id || current.activeResumeId || crypto.randomUUID()
  const now = Date.now()
  const normalized = {
    ...nextResume,
    id,
    profileName: nextResume.profileName || nextResume.candidateName || '未命名候选人',
    otherResumes: nextResume.otherResumes ?? [],
    updatedAt: now,
    createdAt: nextResume.createdAt || now
  }
  const profiles = current.resumeProfiles?.length ? current.resumeProfiles : [current.resume]
  const exists = profiles.some((profile) => profile.id === id)

  return {
    ...current,
    resume: normalized,
    activeResumeId: id,
    resumeProfiles: exists ? profiles.map((profile) => (profile.id === id ? normalized : profile)) : [...profiles, normalized]
  }
}

export function createResumeProfile(index: number): ResumeProfile {
  const now = Date.now()

  return {
    id: crypto.randomUUID(),
    profileName: `新候选人 ${index}`,
    candidateName: '',
    targetRole: '',
    formalResume: '',
    detailedResume: '',
    otherResumes: [],
    createdAt: now,
    updatedAt: now
  }
}

export function filterResumeProfiles(resumeProfiles: ResumeProfile[], resumeSearch: string): ResumeProfile[] {
  const keyword = resumeSearch.trim().toLowerCase()

  if (!keyword) {
    return resumeProfiles
  }

  return resumeProfiles.filter((profile) =>
    [
      profile.profileName,
      profile.candidateName,
      profile.targetRole,
      profile.formalResumeFile?.name,
      profile.detailedResumeFile?.name,
      ...(profile.otherResumes ?? []).map((item) => item.title),
      ...(profile.otherResumes ?? []).map((item) => item.file.name)
    ].some((value) => value?.toLowerCase().includes(keyword))
  )
}

export function buildResumeFileMeta(file: File, textLength: number): ResumeFileMeta {
  return {
    name: file.name,
    extension: fileExtension(file.name),
    size: file.size,
    addedAt: Date.now(),
    textLength
  }
}

export async function importOtherResumeAttachments(files: File[], kind: ResumeImportKind): Promise<ResumeAttachment[]> {
  const attachments: ResumeAttachment[] = []

  for (const item of files) {
    const result = await importResumeFile(item, kind)
    const meta = buildResumeFileMeta(item, result.text.length)
    attachments.push({ id: crypto.randomUUID(), title: result.fileName, text: result.text, file: meta, createdAt: meta.addedAt })
  }

  return attachments
}
