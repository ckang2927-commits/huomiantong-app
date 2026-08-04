import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const updateService = read('src/main/services/updateService.ts')
const updatePanel = read('src/renderer/components/settings/UpdateLogPanel.tsx')
const mainIndex = read('src/main/index.ts')
const preload = read('src/preload/index.ts')

const results = [
  validateManualCheckDoesNotDownload(),
  validateDownloadRequiresAvailableState(),
  validateInstallRequiresDownloadedState(),
  validateDevelopmentModeCopy(),
  validateRendererButtons(),
  validateIpcChannels()
]
const failed = results.filter((item) => !item.ok)

for (const result of results) {
  const status = result.ok ? 'PASS' : 'FAIL'
  console.log(`${status} ${result.name}`)
  for (const detail of result.details) {
    console.log(`  ${detail}`)
  }
  if (result.errors.length) {
    console.log(`  errors: ${result.errors.join('；')}`)
  }
}

if (failed.length) {
  console.error(`\n更新入口技术检查失败：${failed.length}/${results.length}`)
  process.exitCode = 1
} else {
  console.log(`\n更新入口技术检查通过：${results.length}/${results.length}`)
}

function validateManualCheckDoesNotDownload() {
  const errors = []
  const checkFunction = between(updateService, 'export async function checkForUpdatesManually', 'export async function downloadAvailableUpdate')

  expect(updateService.includes('autoUpdater.autoDownload = false'), 'autoUpdater.autoDownload 必须为 false', errors)
  expect(checkFunction.includes('autoUpdater.checkForUpdates()'), '检查更新函数应只调用 checkForUpdates', errors)
  expect(!checkFunction.includes('downloadUpdate()'), '检查更新函数不应调用 downloadUpdate', errors)
  expect(!checkFunction.includes('quitAndInstall'), '检查更新函数不应触发安装', errors)

  return {
    name: '检查更新不自动下载',
    ok: errors.length === 0,
    details: ['checkForUpdatesManually checked'],
    errors
  }
}

function validateDownloadRequiresAvailableState() {
  const errors = []
  const downloadFunction = between(updateService, 'export async function downloadAvailableUpdate', 'export function checkForUpdatesOnStartup')

  expect(downloadFunction.includes("lastStatus.state !== 'available'"), '下载前必须要求状态为 available', errors)
  expect(downloadFunction.includes('autoUpdater.downloadUpdate()'), '下载函数应调用 downloadUpdate', errors)
  expect(downloadFunction.includes('当前没有待下载的更新'), '没有可下载版本时应提示用户先检查更新', errors)

  return {
    name: '下载更新需要用户确认和 available 状态',
    ok: errors.length === 0,
    details: ['downloadAvailableUpdate checked'],
    errors
  }
}

function validateInstallRequiresDownloadedState() {
  const errors = []
  const installFunction = updateService.slice(updateService.indexOf('export function installDownloadedUpdate'))

  expect(installFunction.includes("lastStatus.state !== 'downloaded'"), '安装前必须要求状态为 downloaded', errors)
  expect(installFunction.includes('autoUpdater.quitAndInstall(false, true)'), '安装函数应只在 downloaded 后 quitAndInstall', errors)
  expect(installFunction.includes('当前还没有下载完成的更新包'), '未下载完成时应有中文提示', errors)

  return {
    name: '重启安装需要 downloaded 状态',
    ok: errors.length === 0,
    details: ['installDownloadedUpdate checked'],
    errors
  }
}

function validateDevelopmentModeCopy() {
  const errors = []

  expect(updateService.includes('开发模式不会连接自动更新'), '开发模式应明确提示不会连接自动更新', errors)
  expect(updateService.includes('if (!app.isPackaged)'), '更新检查应区分开发模式和安装包模式', errors)
  expect(updateService.includes('checkForUpdatesOnStartup'), '启动检查入口应存在', errors)

  return {
    name: '开发模式提示和启动检查',
    ok: errors.length === 0,
    details: ['development mode checked'],
    errors
  }
}

function validateRendererButtons() {
  const errors = []

  expect(updatePanel.includes('检查更新只会查询新版本，不会自动下载'), '更新日志页面应说明检查不会自动下载', errors)
  expect(updatePanel.includes("updateStatus.state === 'available'"), '下载按钮只应在 available 状态出现', errors)
  expect(updatePanel.includes("updateStatus.state === 'downloaded'"), '重启安装按钮只应在 downloaded 状态出现', errors)
  expect(updatePanel.includes('确定现在重启并安装吗'), '重启安装前应二次确认', errors)
  expect(updatePanel.includes('重启应用'), '更新日志模块应保留重启应用按钮', errors)

  return {
    name: '设置页更新日志按钮状态',
    ok: errors.length === 0,
    details: ['UpdateLogPanel checked'],
    errors
  }
}

function validateIpcChannels() {
  const errors = []

  expect(mainIndex.includes("ipcMain.handle('app:update-check'"), '主进程应注册检查更新 IPC', errors)
  expect(mainIndex.includes("ipcMain.handle('app:update-download'"), '主进程应注册下载更新 IPC', errors)
  expect(mainIndex.includes("ipcMain.handle('app:update-install'"), '主进程应注册安装更新 IPC', errors)
  expect(preload.includes('checkForUpdates'), 'preload 应暴露 checkForUpdates', errors)
  expect(preload.includes('downloadUpdate'), 'preload 应暴露 downloadUpdate', errors)
  expect(preload.includes('installUpdate'), 'preload 应暴露 installUpdate', errors)

  return {
    name: '更新 IPC 通道完整',
    ok: errors.length === 0,
    details: ['main/preload checked'],
    errors
  }
}

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function between(value, start, end) {
  const startIndex = value.indexOf(start)
  const endIndex = value.indexOf(end, startIndex + start.length)
  return startIndex >= 0 && endIndex >= 0 ? value.slice(startIndex, endIndex) : ''
}

function expect(condition, message, errors) {
  if (!condition) {
    errors.push(message)
  }
}
