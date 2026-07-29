import { AlertTriangle, CheckCircle2, ClipboardList, Info, Trash2 } from 'lucide-react'
import type { DiagnosticLogEntry } from '../../lib/diagnosticLog'

type DiagnosticLogPanelProps = {
  logs: DiagnosticLogEntry[]
  onClearLogs: () => void
}

const categoryLabels: Record<DiagnosticLogEntry['category'], string> = {
  api: 'API',
  model: '模型',
  speech: '语音',
  audio: '音频',
  system: '系统',
  backup: '备份',
  resume: '简历',
  training: '训练',
  unknown: '其他'
}

export function DiagnosticLogPanel({ logs, onClearLogs }: DiagnosticLogPanelProps): JSX.Element {
  const errorCount = logs.filter((item) => item.severity === 'error').length
  const warnCount = logs.filter((item) => item.severity === 'warn').length
  const recentLogs = logs.slice(0, 12)

  return (
    <section className="diagnostic-log-panel">
      <div className="diagnostic-log-heading">
        <div>
          <span className="eyebrow">Error Diagnosis</span>
          <h4>错误日志与人话解释</h4>
          <p>自动记录 API、模型、Deepgram、麦克风和电脑音频异常。不会上传，只存在本机。</p>
        </div>
        <div className="diagnostic-log-summary">
          <span className={errorCount ? 'bad' : 'ok'}>{errorCount} 错误</span>
          <span className={warnCount ? 'warn' : 'ok'}>{warnCount} 提醒</span>
          <button className="ghost-button compact" type="button" onClick={onClearLogs} disabled={logs.length === 0}>
            <Trash2 size={14} />清空
          </button>
        </div>
      </div>

      {recentLogs.length === 0 ? (
        <div className="diagnostic-empty">
          <ClipboardList size={24} />
          <p>暂时没有错误。等出现 401/402、Deepgram、麦克风这类问题时，这里会自动解释原因和下一步。</p>
        </div>
      ) : (
        <div className="diagnostic-log-list">
          {recentLogs.map((item) => (
            <article className={`diagnostic-log-item ${item.severity}`} key={item.id}>
              <div className="diagnostic-log-icon">{iconForSeverity(item.severity)}</div>
              <div>
                <div className="diagnostic-log-top">
                  <strong>{item.title}</strong>
                  <span>
                    {formatTime(item.at)} · {categoryLabels[item.category]} · {item.source}
                  </span>
                </div>
                <p className="diagnostic-log-message">{item.message}</p>
                <div className="diagnostic-log-explain">
                  <p>
                    <b>可能原因：</b>
                    {item.reason}
                  </p>
                  <p>
                    <b>下一步：</b>
                    {item.action}
                  </p>
                </div>
                {item.details && <small>{item.details}</small>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function iconForSeverity(severity: DiagnosticLogEntry['severity']): JSX.Element {
  if (severity === 'error') return <AlertTriangle size={17} />
  if (severity === 'success') return <CheckCircle2 size={17} />
  return <Info size={17} />
}

function formatTime(value: number): string {
  return new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
