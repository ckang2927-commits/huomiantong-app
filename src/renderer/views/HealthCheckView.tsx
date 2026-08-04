import { AlertTriangle, CheckCircle2, Loader2, Mic, ShieldCheck } from 'lucide-react'
import { DiagnosticLogPanel } from '../components/diagnostics/DiagnosticLogPanel'
import { useDiagnosticLogs } from '../hooks/useDiagnosticLogs'
import type { HealthCheckItem, ViewId } from '../lib/appHelpers'

type HealthSummary = {
  fail: number
  warn: number
  pass: number
  score: number
}

type HealthCheckViewProps = {
  checks: HealthCheckItem[]
  summary: HealthSummary
  isRunning: boolean
  onRun: () => void
  onBackWorkspace: () => void
  onChangeView: (view: ViewId) => void
}

type HealthBucket = {
  id: string
  title: string
  desc: string
  items: HealthCheckItem[]
}

export function HealthCheckView({ checks, summary, isRunning, onRun, onBackWorkspace, onChangeView }: HealthCheckViewProps): JSX.Element {
  const { logs, clearLogs } = useDiagnosticLogs()
  const buckets = groupHealthChecks(checks)
  const riskCount = checks.filter((item) => item.status === 'fail').length + checks.filter((item) => item.status === 'warn').length

  return (
    <section className="panel full-panel health-panel" data-onboarding-target="checkup">
      <div className="health-hero">
        <div className="health-hero-copy">
          <span className="eyebrow">Preflight Check</span>
          <h3>面试前作战室</h3>
          <p>开面试前先扫一遍：候选人、简历、模型、语音、悬浮窗和预热缓存，少踩临场翻车坑。</p>
        </div>
        <div className={`health-score ${summary.fail ? 'fail' : summary.warn ? 'warn' : 'pass'}`}>
          <strong>{checks.length ? summary.score : '--'}</strong>
          <span>{checks.length ? `通过 ${summary.pass} / ${checks.length}` : '未体检'}</span>
        </div>
      </div>

      <div className="health-actions">
        <button className="primary-button" type="button" onClick={onRun} disabled={isRunning}>
          {isRunning ? <Loader2 className="spin" size={16} /> : <ShieldCheck size={16} />}
          {isRunning ? '检查中...' : '开始一键检查'}
        </button>
        <button className="ghost-button" type="button" onClick={onBackWorkspace}>
          <Mic size={16} />回到面试台
        </button>
        <button className="ghost-button" type="button" onClick={() => onChangeView('resume')}>
          去简历库
        </button>
        <button className="ghost-button" type="button" onClick={() => onChangeView('settings')}>
          去设置中心
        </button>
      </div>

      <div className="health-workspace">
        <div className="health-main-column">
          <div className="health-summary-strip">
            <SummaryChip label="待确认风险" value={riskCount} tone={riskCount ? 'warn' : 'pass'} />
            <SummaryChip label="高亮检查" value={checks.filter((item) => item.status === 'pass').length} tone="pass" />
            <SummaryChip label="提醒项" value={checks.filter((item) => item.status === 'warn').length} tone="warn" />
            <SummaryChip label="未通过" value={checks.filter((item) => item.status === 'fail').length} tone="fail" />
          </div>

          {checks.length === 0 ? (
            <div className="empty-state health-empty">
              <ShieldCheck size={32} />
              <p>点击“开始一键体检”，我会帮你检查面试前最容易出问题的地方。</p>
            </div>
          ) : (
            <div className="health-bucket-list">
              {buckets.map((bucket) => (
                <section className="health-bucket" key={bucket.id}>
                  <div className="health-bucket-heading">
                    <div>
                      <strong>{bucket.title}</strong>
                      <span>{bucket.desc}</span>
                    </div>
                    <b>{bucket.items.length} 项</b>
                  </div>
                  <div className="health-grid">
                    {bucket.items.map((item) => (
                      <article className={`health-card ${item.status}`} key={item.id}>
                        <div className="health-icon">
                          {item.status === 'running' ? (
                            <Loader2 className="spin" size={18} />
                          ) : item.status === 'pass' ? (
                            <CheckCircle2 size={18} />
                          ) : item.status === 'warn' ? (
                            <AlertTriangle size={18} />
                          ) : (
                            <ShieldCheck size={18} />
                          )}
                        </div>
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.detail}</p>
                          {item.action && item.target && (
                            <button className="ghost-button compact" type="button" onClick={() => onChangeView(item.target!)}>
                              {item.action}
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <aside className="health-side-column">
          <div className="health-tips health-side-card">
            <strong>体检说明</strong>
            <p>麦克风/电脑音频这里只检查能力支持，不会提前占用权限；真正开始转写时仍需要系统授权。</p>
          </div>
          <div className="health-side-card health-side-list">
            <strong>优先处理顺序</strong>
            <ol>
              <li>先看红色项，再看黄色项。</li>
              <li>先补简历和模型，再试语音与悬浮窗。</li>
              <li>最后再点一键体检确认一遍。</li>
            </ol>
          </div>
          <DiagnosticLogPanel logs={logs} onClearLogs={clearLogs} />
        </aside>
      </div>
    </section>
  )
}

function SummaryChip({ label, value, tone }: { label: string; value: number; tone: 'pass' | 'warn' | 'fail' }): JSX.Element {
  return (
    <article className={`health-summary-chip ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}

function groupHealthChecks(checks: HealthCheckItem[]): HealthBucket[] {
  const groups: HealthBucket[] = [
    { id: 'profile', title: '候选人与简历', desc: '先确认人和资料', items: [] },
    { id: 'model', title: '模型与语音', desc: '再确认回答和转写', items: [] },
    { id: 'workspace', title: '面试台能力', desc: '最后看临场入口', items: [] },
    { id: 'other', title: '其他检查项', desc: '兜底项和补充项', items: [] }
  ]

  for (const item of checks) {
    const target = classifyHealthCheck(item)
    groups.find((group) => group.id === target)?.items.push(item)
  }

  return groups.filter((group) => group.items.length > 0)
}

function classifyHealthCheck(item: HealthCheckItem): HealthBucket['id'] {
  if (item.id === 'candidate' || item.id === 'resume') return 'profile'
  if (item.id === 'answer-model' || item.id === 'deepgram') return 'model'
  if (item.id === 'microphone' || item.id === 'system-audio' || item.id === 'floating' || item.id === 'warmup') return 'workspace'
  return 'other'
}
