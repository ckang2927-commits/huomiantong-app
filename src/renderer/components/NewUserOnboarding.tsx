import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, KeyRound, Mic, PlayCircle, Settings, Sparkles, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useUIStore } from '../stores/useUIStore'

const ONBOARDING_DONE_KEY = 'huomiantong:onboarding-v1-done'
const START_ONBOARDING_EVENT = 'huomiantong:start-onboarding'

const deepseekApiKeyUrl = 'https://platform.deepseek.com/api_keys'
const deepseekDocsUrl = 'https://api-docs.deepseek.com/zh-cn/'
const deepgramConsoleUrl = 'https://console.deepgram.com/'
const deepgramDocsUrl = 'https://developers.deepgram.com/docs/stt/getting-started'

type OnboardingStep = {
  id: string
  eyebrow: string
  title: string
  body: string
  icon: typeof Sparkles
  primaryLabel?: string
  secondaryLabel?: string
  targetView?: 'workspace' | 'settings' | 'resume' | 'realisticInterview' | 'training'
  settingsSection?: 'api' | 'voice'
}

const formalSteps: OnboardingStep[] = [
  {
    id: 'answer-api',
    eyebrow: 'Step 1',
    title: '先配置回答模型',
    body: '生成面试回答至少需要一个大模型 Key。新手建议先用 DeepSeek：注册后创建 API Key，复制回来粘贴到设置页。',
    icon: KeyRound,
    primaryLabel: '去填写 DeepSeek Key',
    secondaryLabel: '打开 DeepSeek 申请页',
    targetView: 'settings',
    settingsSection: 'api'
  },
  {
    id: 'speech-api',
    eyebrow: 'Step 2',
    title: '需要转写时再配语音 Key',
    body: '如果要把面试官声音自动转成文字，就配置 Deepgram。只想手动输入问题，可以先跳过这一步。',
    icon: Mic,
    primaryLabel: '去填写 Deepgram Key',
    secondaryLabel: '打开 Deepgram 控制台',
    targetView: 'settings',
    settingsSection: 'voice'
  },
  {
    id: 'resume',
    eyebrow: 'Step 3',
    title: '导入你的简历',
    body: '回答质量主要看简历资料。先导入正式简历，后面再补充万字简历和项目材料。',
    icon: Upload,
    primaryLabel: '去简历库',
    targetView: 'resume'
  },
  {
    id: 'voice',
    eyebrow: 'Step 4',
    title: '试听面试官声音',
    body: '拟真面试里可以选择小雅、华妍、朝文三套本地声音。先试听，再开始练临场感。',
    icon: PlayCircle,
    primaryLabel: '去拟真面试',
    targetView: 'realisticInterview'
  },
  {
    id: 'start',
    eyebrow: 'Ready',
    title: '现在可以开始练习了',
    body: '推荐先用模拟训练刷 5 到 10 题，再进入拟真面试。以后也可以在设置里重新打开这个引导。',
    icon: CheckCircle2,
    primaryLabel: '开始模拟训练',
    targetView: 'training'
  }
]

const previewSteps: OnboardingStep[] = [
  {
    id: 'preview',
    eyebrow: 'Preview',
    title: '先看一眼软件能做什么',
    body: '没有 API 也可以先逛一遍：看题库、看拟真面试声音、看简历库入口。正式生成回答时再回来配置 DeepSeek。',
    icon: Sparkles,
    primaryLabel: '去拟真面试试听',
    secondaryLabel: '打开 DeepSeek 申请页',
    targetView: 'realisticInterview'
  },
  {
    id: 'preview-api',
    eyebrow: 'Next',
    title: '准备认真使用时配置 API',
    body: '回答生成用 DeepSeek 或其他大模型，语音转文字用 Deepgram。两个入口都放在设置页里。',
    icon: Settings,
    primaryLabel: '去 API 设置',
    secondaryLabel: '打开 Deepgram 控制台',
    targetView: 'settings',
    settingsSection: 'api'
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

function openSettingsSection(section?: 'api' | 'voice'): void {
  if (!section) return

  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent('huomiantong:settings-section', { detail: { section } }))
  }, 80)
}

function openExternal(url: string): void {
  void window.huomiantong.openExternal(url)
}

export function startNewUserOnboarding(): void {
  window.dispatchEvent(new Event(START_ONBOARDING_EVENT))
}

export function NewUserOnboarding(): JSX.Element | null {
  const [open, setOpen] = useState(false)
  const [paused, setPaused] = useState(false)
  const [mode, setMode] = useState<'formal' | 'preview' | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const setActiveView = useUIStore((state) => state.setActiveView)
  const steps = useMemo(() => (mode === 'preview' ? previewSteps : formalSteps), [mode])
  const step = steps[stepIndex]

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!localStorage.getItem(ONBOARDING_DONE_KEY) && !hasUsefulUserData()) {
        setOpen(true)
      }
    }, 1000)
    const handleStart = (): void => {
      setMode(null)
      setStepIndex(0)
      setPaused(false)
      setOpen(true)
    }

    window.addEventListener(START_ONBOARDING_EVENT, handleStart)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener(START_ONBOARDING_EVENT, handleStart)
    }
  }, [])

  const close = (): void => {
    localStorage.setItem(ONBOARDING_DONE_KEY, 'true')
    setPaused(false)
    setOpen(false)
  }

  const startMode = (nextMode: 'formal' | 'preview'): void => {
    setMode(nextMode)
    setStepIndex(0)
    setPaused(false)
  }

  const goTarget = (pauseAfterNavigation = true): void => {
    if (!step?.targetView) return

    setActiveView(step.targetView)
    openSettingsSection(step.settingsSection)
    if (pauseAfterNavigation) {
      setOpen(false)
      setPaused(true)
    }
  }

  const resume = (): void => {
    setPaused(false)
    setOpen(true)
  }

  const next = (): void => {
    if (stepIndex >= steps.length - 1) {
      close()
      goTarget(false)
      return
    }

    setStepIndex((current) => current + 1)
  }

  if (!open && !paused) return null

  if (!open && paused) {
    return (
      <div className="onboarding-resume-bar" role="status">
        <Sparkles size={16} />
        <span>新手引导已暂存，完成当前操作后可以继续。</span>
        <button className="primary-button compact" type="button" onClick={resume}>继续引导</button>
        <button className="icon-button" type="button" aria-label="结束新手引导" title="结束引导" onClick={close}>
          <X size={16} />
        </button>
      </div>
    )
  }

  if (!mode) {
    return (
      <div className="onboarding-backdrop" role="presentation">
        <section className="onboarding-card onboarding-welcome" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
          <button className="icon-button onboarding-close" type="button" aria-label="关闭新手引导" title="关闭" onClick={close}>
            <X size={18} />
          </button>
          <span className="eyebrow">Welcome</span>
          <h3 id="onboarding-title">先用 2 分钟把获面通跑起来</h3>
          <p>不用看长说明。你可以先体验，也可以直接配置 API 后正式使用。</p>
          <div className="onboarding-choice-grid">
            <button className="onboarding-choice-card primary" type="button" onClick={() => startMode('formal')}>
              <KeyRound size={22} />
              <strong>我要正式配置</strong>
              <span>配置 DeepSeek、Deepgram、简历和声音。</span>
            </button>
            <button className="onboarding-choice-card" type="button" onClick={() => startMode('preview')}>
              <Sparkles size={22} />
              <strong>我先体验一下</strong>
              <span>先看看页面和本地声音，再回来填 Key。</span>
            </button>
          </div>
          <button className="ghost-button compact" type="button" onClick={close}>我是老用户，直接进入</button>
        </section>
      </div>
    )
  }

  return (
    <div className="onboarding-backdrop" role="presentation">
      <section className="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboarding-step-title">
        <button className="icon-button onboarding-close" type="button" aria-label="关闭新手引导" title="关闭" onClick={close}>
          <X size={18} />
        </button>

        <div className="onboarding-progress" aria-label="新手引导进度" style={{ '--step-count': steps.length } as CSSProperties}>
          {steps.map((item, index) => (
            <span className={index <= stepIndex ? 'active' : ''} key={item.id} />
          ))}
        </div>

        <div className="onboarding-step-head">
          <span className="onboarding-step-icon">
            <step.icon size={22} />
          </span>
          <div>
            <span className="eyebrow">{step.eyebrow}</span>
            <h3 id="onboarding-step-title">{step.title}</h3>
          </div>
        </div>

        <p className="onboarding-body">{step.body}</p>

        {(step.id === 'answer-api' || step.id === 'preview') && (
          <div className="onboarding-link-panel">
            <strong>DeepSeek 申请入口</strong>
            <span>打开网页后注册/登录，进入 API Keys，创建 Key 后复制回来。</span>
            <div>
              <button className="ghost-button compact" type="button" onClick={() => openExternal(deepseekApiKeyUrl)}>
                <ExternalLink size={14} />
                API Key 页面
              </button>
              <button className="ghost-button compact" type="button" onClick={() => openExternal(deepseekDocsUrl)}>
                <ExternalLink size={14} />
                官方文档
              </button>
            </div>
          </div>
        )}

        {(step.id === 'speech-api' || step.id === 'preview-api') && (
          <div className="onboarding-link-panel">
            <strong>Deepgram 申请入口</strong>
            <span>打开 Console 后创建 API Key，复制回来粘贴到语音转写设置。</span>
            <div>
              <button className="ghost-button compact" type="button" onClick={() => openExternal(deepgramConsoleUrl)}>
                <ExternalLink size={14} />
                Deepgram Console
              </button>
              <button className="ghost-button compact" type="button" onClick={() => openExternal(deepgramDocsUrl)}>
                <ExternalLink size={14} />
                转写教程
              </button>
            </div>
          </div>
        )}

        {step.primaryLabel && (
          <button className="onboarding-focus-button" type="button" onClick={() => goTarget()}>
            {step.primaryLabel}
            <ArrowRight size={16} />
          </button>
        )}

        {step.secondaryLabel && (
          <button
            className="ghost-button compact onboarding-secondary-action"
            type="button"
            onClick={() => openExternal(step.id === 'speech-api' || step.id === 'preview-api' ? deepgramConsoleUrl : deepseekApiKeyUrl)}
          >
            <ExternalLink size={14} />
            {step.secondaryLabel}
          </button>
        )}

        <div className="onboarding-actions">
          <button className="ghost-button compact" type="button" disabled={stepIndex === 0} onClick={() => setStepIndex((current) => Math.max(0, current - 1))}>
            <ArrowLeft size={14} />
            上一步
          </button>
          <button className="primary-button compact" type="button" onClick={next}>
            {stepIndex >= steps.length - 1 ? '完成引导' : '下一步'}
            <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </div>
  )
}
