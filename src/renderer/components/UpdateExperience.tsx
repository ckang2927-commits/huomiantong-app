import { CheckCircle2, Download, FileText, RefreshCw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AppUpdateStatus } from '../../shared/types'

const RELEASE_NOTES_VERSION = '0.1.4'
const RELEASE_NOTES_STORAGE_KEY = 'huomiantong:last-release-notes-version'

const initialStatus: AppUpdateStatus = {
  state: 'idle',
  version: RELEASE_NOTES_VERSION,
  message: '正在读取版本信息...'
}

export function UpdateExperience(): JSX.Element | null {
  const [updateStatus, setUpdateStatus] = useState<AppUpdateStatus>(initialStatus)
  const [updatePromptVersion, setUpdatePromptVersion] = useState<string | null>(null)
  const [downloadedPromptVersion, setDownloadedPromptVersion] = useState<string | null>(null)
  const [releaseNotesOpen, setReleaseNotesOpen] = useState(false)

  useEffect(() => {
    let active = true

    const applyStatus = (status: AppUpdateStatus): void => {
      if (!active) {
        return
      }

      setUpdateStatus(status)
      if (status.state === 'available' && status.version) {
        setDownloadedPromptVersion(null)
        setUpdatePromptVersion(status.version)
      }
      if (status.state === 'downloaded' && status.version) {
        setUpdatePromptVersion(null)
        setDownloadedPromptVersion(status.version)
      }
    }

    void window.huomiantong.getUpdateStatus().then((status) => {
      applyStatus(status)
      const currentVersion = status.version || RELEASE_NOTES_VERSION
      if (localStorage.getItem(RELEASE_NOTES_STORAGE_KEY) !== currentVersion) {
        setReleaseNotesOpen(true)
      }
    })

    const unsubscribe = window.huomiantong.onUpdateStatus(applyStatus)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const closeReleaseNotes = (): void => {
    localStorage.setItem(RELEASE_NOTES_STORAGE_KEY, RELEASE_NOTES_VERSION)
    setReleaseNotesOpen(false)
  }

  const handleDownloadUpdate = async (): Promise<void> => {
    setUpdatePromptVersion(null)
    setUpdateStatus({
      state: 'downloading',
      version: updateStatus.version,
      percent: 0,
      message: '正在准备下载更新包：0.0%'
    })

    try {
      const status = await window.huomiantong.downloadUpdate()
      setUpdateStatus(status)
    } catch (error) {
      setUpdateStatus({
        state: 'error',
        version: updateStatus.version,
        message: error instanceof Error ? error.message : '下载更新失败'
      })
    }
  }

  const handleInstallUpdate = async (): Promise<void> => {
    setDownloadedPromptVersion(null)
    try {
      const status = await window.huomiantong.installUpdate()
      setUpdateStatus(status)
    } catch (error) {
      setUpdateStatus({
        state: 'error',
        version: downloadedPromptVersion || updateStatus.version,
        message: error instanceof Error ? error.message : '安装更新失败'
      })
    }
  }

  const dismissAvailableUpdate = (): void => {
    setUpdatePromptVersion(null)
  }

  const dismissDownloadedUpdate = (): void => {
    setDownloadedPromptVersion(null)
  }

  return (
    <>
      {updatePromptVersion && updateStatus.state === 'available' && (
        <div className="app-modal-backdrop" role="presentation">
          <section className="app-modal update-prompt-modal" role="dialog" aria-modal="true" aria-labelledby="update-prompt-title">
            <div className="app-modal-header">
              <div>
                <span className="eyebrow">Software Update</span>
                <h3 id="update-prompt-title">发现新版本 v{updatePromptVersion}</h3>
              </div>
              <button className="icon-button" type="button" aria-label="暂不更新" title="暂不更新" onClick={dismissAvailableUpdate}>
                <X size={18} />
              </button>
            </div>
            <p className="app-modal-lead">现在只完成了版本检查，更新包不会自动下载。</p>
            <ul className="update-summary-list">
              <li>新增 21 步漫游式新手引导。</li>
              <li>面试台候选人、目标岗位和顶部服务状态支持精准跳转。</li>
              <li>本地简历、会话和 API 配置会保留。</li>
            </ul>
            <div className="app-modal-actions">
              <button className="ghost-button compact" type="button" onClick={dismissAvailableUpdate}>暂不更新</button>
              <button className="primary-button compact" type="button" onClick={() => void handleDownloadUpdate()}>
                <Download size={15} />
                下载更新
              </button>
            </div>
          </section>
        </div>
      )}

      {downloadedPromptVersion && updateStatus.state === 'downloaded' && (
        <div className="app-modal-backdrop" role="presentation">
          <section className="app-modal update-prompt-modal" role="dialog" aria-modal="true" aria-labelledby="downloaded-update-title">
            <div className="app-modal-header">
              <div>
                <span className="eyebrow">Download Complete</span>
                <h3 id="downloaded-update-title">更新包已下载完成</h3>
              </div>
              <CheckCircle2 size={22} className="app-modal-success-icon" />
            </div>
            <p className="app-modal-lead">v{downloadedPromptVersion} 已准备好。重启软件后才会完成安装。</p>
            <div className="app-modal-actions">
              <button className="ghost-button compact" type="button" onClick={dismissDownloadedUpdate}>稍后安装</button>
              <button className="primary-button compact" type="button" onClick={() => void handleInstallUpdate()}>
                <RefreshCw size={15} />
                重启安装
              </button>
            </div>
          </section>
        </div>
      )}

      {releaseNotesOpen && (
        <div className="app-modal-backdrop" role="presentation">
          <section className="app-modal release-notes-modal" role="dialog" aria-modal="true" aria-labelledby="release-notes-title">
            <div className="app-modal-header">
              <div>
                <span className="eyebrow">What&apos;s New</span>
                <h3 id="release-notes-title">获面通 v{RELEASE_NOTES_VERSION} 更新内容</h3>
              </div>
              <button className="icon-button" type="button" aria-label="关闭更新说明" title="关闭更新说明" onClick={closeReleaseNotes}>
                <X size={18} />
              </button>
            </div>
            <p className="app-modal-lead">欢迎升级。这次重点补齐新手引导、更新日志、面试台定位和复盘稳定性。</p>
            <div className="release-notes-grid">
              <article>
                <strong>新手引导</strong>
                <p>新增 21 步漫游式教程，面试台 7 个重点区域会逐步高亮说明。</p>
              </article>
              <article>
                <strong>精准跳转</strong>
                <p>候选人、目标岗位、Deepgram 和 DeepSeek 状态都能跳到对应配置区域。</p>
              </article>
              <article>
                <strong>更新日志</strong>
                <p>设置中心新增独立更新日志，检查、下载和重启安装都由用户确认。</p>
              </article>
              <article>
                <strong>稳定性回归</strong>
                <p>RAG、回答队列、拟真面试、面试复盘和长录音策略已补齐本地检查。</p>
              </article>
            </div>
            <div className="app-modal-footer">
              <span>完整日志可以在“设置 → 更新日志”中查看。</span>
              <button className="ghost-button compact" type="button" onClick={() => void window.huomiantong.openDoc('docs/release-notes-v0.1.4.md')}>
                <FileText size={14} />
                查看完整日志
              </button>
            </div>
            <div className="app-modal-actions">
              <button className="primary-button compact" type="button" onClick={closeReleaseNotes}>知道了</button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
