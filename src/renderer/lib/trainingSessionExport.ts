import { trainingModeLabels } from '../../shared/trainingOptions'
import type {
  AppSettings,
  AnswerQualityScore,
  InterviewSession,
  TrainingMode,
  TrainingQuestionCount,
  TrainingRound,
  TranscriptLine
} from '../../shared/types'

type TrainingSnapshotOptions = {
  settings: AppSettings
  trainingMode: TrainingMode
  roundCount: TrainingQuestionCount
  rounds: TrainingRound[]
  finalReport: string
  provider: string
  sessionId?: string
  title?: string
}

export function defaultTrainingSessionTitle(settings: AppSettings, trainingMode: TrainingMode): string {
  const name = settings.resume.profileName || settings.resume.candidateName || '默认候选人'
  const modeLabel = trainingModeLabels[trainingMode].label

  return `模拟训练-${modeLabel}-${name}-${new Date().toLocaleString('zh-CN')}`
}

export function buildTrainingInterviewSession({
  settings,
  trainingMode,
  roundCount,
  rounds,
  finalReport,
  provider,
  sessionId,
  title
}: TrainingSnapshotOptions): InterviewSession {
  const answeredRounds = rounds.filter((round) => round.answer?.trim())
  const createdAt = rounds[0]?.at || Date.now()
  const updatedAt = Date.now()
  const transcript = buildTrainingTranscript(answeredRounds)
  const answers = answeredRounds.map((round, index) => ({
    id: `${round.id}-training-answer`,
    question: `第 ${index + 1} 题：${round.question}`,
    answer: trainingAnswerText(round),
    provider,
    at: round.answeredAt || round.at,
    quality: typeof round.score === 'number' ? scoreToQuality(round.score, round.feedback) : undefined
  }))
  const averageScore = averageRoundScore(answeredRounds)

  if (finalReport.trim()) {
    answers.push({
      id: `${sessionId || 'training'}-final-report`,
      question: `最终复盘报告（${roundCount} 题训练）`,
      answer: finalReport.trim(),
      provider: `${provider} / 模拟训练复盘`,
      at: updatedAt,
      quality: averageScore ? scoreToQuality(averageScore, '最终复盘报告') : undefined
    })
  }

  return {
    id: sessionId || crypto.randomUUID(),
    title: title || defaultTrainingSessionTitle(settings, trainingMode),
    createdAt,
    updatedAt,
    resumeProfileId: settings.resume.id,
    resumeProfileName: settings.resume.profileName || settings.resume.candidateName || undefined,
    candidateName: settings.resume.candidateName,
    targetRole: settings.resume.targetRole,
    transcript,
    answers
  }
}

function buildTrainingTranscript(rounds: TrainingRound[]): TranscriptLine[] {
  return rounds.flatMap((round) => [
    {
      id: `${round.id}-question`,
      speaker: 'interviewer' as const,
      text: round.question,
      at: round.at,
      isFinal: true
    },
    {
      id: `${round.id}-answer`,
      speaker: 'candidate' as const,
      text: round.answer || '',
      at: round.answeredAt || round.at,
      isFinal: true
    }
  ])
}

function trainingAnswerText(round: TrainingRound): string {
  const speechScore = round.speechScore

  return [
    '练习参考答案：',
    round.referenceAnswer || '暂无参考答案',
    '',
    '候选人回答：',
    round.answer || '未回答',
    '',
    ...(speechScore
      ? [
          `口语表达评分：${speechScore.total}/100`,
          `语速：${speechScore.charsPerMinute} 字/分钟；口头禅：${speechScore.fillerCount} 个；停顿提示：${speechScore.pauseHintCount} 次；时长：${speechScore.durationSec}s${speechScore.estimatedDuration ? '（估算）' : ''}`,
          `建议：${speechScore.notes.join(' ')}`,
          ''
        ]
      : []),
    '面试官点评：',
    round.feedback || '暂无点评'
  ].join('\n')
}

function scoreToQuality(score: number, note = ''): AnswerQualityScore {
  const value = Math.max(0, Math.min(100, Math.round(score)))

  return {
    total: value,
    resumeFit: value,
    structure: value,
    clarity: value,
    riskControl: value,
    notes: note ? [note] : []
  }
}

function averageRoundScore(rounds: TrainingRound[]): number {
  const scored = rounds.filter((round) => typeof round.score === 'number')

  return scored.length ? Math.round(scored.reduce((sum, round) => sum + (round.score || 0), 0) / scored.length) : 0
}
