import { CheckSquare, Download, History, MoreHorizontal, PencilLine, Square, Trash2 } from 'lucide-react'
import {
  evidenceSources,
  formatTime,
  resumeLabel
} from '../lib/appHelpers'
import { InterviewReviewDashboard } from '../components/sessions/InterviewReviewDashboard'
import type { FloatingPayload, InterviewSession, ResumeProfile } from '../../shared/types'
import type { TrainingFocusPlan } from '../lib/trainingInsights'

type SessionRecord = NonNullable<FloatingPayload['records']>[number]

type SessionsViewProps = {
  sessions: InterviewSession[]
  filteredSessions: InterviewSession[]
  selectedSessionIds: string[]
  openedSession: InterviewSession | null
  openedRecords: SessionRecord[]
  resumeProfiles: ResumeProfile[]
  sessionProfileFilter: string
  onFilterChange: (profileId: string) => void
  onCloseOpenedSession: () => void
  onOpenSession: (session: InterviewSession) => void
  onToggleSessionSelection: (id: string) => void
  onExportSelectedSessions: (format: 'md' | 'word') => void
  onDeleteSessions: (ids?: string[]) => void | Promise<void>
  onRenameSession: (session: InterviewSession) => void | Promise<void>
  onExportSessionMarkdown: (session: InterviewSession) => void
  onExportSessionWord: (session: InterviewSession) => void
  onStartFocusedTraining?: (plan: TrainingFocusPlan) => void | Promise<void>
}

export function SessionsView({
  sessions,
  filteredSessions,
  selectedSessionIds,
  openedSession,
  openedRecords,
  resumeProfiles,
  sessionProfileFilter,
  onFilterChange,
  onCloseOpenedSession,
  onOpenSession,
  onToggleSessionSelection,
  onExportSelectedSessions,
  onDeleteSessions,
  onRenameSession,
  onExportSessionMarkdown,
  onExportSessionWord,
  onStartFocusedTraining
}: SessionsViewProps): JSX.Element {
  const visibleAnswerCount = filteredSessions.reduce((count, item) => count + item.answers.length, 0)
  const visibleTranscriptCount = filteredSessions.reduce((count, item) => count + item.transcript.length, 0)

  return (
    <section className="panel full-panel sessions-page-shell" data-onboarding-target="sessions">
      <div className="sessions-hero">
        <div>
          <span className="eyebrow">Session History</span>
          <h3>会话记录</h3>
          <p>这里负责回看真实面试过程、批量导出资料，以及把薄弱问题转成下一轮训练。</p>
        </div>
        <div className="sessions-hero-stats">
          <span>{filteredSessions.length} 场会话</span>
          <span>{visibleAnswerCount} 条回答</span>
          <span>{visibleTranscriptCount} 条转写</span>
        </div>
      </div>

      <div className="sessions-toolbar">
        <div className="session-filter-bar">
          <button className={sessionProfileFilter === 'all' ? 'selected' : ''} type="button" onClick={() => onFilterChange('all')}>
            全部会话
          </button>
          {resumeProfiles.map((profile) => (
            <button className={sessionProfileFilter === profile.id ? 'selected' : ''} key={profile.id || resumeLabel(profile)} type="button" onClick={() => onFilterChange(profile.id || 'all')}>
              {resumeLabel(profile)}
            </button>
          ))}
        </div>

        <div className="sessions-bulk-actions">
          {selectedSessionIds.length > 0 ? (
            <>
              <span className="sessions-selected-count">已选 {selectedSessionIds.length}</span>
              <button className="ghost-button compact" type="button" onClick={() => onExportSelectedSessions('md')}>
                <Download size={15} />批量 MD
              </button>
              <button className="ghost-button compact" type="button" onClick={() => onExportSelectedSessions('word')}>
                <Download size={15} />批量 Word
              </button>
              <button className="danger-button compact" type="button" onClick={() => onDeleteSessions()}>
                <Trash2 size={15} />删除
              </button>
            </>
          ) : (
            <span className="sessions-selected-hint">勾选会话后可批量导出或删除</span>
          )}
        </div>
      </div>

      <div className="sessions-main-grid">
        <div className="sessions-review-column">
          <InterviewReviewDashboard
            sessions={filteredSessions}
            totalSessionCount={sessions.length}
            isFiltered={sessionProfileFilter !== 'all'}
            onStartFocusedTraining={onStartFocusedTraining}
          />
        </div>

        <div className="sessions-record-column">
          {openedSession && (
            <section className="history-preview">
              <div className="history-preview-header">
                <div>
                  <span className="eyebrow">Opened Session</span>
                  <h4>{openedSession.title}</h4>
                  <p>
                    {new Date(openedSession.updatedAt).toLocaleString('zh-CN')} · {openedSession.answers.length} 条回答 · {openedSession.transcript.length} 条转写 ·{' '}
                    {openedSession.resumeProfileName || '未绑定候选人'}
                  </p>
                </div>
                <button className="ghost-button compact" type="button" onClick={onCloseOpenedSession}>
                  关闭预览
                </button>
              </div>
              <div className="history-preview-list">
                {openedRecords.length === 0 ? (
                  <p className="empty-state compact">这个会话是空的，可能是旧格式或导入异常导致的。暂时无法逐条回放。</p>
                ) : (
                  openedRecords.map((item) => (
                    <article className={`history-preview-item ${item.kind}`} key={item.id}>
                      <span>
                        {formatTime(item.at)} · {item.kind === 'question' ? '面试官问题' : 'AI 回答'}
                      </span>
                      <p>{item.text}</p>
                      {item.kind === 'answer' && item.evidence && item.evidence.length > 0 && (
                        <div className="history-evidence-tags">
                          {evidenceSources(item.evidence).map((source) => (
                            <span key={source}>{source}</span>
                          ))}
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          )}

          <div className="session-list">
            {sessions.length === 0 ? (
              <div className="empty-state">
                <History size={28} />
                <p>保存会话后会出现在这里。</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="empty-state">
                <History size={28} />
                <p>这个候选人还没有保存过会话。</p>
              </div>
            ) : (
              filteredSessions.map((item) => (
                <article className={`session-item ${selectedSessionIds.includes(item.id) ? 'selected' : ''}`} key={item.id}>
                  <button className="select-button" type="button" onClick={() => onToggleSessionSelection(item.id)}>
                    {selectedSessionIds.includes(item.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                  <div className="session-item-main">
                    <strong>{item.title}</strong>
                    <span>
                      {new Date(item.updatedAt).toLocaleString('zh-CN')} · {item.answers.length} 条回答 · {item.resumeProfileName || '未绑定候选人'}
                    </span>
                  </div>
                  <div className="session-actions">
                    <button className="ghost-button compact" type="button" onClick={() => onOpenSession(item)}>
                      打开
                    </button>
                    <details className="session-actions-menu">
                      <summary>
                        <MoreHorizontal size={16} />更多
                      </summary>
                      <div>
                        <button type="button" onClick={() => onRenameSession(item)}>
                          <PencilLine size={15} />重命名
                        </button>
                        <button type="button" onClick={() => onExportSessionMarkdown(item)}>
                          <Download size={15} />导出 MD
                        </button>
                        <button type="button" onClick={() => onExportSessionWord(item)}>
                          <Download size={15} />导出 Word
                        </button>
                        <button className="danger-text" type="button" onClick={() => onDeleteSessions([item.id])}>
                          <Trash2 size={15} />删除
                        </button>
                      </div>
                    </details>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
