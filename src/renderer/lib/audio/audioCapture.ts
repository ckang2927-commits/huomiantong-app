import type { AudioInputDevice, ListeningMode } from './audioTypes'

type CaptureAudioStreamOptions = {
  microphoneDeviceId?: string
  microphoneFallbackDevices?: AudioInputDevice[]
  systemSourceId?: string
}

type MicrophoneCaptureAttempt = {
  label: string
  constraints: MediaStreamConstraints
  timeoutMs: number
}

export async function captureAudioStream(source: ListeningMode, options: CaptureAudioStreamOptions = {}): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('当前环境不支持麦克风采集，请更新 Electron/Chrome 内核后再试。')
  }

  if (source === 'system' && !options.systemSourceId) {
    throw new Error('请先在“电脑音频来源”里选择要共享的屏幕或窗口。')
  }

  if (source === 'system' && options.systemSourceId) {
    await window.huomiantong.setDesktopAudioSourceId(options.systemSourceId)
  }

  const captureStream =
    source === 'microphone'
      ? await captureMicrophoneStream(options.microphoneDeviceId, options.microphoneFallbackDevices)
      : await captureSystemAudioStream(options.systemSourceId)
  const audioTracks = captureStream.getAudioTracks()

  if (source === 'system') {
    captureStream.getVideoTracks().forEach((track) => track.stop())
  }

  if (audioTracks.length === 0) {
    stopMediaStream(captureStream)
    throw new Error('没有捕获到电脑音频：请选择“整个屏幕”或支持音频的窗口，并勾选“共享系统音频”')
  }

  return new MediaStream(audioTracks)
}

async function captureMicrophoneStream(deviceId?: string, fallbackDevices: AudioInputDevice[] = []): Promise<MediaStream> {
  const attempts = buildMicrophoneCaptureAttempts(deviceId, fallbackDevices)
  const failures: string[] = []

  for (const attempt of attempts) {
    try {
      return await getUserMediaWithTimeout(attempt.constraints, attempt.timeoutMs)
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误'
      failures.push(`${attempt.label}：${message}`)

      if (isPermissionError(error)) {
        break
      }
    }
  }

  throw new Error(`麦克风打开失败，已尝试 ${attempts.length} 种方式。\n${failures.join('\n')}`)
}

async function captureSystemAudioStream(sourceId?: string): Promise<MediaStream> {
  if (!navigator.mediaDevices.getDisplayMedia) {
    throw new Error('当前环境不支持电脑音频采集，请更新 Electron/Chrome 内核或改用麦克风转写。')
  }

  await window.huomiantong.setDesktopAudioSourceId(sourceId || '')

  return getDisplayMediaWithTimeout(
    {
      audio: true,
      video: true
    },
    10000
  )
}

function buildMicrophoneConstraints(deviceId?: string): MediaTrackConstraints {
  const constraints: MediaTrackConstraints = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }

  if (deviceId) {
    constraints.deviceId = { exact: deviceId }
  }

  return constraints
}

function buildMicrophoneCaptureAttempts(deviceId?: string, fallbackDevices: AudioInputDevice[] = []): MicrophoneCaptureAttempt[] {
  const attempts: MicrophoneCaptureAttempt[] = []
  const usedDeviceIds = new Set<string>()
  const fallbackDeviceMap = new Map(fallbackDevices.map((device) => [device.deviceId, device.label]))

  const pushDeviceAttempts = (targetDeviceId: string, label: string): void => {
    if (!targetDeviceId || usedDeviceIds.has(targetDeviceId) || isVirtualDefaultDeviceId(targetDeviceId)) {
      return
    }

    usedDeviceIds.add(targetDeviceId)
    attempts.push(
      {
        label: `${label}（基础模式）`,
        constraints: { audio: buildBasicMicrophoneConstraints(targetDeviceId) },
        timeoutMs: 7000
      },
      {
        label: `${label}（增强降噪模式）`,
        constraints: { audio: buildMicrophoneConstraints(targetDeviceId) },
        timeoutMs: 7000
      }
    )
  }

  if (deviceId) {
    pushDeviceAttempts(deviceId, fallbackDeviceMap.get(deviceId) || '已选麦克风')
  }

  fallbackDevices.forEach((device) => pushDeviceAttempts(device.deviceId, device.label || '可用麦克风'))

  attempts.push(
    {
      label: '系统默认麦克风（基础模式）',
      constraints: { audio: true },
      timeoutMs: 7000
    },
    {
      label: '系统默认麦克风（增强降噪模式）',
      constraints: { audio: buildMicrophoneConstraints() },
      timeoutMs: 7000
    }
  )

  return attempts
}

function buildBasicMicrophoneConstraints(deviceId: string): MediaTrackConstraints {
  return {
    deviceId: { exact: deviceId }
  }
}

function isVirtualDefaultDeviceId(deviceId: string): boolean {
  return deviceId === 'default' || deviceId === 'communications'
}

async function getDisplayMediaWithTimeout(constraints: DisplayMediaStreamOptions, timeoutMs: number): Promise<MediaStream> {
  let timeoutId = 0
  let timedOut = false
  const streamPromise = navigator.mediaDevices.getDisplayMedia(constraints).then((stream) => {
    if (timedOut) {
      stopMediaStream(stream)
    }

    return stream
  })

  try {
    return await Promise.race([
      streamPromise,
      new Promise<MediaStream>((_resolve, reject) => {
        timeoutId = window.setTimeout(() => {
          timedOut = true
          reject(new Error('电脑音频来源没有及时返回音频流，请换成“整个屏幕”，或确认目标窗口正在播放声音。'))
        }, timeoutMs)
      })
    ])
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function getUserMediaWithTimeout(constraints: MediaStreamConstraints, timeoutMs: number): Promise<MediaStream> {
  let timeoutId = 0
  let timedOut = false
  const streamPromise = navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    if (timedOut) {
      stopMediaStream(stream)
    }

    return stream
  })

  try {
    return await Promise.race([
      streamPromise,
      new Promise<MediaStream>((_resolve, reject) => {
        timeoutId = window.setTimeout(() => {
          timedOut = true
          reject(new Error('系统没有及时返回音频流，请检查设备是否被占用、驱动是否卡住，或 Windows 权限是否被拦截。'))
        }, timeoutMs)
      })
    ])
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function isPermissionError(error: unknown): boolean {
  return error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')
}

export function stopMediaStream(stream?: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop())
}
