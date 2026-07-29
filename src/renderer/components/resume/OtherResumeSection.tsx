import { FileText, Trash2, Upload } from 'lucide-react'
import { formatDateTime, formatFileSize } from '../../lib/appHelpers'
import type { ResumeImportKind } from '../../lib/resumeImport'
import type { ResumeAttachment } from '../../../shared/types'

type OtherResumeSectionProps = {
  isImportingResume: boolean
  otherResumes: ResumeAttachment[]
  onImportResume: (kind: ResumeImportKind, files: FileList | null) => void | Promise<void>
  onRemoveOtherResume: (id: string) => void
}

function OtherResumeCard({ item, onRemoveOtherResume }: { item: ResumeAttachment; onRemoveOtherResume: (id: string) => void }): JSX.Element {
  const preview = item.text.trim().slice(0, 100) || '该文件暂无可预览的文本内容。'

  return (
    <article className="other-resume-card" key={item.id}>
      <div className="resume-file-main">
        <span className="resume-file-badge small">{item.file.extension}</span>
        <div>
          <strong>{item.title}</strong>
          <span>
            {formatFileSize(item.file.size)} · {formatDateTime(item.createdAt)} · {item.file.textLength.toLocaleString('zh-CN')} 字
          </span>
        </div>
      </div>
      <p>{preview}</p>
      <button className="danger-button compact" type="button" onClick={() => onRemoveOtherResume(item.id)}>
        <Trash2 size={15} />删除
      </button>
    </article>
  )
}

export function OtherResumeSection({
  isImportingResume,
  otherResumes,
  onImportResume,
  onRemoveOtherResume
}: OtherResumeSectionProps): JSX.Element {
  return (
    <section className="other-resume-section">
      <div className="other-resume-header">
        <div>
          <span className="eyebrow">Other Materials</span>
          <h4>其他简历 / 补充材料</h4>
          <p>项目说明、作品集、旧版简历都可以放这里，AI 回答会和上面两份一起参考。</p>
        </div>
        <label className={`ghost-button compact file-import-button ${isImportingResume ? 'disabled' : ''}`}>
          <Upload size={15} />添加其他简历
          <input
            accept=".pdf,.docx,.md,.markdown,.txt"
            disabled={isImportingResume}
            multiple
            onChange={(event) => {
              void onImportResume('extra', event.currentTarget.files)
              event.currentTarget.value = ''
            }}
            type="file"
          />
        </label>
      </div>
      <div className="other-resume-list">
        {otherResumes.length === 0 ? (
          <div className="empty-other-resume">
            <FileText size={24} />
            <p>其他简历会排列在这里，可以一次添加多份。</p>
          </div>
        ) : (
          otherResumes.map((item) => <OtherResumeCard item={item} key={item.id} onRemoveOtherResume={onRemoveOtherResume} />)
        )}
      </div>
    </section>
  )
}

