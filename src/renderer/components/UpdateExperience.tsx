import { CheckCircle2, Download, FileText, RefreshCw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AppUpdateStatus } from '../../shared/types'

const RELEASE_NOTES_VERSION = '0.1.3'
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
              <li>修复安装后启动失败的问题。</li>
              <li>更新下载前会先征求你的同意。</li>
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
            <p className="app-modal-lead">欢迎升级。这次主要修复了安装启动和更新流程，并把更新说明改成了真正面向用户的版本日志。</p>
            <div className="release-notes-grid">
              <article>
                <strong>安装稳定性</strong>
                <p>修复部分电脑安装后启动时报 onnxruntime 原生模块错误的问题。</p>
              </article>
              <article>
                <strong>更新更可控</strong>
                <p>点击检查更新只检查版本，不会直接下载；确认后才开始下载。</p>
              </article>
              <article>
                <strong>下载失败可重试</strong>
                <p>优化更新下载状态和错误提示，避免下载到 100% 后无提示地重复下载。</p>
              </article>
              <article>
                <strong>声音与题库继续保留</strong>
                <p>三套本地面试官声音、500 道数据分析师题库和已有本地数据都随升级保留。</p>
              </article>
            </div>
            <div className="app-modal-footer">
              <span>完整日志可以在“设置 → 关于与诊断 → 更新说明”中查看。</span>
              <button className="ghost-button compact" type="button" onClick={() => void window.huomiantong.openDoc('docs/release-notes-v0.1.3.md')}>
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
