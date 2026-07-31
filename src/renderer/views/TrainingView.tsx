import { Download, Loader2, Mic, PlayCircle, RotateCcw, Save, SendHorizontal, Square, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Radio } from 'lucide-react'
import { BarChart3, CheckCircle2, ChevronRight, ClipboardList } from 'lucide-react'
import { SpeechExpressionPanel } from '../components/training/SpeechExpressionPanel'
import { TrainingQuestionBankPanel } from '../components/training/TrainingQuestionBankPanel'
import { TrainingReviewInsights } from '../components/training/TrainingReviewInsights'
import { TrainingTrendDashboard } from '../components/training/TrainingTrendDashboard'
import { TrainingPresetPanel } from '../components/training/TrainingPresetPanel'
import { RealisticInterviewReportPreview } from '../components/training/RealisticInterviewReportPreview'
import { useSpeechPlayback } from '../hooks/useSpeechPlayback'
import { useTrainingQuestionBank } from '../hooks/useTrainingQuestionBank'
import type { TranscriptionSessionStats } from '../lib/audio/audioTypes'
import { isTrainingAnswerCompletionCue, stripTrainingAnswerCompletionCue } from '../lib/trainingAnswerCompletion'
import { analyzeSpeechExpression } from '../lib/speechExpressionAnalyzer'
import { buildTrainingWeaknessInsights, type TrainingFocusPlan } from '../lib/trainingInsights'
import type { TrainingQuestionBankItem } from '../lib/trainingQuestionBankStore'
import type { TrainingTrendEntry } from '../lib/trainingTrendStore'
import { trainingModeLabels } from '../../shared/trainingOptions'
import type {
  AppSettings,
  SpeechExpressionScore,
  TrainingMode,
  TrainingPreset,
  TrainingQuestionCount,
  TrainingRound
} from '../../shared/types'

const questionCountOptions: TrainingQuestionCount[] = [10, 15, 20]
type TrainingPhase = 'setup' | 'practice' | 'review'

type TrainingViewProps = {
  settings: AppSettings
  trainingMode: TrainingMode
  roundCount: TrainingQuestionCount
  rounds: TrainingRound[]
  trainingTrendEntries: TrainingTrendEntry[]
  currentAnswer: string
  answerInterimTranscript: string
  answerSpeechStats: TranscriptionSessionStats | null
  answerTranscriptError: string
  finalReport: string
  answeredCount: number
  isAnswerTranscribing: boolean
  isGeneratingTraining: boolean
  isSavingTraining: boolean
  canPersistTraining: boolean
  hasTrainingDraft: boolean
  lastProvider: string
  lastLatencyMs: number
  lastSavedAt: number
  draftSavedAt: number
  autoRestoredDraftAt: number
  onTrainingModeChange: (mode: TrainingMode) => void
  onRoundCountChange: (count: TrainingQuestionCount) => void
  onCurrentAnswerChange: (value: string) => void
  onStartTraining: () => void | Promise<void>
  onStartTrainingPreset: (preset: TrainingPreset) => void | Promise<void>
  onStartFocusedTraining: (plan: TrainingFocusPlan) => void | Promise<void>
  onSaveCustomTrainingPresets: (presets: TrainingPreset[]) => void | Promise<void>
  onSubmitAnswer: (answerText?: string, speechScore?: SpeechExpressionScore) => void | Promise<void>
  onFinishAnswer: (answerText?: string, speechScore?: SpeechExpressionScore) => void | Promise<void>
  onResetTraining: () => void
  onSaveTrainingDraft: () => void
  onRestoreTrainingDraft: () => void
  onClearTrainingDraft: () => void
  onClearTrainingTrend: () => void
  onStartAnswerTranscription: () => void | Promise<void>
  onStopAnswerTranscription: () => void
  onSaveTrainingSession: () => void | Promise<void>
  onExportTraining: (format: 'md' | 'word') => void
  onOpenResume: () => void
  onOpenRealisticInterview: () => void
  onOpenSettings: () => void
}

export function TrainingView({
  settings,
  trainingMode,
  roundCount,
  rounds,
  trainingTrendEntries,
  currentAnswer,
  answerInterimTranscript,
  answerSpeechStats,
  answerTranscriptError,
  finalReport,
  answeredCount,
  isAnswerTranscribing,
  isGeneratingTraining,
  isSavingTraining,
  canPersistTraining,
  hasTrainingDraft,
  lastProvider,
  lastLatencyMs,
  lastSavedAt,
  draftSavedAt,
  autoRestoredDraftAt,
  onTrainingModeChange,
  onRoundCountChange,
  onCurrentAnswerChange,
  onStartTraining,
  onStartTrainingPreset,
  onStartFocusedTraining,
  onSaveCustomTrainingPresets,
  onSubmitAnswer,
  onFinishAnswer,
  onResetTraining,
  onSaveTrainingDraft,
  onRestoreTrainingDraft,
  onClearTrainingDraft,
  onClearTrainingTrend,
  onStartAnswerTranscription,
  onStopAnswerTranscription,
  onSaveTrainingSession,
  onExportTraining,
  onOpenResume,
  onOpenRealisticInterview,
  onOpenSettings
}: TrainingViewProps): JSX.Element {
  const activeRound = rounds.find((round) => !round.answer?.trim())
  const speech = useSpeechPlayback()
  const questionBank = useTrainingQuestionBank({ trainingMode, rounds, finalReport })
  const [isSetupOpen, setIsSetupOpen] = useState(true)
  const [isReferenceExpanded, setIsReferenceExpanded] = useState(false)
  const weaknessInsights = useMemo(() => buildTrainingWeaknessInsights(rounds), [rounds])
  const currentSpeechScore = useMemo(
    () =>
      currentAnswer.trim()
        ? analyzeSpeechExpression({
            text: currentAnswer,
            startedAt: answerSpeechStats?.startedAt,
            endedAt: answerSpeechStats?.endedAt,
            finalTranscriptCount: answerSpeechStats?.finalTranscriptCount
          })
        : null,
    [currentAnswer, answerSpeechStats]
  )
  const normalizedAnswerText = currentAnswer.trim()
  const hasActiveTraining = rounds.length > 0 && !finalReport && (Boolean(activeRound) || isGeneratingTraining)
  const progressText = rounds.length ? `${Math.min(answeredCount + (activeRound ? 1 : 0), roundCount)}/${roundCount}` : `0/${roundCount}`
  const activeRoundNumber = activeRound ? rounds.findIndex((round) => round.id === activeRound.id) + 1 : 0
  const trainingPhase: TrainingPhase = finalReport ? 'review' : activeRound || isGeneratingTraining ? 'practice' : 'setup'
  const shouldShowSetupContent = trainingPhase === 'setup' || isSetupOpen
  const phaseTitle =
    trainingPhase === 'setup' ? '准备好再开始，训练效果会更稳定' : trainingPhase === 'practice' ? `正在进行第 ${activeRoundNumber} 题` : '本轮训练完成，可以开始复盘'
  const phaseHint =
    trainingPhase === 'setup'
      ? '先确认候选人、岗位和模拟规则，再进入真实答题。'
      : trainingPhase === 'practice'
        ? '先听清问题，再用口头回答；右侧会同步保留整个训练过程。'
        : '查看回答表现、薄弱点和趋势，把这一轮变成下一轮的练习计划。'
  const resumeReady =
    settings.resume.formalResume.trim().length > 0 ||
    settings.resume.detailedResume.trim().length > 0 ||
    (settings.resume.otherResumes?.length ?? 0) > 0
  const providerConfig = settings.providers[settings.answer.llmProvider]
  const draftHint =
    autoRestoredDraftAt > 0
      ? `已自动恢复上次草稿：${new Date(autoRestoredDraftAt).toLocaleString('zh-CN')}`
      : draftSavedAt > 0
        ? `草稿已自动保存：${new Date(draftSavedAt).toLocaleString('zh-CN')}`
        : '训练过程中会自动保存到本机。'
  const resumeMaterialCount =
    (settings.resume.formalResume.trim() ? 1 : 0) +
    (settings.resume.detailedResume.trim() ? 1 : 0) +
    (settings.resume.otherResumes?.length ?? 0)
  const modelReady = Boolean(providerConfig.enabled && providerConfig.apiKey)
  const voiceReady = speech.isSupported
  const referenceText = activeRound?.referenceAnswer || finalReport || '完成训练后，这里会显示参考答案或最终复盘。'
  const referenceTitle = activeRound ? '当前题参考答案' : finalReport ? '最终复盘' : '训练提示'
  const referenceIsLong = referenceText.length > 420

  useEffect(() => {
    if (speech.autoSpeak && activeRound?.question) {
      speech.speak(activeRound.question)
    }
  }, [activeRound?.id, speech.autoSpeak])

  useEffect(() => {
    setIsReferenceExpanded(false)
  }, [activeRound?.id, finalReport])

  useEffect(() => {
    if (!isAnswerTranscribing || !answerSpeechStats?.lastFinalAt || !normalizedAnswerText) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      if (!isAnswerTranscribing || !normalizedAnswerText) {
        return
      }

      void onFinishAnswer(normalizedAnswerText, currentSpeechScore || undefined)
    }, 3000)

    return () => window.clearTimeout(timeout)
  }, [answerSpeechStats?.lastFinalAt, currentSpeechScore, isAnswerTranscribing, normalizedAnswerText, onFinishAnswer])

  useEffect(() => {
    setIsSetupOpen(!(hasActiveTraining || finalReport))
  }, [finalReport, hasActiveTraining])

  async function startQuestionBankTraining(items: TrainingQuestionBankItem[], label: string): Promise<void> {
    const plan = questionBank.buildFocusedPlan(items, label)

    if (!plan) {
      return
    }

    await onStartFocusedTraining(plan)
  }

  function speakCurrentQuestion(): void {
    if (activeRound?.question) {
      speech.speak(activeRound.question)
    }
  }

  function scrollToTrainingStage(stageId: string): void {
    document.getElementById(stageId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function isStageDone(stage: TrainingPhase): boolean {
    if (trainingPhase === 'review') {
      return stage !== 'review'
    }

    return trainingPhase === 'practice' && stage === 'setup'
  }

  return (
    <section className={`training-layout training-phase-${trainingPhase}`}>
      <div className="training-main panel">
        <div className="panel-heading training-page-heading">
          <div>
            <span className="eyebrow">Mock Interview Training</span>
            <h3>AI 连续模拟面试</h3>
          </div>
          <span className={`status-pill ${trainingPhase === 'practice' ? 'thinking' : trainingPhase === 'review' ? 'success' : 'idle'}`}>
            {trainingPhase === 'practice' ? `进行中 · ${progressText}` : trainingPhase === 'review' ? '训练已完成' : '准备中'}
          </span>
        </div>

        <div className="training-workflow-nav" aria-label="模拟训练流程">
          <button
            className={`training-workflow-step ${trainingPhase === 'setup' ? 'active' : ''} ${isStageDone('setup') ? 'done' : ''}`}
            type="button"
            onClick={() => {
              setIsSetupOpen(true)
              scrollToTrainingStage('training-setup')
            }}
          >
            <span className="training-workflow-icon">
              {isStageDone('setup') ? <CheckCircle2 size={16} /> : <ClipboardList size={16} />}
            </span>
            <span>
              <strong>训练设置</strong>
              <small>候选人 · 规则 · 模式</small>
            </span>
            <ChevronRight size={15} />
          </button>
          <button
            className={`training-workflow-step ${trainingPhase === 'practice' ? 'active' : ''} ${isStageDone('practice') ? 'done' : ''}`}
            type="button"
            onClick={() => scrollToTrainingStage('training-practice')}
          >
            <span className="training-workflow-icon">
              {isStageDone('practice') ? <CheckCircle2 size={16} /> : <Mic size={16} />}
            </span>
            <span>
              <strong>开始训练</strong>
              <small>提问 · 回答 · 点评</small>
            </span>
            <ChevronRight size={15} />
          </button>
          <button
            className={`training-workflow-step ${trainingPhase === 'review' ? 'active' : ''} ${isStageDone('review') ? 'done' : ''}`}
            type="button"
            onClick={() => scrollToTrainingStage('training-review')}
          >
            <span className="training-workflow-icon">
              {isStageDone('review') ? <CheckCircle2 size={16} /> : <BarChart3 size={16} />}
            </span>
            <span>
              <strong>复盘提升</strong>
              <small>趋势 · 薄弱点 · 导出</small>
            </span>
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="training-phase-banner">
          <div>
            <span className="eyebrow">当前阶段</span>
            <strong>{phaseTitle}</strong>
            <p>{phaseHint}</p>
          </div>
          <span className="training-phase-progress">{progressText}</span>
        </div>

        <div className="training-hero">
          <div className="training-hero-profile">
            <span className="eyebrow">Training Brief</span>
            <strong>{settings.resume.profileName || settings.resume.candidateName || '默认候选人'}</strong>
            <span>{settings.resume.targetRole || '未填写目标岗位'}</span>
            <p>训练会结合简历材料、岗位 JD 和本轮回答持续追问，结束后生成复盘报告。</p>
          </div>
          <div className="training-hero-checks">
            <div className={resumeReady ? 'training-check-card ready' : 'training-check-card warning'}>
              <span>资料</span>
              <strong>{resumeReady ? `${resumeMaterialCount || 1} 份已加载` : '待完善'}</strong>
            </div>
            <div className={modelReady ? 'training-check-card ready' : 'training-check-card warning'}>
              <span>模型</span>
              <strong>{modelReady ? settings.answer.llmProvider : '本地兜底'}</strong>
            </div>
            <div className={voiceReady ? 'training-check-card ready' : 'training-check-card warning'}>
              <span>语音</span>
              <strong>{voiceReady ? '可朗读' : '不可用'}</strong>
            </div>
          </div>
          <div className="training-hero-actions">
            <button className="ghost-button compact" type="button" onClick={onOpenResume}>
              去完善简历
            </button>
            <button className="ghost-button compact" type="button" onClick={onOpenSettings}>
              检查模型
            </button>
          </div>
        </div>

        <section className={`training-setup-stage ${shouldShowSetupContent ? 'open' : 'collapsed'}`} id="training-setup">
          <button
            className="training-setup-summary"
            type="button"
            onClick={() => {
              if (trainingPhase !== 'setup') {
                setIsSetupOpen((value) => !value)
              }
            }}
          >
            <span className="training-setup-summary-icon">
              <ClipboardList size={17} />
            </span>
            <span>
              <strong>训练设置</strong>
              <small>{hasActiveTraining ? '本轮训练进行中，设置已锁定；需要时可以展开查看。' : '先选择专项训练模式和题量；完整语音流程已拆到拟真面试。'}</small>
            </span>
            <ChevronRight className="training-setup-summary-chevron" size={17} />
          </button>
          <div className="training-setup-content">
        <section className="training-realistic-entry">
          <div>
            <span className="eyebrow">Realistic Voice Interview</span>
            <h3>真人语音模拟已独立</h3>
            <p>完整线上面试流程、AI 面试官播报、语音作答和最终复盘都放到独立模块里；这里专注题库、错题和专项训练。</p>
          </div>
          <button className="primary-button compact" type="button" onClick={onOpenRealisticInterview}>
            <Radio size={15} />
            进入拟真面试
          </button>
        </section>

        <TrainingPresetPanel
          customPresets={settings.answer.customTrainingPresets || []}
          hasActiveTraining={hasActiveTraining}
          isGeneratingTraining={isGeneratingTraining}
          onSaveCustomPresets={onSaveCustomTrainingPresets}
          onStartTrainingPreset={onStartTrainingPreset}
        />

        <div className="training-config">
          <div>
            <span className="eyebrow">训练类型</span>
            <div className="training-mode-grid">
              {(Object.keys(trainingModeLabels) as TrainingMode[]).map((mode) => (
                <button
                  className={trainingMode === mode ? 'selected' : ''}
                  disabled={isGeneratingTraining || hasActiveTraining}
                  key={mode}
                  onClick={() => onTrainingModeChange(mode)}
                  type="button"
                >
                  <strong>{trainingModeLabels[mode].label}</strong>
                  <span>{trainingModeLabels[mode].hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="training-side-config">
            <span className="eyebrow">问题数量</span>
            <div className="training-count-group">
              {questionCountOptions.map((count) => (
                <button
                  className={roundCount === count ? 'selected' : ''}
                  disabled={isGeneratingTraining || hasActiveTraining}
                  key={count}
                  onClick={() => onRoundCountChange(count)}
                  type="button"
                >
                  {count} 题
                </button>
              ))}
            </div>
            <div className="training-status-card">
              <strong>{providerConfig.enabled && providerConfig.apiKey ? 'AI 模型训练' : '本地兜底训练'}</strong>
              <span>
                当前：{settings.answer.llmProvider}
                {providerConfig.model ? ` / ${providerConfig.model}` : ''}
              </span>
              <p>
                {providerConfig.enabled && providerConfig.apiKey
                  ? '会调用当前回答模型生成追问、点评和复盘。'
                  : '没有 API Key 也能练，系统会使用本地兜底题库和规则点评；配置 Key 后体验更佳。'}
              </p>
            </div>
          </div>
        </div>

        <div className="button-row">
          <button className="primary-button" type="button" onClick={onStartTraining} disabled={isGeneratingTraining}>
            {isGeneratingTraining && rounds.length === 0 ? <Loader2 className="spin" size={16} /> : <PlayCircle size={16} />}
            开始训练
          </button>
          <button className="ghost-button" type="button" onClick={onResetTraining} disabled={isGeneratingTraining}>
            <RotateCcw size={16} />
            重置训练
          </button>
        </div>

        <div className="training-draft-row">
          <span className="eyebrow">训练草稿</span>
          <div className="training-draft-actions">
            <button className="ghost-button compact" type="button" onClick={onSaveTrainingDraft} disabled={!hasActiveTraining && !currentAnswer.trim() && !finalReport.trim()}>
              保存草稿
            </button>
            <button className="ghost-button compact" type="button" onClick={onRestoreTrainingDraft} disabled={!hasTrainingDraft}>
              恢复草稿
            </button>
            <button className="ghost-button compact" type="button" onClick={onClearTrainingDraft} disabled={!hasTrainingDraft}>
              清除草稿
            </button>
          </div>
          <span className="training-save-hint">{draftHint}</span>
        </div>

        {!resumeReady && (
          <div className="training-note">
            兄弟提醒一下：当前候选人简历材料还比较空，训练可以跑，但追问质量会明显下降，建议先导入简历。
          </div>
        )}
          </div>
        </section>

        {activeRound ? (
          <div className="training-question-card training-current-stage" id="training-practice">
            <div className="training-stage-ribbon">
              <div>
                <span className="eyebrow">Stage 02 · Live Practice</span>
                <strong>正在训练</strong>
              </div>
              <span>{activeRoundNumber} / {roundCount} 题</span>
            </div>
            <div className="panel-heading">
              <div>
                <span className="eyebrow">当前问题</span>
                <h3>第 {activeRoundNumber} 题</h3>
              </div>
              {lastLatencyMs > 0 && <span className="status-pill idle">{lastProvider} · {(lastLatencyMs / 1000).toFixed(1)}s</span>}
            </div>
            <div className="training-voice-panel">
              <div>
                <strong>线上语音模拟</strong>
                <span>{speech.isSupported ? '让 AI 面试官把问题读出来，你按真实线上面试节奏口头练。' : '当前环境不支持系统语音朗读。'}</span>
              </div>
              <div className="training-voice-actions">
                <button className="ghost-button compact" type="button" onClick={() => speech.speak(activeRound.question)} disabled={!speech.isSupported}>
                  <Volume2 size={15} />
                  朗读问题
                </button>
                <button className="ghost-button compact" type="button" onClick={speech.stop} disabled={!speech.isSupported || !speech.isSpeaking}>
                  <Square size={14} />
                  停止
                </button>
                <button className={speech.autoSpeak ? 'toggle-button compact on' : 'toggle-button compact'} type="button" onClick={() => speech.setAutoSpeak(!speech.autoSpeak)} disabled={!speech.isSupported}>
                  自动朗读下一题
                </button>
                <button
                  className={isAnswerTranscribing ? 'toggle-button compact on' : 'toggle-button compact'}
                  type="button"
                  onClick={() => {
                    void onStartAnswerTranscription()
                  }}
                  disabled={isGeneratingTraining || isAnswerTranscribing}
                >
                  <Mic size={15} />
                  语音作答转写
                </button>
                <button className="ghost-button compact" type="button" onClick={onStopAnswerTranscription} disabled={!isAnswerTranscribing}>
                  <Square size={14} />
                  停止转写
                </button>
              </div>
            </div>
            <p>{activeRound.question}</p>
            <div className="training-practice-grid">
              <div className="training-speech-answer">
                <div className={isAnswerTranscribing ? 'training-transcription-box listening' : 'training-transcription-box'}>
                  <strong>{isAnswerTranscribing ? '正在听你的口头回答' : '线上面试语音练习'}</strong>
                  <span>
                    {isAnswerTranscribing
                      ? '你正常说答案就行，识别完成后会自动追加到下面的回答框；安静 3 秒会自动进入下一步，也可以说“我回答完毕”。'
                      : '点击“语音作答转写”，按真实线上面试节奏开口练，再提交给 AI 面试官点评。'}
                  </span>
                  {answerInterimTranscript && <p>识别中：{answerInterimTranscript}</p>}
                  {answerTranscriptError && <p className="inline-error">{answerTranscriptError}</p>}
                  {isAnswerTranscribing && isTrainingAnswerCompletionCue(normalizedAnswerText) && <p className="inline-note">已识别到回答结束信号，准备自动提交。</p>}
                </div>
                <label className="field-block tall training-answer-box">
                  <span>你的回答记录（可手动输入）</span>
                  <textarea
                    placeholder="你可以直接手动输入，也可以先口头回答后再补充整理。提交后 AI 面试官会点评，并继续追问下一题。"
                    value={currentAnswer}
                    onChange={(event) => onCurrentAnswerChange(event.target.value)}
                  />
                </label>
                <SpeechExpressionPanel score={currentSpeechScore} isLive={isAnswerTranscribing} />
                <div className="training-answer-actions">
                  <button className="primary-button" type="button" onClick={() => onSubmitAnswer(normalizedAnswerText, currentSpeechScore || undefined)} disabled={isGeneratingTraining}>
                    {isGeneratingTraining ? <Loader2 className="spin" size={16} /> : <SendHorizontal size={16} />}
                    提交回答并进入下一题
                  </button>
                  <button className="ghost-button" type="button" onClick={() => onFinishAnswer(normalizedAnswerText, currentSpeechScore || undefined)} disabled={isGeneratingTraining}>
                    <Square size={14} />
                    回答完毕
                  </button>
                </div>
              </div>
              <aside className="training-reference-answer">
                <div className="training-reference-heading">
                  <div>
                    <span className="eyebrow">Resume + AI Reference</span>
                    <strong>参考答案</strong>
                  </div>
                  {referenceIsLong ? (
                    <button className="icon-button" type="button" onClick={() => setIsReferenceExpanded((value) => !value)} title={isReferenceExpanded ? '收起内容' : '展开完整内容'} aria-label={isReferenceExpanded ? '收起内容' : '展开完整内容'}>
                      {isReferenceExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  ) : (
                    <button className="ghost-button compact" type="button" onClick={() => speech.speak(activeRound.referenceAnswer || '')} disabled={!speech.isSupported || !activeRound.referenceAnswer}>
                      <Volume2 size={15} />
                      朗读答案
                    </button>
                  )}
                </div>
                <div className={referenceIsLong && !isReferenceExpanded ? 'training-reference-content collapsed' : 'training-reference-content'}>
                  <span className="training-reference-label">{referenceTitle}</span>
                  <p>{referenceText}</p>
                </div>
                {referenceIsLong && (
                  <button className="ghost-button compact training-reference-toggle" type="button" onClick={() => setIsReferenceExpanded((value) => !value)}>
                    {isReferenceExpanded ? '收起完整内容' : '展开完整内容'}
                  </button>
                )}
                <span>提示：这是练习参考，不是唯一标准答案；如果简历里没有依据，不要硬编具体经历。</span>
              </aside>
            </div>
          </div>
        ) : (
          <div className="empty-state compact training-current-stage" id="training-practice">
            <strong>{finalReport ? '训练已结束' : isGeneratingTraining ? '正在生成第一道题' : '还没有开始训练'}</strong>
            <p>
              {finalReport
                ? '复盘报告在右侧，可以根据建议继续下一轮。'
                : isGeneratingTraining
                  ? '正在根据候选人资料和训练规则准备问题，请稍候。'
                  : '选择训练类型和问题数量，然后点击开始训练。'}
            </p>
          </div>
        )}
      </div>

      <aside className="training-aside">
        <div className="training-aside-status">
          <div>
            <span className="eyebrow">Training Workspace</span>
            <strong>{trainingPhase === 'practice' ? '答题记录同步中' : trainingPhase === 'review' ? '本轮结果已准备好' : '训练工作区'}</strong>
          </div>
          <span>{rounds.length ? `${answeredCount} 题已完成` : '等待开始'}</span>
        </div>

        <section className="panel training-round-list training-support-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Training Timeline</span>
              <h3>训练记录</h3>
            </div>
          </div>
          {rounds.length === 0 ? (
            <div className="empty-state compact">
              <strong>暂无记录</strong>
              <p>开始训练后，这里会记录每道题、你的回答和 AI 点评，方便回顾薄弱点。</p>
            </div>
          ) : (
            rounds.map((round, index) => (
              <article className={round.answer ? 'training-round-card answered' : 'training-round-card'} key={round.id}>
                <div className="training-round-top">
                  <strong>第 {index + 1} 题</strong>
                  <div className="training-round-badges">
                    <span>{round.kind === 'followUp' ? '追问' : '正题'}</span>
                    {typeof round.score === 'number' && <span>{round.score}/100</span>}
                  </div>
                </div>
                <p className="training-question-text">{round.question}</p>
                {round.answer && (
                  <p className="training-answer-text">
                    <b>我：</b>
                    {round.answer}
                  </p>
                )}
                {round.feedback && (
                  <p className="training-feedback-text">
                    <b>点评：</b>
                    {round.feedback}
                  </p>
                )}
                <SpeechExpressionPanel score={round.speechScore || null} compact />
              </article>
            ))
          )}
        </section>

        <TrainingQuestionBankPanel
          items={questionBank.questionBankItems}
          rounds={rounds}
          isGeneratingTraining={isGeneratingTraining}
          isBookmarked={questionBank.isBookmarked}
          onBookmarkRound={questionBank.bookmarkRound}
          onRemoveItem={questionBank.removeQuestionBankItem}
          onClearQuestionBank={questionBank.clearQuestionBank}
          onStartQuestionBankTraining={startQuestionBankTraining}
        />

        <section className="panel training-report training-review-stage" id="training-review">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Review</span>
              <h3>最终复盘</h3>
            </div>
          </div>
          {finalReport ? (
            <>
              <div className="training-report-actions">
                <button className="ghost-button compact" type="button" onClick={onSaveTrainingSession} disabled={isSavingTraining || !canPersistTraining}>
                  {isSavingTraining ? <Loader2 className="spin" size={15} /> : <Save size={15} />}
                  保存到会话记录
                </button>
                <button className="ghost-button compact" type="button" onClick={() => onExportTraining('md')} disabled={!canPersistTraining}>
                  <Download size={15} />
                  导出 MD
                </button>
                <button className="primary-button compact" type="button" onClick={() => onExportTraining('word')} disabled={!canPersistTraining}>
                  <Download size={15} />
                  导出 Word
                </button>
              </div>
              {lastSavedAt > 0 && <span className="training-save-hint">最近保存：{new Date(lastSavedAt).toLocaleString('zh-CN')}</span>}
              <TrainingTrendDashboard entries={trainingTrendEntries} onClearTrainingTrend={onClearTrainingTrend} />
              <TrainingReviewInsights
                insights={weaknessInsights}
                isGeneratingTraining={isGeneratingTraining}
                onStartFocusedTraining={onStartFocusedTraining}
              />
              <pre>{finalReport}</pre>
            </>
          ) : (
            <>
              <div className="empty-state compact">
                <strong>完成 {roundCount} 题后生成</strong>
                <p>会总结平均表现、薄弱点分布、简历证据使用情况和下一轮专项练习建议。</p>
              </div>
              <TrainingTrendDashboard entries={trainingTrendEntries} onClearTrainingTrend={onClearTrainingTrend} />
            </>
          )}
        </section>
      </aside>
    </section>
  )
}
