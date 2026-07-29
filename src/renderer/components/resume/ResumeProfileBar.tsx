import { Search, Trash2, UserPlus } from 'lucide-react'
import { resumeLabel } from '../../lib/appHelpers'
import type { AppSettings, ResumeProfile } from '../../../shared/types'

type ResumeProfileBarProps = {
  activeResumeId?: string
  currentResume: AppSettings['resume']
  filteredResumeProfiles: ResumeProfile[]
  resumeSearch: string
  onAddProfile: () => void
  onDeleteProfile: (id?: string) => void
  onResumeSearchChange: (value: string) => void
  onSelectProfile: (id?: string) => void
}

export function ResumeProfileBar({
  activeResumeId,
  currentResume,
  filteredResumeProfiles,
  resumeSearch,
  onAddProfile,
  onDeleteProfile,
  onResumeSearchChange,
  onSelectProfile
}: ResumeProfileBarProps): JSX.Element {
  return (
    <aside className="resume-profile-bar">
      <div className="resume-profile-summary">
        <span className="eyebrow">Candidate Profiles</span>
        <strong>{resumeLabel(currentResume)}</strong>
        <small>可以给不同候选人建立独立档案，搜索姓名、岗位或文件名后点击标签即可切换。</small>
      </div>

      <label className="resume-search">
        <Search size={15} />
        <input value={resumeSearch} onChange={(event) => onResumeSearchChange(event.target.value)} placeholder="搜索候选人 / 岗位 / 文件名" />
      </label>

      <div className="resume-profile-actions">
        {filteredResumeProfiles.length === 0 ? (
          <span className="resume-search-empty">没有匹配的候选人</span>
        ) : (
          filteredResumeProfiles.map((profile) => (
            <button className={profile.id === activeResumeId ? 'selected' : ''} key={profile.id || resumeLabel(profile)} onClick={() => onSelectProfile(profile.id)} type="button">
              {resumeLabel(profile)}
            </button>
          ))
        )}
      </div>

      <div className="resume-profile-footer">
        <button className="ghost-button compact add-profile" onClick={onAddProfile} type="button">
          <UserPlus size={14} />新增简历
        </button>
        <button className="danger-button compact delete-profile-button" type="button" onClick={() => onDeleteProfile(activeResumeId)}>
          <Trash2 size={15} />删除当前
        </button>
      </div>
    </aside>
  )
}
