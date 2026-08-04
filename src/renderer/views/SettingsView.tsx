import { useState, type ChangeEvent, type RefObject } from 'react'
import { useEffect } from 'react'
import { Briefcase, Cpu, FileClock, FileText, GraduationCap, Keyboard, MessageSquare, Mic, Settings2, Shield } from 'lucide-react'
import { AboutDiagnosticsPanel } from '../components/settings/AboutDiagnosticsPanel'
import { ApiModelConsole } from '../components/settings/ApiModelConsole'
import { AudioTroubleshootingPanel } from '../components/settings/AudioTroubleshootingPanel'
import { FAQPanel } from '../components/settings/FAQPanel'
import { HelpQuickLinksPanel } from '../components/settings/HelpQuickLinksPanel'
import { BackgroundPrepPreviewPanel } from '../components/settings/BackgroundPrepPreviewPanel'
import { BackgroundPrepResultPreview } from '../components/settings/BackgroundPrepResultPreview'
import { BackgroundPrepConsistencyReport } from '../components/settings/BackgroundPrepConsistencyReport'
import { ModelRouterPanel } from '../components/settings/ModelRouterPanel'
import { PrivacySettingsPanel } from '../components/settings/PrivacySettingsPanel'
import { SettingsBackupPanel } from '../components/settings/SettingsBackupPanel'
import { SpeechProviderSettingsPanel } from '../components/settings/SpeechProviderSettingsPanel'
import { ShortcutGrid } from '../components/settings/ShortcutGrid'
import { UpdateLogPanel } from '../components/settings/UpdateLogPanel'
import { OnboardingProgressPanel } from '../components/settings/OnboardingProgressPanel'
import type { InterviewMode } from '../../shared/types'

type SettingsSectionId = 'api' | 'answer' | 'voice' | 'floating' | 'keys' | 'privacy' | 'training' | 'background' | 'diag' | 'updates'

const SETTINGS_SECTIONS: Array<{ id: SettingsSectionId; icon: typeof Cpu; label: string; desc: string }> = [
  { id: 'api', icon: Cpu, label: 'API 模型', desc: 'Key、模型、费用预算' },
  { id: 'answer', icon: MessageSquare, label: '回答风格', desc: '岗位、JD、回答策略' },
  { id: 'voice', icon: Mic, label: '语音转写', desc: '麦克风与电脑音频' },
  { id: 'floating', icon: FileText, label: '悬浮窗', desc: '显示与临场使用' },
  { id: 'keys', icon: Keyboard, label: '快捷键', desc: '键盘快速操作' },
  { id: 'privacy', icon: Shield, label: '隐私安全', desc: '备份、脱敏、本地数据' },
  { id: 'training', icon: GraduationCap, label: '模拟训练', desc: '题数、复盘、错题' },
  { id: 'background', icon: Briefcase, label: '背景资料', desc: 'HR、薪资、公司补充包' },
  { id: 'diag', icon: Settings2, label: '诊断日志', desc: '帮助、FAQ、排障' },
  { id: 'updates', icon: FileClock, label: '更新日志', desc: '版本历史、检查更新、重启' }
]

type SettingsViewProps = {
  backupStatus: string
  backupImportRef: RefObject<HTMLInputElement>
  onExportBackup: (options?: { includeApiKeys?: boolean }) => void | Promise<void>
  onOpenBackupImporter: () => void
  onBackupImportChange: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>
  onGenerateRoleJdWithAi: (mode: InterviewMode) => void | Promise<void>
  generatingRoleJdMode: InterviewMode | null
}

export function SettingsView({
  backupStatus,
  backupImportRef,
  onExportBackup,
  onOpenBackupImporter,
  onBackupImportChange,
  onGenerateRoleJdWithAi,
  generatingRoleJdMode
}: SettingsViewProps): JSX.Element {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('api')
  const activeMeta = SETTINGS_SECTIONS.find((section) => section.id === activeSection) ?? SETTINGS_SECTIONS[0]

  useEffect(() => {
    const handleSettingsSection = (event: Event): void => {
      const section = (event as CustomEvent<{ section?: SettingsSectionId }>).detail?.section

      if (section && SETTINGS_SECTIONS.some((item) => item.id === section)) {
        setActiveSection(section)
      }
    }

    window.addEventListener('huomiantong:settings-section', handleSettingsSection)
    return () => window.removeEventListener('huomiantong:settings-section', handleSettingsSection)
  }, [])

  const renderActiveSection = (): JSX.Element => {
    switch (activeSection) {
      case 'api':
        return <ApiModelConsole />
      case 'answer':
        return (
          <ModelRouterPanel
            onGenerateRoleJdWithAi={onGenerateRoleJdWithAi}
            generatingRoleJdMode={generatingRoleJdMode}
          />
        )
      case 'voice':
        return (
          <div className="settings-content-grid voice-settings-grid">
            <SpeechProviderSettingsPanel />
            <AudioTroubleshootingPanel />
          </div>
        )
      case 'floating':
        return (
          <div className="panel settings-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Floating Window</span>
                <h3>悬浮窗设置</h3>
              </div>
            </div>
            <div className="settings-placeholder-grid">
              <div className="settings-placeholder-card">
                <strong>临场显示</strong>
                <span>悬浮窗用于面试时显示当前问题、AI 答案、依据和历史上下文。</span>
              </div>
              <div className="settings-placeholder-card">
                <strong>后续可调</strong>
                <span>建议下一步加入字体大小、答案区比例、透明度、置顶和默认尺寸。</span>
              </div>
              <div className="settings-placeholder-card">
                <strong>当前入口</strong>
                <span>悬浮窗的打开/关闭仍在面试台和快捷键里操作，避免这里重复放按钮。</span>
              </div>
            </div>
          </div>
        )
      case 'keys':
        return (
          <div className="panel settings-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Keyboard Shortcuts</span>
                <h3>快捷键设置</h3>
              </div>
            </div>
            <ShortcutGrid />
          </div>
        )
      case 'privacy':
        return (
          <div className="settings-content-grid two-columns">
            <PrivacySettingsPanel />
            <div className="panel settings-panel backup-settings-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Backup & Restore</span>
                  <h3>备份与恢复</h3>
                </div>
              </div>
              <SettingsBackupPanel
                backupImportRef={backupImportRef}
                backupStatus={backupStatus}
                onBackupImportChange={onBackupImportChange}
                onExportBackup={onExportBackup}
                onOpenBackupImporter={onOpenBackupImporter}
              />
            </div>
          </div>
        )
      case 'training':
        return (
          <div className="panel settings-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">Training Defaults</span>
                <h3>模拟训练设置</h3>
              </div>
            </div>
            <div className="settings-placeholder-grid">
              <div className="settings-placeholder-card">
                <strong>训练题数</strong>
                <span>当前训练页已支持 10 / 15 / 20 题选择，适合线上面试前快速练习。</span>
              </div>
              <div className="settings-placeholder-card">
                <strong>参考答案</strong>
                <span>训练答案会参考候选人简历、岗位 JD 和 AI 优化结果，避免只背模板。</span>
              </div>
              <div className="settings-placeholder-card">
                <strong>后续可调</strong>
                <span>建议加入默认题数、默认训练模板、低分自动进错题本和复盘阈值。</span>
              </div>
            </div>
          </div>
        )
      case 'background':
        return (
          <div className="settings-content-grid two-columns">
            <div className="settings-content-stack">
              <BackgroundPrepPreviewPanel />
              <BackgroundPrepConsistencyReport />
            </div>
            <BackgroundPrepResultPreview />
          </div>
        )
      case 'diag':
        return (
          <div className="settings-content-grid two-columns">
            <div className="settings-content-stack">
              <AboutDiagnosticsPanel />
              <HelpQuickLinksPanel />
            </div>
            <FAQPanel />
          </div>
        )
      case 'updates':
      default:
        return <UpdateLogPanel />
    }
  }

  return (
    <section className="settings-page">
      <aside className="settings-section-index" aria-label="设置模块导航" data-onboarding-target="settings-map">
        <div className="settings-section-index-header">
          <span className="eyebrow">Settings Map</span>
          <h3>设置目录</h3>
          <p>按场景管理配置，右侧只展示当前模块。</p>
        </div>
        {SETTINGS_SECTIONS.map((section) => (
          <button
            className={`settings-section-pill ${activeSection === section.id ? 'active' : ''}`}
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            type="button"
          >
            <span className="settings-section-icon">
              <section.icon size={16} />
            </span>
            <span className="settings-section-copy">
              <strong>{section.label}</strong>
              <small>{section.desc}</small>
            </span>
            {activeSection === section.id && <span className="settings-section-current">当前</span>}
          </button>
        ))}
      </aside>
      <div className="settings-active-page">
        <div className="settings-active-heading">
          <div>
            <span className="eyebrow">Settings Center</span>
            <h3>{activeMeta.label}</h3>
          </div>
          <div className="settings-active-meta">
            <p>{activeMeta.desc}</p>
            <span>本机配置</span>
            <span>保存后生效</span>
          </div>
        </div>
        <div className="settings-active-body">
          <OnboardingProgressPanel />
          {renderActiveSection()}
        </div>
      </div>
    </section>
  )
}

