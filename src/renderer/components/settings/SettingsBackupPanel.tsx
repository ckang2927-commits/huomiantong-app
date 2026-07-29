import { Download, KeyRound, Upload } from 'lucide-react'
import { useState, type ChangeEvent, type RefObject } from 'react'

type SettingsBackupPanelProps = {
  backupImportRef: RefObject<HTMLInputElement>
  backupStatus: string
  onBackupImportChange: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>
  onExportBackup: (options?: { includeApiKeys?: boolean }) => void | Promise<void>
  onOpenBackupImporter: () => void
}

type BackupKeyOption = 'full' | 'no-keys'

const BACKUP_KEY_OPTIONS: { value: BackupKeyOption; label: string; desc: string }[] = [
  { value: 'full', label: '包含 API Key', desc: '完整备份，包含所有设置、会话、用量和凭证。' },
  { value: 'no-keys', label: '不包含 API Key', desc: '导出备份但去掉 API Key，适合发给别人排查。' }
]

export function SettingsBackupPanel({
  backupImportRef,
  backupStatus,
  onBackupImportChange,
  onExportBackup,
  onOpenBackupImporter
}: SettingsBackupPanelProps): JSX.Element {
  const [backupKeyOption, setBackupKeyOption] = useState<BackupKeyOption>('full')
  const [showBackupOptions, setShowBackupOptions] = useState(false)

  return (
    <>
      {backupStatus && <p className={backupStatus.startsWith('导出失败') || backupStatus.startsWith('导入失败') ? 'inline-error' : 'inline-note'}>{backupStatus}</p>}
      <div className="backup-panel">
        <div className="backup-panel-header">
          <strong>数据备份恢复</strong>
          <p>导出会包含设置、会话和用量记录；如果里面有 API Key，请只保存在自己电脑里，别直接发给别人。</p>
        </div>
        <div className="backup-actions">
          <button className="ghost-button compact" type="button" onClick={() => setShowBackupOptions(true)}>
            <Download size={15} />导出备份
          </button>
          <button className="ghost-button compact" type="button" onClick={onOpenBackupImporter}>
            <Upload size={15} />导入备份
          </button>
          {showBackupOptions && (
            <div className="backup-options-modal">
              <div className="backup-options-overlay" onClick={() => setShowBackupOptions(false)} />
              <div className="backup-options-card">
                <div className="backup-options-header">
                  <KeyRound size={18} />
                  <h4>导出备份</h4>
                </div>
                <p className="backup-options-desc">选择备份文件是否包含 API Key。</p>
                <div className="backup-options-list">
                  {BACKUP_KEY_OPTIONS.map((opt) => (
                    <label key={opt.value} className="backup-option-row">
                      <input
                        type="radio"
                        name="backup-key-option"
                        checked={backupKeyOption === opt.value}
                        onChange={() => setBackupKeyOption(opt.value)}
                      />
                      <div>
                        <strong>{opt.label}</strong>
                        <span>{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="backup-options-actions">
                  <button className="ghost-button compact" type="button" onClick={() => setShowBackupOptions(false)}>
                    取消
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => {
                      onExportBackup(backupKeyOption === 'no-keys' ? { includeApiKeys: false } : undefined)
                      setShowBackupOptions(false)
                    }}
                  >
                    <Download size={15} />导出
                  </button>
                </div>
              </div>
            </div>
          )}
          <input
            ref={backupImportRef}
            className="backup-file-input"
            accept=".json,application/json"
            onChange={(event) => {
              void onBackupImportChange(event)
            }}
            type="file"
          />
        </div>
      </div>
    </>
  )
}
