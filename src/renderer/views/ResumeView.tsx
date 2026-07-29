import { FileText, Save, Sparkles } from 'lucide-react'
import { OtherResumeSection } from '../components/resume/OtherResumeSection'
import { ResumeFileCard } from '../components/resume/ResumeFileCard'
import { ResumeIdentityFields } from '../components/resume/ResumeIdentityFields'
import { ResumeProfileBar } from '../components/resume/ResumeProfileBar'
import type { ResumeImportKind } from '../lib/resumeImport'
import type { AppSettings, ResumeProfile } from '../../shared/types'

type ResumeViewProps = {
  settings: AppSettings
  filteredResumeProfiles: ResumeProfile[]
  resumeSearch: string
  resumeSaveStatus: string
  resumeImportStatus: string
  isImportingResume: boolean
  onSaveResume: () => void
  onDeleteProfile: (id?: string) => void
  onSelectProfile: (id?: string) => void
  onAddProfile: () => void
  onResumeSearchChange: (value: string) => void
  onUpdateResume: (patch: Partial<AppSettings['resume']>) => void
  onImportResume: (kind: ResumeImportKind, files: FileList | null) => void | Promise<void>
  onRemoveOtherResume: (id: string) => void
}

export function ResumeView({
  settings,
  filteredResumeProfiles,
  resumeSearch,
  resumeSaveStatus,
  resumeImportStatus,
  isImportingResume,
  onSaveResume,
  onDeleteProfile,
  onSelectProfile,
  onAddProfile,
  onResumeSearchChange,
  onUpdateResume,
  onImportResume,
  onRemoveOtherResume
}: ResumeViewProps): JSX.Element {
  const otherResumeCount = settings.resume.otherResumes?.length ?? 0

  return (
    <section className="panel full-panel resume-library-shell">
      <div className="resume-library-hero">
        <div>
          <span className="eyebrow">Resume Knowledge</span>
          <h3>候选人简历库</h3>
          <p>把不同人的正式简历、万字解释版和补充材料统一放在这里，面试台和模拟训练都会优先引用当前候选人。</p>
        </div>
        <div className="resume-library-actions">
          <span className="resume-library-stat">
            <FileText size={15} />
            补充材料 {otherResumeCount} 份
          </span>
          <button className="primary-button" type="button" onClick={onSaveResume}>
            <Save size={16} />保存简历
          </button>
        </div>
      </div>

      {(resumeSaveStatus || resumeImportStatus) && (
        <div className="resume-status-strip">
          {resumeSaveStatus && <p className={resumeSaveStatus.startsWith('保存失败') ? 'inline-error' : 'inline-note'}>{resumeSaveStatus}</p>}
          {resumeImportStatus && <p className={resumeImportStatus.startsWith('导入失败') ? 'inline-error' : 'inline-note'}>{resumeImportStatus}</p>}
        </div>
      )}

      <div className="resume-library-layout">
        <ResumeProfileBar
          activeResumeId={settings.activeResumeId}
          currentResume={settings.resume}
          filteredResumeProfiles={filteredResumeProfiles}
          onAddProfile={onAddProfile}
          onDeleteProfile={onDeleteProfile}
          onResumeSearchChange={onResumeSearchChange}
          onSelectProfile={onSelectProfile}
          resumeSearch={resumeSearch}
        />

        <div className="resume-library-main">
          <section className="resume-identity-card">
            <div className="resume-section-title">
              <Sparkles size={17} />
              <div>
                <strong>当前候选人信息</strong>
                <span>用于区分多人档案，也会影响回答口吻里的身份表达。</span>
              </div>
            </div>
            <ResumeIdentityFields onUpdateResume={onUpdateResume} resume={settings.resume} />
          </section>

          <section className="resume-core-files-card">
            <div className="resume-section-title">
              <FileText size={17} />
              <div>
                <strong>核心简历文件</strong>
                <span>正式简历负责事实边界，万字简历负责展开细节和项目口径。</span>
              </div>
            </div>
            <div className="resume-file-grid">
              <ResumeFileCard
                accept=".pdf,.docx,.md,.markdown"
                isImportingResume={isImportingResume}
                kind="formal"
                meta={settings.resume.formalResumeFile}
                onImportResume={onImportResume}
                text={settings.resume.formalResume}
                title="正式简历"
              />
              <ResumeFileCard
                accept=".docx,.md,.markdown"
                isImportingResume={isImportingResume}
                kind="detailed"
                meta={settings.resume.detailedResumeFile}
                onImportResume={onImportResume}
                text={settings.resume.detailedResume}
                title="万字简历 / 解释版简历"
              />
            </div>
          </section>

          <OtherResumeSection
            isImportingResume={isImportingResume}
            onImportResume={onImportResume}
            onRemoveOtherResume={onRemoveOtherResume}
            otherResumes={settings.resume.otherResumes ?? []}
          />
        </div>
      </div>
    </section>
  )
}
