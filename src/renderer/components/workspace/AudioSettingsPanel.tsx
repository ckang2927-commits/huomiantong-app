import { Activity, AlertTriangle, CheckCircle2, Loader2, Mic2, MonitorSpeaker, RefreshCw, RotateCcw, Stethoscope, Volume2, Wifi } from 'lucide-react'
import type { AudioInputDevice, ListeningMode, MicrophonePermissionState, TranscriptionConnectionStatus } from '../../lib/audio/audioTypes'
import type { DesktopAudioSource, SpeechProviderId } from '../../../shared/types'
import { speechProviderHints, speechProviderNames, speechProviderOrder } from '../../../shared/speechProviders'

export type AudioSettingsPanelProps = {
  activeSpeechProvider: SpeechProviderId
  audioDeviceError: string
  audioInputDevices: AudioInputDevice[]
  connectionLatencyMs: number
  connectionStatus: TranscriptionConnectionStatus
  desktopAudioSources: DesktopAudioSource[]
  inputLevel: number
  isListening: boolean
  isRefreshingAudioDevices: boolean
  isRefreshingDesktopSources: boolean
  isRunningMicrophoneDiagnostic: boolean
  listeningMode: ListeningMode | null
  microphoneDiagnostic: string
  microphonePermission: MicrophonePermissionState
  onRefreshAudioDevices: (requestPermission?: boolean) => void
  onRefreshDesktopAudioSources: () => void
  onResetAudioUiState: () => void
  onRunMicrophoneDiagnostic: () => void
  onSelectedMicrophoneDeviceIdChange: (deviceId: string) => void
  onSelectedSystemSourceIdChange: (sourceId: string) => void
  onSpeechEndpointingMsChange: (value: number) => void
  onSpeechProviderChange: (provider: SpeechProviderId) => void
  selectedMicrophoneDeviceId: string
  selectedMicrophoneLabel: string
  selectedSystemSourceId: string
  selectedSystemSourceName: string
  speechEndpointingMs: number
  speechProviderReady: boolean
  systemAudioSupported: boolean
}

const permissionLabels: Record<MicrophonePermissionState, string> = {
  checking: '检测中',
  granted: '已授权',
  prompt: '待授权',
  denied: '已拒绝',
  unsupported: '不支持',
  unknown: '未知'
}

const connectionLabels: Record<TranscriptionConnectionStatus, string> = {
  idle: '未开启',
  preparing: '请求权限',
  capturing: '采集中',
  connecting: '连接中',
  connected: '已连接',
  error: '异常'
}

const endpointingOptions = [500, 800, 1200, 2000, 3000]

export function AudioSettingsPanel({
  activeSpeechProvider,
  audioDeviceError,
  audioInputDevices,
  connectionLatencyMs,
  connectionStatus,
  desktopAudioSources,
  inputLevel,
  isListening,
  isRefreshingAudioDevices,
  isRefreshingDesktopSources,
  isRunningMicrophoneDiagnostic,
  listeningMode,
  microphoneDiagnostic,
  microphonePermission,
  onRefreshAudioDevices,
  onRefreshDesktopAudioSources,
  onResetAudioUiState,
  onRunMicrophoneDiagnostic,
  onSelectedMicrophoneDeviceIdChange,
  onSelectedSystemSourceIdChange,
  onSpeechEndpointingMsChange,
  onSpeechProviderChange,
  selectedMicrophoneDeviceId,
  selectedMicrophoneLabel,
  selectedSystemSourceId,
  selectedSystemSourceName,
  speechEndpointingMs,
  speechProviderReady,
  systemAudioSupported
}: AudioSettingsPanelProps): JSX.Element {
  const permissionKind = microphonePermission === 'granted' ? 'pass' : microphonePermission === 'denied' || microphonePermission === 'unsupported' ? 'fail' : 'warn'
  const connectionKind = connectionStatus === 'connected' ? 'pass' : connectionStatus === 'error' ? 'fail' : connectionStatus === 'idle' ? 'muted' : 'warn'
  const systemAudioKind = !systemAudioSupported ? 'fail' : selectedSystemSourceId ? 'pass' : 'warn'
  const selectedSystemSourceExists = Boolean(selectedSystemSourceId && desktopAudioSources.some((source) => source.id === selectedSystemSourceId))
  const selectedSystemSourceIsWindow = selectedSystemSourceId.startsWith('window:')
  const selectedSystemSourceDisplayName = selectedSystemSourceName || '上次选择的来源（请刷新确认）'
  const systemAudioStatus = !systemAudioSupported
    ? '当前不支持'
    : selectedSystemSourceId
      ? selectedSystemSourceExists
        ? '已选择来源'
        : '需刷新确认'
      : '需要选择来源'
  const levelPercent = Math.round(inputLevel * 100)
  const isMicrophoneMode = listeningMode === 'microphone'
  const isSystemMode = listeningMode === 'system'
  const activeProviderName = speechProviderNames[activeSpeechProvider]

  return (
    <section className="audio-settings-panel">
      <div className="audio-settings-title">
        <div>
          <span className="eyebrow">Audio Setup</span>
          <strong>语音转写设置</strong>
          <p>先选语音服务商，再选麦克风或电脑音频来源。线上面试建议优先用电脑音频，避免把自己的回答重复录进去。</p>
        </div>
        <div className="audio-title-actions">
          <button className="ghost-button compact" type="button" onClick={onResetAudioUiState} disabled={isListening}>
            <RotateCcw size={14} />
            重置状态
          </button>
          <button className="ghost-button compact" type="button" onClick={() => onRefreshAudioDevices(true)} disabled={isRefreshingAudioDevices}>
            {isRefreshingAudioDevices ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
            刷新 / 授权
          </button>
        </div>
      </div>

      <article className="speech-provider-card">
        <div>
          <span className="eyebrow">STT Provider</span>
          <strong>实时语音服务商</strong>
          <p>{speechProviderHints[activeSpeechProvider]}</p>
        </div>
        <div className="speech-provider-controls">
          <label>
            <span>服务商</span>
            <select value={activeSpeechProvider} onChange={(event) => onSpeechProviderChange(event.target.value as SpeechProviderId)} disabled={isListening}>
              {speechProviderOrder.map((provider) => (
                <option key={provider} value={provider}>
                  {speechProviderNames[provider]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>断句间隔</span>
            <select value={speechEndpointingMs} onChange={(event) => onSpeechEndpointingMsChange(Number(event.target.value))} disabled={isListening}>
              {endpointingOptions.map((ms) => (
                <option key={ms} value={ms}>
                  {ms / 1000} 秒
                </option>
              ))}
            </select>
          </label>
        </div>
        {activeSpeechProvider !== 'deepgram' && (
          <p className="audio-device-note compact-note">
            {activeProviderName} 现在是“接口预留”状态：配置入口已保留，实时转写协议还没正式接入；需要上线国内语音时再接官方 WebSocket。
          </p>
        )}
      </article>

      <div className="audio-mode-grid">
        <article className={`audio-mode-card ${isMicrophoneMode ? 'active' : ''}`}>
          <div className="audio-mode-heading">
            <div className="audio-mode-icon">
              <Mic2 size={17} />
            </div>
            <div>
              <strong>麦克风转写</strong>
              <span>适合自己练习、拟真面试、线下面试。</span>
            </div>
          </div>
          <label className="audio-device-select">
            <span>麦克风设备</span>
            <select
              value={selectedMicrophoneDeviceId}
              onChange={(event) => onSelectedMicrophoneDeviceIdChange(event.target.value)}
              disabled={isListening}
              title={isListening ? '转写中不能切换麦克风，请先停止。' : '选择本次要使用的麦克风。'}
            >
              <option value="">系统默认麦克风</option>
              {audioInputDevices.map((device) => (
                <option key={device.deviceId || device.label} value={device.deviceId}>
                  {device.label}
                </option>
              ))}
            </select>
            {isListening && <small>转写中不能切换设备，先停止当前转写。</small>}
          </label>
          <div className="audio-active-device" title="当前麦克风设备，仅用于显示">
            <Mic2 size={15} />
            <span>{selectedMicrophoneLabel}</span>
          </div>
        </article>

        <article className={`audio-mode-card ${isSystemMode ? 'active' : ''}`}>
          <div className="audio-mode-heading">
            <div className="audio-mode-icon">
              <MonitorSpeaker size={17} />
            </div>
            <div>
              <strong>电脑音频转写</strong>
              <span>适合线上面试，只识别对方声音，减少把自己的回答录进去。</span>
            </div>
          </div>
          <label className="audio-device-select">
            <span>屏幕 / 窗口来源</span>
            <select
              value={selectedSystemSourceId}
              onChange={(event) => onSelectedSystemSourceIdChange(event.target.value)}
              disabled={isListening}
              title={isListening ? '转写中不能切换电脑音频来源，请先停止。' : '选择要捕获系统声音的屏幕或窗口。'}
            >
              <option value="">请选择屏幕 / 窗口</option>
              {selectedSystemSourceId && !selectedSystemSourceExists && (
                <option value={selectedSystemSourceId}>上次选择的来源（请刷新确认）</option>
              )}
              {desktopAudioSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
            {selectedSystemSourceId ? (
              <small>{selectedSystemSourceIsWindow ? `已选：${selectedSystemSourceDisplayName}；如果没声音，建议换“整个屏幕”。` : `已选：${selectedSystemSourceDisplayName}`}</small>
            ) : (
              <small>先点“刷新来源”，再选正在播放面试声音的屏幕或窗口。</small>
            )}
          </label>
          <button className="ghost-button compact audio-source-refresh" type="button" onClick={onRefreshDesktopAudioSources} disabled={isRefreshingDesktopSources || isListening}>
            {isRefreshingDesktopSources ? <Loader2 className="spin" size={14} /> : <MonitorSpeaker size={14} />}
            刷新来源
          </button>
        </article>
      </div>

      <div className="audio-status-grid">
        <AudioStatusChip icon={<Wifi size={14} />} kind={speechProviderReady ? 'pass' : 'warn'} label={activeProviderName} value={speechProviderReady ? '已配置' : '未配置'} />
        <AudioStatusChip icon={<Mic2 size={14} />} kind={permissionKind} label="麦克风权限" value={permissionLabels[microphonePermission]} />
        <AudioStatusChip icon={<Volume2 size={14} />} kind={systemAudioKind} label="电脑音频" value={systemAudioStatus} />
        <AudioStatusChip
          icon={connectionStatus === 'connected' ? <CheckCircle2 size={14} /> : connectionStatus === 'error' ? <AlertTriangle size={14} /> : <Activity size={14} />}
          kind={connectionKind}
          label="连接状态"
          value={connectionLatencyMs > 0 && connectionStatus === 'connected' ? `${connectionLabels[connectionStatus]} · ${connectionLatencyMs}ms` : connectionLabels[connectionStatus]}
        />
      </div>

      <div className="audio-level-card">
        <div className="audio-level-row">
          <span>{listeningMode === 'system' ? '电脑音频输入' : '麦克风输入'}</span>
          <strong>{levelPercent}%</strong>
        </div>
        <div className="audio-level-bar" aria-label={`当前音量 ${levelPercent}%`}>
          <i style={{ width: `${levelPercent}%` }} />
        </div>
      </div>

      <div className="audio-diagnostic-row">
        <button className="ghost-button compact" type="button" onClick={onRunMicrophoneDiagnostic} disabled={isListening || isRunningMicrophoneDiagnostic}>
          {isRunningMicrophoneDiagnostic ? <Loader2 className="spin" size={14} /> : <Stethoscope size={14} />}
          本地麦克风诊断
        </button>
        <span>这个诊断不会调用语音服务商，只检查系统麦克风能不能打开、有没有声音。</span>
      </div>

      {audioDeviceError && <p className="audio-device-error">{audioDeviceError}</p>}
      {microphoneDiagnostic && <p className="audio-device-note">{microphoneDiagnostic}</p>}
    </section>
  )
}

function AudioStatusChip({
  icon,
  kind,
  label,
  value
}: {
  icon: JSX.Element
  kind: 'pass' | 'warn' | 'fail' | 'muted'
  label: string
  value: string
}): JSX.Element {
  return (
    <div className={`audio-status-chip ${kind}`}>
      {icon}
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}
