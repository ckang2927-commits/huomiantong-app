import { Brain, ChevronDown, ChevronUp, Clock3, FileText, Loader2, Mic, PlayCircle, RotateCcw, Save, SendHorizontal, Square, UserRoundCheck, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { MockInterviewConfigPanel, getDefaultMockInterviewConfig } from '../components/training/MockInterviewConfigPanel'
import { MockInterviewFlowPreview } from '../components/training/MockInterviewFlowPreview'
import { SpeechExpressionPanel } from '../components/training/SpeechExpressionPanel'
import { useSpeechPlayback } from '../hooks/useSpeechPlayback'
import type { TranscriptionSessionStats } from '../lib/audio/audioTypes'
import { loadMockInterviewConfig, saveMockInterviewConfig, type MockInterviewConfig } from '../lib/mockInterviewConfigStore'
import { analyzeSpeechExpression } from '../lib/speechExpressionAnalyzer'
import { isTrainingAnswerCompletionCue } from '../lib/trainingAnswerCompletion'
import type { AppSettings, SpeechExpressionScore, TrainingQuestionCount, TrainingRound } from '../../shared/types'

type RealisticInterviewViewProps = {
  settings: AppSettings
  roundCount: TrainingQuestionCount
  rounds: TrainingRound[]
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
  lastProvider: string
  lastLatencyMs: number
  onRoundCountChange: (count: TrainingQuestionCount) => void
  onCurrentAnswerChange: (value: string) => void
  onStartTraining: (options?: { roundCount?: TrainingQuestionCount; mockInterviewConfig?: MockInterviewConfig }) => void | Promise<void>
  onSubmitAnswer: (answerText?: string, speechScore?: SpeechExpressionScore) => void | Promise<void>
  onFinishAnswer: (answerText?: string, speechScore?: SpeechExpressionScore) => void | Promise<void>
  onResetTraining: () => void
  onStartAnswerTranscription: () => void | Promise<void>
  onStopAnswerTranscription: () => void
  onSaveTrainingSession: () => void | Promise<void>
  onExportTraining: (format: 'md' | 'word') => void
  onOpenResume: () => void
  onOpenSettings: () => void
  onOpenTraining: () => void
  onMockInterviewConfigSaved?: () => void
}

export function RealisticInterviewView({
  settings,
  roundCount,
  rounds,
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
  lastProvider,
  lastLatencyMs,
  onRoundCountChange,
  onCurrentAnswerChange,
  onStartTraining,
  onSubmitAnswer,
  onFinishAnswer,
  onResetTraining,
  onStartAnswerTranscription,
  onStopAnswerTranscription,
  onSaveTrainingSession,
  onExportTraining,
  onOpenResume,
  onOpenSettings,
  onOpenTraining,
  onMockInterviewConfigSaved
}: RealisticInterviewViewProps): JSX.Element {
  const [mockInterviewConfig, setMockInterviewConfig] = useState<MockInterviewConfig>(() => loadMockInterviewConfig())
  const [isReferenceExpanded, setIsReferenceExpanded] = useState(false)
  const speech = useSpeechPlayback({ voiceURI: mockInterviewConfig.interviewerVoiceURI })
  const activeRound = rounds.find((round) => !round.answer?.trim())
  const latestAnsweredRound = [...rounds].reverse().find((round) => round.answer?.trim())
  const activeRoundNumber = activeRound ? rounds.findIndex((round) => round.id === activeRound.id) + 1 : 0
  const normalizedAnswerText = currentAnswer.trim()
  const effectiveRoundCount = rounds.length > 0 || finalReport ? roundCount : mockInterviewConfig.questionCount
  const progressText = rounds.length ? `${Math.min(answeredCount + (activeRound ? 1 : 0), effectiveRoundCount)}/${effectiveRoundCount}` : `0/${effectiveRoundCount}`
  const stageInfo = buildRealisticStageInfo({
    activeRound: Boolean(activeRound),
    finalReport: Boolean(finalReport),
    isAnswerTranscribing,
    isGeneratingTraining
  })
  const startButtonText = rounds.length > 0 && !finalReport ? '重新开始' : finalReport ? '再来一轮' : '开始拟真面试'
  const resumeMaterialCount =
    (settings.resume.formalResume.trim() ? 1 : 0) +
    (settings.resume.detailedResume.trim() ? 1 : 0) +
    (settings.resume.otherResumes?.length ?? 0)
  const resumeReady = resumeMaterialCount > 0
  const providerConfig = settings.providers[settings.answer.llmProvider]
  const modelReady = Boolean(providerConfig.enabled && providerConfig.apiKey)
  const currentSpeechScore = useMemo(
    () =>
      normalizedAnswerText
        ? analyzeSpeechExpression({
            text: normalizedAnswerText,
            startedAt: answerSpeechStats?.startedAt,
            endedAt: answerSpeechStats?.endedAt,
            finalTranscriptCount: answerSpeechStats?.finalTranscriptCount
          })
        : null,
    [answerSpeechStats, normalizedAnswerText]
  )
  const referenceText = activeRound?.referenceAnswer || finalReport || '开始面试后，这里会显示当前题的简短参考答法；整场结束后会切换为复盘报告。'
  const referenceTitle = activeRound ? '当前题参考答法' : finalReport ? '本轮复盘报告' : '面试提示'
  const referenceIsLong = referenceText.length > 520

  useEffect(() => {
    if (speech.autoSpeak && activeRound?.question) {
      speech.speak(activeRound.question)
    }
  }, [activeRound?.id, speech.autoSpeak])

  useEffect(() => {
    if (!isAnswerTranscribing || !activeRound || isGeneratingTraining || !answerSpeechStats?.lastFinalAt || !normalizedAnswerText) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      if (!isGeneratingTraining && normalizedAnswerText) {
        void onFinishAnswer(normalizedAnswerText, currentSpeechScore || undefined)
      }
    }, 3000)

    return () => window.clearTimeout(timeout)
  }, [activeRound, answerSpeechStats?.lastFinalAt, currentSpeechScore, isAnswerTranscribing, isGeneratingTraining, normalizedAnswerText, onFinishAnswer])

  function saveMockConfig(): void {
    saveMockInterviewConfig(mockInterviewConfig)
    onMockInterviewConfigSaved?.()
  }

  function resetMockConfig(): void {
    setMockInterviewConfig(getDefaultMockInterviewConfig())
  }

  function speakMockIntro(): void {
    speech.speak(buildMockIntro(mockInterviewConfig, settings.resume.profileName || settings.resume.candidateName || '当前候选人'))
  }

  function previewInterviewerVoice(): void {
    speech.speak('你好，我是今天的面试官。接下来我会用这套声音向你提问，请你按照正式线上面试的节奏回答。')
  }

  function speakCurrentQuestion(): void {
    if (activeRound?.question) {
      speech.speak(activeRound.question)
    }
  }

  async function startRealisticInterview(): Promise<void> {
    saveMockInterviewConfig(mockInterviewConfig)
    await onStartTraining({
      roundCount: mockInterviewConfig.questionCount,
      mockInterviewConfig
    })
  }

  return (
    <section className="realistic-interview-layout">
      <div className="realistic-main panel">
        <div className="panel-heading realistic-page-heading">
          <div>
            <span className="eyebrow">Realistic Voice Interview</span>
            <h3>真人语音模拟面试</h3>
          </div>
          <span className={activeRound ? 'status-pill thinking' : finalReport ? 'status-pill success' : 'status-pill idle'}>
            {activeRound ? `面试中 · ${progressText}` : finalReport ? '已完成复盘' : '等待开始'}
          </span>
        </div>

        <div className="realistic-hero">
          <div>
            <span className="eyebrow">Online Interview Room</span>
            <strong>让 AI 像面试官一样掌控节奏</strong>
            <p>这里专门承载“语音提问、语音回答、自动追问、最终复盘”的完整线上面试流程；普通练题继续留在模拟训练里。</p>
          </div>
          <div className="realistic-hero-actions">
            <button className="primary-button" type="button" onClick={() => { void startRealisticInterview() }} disabled={isGeneratingTraining}>
              {isGeneratingTraining && rounds.length === 0 ? <Loader2 className="spin" size={16} /> : <PlayCircle size={16} />}
              {startButtonText}
            </button>
            <button className="ghost-button" type="button" onClick={onResetTraining} disabled={isGeneratingTraining}>
              <RotateCcw size={16} />
              重置
            </button>
          </div>
        </div>

        <div className="realistic-readiness-grid">
          <div className={resumeReady ? 'realistic-readiness-card ready' : 'realistic-readiness-card warning'}>
            <FileText size={17} />
            <span>资料状态</span>
            <strong>{resumeReady ? `${resumeMaterialCount} 份资料` : '待完善'}</strong>
          </div>
          <div className={modelReady ? 'realistic-readiness-card ready' : 'realistic-readiness-card warning'}>
            <Brain size={17} />
            <span>回答模型</span>
            <strong>{modelReady ? settings.answer.llmProvider : '本地兜底'}</strong>
          </div>
          <div className={speech.isSupported ? 'realistic-readiness-card ready' : 'realistic-readiness-card warning'}>
            <Volume2 size={17} />
            <span>语音播报</span>
            <strong>{speech.isSupported ? (speech.voices.length > 0 ? `${speech.voices.length} 种可选` : '可朗读') : '不可用'}</strong>
          </div>
          <div className="realistic-readiness-card">
            <Clock3 size={17} />
            <span>当前进度</span>
            <strong>{progressText}</strong>
          </div>
        </div>

        <div className="realistic-stage-grid">
          <MockInterviewConfigPanel
            config={mockInterviewConfig}
            disabled={isGeneratingTraining || Boolean(activeRound)}
            selectedVoiceLabel={speech.selectedVoiceLabel}
            voiceOptions={speech.voices}
            voiceSupported={speech.isSupported}
            onChange={setMockInterviewConfig}
            onPreviewVoice={previewInterviewerVoice}
            onSave={saveMockConfig}
            onReset={resetMockConfig}
          />

          <MockInterviewFlowPreview
            config={mockInterviewConfig}
            activeQuestion={activeRound?.question}
            isSupported={speech.isSupported}
            isSpeaking={speech.isSpeaking}
            autoSpeak={speech.autoSpeak}
            selectedVoiceLabel={speech.selectedVoiceLabel}
            onSpeakIntro={speakMockIntro}
            onSpeakQuestion={speakCurrentQuestion}
            onStop={speech.stop}
            onToggleAutoSpeak={() => speech.setAutoSpeak(!speech.autoSpeak)}
          />
        </div>
      </div>

      <aside className="realistic-aside">
        <section className="panel realistic-room-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Live Room</span>
              <h3>面试官现场</h3>
            </div>
            {lastLatencyMs > 0 && <span className="status-pill idle">{lastProvider} · {(lastLatencyMs / 1000).toFixed(1)}s</span>}
          </div>

          <div className="realistic-question-card">
            <span>当前题目</span>
            <strong>{activeRound ? `第 ${activeRoundNumber} / ${effectiveRoundCount} 题` : finalReport ? '本轮面试已结束' : '等待 AI 面试官提问'}</strong>
            <p>{activeRound?.question || (finalReport ? '可以导出复盘，或者重置后再来一轮。' : '点击开始后，AI 会按配置生成问题，并支持语音播报。')}</p>
          </div>

          <div className={`realistic-stage-card ${stageInfo.tone}`}>
            <span>{stageInfo.label}</span>
            <strong>{stageInfo.title}</strong>
            <p>{stageInfo.hint}</p>
          </div>

          <div className="realistic-control-row">
            <button className="ghost-button compact" type="button" onClick={speakCurrentQuestion} disabled={!speech.isSupported || !activeRound?.question}>
              <Volume2 size={15} />
              朗读题目
            </button>
            <button className={speech.autoSpeak ? 'toggle-button compact on' : 'toggle-button compact'} type="button" onClick={() => speech.setAutoSpeak(!speech.autoSpeak)} disabled={!speech.isSupported}>
              自动播报
            </button>
            <button className="ghost-button compact" type="button" onClick={speech.stop} disabled={!speech.isSupported || !speech.isSpeaking}>
              <Square size={14} />
              停止播报
            </button>
          </div>

          <div className={isAnswerTranscribing ? 'realistic-answer-capture listening' : 'realistic-answer-capture'}>
            <strong>{isAnswerTranscribing ? '正在听你的回答' : '语音回答区'}</strong>
            <span>{isAnswerTranscribing ? '说完后安静 3 秒，或点击“回答完毕”。' : '开始题目后，点击语音作答转写，按线上面试节奏回答。'}</span>
            {answerInterimTranscript && <p>识别中：{answerInterimTranscript}</p>}
            {answerTranscriptError && <p className="inline-error">{answerTranscriptError}</p>}
            {isAnswerTranscribing && isTrainingAnswerCompletionCue(normalizedAnswerText) && <p className="inline-note">已识别到回答结束信号，准备提交。</p>}
          </div>

          {latestAnsweredRound?.feedback && (
            <div className="realistic-feedback-card">
              <span>上一题即时点评</span>
              <p>{latestAnsweredRound.feedback}</p>
            </div>
          )}

          <label className="field-block tall realistic-answer-box">
            <span>你的回答记录（可手动输入）</span>
            <textarea
              aria-label="手动输入回答记录"
              placeholder="直接在这里输入回答；也可以先用语音转写，再手动修改。"
              value={currentAnswer}
              onChange={(event) => onCurrentAnswerChange(event.target.value)}
            />
          </label>

          <SpeechExpressionPanel score={currentSpeechScore} isLive={isAnswerTranscribing} />

          <div className="realistic-control-row">
            <button
              className={isAnswerTranscribing ? 'toggle-button compact on' : 'toggle-button compact'}
              type="button"
              onClick={() => {
                void onStartAnswerTranscription()
              }}
              disabled={isGeneratingTraining || isAnswerTranscribing || !activeRound}
            >
              <Mic size={15} />
              语音作答转写
            </button>
            <button className="ghost-button compact" type="button" onClick={onStopAnswerTranscription} disabled={!isAnswerTranscribing}>
              <Square size={14} />
              停止转写
            </button>
            <button className="primary-button compact" type="button" onClick={() => onSubmitAnswer(normalizedAnswerText, currentSpeechScore || undefined)} disabled={isGeneratingTraining || !activeRound}>
              {isGeneratingTraining ? <Loader2 className="spin" size={15} /> : <SendHorizontal size={15} />}
              提交进入下一题
            </button>
            <button className="ghost-button compact" type="button" onClick={() => onFinishAnswer(normalizedAnswerText, currentSpeechScore || undefined)} disabled={isGeneratingTraining || !activeRound}>
              回答完毕
            </button>
          </div>
        </section>

        <section className="panel realistic-reference-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Reference Answer</span>
              <h3>参考答案 / 复盘</h3>
            </div>
            {referenceIsLong && (
              <button className="icon-button" type="button" onClick={() => setIsReferenceExpanded((value) => !value)} title={isReferenceExpanded ? '收起内容' : '展开完整内容'} aria-label={isReferenceExpanded ? '收起内容' : '展开完整内容'}>
                {isReferenceExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>
          <div className={referenceIsLong && !isReferenceExpanded ? 'realistic-reference-content collapsed' : 'realistic-reference-content'}>
            <span className="realistic-reference-label">{referenceTitle}</span>
            <p>{referenceText}</p>
          </div>
          {referenceIsLong && (
            <button className="ghost-button compact realistic-reference-toggle" type="button" onClick={() => setIsReferenceExpanded((value) => !value)}>
              {isReferenceExpanded ? '收起完整内容' : '展开完整内容'}
            </button>
          )}
          <div className="realistic-control-row">
            <button className="ghost-button compact" type="button" onClick={onOpenResume}>
              <UserRoundCheck size={15} />
              检查候选人
            </button>
            <button className="ghost-button compact" type="button" onClick={onOpenSettings}>
              检查模型
            </button>
            <button className="ghost-button compact" type="button" onClick={onOpenTraining}>
              去专项练题
            </button>
          </div>
          <div className="realistic-control-row">
            <button className="ghost-button compact" type="button" onClick={onSaveTrainingSession} disabled={!canPersistTraining || isSavingTraining}>
              {isSavingTraining ? <Loader2 className="spin" size={15} /> : <Save size={15} />}
              保存记录
            </button>
            <button className="ghost-button compact" type="button" onClick={() => onExportTraining('md')} disabled={!finalReport && rounds.length === 0}>
              导出 MD
            </button>
            <button className="ghost-button compact" type="button" onClick={() => onExportTraining('word')} disabled={!finalReport && rounds.length === 0}>
              导出 Word
            </button>
          </div>
        </section>
      </aside>
    </section>
  )
}

function buildMockIntro(config: MockInterviewConfig, candidateName: string): string {
  return `你好，${candidateName}，接下来我们进行一场 ${config.durationMinutes} 分钟左右的线上模拟面试，大约 ${config.questionCount} 道题。我会根据你的回答继续追问，回答时尽量像正式面试一样自然表达。准备好了我们就开始。`
}

function buildRealisticStageInfo({
  activeRound,
  finalReport,
  isAnswerTranscribing,
  isGeneratingTraining
}: {
  activeRound: boolean
  finalReport: boolean
  isAnswerTranscribing: boolean
  isGeneratingTraining: boolean
}): { label: string; title: string; hint: string; tone: 'idle' | 'live' | 'thinking' | 'done' } {
  if (finalReport) {
    return {
      label: 'Review',
      title: '进入复盘阶段',
      hint: '现在可以查看参考答案、最终复盘，也可以保存或导出本轮记录。',
      tone: 'done'
    }
  }

  if (isGeneratingTraining) {
    return {
      label: 'Thinking',
      title: 'AI 面试官正在整理下一步',
      hint: '系统正在生成题目、点评或追问，等它出来后再继续回答。',
      tone: 'thinking'
    }
  }

  if (isAnswerTranscribing) {
    return {
      label: 'Answering',
      title: '正在记录你的口头回答',
      hint: '说完后安静 3 秒会自动进入下一步；也可以直接点“回答完毕”。',
      tone: 'live'
    }
  }

  if (activeRound) {
    return {
      label: 'Question',
      title: '先听题，再开始作答',
      hint: '可以点“朗读题目”，确认理解后再开启语音作答转写。',
      tone: 'idle'
    }
  }

  return {
    label: 'Ready',
    title: '先配置，再开始拟真面试',
    hint: '题数、难度、侧重点会影响整场节奏；开始后会锁定当前配置。',
    tone: 'idle'
  }
}
