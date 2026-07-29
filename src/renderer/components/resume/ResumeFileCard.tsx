import { Upload } from 'lucide-react'
import { formatDateTime, formatFileSize } from '../../lib/appHelpers'
import type { ResumeImportKind } from '../../lib/resumeImport'
import type { ResumeFileMeta } from '../../../shared/types'

type ResumeFileCardProps = {
  accept: string
  isImportingResume: boolean
  kind: ResumeImportKind
  meta?: ResumeFileMeta
  text: string
  title: string
  onImportResume: (kind: ResumeImportKind, files: FileList | null) => void | Promise<void>
}

export function ResumeFileCard({
  accept,
  isImportingResume,
  kind,
  meta,
  text,
  title,
  onImportResume
}: ResumeFileCardProps): JSX.Element {
  const hasContent = text.trim().length > 0
  const displayMeta = meta || (hasContent ? { name: `${title}（旧版导入内容）`, extension: 'TXT', size: new Blob([text]).size, addedAt: 0, textLength: text.length } : undefined)
  const preview = text.trim().slice(0, 120) || '导入后会自动提取文字，作为 AI 回答依据。'
  const sideLabel = kind === 'formal' ? '主简历 · 正式版' : '解释材料 · 万字版'
  const buttonText = hasContent ? `更换${kind === 'formal' ? '正式简历' : '万字简历'}` : `导入${kind === 'formal' ? '正式简历' : '万字简历'}`

  return (
    <article className={`resume-file-card ${kind} ${hasContent ? 'ready' : ''}`}>
      <div className="resume-file-side">{sideLabel}</div>
      <div className="resume-file-main">
        <span className="resume-file-badge">{displayMeta?.extension || 'FILE'}</span>
        <div>
          <strong>{displayMeta?.name || `${title}未导入`}</strong>
          <span>{displayMeta ? `${formatFileSize(displayMeta.size)} · ${formatDateTime(displayMeta.addedAt)}` : '支持导入后本地保存文本索引'}</span>
        </div>
      </div>
      <label className={`ghost-button compact file-import-button ${isImportingResume ? 'disabled' : ''}`}>
        <Upload size={15} />
        {buttonText}
        <input
          accept={accept}
          disabled={isImportingResume}
          onChange={(event) => {
            void onImportResume(kind, event.currentTarget.files)
            event.currentTarget.value = ''
          }}
          type="file"
        />
      </label>
      {displayMeta && (
        <div className="resume-file-tooltip">
          <strong>{title}</strong>
          <span>格式：{displayMeta.extension}</span>
          <span>大小：{formatFileSize(displayMeta.size)}</span>
          <span>添加：{formatDateTime(displayMeta.addedAt)}</span>
          <span>已提取：{displayMeta.textLength.toLocaleString('zh-CN')} 字</span>
          <p>{preview}</p>
        </div>
      )}
    </article>
  )
}
