import { ClipboardList, Download, FileText, FolderOpen, Info, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AppUpdateStatus } from '../../../shared/types'

export function AboutDiagnosticsPanel(): JSX.Element {
  const [restartStatus, setRestartStatus] = useState('')
  const [updateStatus, setUpdateStatus] = useState<AppUpdateStatus>({
    state: 'idle',
    message: '正在读取更新状态...'
  })

  useEffect(() => {
    void window.huomiantong
      .getUpdateStatus()
      .then(setUpdateStatus)
      .catch((error) => {
        setUpdateStatus({
          state: 'error',
          message: error instanceof Error ? error.message : '读取更新状态失败'
        })
      })

    return window.huomiantong.onUpdateStatus(setUpdateStatus)
  }, [])

  const handleRestart = async (): Promise<void> => {
    if (!window.confirm('确定要重启获面通吗？当前未保存的输入内容可能会丢失。')) {
      return
    }

    setRestartStatus('正在重启/刷新应用...')
    try {
      const result = await window.huomiantong.restartApp()
      if (result?.mode === 'reload') {
        setRestartStatus('开发模式已刷新窗口')
      }
    } catch (error) {
      setRestartStatus(error instanceof Error ? error.message : '重启失败，请手动关闭后重新打开')
    }
  }

  const handleCheckUpdate = async (): Promise<void> => {
    setUpdateStatus({
      state: 'checking',
      message: '正在检查新版本...'
    })

    try {
      setUpdateStatus(await window.huomiantong.checkForUpdates())
    } catch (error) {
      setUpdateStatus({
        state: 'error',
        message: error instanceof Error ? error.message : '检查更新失败'
      })
    }
  }

  const handleInstallUpdate = async (): Promise<void> => {
    if (!window.confirm('更新包已下载完成，确定现在重启并安装吗？')) {
      return
    }

    try {
      setUpdateStatus(await window.huomiantong.installUpdate())
    } catch (error) {
      setUpdateStatus({
        state: 'error',
        message: error instanceof Error ? error.message : '安装更新失败'
      })
    }
  }

  const handleDownloadUpdate = async (): Promise<void> => {
    try {
      setUpdateStatus({
        state: 'downloading',
        version: updateStatus.version,
        percent: 0,
        message: '正在准备下载更新包：0.0%'
      })
      setUpdateStatus(await window.huomiantong.downloadUpdate())
    } catch (error) {
      setUpdateStatus({
        state: 'error',
        message: error instanceof Error ? error.message : '下载更新失败'
      })
    }
  }

  const handleOpenReleaseNotes = async (): Promise<void> => {
    const result = await window.huomiantong.openDoc('docs/release-notes-v0.1.3.md')
    setUpdateStatus({
      state: result.ok ? 'idle' : 'error',
      version: updateStatus.version,
      message: result.ok ? '已打开 v0.1.3 更新说明。' : result.message || '打开更新说明失败。'
    })
  }

  const isUpdating = updateStatus.state === 'checking' || updateStatus.state === 'downloading' || updateStatus.state === 'installing'

  return (
    <div className="panel settings-panel about-diagnostics-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">About & Diagnostics</span>
          <h3>关于与诊断</h3>
        </div>
        <button className="ghost-button compact" type="button" onClick={handleRestart}>
          重启应用
        </button>
      </div>
      {restartStatus && <p className="about-note">{restartStatus}</p>}

      <div className="about-section">
        <div className="about-icon-row">
          <Info size={18} />
          <div>
            <strong>版本信息</strong>
            <p>获面通 v0.1.3</p>
            <span className="about-note">当前版本已修复安装启动和更新下载流程。</span>
          </div>
        </div>

        <div className="about-icon-row">
          <RefreshCw size={18} />
          <div>
            <strong>软件更新</strong>
            <p>正式安装包会在启动时自动检查 GitHub Releases，也可以在这里手动检查、下载后重启安装。</p>
            <div className="about-update-actions">
              <button className="ghost-button compact" type="button" disabled={isUpdating} onClick={() => void handleCheckUpdate()}>
                <RefreshCw size={14} />
                检查更新
              </button>
              {updateStatus.state === 'available' && (
                <button className="primary-button compact" type="button" onClick={() => void handleDownloadUpdate()}>
                  <Download size={14} />
                  下载更新
                </button>
              )}
              {updateStatus.state === 'downloaded' && (
                <button className="primary-button compact" type="button" onClick={() => void handleInstallUpdate()}>
                  <Download size={14} />
                  重启安装
                </button>
              )}
              <button className="ghost-button compact" type="button" onClick={() => void handleOpenReleaseNotes()}>
                <FileText size={14} />
                发布说明
              </button>
            </div>
            {updateStatus.state === 'downloading' && typeof updateStatus.percent === 'number' && (
              <div className="about-update-progress" aria-label="更新下载进度">
                <span style={{ width: `${updateStatus.percent}%` }} />
              </div>
            )}
            <span className={`about-note about-update-status status-${updateStatus.state}`}>
              {updateStatus.message}
              {updateStatus.state === 'available' && ' 下载前会先征求你的同意。'}
            </span>
          </div>
        </div>

        <div className="about-icon-row">
          <FolderOpen size={18} />
          <div>
            <strong>数据存储位置</strong>
            <p>所有数据存储在本地计算机，路径为：</p>
            <code className="about-path">%APPDATA%/huomiantong/</code>
            <span className="about-note">包含设置、会话记录、训练成绩和用量数据。建议定期导出备份。</span>
          </div>
        </div>

        <div className="about-icon-row">
          <ShieldCheck size={18} />
          <div>
            <strong>作战室入口说明</strong>
            <p>
              作战室（面试前体检）在左侧导航栏的盾牌图标进入。它可以一键检查候选人简历、回答模型、
              Deepgram 语音、麦克风/电脑音频和悬浮窗是否就绪，避免面试中途发现问题。
            </p>
          </div>
        </div>

        <div className="about-icon-row">
          <ClipboardList size={18} />
          <div>
            <strong>错误日志说明</strong>
            <p>
              诊断日志位于作战室下方，会自动记录 API 服务商测试失败、Deepgram 连接异常、
              麦克风/电脑音频问题。每条日志都会给出中文原因说明和解决建议。
            </p>
            <span className="about-note">
              遇到错误弹窗时，点击“查看详情”可直接跳转到诊断日志区域。
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
