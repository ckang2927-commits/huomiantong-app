import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { ProgressInfo, UpdateInfo } from 'electron-updater'
import type { AppUpdateStatus } from '../../shared/types'

type UpdateStatusSender = (status: AppUpdateStatus) => void

let eventRegistered = false
let sender: UpdateStatusSender | null = null
let lastStatus: AppUpdateStatus = {
  state: 'idle',
  message: '尚未检查更新。正式安装包启动后会自动检查 GitHub Releases。'
}

function emitUpdateStatus(status: AppUpdateStatus): AppUpdateStatus {
  lastStatus = status
  sender?.(status)
  return status
}

function getVersion(info?: UpdateInfo): string {
  return info?.version || app.getVersion()
}

function describeUpdateError(error: unknown): string {
  const rawMessage = error instanceof Error ? error.message : String(error || '未知错误')

  if (rawMessage.includes('ENOTFOUND') || rawMessage.includes('ECONNREFUSED') || rawMessage.includes('ETIMEDOUT')) {
    return '检查更新失败：网络连接异常，请确认能访问 GitHub Releases 后重试。'
  }

  if (rawMessage.includes('Cannot find latest.yml') || rawMessage.includes('404')) {
    return '检查更新失败：GitHub Release 里还没有 latest.yml。需要先用 electron-builder 发布正式安装包。'
  }

  if (rawMessage.includes('No published versions') || rawMessage.includes('No releases')) {
    return '检查更新失败：GitHub 仓库还没有可用 Release。'
  }

  return `检查更新失败：${rawMessage}`
}

function getDevelopmentStatus(): AppUpdateStatus {
  return {
    state: 'idle',
    version: app.getVersion(),
    message: '开发模式不会连接自动更新。打包安装后的正式版会在启动时自动检查 GitHub Releases。'
  }
}

export function registerAutoUpdateEvents(sendStatus: UpdateStatusSender): void {
  sender = sendStatus

  if (eventRegistered) {
    return
  }

  eventRegistered = true
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    emitUpdateStatus({
      state: 'checking',
      version: app.getVersion(),
      message: '正在检查新版本...'
    })
  })

  autoUpdater.on('update-available', (info) => {
    emitUpdateStatus({
      state: 'available',
      version: getVersion(info),
      message: `发现新版本 v${getVersion(info)}，正在后台下载更新包...`
    })
  })

  autoUpdater.on('update-not-available', (info) => {
    emitUpdateStatus({
      state: 'not-available',
      version: getVersion(info),
      message: `当前已经是最新版本 v${app.getVersion()}。`
    })
  })

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    const percent = Math.max(0, Math.min(100, progress.percent || 0))
    emitUpdateStatus({
      state: 'downloading',
      version: lastStatus.version,
      percent,
      message: `正在下载更新包：${percent.toFixed(1)}%。`
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    emitUpdateStatus({
      state: 'downloaded',
      version: getVersion(info),
      message: `新版本 v${getVersion(info)} 已下载完成，可以重启安装。`
    })
  })

  autoUpdater.on('error', (error) => {
    emitUpdateStatus({
      state: 'error',
      version: app.getVersion(),
      message: describeUpdateError(error)
    })
  })
}

export function getCurrentUpdateStatus(): AppUpdateStatus {
  return app.isPackaged ? lastStatus : getDevelopmentStatus()
}

export async function checkForUpdatesManually(): Promise<AppUpdateStatus> {
  if (!app.isPackaged) {
    return emitUpdateStatus(getDevelopmentStatus())
  }

  try {
    emitUpdateStatus({
      state: 'checking',
      version: app.getVersion(),
      message: '正在检查新版本...'
    })
    await autoUpdater.checkForUpdates()
    return lastStatus
  } catch (error) {
    return emitUpdateStatus({
      state: 'error',
      version: app.getVersion(),
      message: describeUpdateError(error)
    })
  }
}

export function checkForUpdatesOnStartup(): void {
  if (!app.isPackaged) {
    emitUpdateStatus(getDevelopmentStatus())
    return
  }

  void checkForUpdatesManually()
}

export function installDownloadedUpdate(): AppUpdateStatus {
  if (!app.isPackaged) {
    return emitUpdateStatus(getDevelopmentStatus())
  }

  if (lastStatus.state !== 'downloaded') {
    return emitUpdateStatus({
      state: 'error',
      version: app.getVersion(),
      message: '当前还没有下载完成的更新包，先点击“检查更新”。'
    })
  }

  const status = emitUpdateStatus({
    state: 'installing',
    version: lastStatus.version,
    message: '正在重启并安装更新...'
  })

  setImmediate(() => autoUpdater.quitAndInstall(false, true))
  return status
}
