import { ArrowRight, CheckCircle2, Circle, GraduationCap, KeyRound, Mic, PlayCircle, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ProviderId, ProviderTestResult } from '../../../shared/types'
import { getOnboardingTasks, subscribeOnboardingProgress, type OnboardingTask } from '../../lib/onboardingProgress'
import { useSettingsStore } from '../../stores/useSettingsStore'
import { useUIStore } from '../../stores/useUIStore'

const iconMap = {
  'answer-api': KeyRound,
  'speech-api': Mic,
  resume: Upload,
  training: GraduationCap,
  'realistic-interview': PlayCircle
} as const

export function OnboardingProgressPanel(): JSX.Element {
  const settings = useSettingsStore((state) => state.settings)
  const providerTests = useSettingsStore((state) => state.providerTests)
  const setActiveView = useUIStore((state) => state.setActiveView)
  const [refreshKey, setRefreshKey] = useState(0)
  const tasks = useMemo(() => getOnboardingTasks(settings, providerTests), [providerTests, refreshKey, settings])
  const completedCount = tasks.filter((task) => task.done).length

  useEffect(() => subscribeOnboardingProgress(() => setRefreshKey((value) => value + 1)), [])

  function openTask(task: OnboardingTask): void {
    setActiveView(task.view)
    if (task.settingsSection) {
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent('huomiantong:settings-section', { detail: { section: task.settingsSection } }))
      }, 80)
    }
  }

  return (
    <section className="panel settings-panel onboarding-progress-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Getting Started</span>
          <h3>新手任务进度</h3>
          <p>完成这些小步骤，就能把获面通的核心流程跑通。进度只保存在本机。</p>
        </div>
        <span className="onboarding-progress-count">{completedCount}/{tasks.length}</span>
      </div>

      <div className="onboarding-progress-track" aria-label={`已完成 ${completedCount} 项，共 ${tasks.length} 项`}>
        <span style={{ width: `${(completedCount / tasks.length) * 100}%` }} />
      </div>

      <div className="onboarding-task-list">
        {tasks.map((task) => {
          const Icon = iconMap[task.id]
          return (
            <button className={`onboarding-task-row ${task.done ? 'done' : ''}`} key={task.id} onClick={() => openTask(task)} type="button">
              <span className="onboarding-task-icon"><Icon size={16} /></span>
              <span className="onboarding-task-copy">
                <strong>{task.label}</strong>
                <small>{task.done ? task.detail : `${task.description} · ${task.detail}`}</small>
              </span>
              <span className={`onboarding-task-status ${task.done ? 'done' : 'pending'}`}>
                {task.done ? <CheckCircle2 size={17} /> : <Circle size={17} />}
              </span>
              <ArrowRight size={15} className="onboarding-task-arrow" />
            </button>
          )
        })}
      </div>
    </section>
  )
}
