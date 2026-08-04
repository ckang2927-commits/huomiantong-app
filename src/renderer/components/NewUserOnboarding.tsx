import { ArrowRight, BookOpen, Brain, BriefcaseBusiness, CheckCircle2, CircleHelp, FileAudio, FileText, Flame, LayoutDashboard, Lightbulb, Map, MessageSquareText, Mic, Settings, ShieldCheck, SkipForward, Sparkles, Target, UserRound, UsersRound, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { recordDiagnosticLog } from '../lib/diagnosticLog'
import type { ViewId } from '../lib/appHelpers'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useUIStore } from '../stores/useUIStore'

const ONBOARDING_DONE_KEY = 'huomiantong:onboarding-v2-done'
const START_ONBOARDING_EVENT = 'huomiantong:start-onboarding'

type SettingsSection = 'api' | 'voice' | 'updates'

type TourStep = {
  id: string
  title: string
  summary: string
  detail: string
  icon: typeof Sparkles
  targetView: ViewId
  targetSelector: string
  settingsSection?: SettingsSection
}

const tourSteps: TourStep[] = [
  {
    id: 'sidebar',
    title: '这是你的面试工作台地图',
    summary: '左侧导航负责切换获面通的所有核心模块。',
    detail: '从上到下可以找到实时面试台、训练与拟真面试、简历资料、会话复盘、帮助中心和设置中心。后面每一步我会带你快速认识这些区域。',
    icon: Map,
    targetView: 'workspace',
    targetSelector: '[data-onboarding-target="sidebar"]'
  },
  {
    id: 'topbar',
    title: '顶部状态栏',
    summary: '这里查看当前语音和回答模型是否可用。',
    detail: '顶部状态会告诉你语音转写、回答模型和当前页面。遇到配置问题时，点击状态胶囊可以回到设置中心排查。',
    icon: LayoutDashboard,
    targetView: 'workspace',
    targetSelector: '[data-onboarding-target="topbar"]'
  },
  {
    id: 'workspace',
    title: '实时模拟面试台',
    summary: '把面试官的问题转成文字，并即时生成回答依据。',
    detail: '面试时主要使用这里：左侧接收转写和问题，中央查看 AI 回答，右侧检查简历依据、风险和队列。你也可以手动输入问题，不依赖麦克风。',
    icon: Mic,
    targetView: 'workspace',
    targetSelector: '[data-onboarding-target="workspace"]'
  },
  {
    id: 'workspace-candidate',
    title: '当前候选人',
    summary: '这里显示本轮面试正在使用哪一份候选人资料。',
    detail: '回答会优先参考当前候选人的正式简历、详细简历和其他材料。点击这块区域会直接跳到简历库的“姓名”字段，方便你切换或补充候选人信息。',
    icon: UserRound,
    targetView: 'workspace',
    targetSelector: '[data-onboarding-target="workspace-candidate"]'
  },
  {
    id: 'workspace-role',
    title: '目标岗位',
    summary: '这里决定回答要围绕哪个岗位来组织。',
    detail: '目标岗位会影响问题理解、回答重点和表达方式。点击这块区域会跳到简历库的“目标岗位”字段，并闪烁定位，避免用户误以为岗位只能在别处修改。',
    icon: BriefcaseBusiness,
    targetView: 'workspace',
    targetSelector: '[data-onboarding-target="workspace-role"]'
  },
  {
    id: 'workspace-transcript',
    title: '实时转写',
    summary: '面试官的声音会在这里变成可读的文字问题。',
    detail: '开始麦克风或电脑音频转写后，最新内容会出现在这里。转写结果会被整理成当前问题；如果现场不方便录音，也可以直接在问题输入框里手动粘贴或输入。',
    icon: MessageSquareText,
    targetView: 'workspace',
    targetSelector: '[data-onboarding-target="workspace-transcript"]'
  },
  {
    id: 'workspace-answer',
    title: 'AI 建议回答',
    summary: '这里给出基于简历和当前问题的可直接组织答案。',
    detail: '答案会尽量引用你的真实经历，并按结论、依据、行动和结果组织。生成中的内容会先显示等待状态，模型不可用时也会给出本地兜底提示，不会让页面一直空白。',
    icon: Sparkles,
    targetView: 'workspace',
    targetSelector: '[data-onboarding-target="workspace-answer"]'
  },
  {
    id: 'workspace-strategy',
    title: '回答策略',
    summary: '这里提醒你当前回答的证据、风险和表达策略。',
    detail: '回答前先看这里的风险提示和依据覆盖情况：它能帮助你发现回答是否超出了简历事实、是否需要补充数据，以及应该采用简洁、结构化还是澄清式表达。',
    icon: Lightbulb,
    targetView: 'workspace',
    targetSelector: '[data-onboarding-target="workspace-strategy"]'
  },
  {
    id: 'workspace-audio-settings',
    title: '语音设置',
    summary: '这里控制麦克风、电脑音频和实时转写状态。',
    detail: '需要转写面试官声音时，在这里选择音频来源并开始或暂停监听。遇到没有文字、权限被拒绝或设备不对时，先看这里的状态和错误提示。',
    icon: Volume2,
    targetView: 'workspace',
    targetSelector: '[data-onboarding-target="workspace-audio-settings"]'
  },
  {
    id: 'workspace-warmup',
    title: '面试预热题目',
    summary: '这里生成一批本轮面试前可以先熟悉的题目和回答素材。',
    detail: '预热题目不是当前正在进行的面试问题，所以它们不能像实时问题一样直接点开回答。你可以选择题量，生成或继续生成预热内容；它会作为面试前的准备材料和回答方向参考。',
    icon: Flame,
    targetView: 'workspace',
    targetSelector: '[data-onboarding-target="workspace-warmup"]'
  },
  {
    id: 'training',
    title: '模拟训练',
    summary: '适合先刷题、练表达、看点评和复盘。',
    detail: '你可以选择训练类型和题量，完成一轮后查看参考答案、回答点评、薄弱点和训练趋势。没有 API Key 时也能使用本地兜底题库。',
    icon: Brain,
    targetView: 'training',
    targetSelector: '[data-onboarding-target="training"]'
  },
  {
    id: 'realistic-interview',
    title: '拟真面试',
    summary: '按真实线上面试节奏，由 AI 面试官提问和播报。',
    detail: '这里可以选择面试题数、难度、侧重点和面试官声音，支持语音作答、自动追问和整场复盘。建议先完成一轮模拟训练，再来挑战拟真面试。',
    icon: UsersRound,
    targetView: 'realisticInterview',
    targetSelector: '[data-onboarding-target="realistic"]'
  },
  {
    id: 'checkup',
    title: '面试前作战室',
    summary: '开面试前先做一次全局体检。',
    detail: '作战室会检查候选人资料、回答模型、语音服务商、麦克风、电脑音频和悬浮窗等关键条件，减少临场才发现配置没完成的情况。',
    icon: ShieldCheck,
    targetView: 'checkup',
    targetSelector: '[data-onboarding-target="checkup"]'
  },
  {
    id: 'resume',
    title: '简历知识库',
    summary: '这里是 AI 回答的事实来源。',
    detail: '正式简历负责事实边界，万字简历和其他材料负责补充项目细节。支持多个候选人档案，切换候选人后，面试台和训练都会使用对应资料。',
    icon: FileText,
    targetView: 'resume',
    targetSelector: '[data-onboarding-target="resume"]'
  },
  {
    id: 'sessions',
    title: '历史会话',
    summary: '保存和回看每次面试过程。',
    detail: '这里可以查看问题、回答、转写和依据，支持筛选候选人、导出 Markdown/Word，并把薄弱问题转成下一轮专项训练。',
    icon: FileAudio,
    targetView: 'sessions',
    targetSelector: '[data-onboarding-target="sessions"]'
  },
  {
    id: 'interview-review',
    title: '面试复盘',
    summary: '上传真实录音，拆问题并分析回答质量。',
    detail: '复盘模块适合面试结束后使用：上传录音，编辑转写和说话人，再生成问题清单、本地报告、AI 深度报告和口语化优化话术。',
    icon: CheckCircle2,
    targetView: 'interviewReview',
    targetSelector: '[data-onboarding-target="interview-review"]'
  },
  {
    id: 'help',
    title: '帮助中心',
    summary: '遇到问题时，先在这里搜索。',
    detail: '帮助中心会搜索语音、API、简历、训练、拟真面试、更新和总计划等本地文档。优先输入按钮名称、错误码或页面名称，通常更容易命中答案。',
    icon: CircleHelp,
    targetView: 'help',
    targetSelector: '[data-onboarding-target="help"]'
  },
  {
    id: 'settings-map',
    title: '设置中心总目录',
    summary: '所有配置都集中在这里管理。',
    detail: '设置中心按场景拆成 API 模型、回答风格、语音转写、悬浮窗、快捷键、隐私安全、训练、背景资料、诊断日志和更新日志，右侧只显示当前模块。',
    icon: Settings,
    targetView: 'settings',
    targetSelector: '[data-onboarding-target="settings-map"]'
  },
  {
    id: 'settings-api',
    title: 'API 模型配置',
    summary: '回答模型和 API Key 在这里配置。',
    detail: '先配置 DeepSeek 或其他回答模型，保存后测试连接。这里也能管理模型名称、Base URL、预算和用量。没有 Key 时，训练仍可使用本地兜底。',
    icon: Target,
    targetView: 'settings',
    targetSelector: '[data-onboarding-target="settings-api"]',
    settingsSection: 'api'
  },
  {
    id: 'settings-voice',
    title: '语音转写配置',
    summary: '麦克风、电脑音频和转写服务在这里管理。',
    detail: '需要自动把面试官声音转成文字时，配置 Deepgram 等语音服务商；这里还能选择麦克风、电脑音频来源和断句策略，并查看权限或连接问题。',
    icon: Mic,
    targetView: 'settings',
    targetSelector: '[data-onboarding-target="settings-voice"]',
    settingsSection: 'voice'
  },
  {
    id: 'settings-updates',
    title: '更新日志',
    summary: '查看版本变化并控制软件更新。',
    detail: '这里可以查看历代版本、发布时间和本次待发布内容。检查更新只负责检查，下载和重启安装都需要你明确点击确认。',
    icon: BookOpen,
    targetView: 'settings',
    targetSelector: '[data-onboarding-target="settings-updates"]',
    settingsSection: 'updates'
  }
]

function hasUsefulUserData(): boolean {
  const settings = useSettingsStore.getState().settings
  const hasAnswerKey = Boolean(
    settings.providers.deepseek.apiKey ||
      settings.providers.dashscope.apiKey ||
      settings.providers.openai.apiKey ||
      settings.providers.anthropic.apiKey
  )
  const hasSpeechKey = Object.values(settings.speech.providers).some((provider) => provider.apiKey.trim().length > 0)
  const hasResume = Boolean(
    settings.resume.candidateName.trim() ||
      settings.resume.formalResume.trim() ||
      settings.resume.detailedResume.trim() ||
      (settings.resume.otherResumes?.length ?? 0) > 0
  )

  return hasAnswerKey || hasSpeechKey || hasResume
}

function openSettingsSection(section?: SettingsSection): void {
  if (!section) return

  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent('huomiantong:settings-section', { detail: { section } }))
  }, 80)
}

function getTourCardStyle(rect: DOMRect | null): CSSProperties {
  const cardWidth = Math.min(390, window.innerWidth - 32)
  const cardHeight = 340

  if (!rect) {
    return {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)'
    }
  }

  const gap = 20
  const preferredTop = rect.bottom + gap
  const top = preferredTop + cardHeight <= window.innerHeight - 16 ? preferredTop : Math.max(16, rect.top - cardHeight - gap)
  const left = Math.min(
    Math.max(16, rect.left + rect.width / 2 - cardWidth / 2),
    Math.max(16, window.innerWidth - cardWidth - 16)
  )

  return {
    left,
    top,
    width: cardWidth
  }
}

export function startNewUserOnboarding(): void {
  window.dispatchEvent(new Event(START_ONBOARDING_EVENT))
}

export function NewUserOnboarding(): JSX.Element | null {
  const [open, setOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const setActiveView = useUIStore((state) => state.setActiveView)
  const step = tourSteps[stepIndex]
  const progressText = `${stepIndex + 1} / ${tourSteps.length}`

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!localStorage.getItem(ONBOARDING_DONE_KEY) && !hasUsefulUserData()) {
        setOpen(true)
      }
    }, 1000)

    const handleStart = (): void => {
      setStepIndex(0)
      setTargetRect(null)
      setOpen(true)
    }

    window.addEventListener(START_ONBOARDING_EVENT, handleStart)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener(START_ONBOARDING_EVENT, handleStart)
    }
  }, [])

  useEffect(() => {
    if (!open || !step) {
      setTargetRect(null)
      return undefined
    }

    setActiveView(step.targetView)
    openSettingsSection(step.settingsSection)
    let cancelled = false
    let attempts = 0
    let retryTimer = 0

    const measure = (): void => {
      if (cancelled) return
      const target = document.querySelector<HTMLElement>(step.targetSelector)

      if (!target) {
        attempts += 1
        if (attempts < 18) {
          retryTimer = window.setTimeout(measure, 80)
        }
        return
      }

      target.scrollIntoView({ behavior: attempts > 0 ? 'smooth' : 'auto', block: 'center', inline: 'nearest' })
      window.requestAnimationFrame(() => {
        if (!cancelled) {
          setTargetRect(target.getBoundingClientRect())
        }
      })
    }

    const refresh = (): void => {
      const target = document.querySelector<HTMLElement>(step.targetSelector)
      if (target) {
        setTargetRect(target.getBoundingClientRect())
      }
    }

    measure()
    window.addEventListener('resize', refresh)
    document.addEventListener('scroll', refresh, true)
    return () => {
      cancelled = true
      window.clearTimeout(retryTimer)
      window.removeEventListener('resize', refresh)
      document.removeEventListener('scroll', refresh, true)
    }
  }, [open, setActiveView, step])

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        skip()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, stepIndex])

  function skip(): void {
    localStorage.setItem(ONBOARDING_DONE_KEY, 'true')
    setOpen(false)
    setTargetRect(null)
    recordDiagnosticLog({
      severity: 'info',
      category: 'system',
      source: '漫游式新手引导',
      title: '用户跳过新手引导',
      message: `跳过第 ${stepIndex + 1}/${tourSteps.length} 步`
    })
  }

  function next(): void {
    if (stepIndex >= tourSteps.length - 1) {
      localStorage.setItem(ONBOARDING_DONE_KEY, 'true')
      setOpen(false)
      setTargetRect(null)
      recordDiagnosticLog({
        severity: 'success',
        category: 'system',
        source: '漫游式新手引导',
        title: '用户完成新手引导',
        message: `完成 ${tourSteps.length} 步漫游介绍`
      })
      return
    }

    setTargetRect(null)
    setStepIndex((current) => current + 1)
  }

  const spotlightStyle = useMemo<CSSProperties | null>(() => {
    if (!targetRect) return null

    return {
      left: Math.max(8, targetRect.left - 8),
      top: Math.max(8, targetRect.top - 8),
      width: Math.min(window.innerWidth - 16, targetRect.width + 16),
      height: Math.min(window.innerHeight - 16, targetRect.height + 16)
    }
  }, [targetRect])

  if (!open) return null

  return (
    <div className="onboarding-tour-root" role="presentation">
      <div className={`onboarding-tour-blocker ${targetRect ? '' : 'locating'}`} aria-hidden="true" />
      {spotlightStyle && <div className="onboarding-tour-spotlight" style={spotlightStyle} aria-hidden="true" />}
      <section
        className={`onboarding-tour-card ${targetRect ? '' : 'is-locating'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-tour-title"
        style={getTourCardStyle(targetRect)}
      >
        <div className="onboarding-tour-topline">
          <span className="onboarding-tour-kicker"><Sparkles size={14} />漫游式新手引导</span>
          <button className="onboarding-tour-skip-icon" type="button" aria-label="跳过新手引导" title="跳过引导" onClick={skip}>
            <SkipForward size={16} />
          </button>
        </div>

        <div className="onboarding-tour-progress">
          <span>{progressText}</span>
          <div aria-hidden="true"><i style={{ width: `${((stepIndex + 1) / tourSteps.length) * 100}%` }} /></div>
        </div>

        <div className="onboarding-tour-heading">
          <span className="onboarding-tour-icon"><step.icon size={21} /></span>
          <div>
            <span className="onboarding-tour-step-label">快速了解</span>
            <h3 id="onboarding-tour-title">{step.title}</h3>
          </div>
        </div>

        <p className="onboarding-tour-summary">{step.summary}</p>
        <div className="onboarding-tour-detail">
          <span><BookOpen size={14} />详细说明</span>
          <p>{step.detail}</p>
        </div>

        {!targetRect && <p className="onboarding-tour-locating">正在定位当前模块...</p>}

        <div className="onboarding-tour-actions">
          <button className="ghost-button compact" type="button" onClick={skip}>
            跳过引导
          </button>
          <button className="primary-button compact" type="button" onClick={next}>
            {stepIndex === tourSteps.length - 1 ? '完成引导' : '下一步'}
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  )
}
