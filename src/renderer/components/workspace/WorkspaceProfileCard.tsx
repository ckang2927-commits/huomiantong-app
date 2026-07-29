import { FileText } from 'lucide-react'
import { resumeLabel } from '../../lib/appHelpers'
import type { AppSettings } from '../../../shared/types'

type WorkspaceProfileCardProps = {
  resume: AppSettings['resume']
  onSwitchResume: () => void
}

export function WorkspaceProfileCard({ resume, onSwitchResume }: WorkspaceProfileCardProps): JSX.Element {
  return (
    <div className="workspace-profile-card">
      <div>
        <span>当前使用者</span>
        <strong>
          {resumeLabel(resume)}
          {resume.targetRole ? ` · ${resume.targetRole}` : ''}
        </strong>
      </div>
      <button className="ghost-button compact" type="button" onClick={onSwitchResume}>
        <FileText size={15} />切换简历
      </button>
    </div>
  )
}
