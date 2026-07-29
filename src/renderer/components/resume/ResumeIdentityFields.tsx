import type { AppSettings } from '../../../shared/types'

type ResumeIdentityFieldsProps = {
  resume: AppSettings['resume']
  onUpdateResume: (patch: Partial<AppSettings['resume']>) => void
}

export function ResumeIdentityFields({ resume, onUpdateResume }: ResumeIdentityFieldsProps): JSX.Element {
  return (
    <div className="resume-grid">
      <label className="field-block">
        <span>档案名 / 使用者</span>
        <input value={resume.profileName || ''} onChange={(event) => onUpdateResume({ profileName: event.target.value })} placeholder="比如：康超帅 / 数据分析候选人" />
      </label>
      <label className="field-block">
        <span>姓名</span>
        <input value={resume.candidateName} onChange={(event) => onUpdateResume({ candidateName: event.target.value })} placeholder="比如：康超帅" />
      </label>
      <label className="field-block">
        <span>目标岗位</span>
        <input value={resume.targetRole} onChange={(event) => onUpdateResume({ targetRole: event.target.value })} placeholder="比如：数据分析师" />
      </label>
    </div>
  )
}
