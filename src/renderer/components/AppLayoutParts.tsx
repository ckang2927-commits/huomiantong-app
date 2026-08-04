import { AlertCircle, CheckCircle2, Dumbbell, Info, FileText, History, Loader2, Mic, PanelTopOpen, RefreshCw, Save, Settings, ShieldCheck } from 'lucide-react'
import { AppLogo } from './AppLogo'
import { CircleHelp, FileAudio, Radio } from 'lucide-react'
import type { ToastMessage, ViewId } from '../lib/appHelpers'

const viewTitles: Record<ViewId, string> = {
  workspace: '实时模拟面试台',
  training: '模拟训练',
  realisticInterview: '拟真面试',
  checkup: '面试前作战室',
  resume: '简历知识库',
  settings: '设置中心',
  sessions: '历史会话',
  interviewReview: '面试复盘',
  help: '帮助中心'
}

type SidebarNavProps = {
  activeView: ViewId
  onChangeView: (view: ViewId) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function SidebarNav({ activeView, onChangeView, collapsed, onToggleCollapse }: SidebarNavProps): JSX.Element {
  const navGroups = [
    {
      title: '面试工作台',
      items: [{ view: 'workspace' as ViewId, label: '面试台', icon: <Mic size={17} /> }]
    },
    {
      title: '训练与体检',
      items: [
        { view: 'training' as ViewId, label: '模拟训练', icon: <Dumbbell size={17} /> },
        { view: 'realisticInterview' as ViewId, label: '拟真面试', icon: <Radio size={17} /> },
        { view: 'checkup' as ViewId, label: '作战室', icon: <ShieldCheck size={17} /> }
      ]
    },
    {
      title: '资料中心',
      items: [{ view: 'resume' as ViewId, label: '简历库', icon: <FileText size={17} /> }]
    },
    {
      title: '复盘中心',
      items: [
        { view: 'sessions' as ViewId, label: '会话记录', icon: <History size={17} /> },
        { view: 'interviewReview' as ViewId, label: '面试复盘', icon: <FileAudio size={17} /> }
      ]
    },
    {
      title: '系统中心',
      items: [
        { view: 'help' as ViewId, label: '帮助中心', icon: <CircleHelp size={17} /> },
        { view: 'settings' as ViewId, label: '设置中心', icon: <Settings size={17} /> }
      ]
    }
  ]

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`} aria-label="主导航" data-onboarding-target="sidebar">
      <div className="brand-block">
        <AppLogo className="brand-logo" />
        <div className="brand-copy">
          <h1>获面通</h1>
          <p>INTERVIEW OS</p>
        </div>
      </div>
      <div className="sidebar-sections">
        {navGroups.map((group) => (
          <section className="sidebar-group" key={group.title}>
            <span className="sidebar-group-title">{group.title}</span>
            <nav className="nav-list">
              {group.items.map((item) => (
                <button
                  key={item.view}
                  className={activeView === item.view ? 'active' : ''}
                  aria-label={item.label}
                  onClick={() => onChangeView(item.view)}
                  title={`${group.title} · ${item.label}`}
                  type="button"
                >
                  {item.icon}
                  <span className="nav-label">{item.label}</span>
                </button>
              ))}
            </nav>
          </section>
        ))}
      </div>
      <div className="sidebar-status">
        <AppLogo className="sidebar-status-logo" />
        <div>
          <strong>本地个人版</strong>
          <span>配置保存在本机</span>
        </div>
      </div>
    </aside>
  )
}

type AppTopbarProps = {
  activeView: ViewId
  audioStatus: TopbarStatus
  isRunningHealthCheck: boolean
  modelStatus: TopbarStatus
  onOpenAudioSettings: () => void
  onOpenModelSettings: () => void
  onRefreshSessions: () => void
  onRunHealthCheck: () => void
  onSaveCurrentSession: () => void
  onOpenFloating: () => void
}

export type TopbarStatus = {
  kind: 'ok' | 'warn' | 'error' | 'live'
  label: string
  detail: string
}

export function AppTopbar({
  activeView,
  audioStatus,
  isRunningHealthCheck,
  modelStatus,
  onOpenAudioSettings,
  onOpenModelSettings,
  onRefreshSessions,
  onRunHealthCheck,
  onSaveCurrentSession,
  onOpenFloating
}: AppTopbarProps): JSX.Element {
  return (
    <header className="topbar" data-onboarding-target="topbar">
      <div>
        <span className="eyebrow">Personal Interview Copilot</span>
        <h2>{viewTitles[activeView]}</h2>
      </div>
      <div className="topbar-actions">
        <button className={`topbar-chip topbar-chip-${audioStatus.kind}`} title={audioStatus.detail} aria-label={`${audioStatus.detail} 点击进入语音转写设置。`} type="button" onClick={onOpenAudioSettings}>
          <span className="topbar-chip-dot" />
          {audioStatus.label}
        </button>
        <button className={`topbar-chip topbar-chip-${modelStatus.kind}`} title={modelStatus.detail} aria-label={`${modelStatus.detail} 点击进入回答模型设置。`} type="button" onClick={onOpenModelSettings}>
          <span className="topbar-chip-dot" />
          {modelStatus.label}
        </button>
        {activeView === 'sessions' && (
          <button className="ghost-button" type="button" onClick={onRefreshSessions}>
            <RefreshCw size={16} />刷新会话
          </button>
        )}
        {activeView === 'workspace' && (
          <>
            <button className="ghost-button" type="button" onClick={onRunHealthCheck}>
              <ShieldCheck size={16} />一键检查
            </button>
            <button className="ghost-button" type="button" onClick={onSaveCurrentSession}>
              <Save size={16} />保存会话
            </button>
          </>
        )}
        {activeView === 'checkup' && (
          <button className="primary-button" type="button" onClick={onRunHealthCheck} disabled={isRunningHealthCheck}>
            {isRunningHealthCheck ? <Loader2 className="spin" size={16} /> : <ShieldCheck size={16} />}开始体检
          </button>
        )}
        {(activeView === 'workspace' || activeView === 'sessions') && (
          <button className="primary-button" type="button" onClick={onOpenFloating}>
            <PanelTopOpen size={16} />打开悬浮窗
          </button>
        )}
      </div>
    </header>
  )
}

export function ToastNotice({ toast, onOpenDiagnostics }: { toast: ToastMessage; onOpenDiagnostics?: () => void }): JSX.Element {
  return (
    <div className={`toast-notice ${toast.kind}`} key={toast.id}>
      {toast.kind === 'error' ? <AlertCircle size={18} /> : toast.kind === 'info' ? <Info size={18} /> : <CheckCircle2 size={18} />}
      <span>{toast.text}</span>
      {toast.kind === 'error' && onOpenDiagnostics && (
        <button type="button" onClick={onOpenDiagnostics}>
          查看详情
        </button>
      )}
    </div>
  )
}

