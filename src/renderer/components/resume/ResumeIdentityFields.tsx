import type { AppSettings } from '../../../shared/types'
import { useEffect, useState } from 'react'

type ResumeIdentityFieldsProps = {
  resume: AppSettings['resume']
  onUpdateResume: (patch: Partial<AppSettings['resume']>) => void
}

export function ResumeIdentityFields({ resume, onUpdateResume }: ResumeIdentityFieldsProps): JSX.Element {
  const [flashField, setFlashField] = useState<'candidateName' | 'targetRole' | null>(null)

  useEffect(() => {
    const handleFocus = (event: Event): void => {
      const field = (event as CustomEvent<{ field?: 'candidateName' | 'targetRole' }>).detail?.field

      if (field !== 'candidateName' && field !== 'targetRole') return

      setFlashField(field)
      window.setTimeout(() => {
        document.querySelector<HTMLElement>(`[data-resume-focus="${field}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 30)
      window.setTimeout(() => setFlashField((current) => (current === field ? null : current)), 1500)
    }

    window.addEventListener('huomiantong:resume-focus', handleFocus)
    return () => window.removeEventListener('huomiantong:resume-focus', handleFocus)
  }, [])

  return (
    <div className="resume-grid">
      <label className="field-block">
        <span>档案名 / 使用者</span>
        <input value={resume.profileName || ''} onChange={(event) => onUpdateResume({ profileName: event.target.value })} placeholder="比如：康超帅 / 数据分析候选人" />
      </label>
      <label className={`field-block resume-focus-field ${flashField === 'candidateName' ? 'flash' : ''}`} data-resume-focus="candidateName">
        <span>姓名</span>
        <input value={resume.candidateName} onChange={(event) => onUpdateResume({ candidateName: event.target.value })} placeholder="比如：康超帅" />
      </label>
      <label className={`field-block resume-focus-field ${flashField === 'targetRole' ? 'flash' : ''}`} data-resume-focus="targetRole">
        <span>目标岗位</span>
        <input value={resume.targetRole} onChange={(event) => onUpdateResume({ targetRole: event.target.value })} placeholder="比如：数据分析师" />
      </label>
    </div>
  )
}
