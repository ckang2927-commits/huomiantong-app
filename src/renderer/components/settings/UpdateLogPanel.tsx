import { CalendarClock, Download, FileText, History, RefreshCw, RotateCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AppUpdateStatus } from '../../../shared/types'

type ReleaseLog = {
  version: string
  date: string
  state: 'published' | 'pending'
  title: string
  summary: string
  items: string[]
  docPath?: string
}

const releaseLogs: ReleaseLog[] = [
  {
    version: '0.1.4',
    date: '2026-08-04',
    state: 'published',
    title: '新手引导、更新日志与面试台定位优化',
    summary: '从 v0.1.3 到当前开发进度的正式发布版本，重点补齐新手体验、设置跳转、复盘兜底和本地回归。',
    items: [
      '新增 21 步漫游式新手引导，面试台 7 个重点区域逐步高亮说明。',
      '当前候选人、目标岗位、顶部 Deepgram / DeepSeek 状态支持精准跳转和闪烁定位。',
      '设置目录新增独立“更新日志”模块，检查、下载、重启安装分步确认。',
      '补齐 RAG、回答队列、拟真面试、面试复盘、长录音和 AI 兜底的本地回归。'
    ],
    docPath: 'docs/release-notes-v0.1.4.md'
  },
  {
    version: '0.1.3',
    date: '2026-07-31',
    state: 'published',
    title: '安装启动与更新流程修复',
    summary: '修复安装后打不开、更新重复下载、检查更新自动下载等严重问题。',
    items: [
      '修复 onnxruntime 原生模块打包后无法加载的问题。',
      '修复 electron-updater 导入兼容问题。',
      '检查更新只检查版本，用户确认后才下载，下载完成后再选择重启安装。',
      '升级后首次启动显示用户可读的更新说明。'
    ],
    docPath: 'docs/release-notes-v0.1.3.md'
  },
  {
    version: '0.1.2',
    date: '2026-07-31',
    state: 'published',
    title: '离线面试官声音与 500 题题库',
    summary: '拟真面试新增三套本地声音，模拟训练接入 500 道数据分析师题库。',
    items: [
      '拟真面试支持小雅、华妍、朝文三套本地离线声音。',
      '模拟训练内置 500 道数据分析师面试题和参考答案。',
      '训练记录支持手动输入、复盘和参考答案折叠查看。'
    ],
    docPath: 'docs/release-notes-v0.1.2.md'
  },
  {
    version: '0.1.1',
    date: '2026-07-30',
    state: 'published',
    title: 'GitHub 自动更新链路验证',
    summary: '接入 GitHub Releases 更新源，验证安装包、blockmap 和 latest.yml 的自动更新链路。',
    items: [
      '设置中心加入检查更新、下载更新、重启安装入口。',
      'GitHub Actions 可根据版本标签自动生成 Windows 安装包。',
      '覆盖安装保留本地 API Key、简历、会话和复盘数据。'
    ]
  },
  {
    version: '0.1.0',
    date: '2026-07-30',
    state: 'published',
    title: '首个朋友试用安装包',
    summary: '首版 Windows 安装包，用于验证基础安装、启动和核心面试辅助流程。',
    items: [
      '提供面试台、简历库、设置、会话记录等基础模块。',
      '支持本地保存配置和覆盖安装保留用户数据。',
      '作为后续自动更新链路的起点版本。'
    ]
  }
]

function isBusy(status: AppUpdateStatus): boolean {
  return status.state === 'checking' || status.state === 'downloading' || status.state === 'installing'
}

export function UpdateLogPanel(): JSX.Element {
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
      setRestartStatus(result?.mode === 'reload' ? '开发模式已刷新窗口' : '正在重启应用')
    } catch (error) {
      setRestartStatus(error instanceof Error ? error.message : '重启失败，请手动关闭后重新打开')
    }
  }

  const handleCheckUpdate = async (): Promise<void> => {
    setUpdateStatus({
      state: 'checking',
      version: updateStatus.version,
      message: '正在检查新版本...'
    })

    try {
      setUpdateStatus(await window.huomiantong.checkForUpdates())
    } catch (error) {
      setUpdateStatus({
        state: 'error',
        version: updateStatus.version,
        message: error instanceof Error ? error.message : '检查更新失败'
      })
    }
  }

  const handleDownloadUpdate = async (): Promise<void> => {
    setUpdateStatus({
      state: 'downloading',
      version: updateStatus.version,
      percent: 0,
      message: '正在准备下载更新包：0.0%'
    })

    try {
      setUpdateStatus(await window.huomiantong.downloadUpdate())
    } catch (error) {
      setUpdateStatus({
        state: 'error',
        version: updateStatus.version,
        message: error instanceof Error ? error.message : '下载更新失败'
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
        version: updateStatus.version,
        message: error instanceof Error ? error.message : '安装更新失败'
      })
    }
  }

  const handleOpenDoc = async (docPath: string): Promise<void> => {
    const result = await window.huomiantong.openDoc(docPath)

    if (!result.ok) {
      setUpdateStatus({
        state: 'error',
        version: updateStatus.version,
        message: result.message || '打开更新日志失败'
      })
    }
  }

  return (
    <div className="panel settings-panel update-log-panel" data-onboarding-target="settings-updates">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Release Notes</span>
          <h3>更新日志</h3>
        </div>
        <button className="ghost-button compact" type="button" onClick={() => void handleRestart()}>
          <RotateCw size={14} />
          重启应用
        </button>
      </div>

      {restartStatus && <p className="about-note">{restartStatus}</p>}

      <section className="update-control-card" aria-label="软件更新操作">
        <div>
          <span className="eyebrow">Update Center</span>
          <h4>检查更新</h4>
          <p>检查更新只会查询新版本，不会自动下载。发现新版本后，用户确认才开始下载。</p>
          <span className={`about-note about-update-status status-${updateStatus.state}`}>
            {updateStatus.message}
            {updateStatus.version ? ` 当前状态版本：v${updateStatus.version}` : ''}
          </span>
        </div>
        <div className="about-update-actions">
          <button className="ghost-button compact" type="button" disabled={isBusy(updateStatus)} onClick={() => void handleCheckUpdate()}>
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
              <RefreshCw size={14} />
              重启安装
            </button>
          )}
        </div>
        {updateStatus.state === 'downloading' && typeof updateStatus.percent === 'number' && (
          <div className="about-update-progress" aria-label="更新下载进度">
            <span style={{ width: `${updateStatus.percent}%` }} />
          </div>
        )}
      </section>

      <div className="update-log-list">
        {releaseLogs.map((release) => (
          <article className={`update-log-item ${release.state}`} key={release.version}>
            <div className="update-log-marker">
              {release.state === 'pending' ? <CalendarClock size={17} /> : <History size={17} />}
            </div>
            <div className="update-log-content">
              <div className="update-log-topline">
                <span className={`update-log-badge ${release.state}`}>
                  {release.state === 'pending' ? '待发布' : `v${release.version}`}
                </span>
                <span>{release.date}</span>
              </div>
              <h4>{release.title}</h4>
              <p>{release.summary}</p>
              <ul>
                {release.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {release.docPath && (
                <button className="ghost-button compact" type="button" onClick={() => void handleOpenDoc(release.docPath!)}>
                  <FileText size={14} />
                  查看完整日志
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
