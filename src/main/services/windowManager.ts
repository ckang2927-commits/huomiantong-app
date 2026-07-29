import { BrowserWindow, desktopCapturer, session } from 'electron'
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { DesktopAudioSource, FloatingPayload } from '../../shared/types'

let mainWindow: BrowserWindow | null = null
let floatingWindow: BrowserWindow | null = null
let selectedDesktopAudioSourceId = ''

export function setupDisplayMediaCapture(): void {
  const defaultSession = session.defaultSession as Electron.Session & {
    setDisplayMediaRequestHandler?: (handler: (request: unknown, callback: (streams: unknown) => void) => void, options?: { useSystemPicker?: boolean }) => void
  }

  defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(isAllowedMediaPermission(permission))
  })

  defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    return isAllowedMediaPermission(permission)
  })

  defaultSession.setDisplayMediaRequestHandler?.(
    (_request, callback) => {
      desktopCapturer
        .getSources({
          types: ['screen', 'window'],
          thumbnailSize: {
            width: 0,
            height: 0
          }
        })
        .then((sources) => {
          const selectedSource = selectedDesktopAudioSourceId
            ? sources.find((source) => source.id === selectedDesktopAudioSourceId)
            : sources.find((source) => source.name.toLowerCase().includes('screen')) || sources[0]
          callback(selectedSource ? { video: selectedSource, audio: 'loopback' } : {})
        })
        .catch(() => callback({}))
    },
    { useSystemPicker: false }
  )
}

export function setDesktopAudioSourceId(sourceId: string): void {
  selectedDesktopAudioSourceId = sourceId
}

export async function listDesktopAudioSources(): Promise<DesktopAudioSource[]> {
  const sources = await desktopCapturer.getSources({
    types: ['screen', 'window'],
    thumbnailSize: {
      width: 0,
      height: 0
    }
  })

  return sources.map((source) => ({
    id: source.id,
    name: source.name,
    thumbnail: ''
  }))
}

function isAllowedMediaPermission(permission: string): boolean {
  return permission === 'media' || permission === 'display-capture' || permission === 'speaker-selection'
}

function attachDiagnostics(window: BrowserWindow, label: string): void {
  window.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[renderer:${label}] level=${level} ${sourceId}:${line} ${message}`)
  })
  window.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedUrl) => {
    console.error(`[renderer:${label}] did-fail-load ${errorCode} ${errorDescription} ${validatedUrl}`)
  })
  window.webContents.on('preload-error', (_event, preloadPath, error) => {
    console.error(`[renderer:${label}] preload-error ${preloadPath}`, error)
  })
  window.webContents.on('render-process-gone', (_event, details) => {
    console.error(`[renderer:${label}] render-process-gone`, details)
  })
}

function rendererUrlFor(view?: string): string {
  const url = process.env.ELECTRON_RENDERER_URL

  if (url) {
    return view ? `${url}?view=${view}` : url
  }

  return ''
}

function getWindowIconPath(): string | undefined {
  const iconPath = path.join(__dirname, '../renderer/huomiantong-logo.png')
  return existsSync(iconPath) ? iconPath : undefined
}

export function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1040,
    minHeight: 680,
    title: '获面通',
    icon: getWindowIconPath(),
    backgroundColor: '#f6f3ec',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  attachDiagnostics(mainWindow, 'main')
  mainWindow.setMenuBarVisibility(false)

  const rendererUrl = rendererUrlFor()

  if (rendererUrl) {
    mainWindow.loadURL(rendererUrl)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

export function createFloatingWindow(): BrowserWindow {
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    return floatingWindow
  }

  floatingWindow = new BrowserWindow({
    width: 420,
    height: 280,
    minWidth: 320,
    minHeight: 180,
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    title: '获面通悬浮窗',
    icon: getWindowIconPath(),
    backgroundColor: '#fffdf8',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  attachDiagnostics(floatingWindow, 'floating')
  floatingWindow.setMenuBarVisibility(false)

  const rendererUrl = rendererUrlFor('floating')

  if (rendererUrl) {
    floatingWindow.loadURL(rendererUrl)
  } else {
    floatingWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
      query: {
        view: 'floating'
      }
    })
  }

  floatingWindow.on('closed', () => {
    floatingWindow = null
  })

  return floatingWindow
}

export function sendFloatingPayload(payload: FloatingPayload): void {
  const window = createFloatingWindow()
  window.webContents.send('floating:payload', payload)

  if (!window.isVisible()) {
    window.showInactive()
  }
}

export function hideFloatingWindow(): void {
  floatingWindow?.hide()
}

export function toggleFloatingMaximize(): boolean {
  const window = createFloatingWindow()

  if (window.isMaximized()) {
    window.unmaximize()
    return false
  }

  window.maximize()
  return true
}
