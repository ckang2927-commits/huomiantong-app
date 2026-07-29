import { CheckCircle2, ClipboardCopy, FileText, Loader2, Maximize2, Minimize2, Minus, ShieldAlert, X } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { FloatingPayload } from '../../shared/types'
import { AppLogo } from './AppLogo'

const emptyPayload: FloatingPayload = {
  question: '等待面试问题',
  answer: '问题和答案会按时间留在这里。',
  evidence: [],
  status: 'idle',
  candidateName: '未选择候选人',
  targetRole: '未设置岗位',
  records: []
}

function formatTime(value: number): string {
  return new Date(value).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function evidenceLabel(item: FloatingPayload['evidence'][number]): string {
  return item.sourceLabel || (item.source === 'formal' ? '正式简历' : item.source === 'detailed' ? '万字简历' : '其他简历')
}

function evidenceSources(evidence: FloatingPayload['evidence']): string[] {
  return Array.from(new Set(evidence.map(evidenceLabel))).slice(0, 5)
}

function statusText(status: FloatingPayload['status'], queuedCount?: number): string {
  if (status === 'thinking') return queuedCount ? `生成中 · 排队 ${queuedCount}` : '生成中'
  if (status === 'ready') return '答案已就绪'
  if (status === 'error') return '生成异常'
  return '待命中'
}

function answerHint(status: FloatingPayload['status']): string {
  if (status === 'thinking') return '先稳住节奏，完整答案会继续流式更新。'
  if (status === 'error') return '这次生成失败了，回主窗口检查 API、余额或模型名。'
  if (status === 'ready') return '可以直接照这个口语化版本回答。'
  return '打开转写或手动输入问题后，这里会显示建议回答。'
}

function compactCount(text: string): number {
  return text.trim().replace(/\s+/g, '').length
}

export function FloatingWindow(): JSX.Element {
  const [payload, setPayload] = useState<FloatingPayload>(emptyPayload)
  const [isMaximized, setIsMaximized] = useState(false)
  const [answerRatio, setAnswerRatio] = useState(68)
  const resizeStateRef = useRef<{ startY: number; startRatio: number } | null>(null)

  useEffect(() => {
    return window.huomiantong.onFloatingPayload(setPayload)
  }, [])

  useEffect(() => {
    function handlePointerMove(event: PointerEvent): void {
      const state = resizeStateRef.current

      if (!state) {
        return
      }

      const deltaRatio = ((event.clientY - state.startY) / Math.max(window.innerHeight, 260)) * 100
      setAnswerRatio(clamp(state.startRatio + deltaRatio, 48, 84))
    }

    function stopResize(): void {
      resizeStateRef.current = null
      document.body.classList.remove('floating-resizing')
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopResize)
    window.addEventListener('pointercancel', stopResize)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopResize)
      window.removeEventListener('pointercancel', stopResize)
    }
  }, [])

  function startResize(event: ReactPointerEvent<HTMLDivElement>): void {
    event.preventDefault()
    resizeStateRef.current = {
      startY: event.clientY,
      startRatio: answerRatio
    }
    document.body.classList.add('floating-resizing')
  }

  async function copyAnswer(): Promise<void> {
    const text = payload.answer.trim()

    if (!text || !navigator.clipboard) {
      return
    }

    await navigator.clipboard.writeText(text)
  }

  const records = payload.records || []
  const latestRecords = records.slice(-10)
  const sources = evidenceSources(payload.evidence)
  const answerLength = compactCount(payload.answer)

  return (
    <main className="floating-shell">
      <header className="floating-titlebar">
        <div className="floating-title">
          <AppLogo className="floating-logo" />
          {payload.status === 'thinking' ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />}
          <span>获面通</span>
        </div>
        <div className="floating-actions">
          <button className="icon-button" type="button" title="最小化" onClick={() => window.huomiantong.hideFloating()}>
            <Minus size={16} />
          </button>
          <button
            className="icon-button"
            type="button"
            title={isMaximized ? '还原' : '最大化'}
            onClick={() => window.huomiantong.toggleFloatingMaximize().then(setIsMaximized)}
          >
            {isMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button className="icon-button" type="button" title="隐藏" onClick={() => window.huomiantong.hideFloating()}>
            <X size={16} />
          </button>
        </div>
      </header>

      <section
        className="floating-content"
        style={{
          gridTemplateRows: `auto minmax(128px, ${answerRatio}fr) auto 8px minmax(52px, ${100 - answerRatio}fr)`
        }}
      >
        <section className="floating-stage">
          <div className="floating-meta-row">
            <span>{payload.candidateName || '未选择候选人'}</span>
            <span>{payload.targetRole || '未设置岗位'}</span>
            <span>{records.length} 条记录</span>
            <strong className={`floating-live-pill ${payload.status}`}>{statusText(payload.status, payload.queuedCount)}</strong>
          </div>

          <div className="floating-question-card">
            <span>当前问题</span>
            <p>{payload.question || '等待面试问题'}</p>
          </div>
        </section>

        <article className={`floating-answer-card ${payload.status}`}>
          <div className="floating-answer-head">
            <div>
              <span>建议回答</span>
              <p>{answerHint(payload.status)}</p>
            </div>
            <button className="floating-copy-button" type="button" onClick={copyAnswer} title="复制当前答案">
              <ClipboardCopy size={14} />
              复制
            </button>
          </div>
          <div className="floating-answer">{payload.answer}</div>
        </article>

        <div className="floating-signal-row">
          <span><FileText size={13} />依据 {payload.evidence.length || 0} 条</span>
          <span><ShieldAlert size={13} />{payload.evidence.length === 0 ? '低依据，别硬编' : '依据可用'}</span>
          <span>{answerLength} 字</span>
          <span>{payload.queuedCount ? `排队 ${payload.queuedCount}` : '无排队'}</span>
          <span className="floating-signal-sources">
            {sources.length === 0 ? '参考：暂无' : `参考：${sources.join(' / ')}`}
          </span>
        </div>

        <div
          aria-label="拖动调节答案区高度"
          className="floating-resize-handle"
          onPointerDown={startResize}
          role="separator"
          title="按住上下拖动，调节答案区和记录区大小"
        />

        <div className="floating-records">
          {latestRecords.length === 0 ? (
            <p className="floating-empty">还没开始面试，生成回答后这里会同步显示完整上下文。</p>
          ) : (
            latestRecords.map((item) => (
              <article className={`floating-record ${item.kind}`} key={item.id}>
                <span>{formatTime(item.at)} · {item.kind === 'question' ? '问题' : '回答'}</span>
                <p>{item.text}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
