import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { AlertCircle, BarChart3, CheckCircle2, ClipboardCopy, DollarSign, Download, FileAudio, FileText, ListChecks, Loader2, LockKeyhole, RefreshCw, RotateCcw, Save, SearchCheck, ShieldCheck, Trash2, UploadCloud, UsersRound } from 'lucide-react'
import {
  analyzeInterviewReviewAnswers,
  extractInterviewReviewQuestions,
  getInterviewReviewEvidenceMetricLabel,
  summarizeExtractedQuestions,
  type InterviewReviewAnswerAnalysis,
  type InterviewReviewExtractedQuestion,
  type InterviewReviewQuestionSource
} from '../lib/interviewReviewAnalyzer'
import { buildLocalInterviewReviewReport, type InterviewReviewReport } from '../lib/interviewReviewReport'
import { buildLongAudioOptimizationMarkdown } from '../lib/longAudioOptimization'
import {
  buildInterviewReviewRecord,
  defaultInterviewReviewTitle,
  interviewReviewExportFileName,
  interviewReviewRecordToMarkdown,
  interviewReviewRecordToWordHtml
} from '../lib/interviewReviewRecordExport'
import { downloadText, safeFileName } from '../lib/sessionExport'
import { useSettingsStore } from '../stores/useSettingsStore'
import type {
  InterviewReviewAnswerAnalysisRecord,
  InterviewReviewQuestionRecord,
  InterviewReviewRecord,
  InterviewReviewTranscriptionResult
} from '../../shared/types'

type InterviewReviewViewProps = {
  onOpenSettings: () => void
}

type ReviewSpeakerRole = 'interviewer' | 'candidate' | 'other'

type SpeakerAlias = {
  role: ReviewSpeakerRole
  name: string
}

type SpeakerAliases = Record<string, SpeakerAlias>

const audioAccept = [
  'audio/*',
  'video/mp4',
  'video/webm',
  '.aac',
  '.flac',
  '.m4a',
  '.m4v',
  '.mp3',
  '.mp4',
  '.mpeg',
  '.mpga',
  '.ogg',
  '.opus',
  '.wav',
  '.webm'
].join(',')

const supportedAudioExtensions = new Set(['aac', 'flac', 'm4a', 'm4v', 'mp3', 'mp4', 'mpeg', 'mpga', 'ogg', 'opus', 'wav', 'webm'])

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function formatDuration(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds)) return '待识别'
  const totalSeconds = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(totalSeconds / 60)
  const restSeconds = totalSeconds % 60
  return `${minutes}:${String(restSeconds).padStart(2, '0')}`
}

function formatConfidence(confidence?: number): string {
  if (confidence === undefined || !Number.isFinite(confidence)) return '未返回'
  return `${Math.round(confidence * 100)}%`
}

function formatQuestionSource(source: InterviewReviewQuestionSource): string {
  if (source === 'punctuation') return '问号命中'
  if (source === 'speaker') return '说话人命中'
  return '关键词命中'
}

function formatAnswerLevel(level?: InterviewReviewAnswerAnalysis['level']): string {
  if (level === 'good') return '表现较好'
  if (level === 'warn') return '需要优化'
  if (level === 'risk') return '风险较高'
  return '待分析'
}

function formatRecordTime(value: number): string {
  return new Date(value).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatReviewDurationMinutes(seconds?: number): string {
  if (!seconds || !Number.isFinite(seconds)) return '待 Deepgram 返回'
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  return `约 ${minutes} 分钟`
}

function buildReviewUsageText(result: InterviewReviewTranscriptionResult | null, selectedFile: File | null): string {
  if (result?.durationSec) {
    return `本次已识别音频 ${formatReviewDurationMinutes(result.durationSec)}，Deepgram 通常按音频时长消耗额度；实际费用以服务商后台账单为准。`
  }

  if (selectedFile) {
    return `已选择 ${formatFileSize(selectedFile.size)} 文件；开始转写后会上传到 Deepgram，时长和费用以服务商返回与后台账单为准。`
  }

  return '选择录音后再开始转写；本页问题提取、本地评分和本地报告不消耗模型 Token。'
}

function buildPlainUtterances(result: InterviewReviewTranscriptionResult, speakerAliases: SpeakerAliases = {}): string {
  if (result.utterances.length === 0) {
    return result.transcript
  }

  return result.utterances
    .map((utterance) => {
      const rawSpeaker = utterance.speaker || '说话人'
      const speaker = formatSpeakerAlias(rawSpeaker, speakerAliases[rawSpeaker])
      const start = utterance.start === undefined ? '' : `[${formatDuration(utterance.start)}] `
      return `${start}${speaker}：${utterance.text}`
    })
    .join('\n')
}

function isSupportedReviewAudioFile(file: File): boolean {
  const extension = (file.name.split('.').pop() || '').trim().toLowerCase()
  return file.type.startsWith('audio/') || file.type.startsWith('video/') || supportedAudioExtensions.has(extension)
}

function formatSpeakerAlias(speaker: string, alias?: SpeakerAlias): string {
  const name = alias?.name.trim() || ''

  if (alias?.role === 'interviewer') {
    return name ? `面试官 ${name}` : '面试官'
  }

  if (alias?.role === 'candidate') {
    return name ? `候选人 ${name}` : '候选人'
  }

  return name || speaker
}

function extractSpeakersFromTranscript(transcript: string): string[] {
  const speakers = new Set<string>()

  transcript.split(/\n+/).forEach((line) => {
    const match = line.trim().match(/^(?:\[[^\]]+\]\s*)?([^：:]{1,28})[：:]\s*/)
    const speaker = match?.[1]?.trim()
    if (speaker) {
      speakers.add(speaker)
    }
  })

  return Array.from(speakers)
}

function inferSpeakerAliases(result: InterviewReviewTranscriptionResult): SpeakerAliases {
  const speakerScores = new Map<string, { questionScore: number; answerScore: number; totalLength: number }>()

  result.utterances.forEach((utterance) => {
    const speaker = utterance.speaker || '说话人'
    const current = speakerScores.get(speaker) || { questionScore: 0, answerScore: 0, totalLength: 0 }
    const text = utterance.text || ''
    current.totalLength += text.length
    current.questionScore += scoreQuestionLikeText(text)
    current.answerScore += scoreAnswerLikeText(text)
    speakerScores.set(speaker, current)
  })

  const ranked = Array.from(speakerScores.entries()).sort((left, right) => {
    const questionDiff = right[1].questionScore - left[1].questionScore
    if (questionDiff !== 0) return questionDiff
    return right[1].totalLength - left[1].totalLength
  })

  const aliases: SpeakerAliases = {}
  const interviewerSpeaker = ranked[0]?.[0] || ''
  const candidateSpeaker = ranked
    .filter(([speaker]) => speaker !== interviewerSpeaker)
    .sort((left, right) => right[1].answerScore - left[1].answerScore || right[1].totalLength - left[1].totalLength)[0]?.[0] || ''

  Array.from(speakerScores.keys()).forEach((speaker) => {
    aliases[speaker] = {
      role: speaker === interviewerSpeaker && ranked[0][1].questionScore > 0 ? 'interviewer' : speaker === candidateSpeaker ? 'candidate' : 'other',
      name: ''
    }
  })

  return aliases
}

function scoreQuestionLikeText(text: string): number {
  const matches = text.match(/？|\?|吗|什么|怎么|如何|为什么|有没有|是否|能不能|可不可以|介绍一下|描述一下|表述一下|分享一下|了解一下|想了解|想问|问一下|反馈周期|反向提问/g) || []
  return matches.length
}

function scoreAnswerLikeText(text: string): number {
  const matches = text.match(/我|我们|当时|负责|项目|经验|做过|参与|主导|搭建|处理|落地|提升|降低|优化/g) || []
  return matches.length
}

function applySpeakerAliasesToTranscript(transcript: string, speakerAliases: SpeakerAliases): string {
  return transcript
    .split('\n')
    .map((line) => {
      const match = line.match(/^(\[[^\]]+\]\s*)?([^：:]{1,28})([：:]\s*)/)
      const rawSpeaker = match?.[2]?.trim()
      if (!match || !rawSpeaker || !speakerAliases[rawSpeaker]) {
        return line
      }
      return line.replace(match[0], `${match[1] || ''}${formatSpeakerAlias(rawSpeaker, speakerAliases[rawSpeaker])}${match[3]}`)
    })
    .join('\n')
}

function toReviewQuestionRecords(questions: InterviewReviewExtractedQuestion[]): InterviewReviewQuestionRecord[] {
  return questions.map((question) => ({
    id: question.id,
    order: question.order,
    question: question.question,
    intentLabel: question.intentLabel,
    confidence: question.confidence,
    source: question.source,
    startSec: question.startSec,
    speaker: question.speaker,
    contextBefore: question.contextBefore,
    contextAfter: question.contextAfter
  }))
}

function toReviewAnswerAnalysisRecords(analyses: InterviewReviewAnswerAnalysis[]): InterviewReviewAnswerAnalysisRecord[] {
  return analyses.map((analysis) => ({
    questionId: analysis.questionId,
    answerText: analysis.answerText,
    wordCount: analysis.wordCount,
    score: analysis.score,
    level: analysis.level,
    metrics: analysis.metrics,
    issues: analysis.issues,
    suggestions: analysis.suggestions
  }))
}

type EnhancementPreviewProps = {
  title: string
  text: string
  placeholder: string
  onCopy: () => void
  onDownloadMd: () => void
  onDownloadWord: () => void
}

function EnhancementPreview({ title, text, placeholder, onCopy, onDownloadMd, onDownloadWord }: EnhancementPreviewProps): JSX.Element {
  const previewBlocks = buildEnhancementPreviewBlocks(text)
  const totalLines = text.split('\n').filter((line) => line.trim()).length

  return (
    <div className="interview-review-enhancement-preview">
      <div className="interview-review-enhancement-preview-head">
        <div>
          <span>预览样式</span>
          <strong>{title}</strong>
        </div>
        <div>
          <button className="ghost-button compact" disabled={!text.trim()} onClick={onCopy} type="button">
            <ClipboardCopy size={14} />
            复制
          </button>
          <button className="ghost-button compact" disabled={!text.trim()} onClick={onDownloadMd} type="button">
            <Download size={14} />
            MD
          </button>
          <button className="ghost-button compact" disabled={!text.trim()} onClick={onDownloadWord} type="button">
            <Download size={14} />
            Word
          </button>
        </div>
      </div>
      {text.trim() ? (
        <div className="interview-review-enhancement-preview-body">
          {previewBlocks.map((block) => {
            if (block.kind === 'title') {
              return <h4 key={block.id}>{block.text}</h4>
            }
            if (block.kind === 'section') {
              return <strong key={block.id}>{block.text}</strong>
            }
            if (block.kind === 'bullet') {
              return <p className="bullet" key={block.id}>{block.text}</p>
            }
            if (block.kind === 'note') {
              return <p className="note" key={block.id}>{block.text}</p>
            }
            return <p key={block.id}>{block.text}</p>
          })}
          {totalLines > previewBlocks.length && <small>预览只展示前 {previewBlocks.length} 行，下载会保留完整内容。</small>}
        </div>
      ) : (
        <p className="interview-review-enhancement-placeholder">{placeholder}</p>
      )}
    </div>
  )
}

function buildEnhancementPreviewBlocks(markdown: string): Array<{ id: string; kind: 'title' | 'section' | 'bullet' | 'note' | 'paragraph'; text: string }> {
  return markdown
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line !== '```')
    .slice(0, 12)
    .map((line, index) => {
      if (line.startsWith('# ')) return { id: `${index}-${line}`, kind: 'title' as const, text: line.slice(2).trim() }
      if (line.startsWith('## ')) return { id: `${index}-${line}`, kind: 'section' as const, text: line.slice(3).trim() }
      if (line.startsWith('### ')) return { id: `${index}-${line}`, kind: 'section' as const, text: line.slice(4).trim() }
      if (line.startsWith('- ')) return { id: `${index}-${line}`, kind: 'bullet' as const, text: line.slice(2).trim() }
      if (/^\d+[.、]/.test(line)) return { id: `${index}-${line}`, kind: 'bullet' as const, text: line }
      if (line.startsWith('> ')) return { id: `${index}-${line}`, kind: 'note' as const, text: line.slice(2).trim() }
      return { id: `${index}-${line}`, kind: 'paragraph' as const, text: line }
    })
}

function enhancementMarkdownToWordHtml(title: string, markdown: string): string {
  const body = markdown
    .split('\n')
    .map((line) => {
      if (line.startsWith('# ')) return `<h1>${escapeHtml(line.slice(2))}</h1>`
      if (line.startsWith('## ')) return `<h2>${escapeHtml(line.slice(3))}</h2>`
      if (line.startsWith('### ')) return `<h3>${escapeHtml(line.slice(4))}</h3>`
      if (line.startsWith('- ')) return `<p>• ${escapeHtml(line.slice(2))}</p>`
      if (line.startsWith('> ')) return `<blockquote>${escapeHtml(line.slice(2))}</blockquote>`
      if (!line.trim()) return '<br>'
      return `<p>${escapeHtml(line)}</p>`
    })
    .join('\n')

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body>${body}</body></html>`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export function InterviewReviewView({ onOpenSettings }: InterviewReviewViewProps): JSX.Element {
  const settings = useSettingsStore((state) => state.settings)
  const setUsageStats = useSettingsStore((state) => state.setUsageStats)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<InterviewReviewTranscriptionResult | null>(null)
  const [transcriptText, setTranscriptText] = useState('')
  const [status, setStatus] = useState('请选择一段面试录音，第一版先完成 Deepgram 文件转写。')
  const [error, setError] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')
  const [questions, setQuestions] = useState<InterviewReviewExtractedQuestion[]>([])
  const [selectedQuestionId, setSelectedQuestionId] = useState('')
  const [analysisStatus, setAnalysisStatus] = useState('转写完成后，可以从文本里自动提取面试问题。')
  const [reviewReport, setReviewReport] = useState<InterviewReviewReport | null>(null)
  const [reportStatus, setReportStatus] = useState('提取问题并完成回答分析后，可以生成本地复盘报告。')
  const [reportCopyStatus, setReportCopyStatus] = useState('')
  const [savedReviews, setSavedReviews] = useState<InterviewReviewRecord[]>([])
  const [savedReviewStatus, setSavedReviewStatus] = useState('最近保存的复盘会显示在这里。')
  const [speakerAliases, setSpeakerAliases] = useState<SpeakerAliases>({})
  const [speakerStatus, setSpeakerStatus] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [deepReportText, setDeepReportText] = useState('')
  const [deepReportStatus, setDeepReportStatus] = useState('AI 深度报告会调用当前回答模型，建议先完成转写和本地复盘。')
  const [isGeneratingDeepReport, setIsGeneratingDeepReport] = useState(false)
  const [deepTalkText, setDeepTalkText] = useState('')
  const [deepTalkTitle, setDeepTalkTitle] = useState('AI 深度话术')
  const [deepTalkStatus, setDeepTalkStatus] = useState('选中某个问题后，可以生成更自然的口语优化版。')
  const [isGeneratingDeepTalk, setIsGeneratingDeepTalk] = useState(false)
  const [longAudioPlanText, setLongAudioPlanText] = useState('')
  const [longAudioStatus, setLongAudioStatus] = useState('长录音优化不消耗 Token，会根据时长、片段数和问题数量给出建议。')

  const deepgramKeyReady = useMemo(
    () => Boolean((settings.speech.providers.deepgram.apiKey || settings.providers.deepgram.apiKey || '').trim()),
    [settings.providers.deepgram.apiKey, settings.speech.providers.deepgram.apiKey]
  )
  const questionSummary = useMemo(() => summarizeExtractedQuestions(questions), [questions])
  const answerAnalyses = useMemo(() => analyzeInterviewReviewAnswers(transcriptText, questions), [questions, transcriptText])
  const selectedQuestion = useMemo(
    () => questions.find((question) => question.id === selectedQuestionId) || questions[0],
    [questions, selectedQuestionId]
  )
  const selectedAnswerAnalysis = useMemo(
    () => answerAnalyses.find((analysis) => analysis.questionId === selectedQuestion?.id),
    [answerAnalyses, selectedQuestion?.id]
  )
  const answerSummary = useMemo(() => {
    const answeredCount = answerAnalyses.filter((analysis) => analysis.answerText.trim()).length
    const averageScore = answerAnalyses.length
      ? Math.round(answerAnalyses.reduce((sum, analysis) => sum + analysis.score, 0) / answerAnalyses.length)
      : 0
    const riskCount = answerAnalyses.filter((analysis) => analysis.level === 'risk').length

    return { answeredCount, averageScore, riskCount }
  }, [answerAnalyses])
  const privacyMode = settings.answer.privacyMode ?? false
  const reviewUsageText = useMemo(() => buildReviewUsageText(result, selectedFile), [result, selectedFile])
  const reviewPrivacyText = privacyMode
    ? '隐私模式已开启：导出 MD/Word 时会脱敏姓名、手机号、邮箱和公司名；本地保存记录仍保留原始转写，方便后续复盘。'
    : '隐私模式未开启：保存和导出都会保留完整文字。给朋友或外发报告前，建议先到设置中心开启隐私模式。'
  const detectedSpeakers = useMemo(
    () => {
      if (result?.utterances.length) {
        return Array.from(new Set(result.utterances.map((utterance) => utterance.speaker || '说话人')))
      }

      return extractSpeakersFromTranscript(transcriptText)
    },
    [result, transcriptText]
  )

  const canTranscribe = Boolean(selectedFile && deepgramKeyReady && !isTranscribing)

  useEffect(() => {
    window.huomiantong.listInterviewReviews().then(setSavedReviews).catch(() => setSavedReviews([]))
  }, [])

  const resetEnhancementState = (): void => {
    setDeepReportText('')
    setDeepReportStatus('AI 深度报告会调用当前回答模型，建议先完成转写和本地复盘。')
    setIsGeneratingDeepReport(false)
    setDeepTalkText('')
    setDeepTalkTitle('AI 深度话术')
    setDeepTalkStatus('选中某个问题后，可以生成更自然的口语优化版。')
    setIsGeneratingDeepTalk(false)
    setLongAudioPlanText('')
    setLongAudioStatus('长录音优化不消耗 Token，会根据时长、片段数和问题数量给出建议。')
  }

  const pickFile = (): void => {
    fileInputRef.current?.click()
  }

  const selectReviewFile = (file: File | null): void => {
    setSelectedFile(file)
    setResult(null)
    setTranscriptText('')
    setError('')
    setCopyStatus('')
    setQuestions([])
    setSelectedQuestionId('')
    setAnalysisStatus('转写完成后，可以从文本里自动提取面试问题。')
    setReviewReport(null)
    setReportStatus('提取问题并完成回答分析后，可以生成本地复盘报告。')
    setReportCopyStatus('')
    setSpeakerAliases({})
    setSpeakerStatus('')
    resetEnhancementState()
    setStatus(file ? `已选择：${file.name}` : '请选择一段面试录音。')
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    selectReviewFile(event.target.files?.[0] || null)
  }

  const handleDropFile = (event: DragEvent<HTMLButtonElement>): void => {
    event.preventDefault()
    setIsDragOver(false)
    const file = Array.from(event.dataTransfer.files || []).find(isSupportedReviewAudioFile) || null

    if (!file) {
      setError('没有识别到可用的录音文件。请拖入 mp3、wav、m4a、mp4、webm、ogg 或 flac。')
      return
    }

    selectReviewFile(file)
  }

  const handleDragOver = (event: DragEvent<HTMLButtonElement>): void => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLButtonElement>): void => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const clearAll = (): void => {
    setSelectedFile(null)
    setResult(null)
    setTranscriptText('')
    setError('')
    setCopyStatus('')
    setQuestions([])
    setSelectedQuestionId('')
    setAnalysisStatus('已清空问题列表。')
    setReviewReport(null)
    setReportStatus('提取问题并完成回答分析后，可以生成本地复盘报告。')
    setReportCopyStatus('')
    setSpeakerAliases({})
    setSpeakerStatus('')
    setIsDragOver(false)
    resetEnhancementState()
    setStatus('已清空。可以继续上传下一段面试录音。')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const transcribeFile = async (): Promise<void> => {
    if (!selectedFile) {
      setError('请先选择一段录音文件。')
      return
    }

    if (!deepgramKeyReady) {
      setError('还没有配置 Deepgram Key。请先去设置中心填写并保存。')
      return
    }

    setIsTranscribing(true)
    setError('')
    setCopyStatus('')
    resetEnhancementState()
    setStatus('正在上传录音并转写，长录音可能需要几十秒。')

    try {
      const data = await selectedFile.arrayBuffer()
      const nextResult = await window.huomiantong.transcribeInterviewAudio({
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        size: selectedFile.size,
        data
      })
      const nextSpeakerAliases = inferSpeakerAliases(nextResult)
      const plainTranscript = buildPlainUtterances(nextResult, nextSpeakerAliases)
      const nextQuestions = extractInterviewReviewQuestions(plainTranscript)
      setResult(nextResult)
      setTranscriptText(plainTranscript)
      setQuestions(nextQuestions)
      setSpeakerAliases(nextSpeakerAliases)
      setSpeakerStatus(Object.keys(nextSpeakerAliases).length ? '已根据问句比例初步判断发言人；如果判断反了，可以在下方改名后重新提取。' : '')
      setSelectedQuestionId(nextQuestions[0]?.id || '')
      setReviewReport(null)
      setReportStatus('已完成转写和问题提取，可以生成复盘报告。')
      setReportCopyStatus('')
      setStatus(`转写完成：${nextResult.fileName}，音频时长 ${formatReviewDurationMinutes(nextResult.durationSec)}，请求耗时 ${(nextResult.latencyMs / 1000).toFixed(1)} 秒。`)
      setAnalysisStatus(nextQuestions.length ? `已自动提取 ${nextQuestions.length} 个疑似面试问题。` : '转写完成，但暂时没有提取到明确问题；可以手动修正文案后再点“重新提取”。')
    } catch (transcriptionError) {
      setError(transcriptionError instanceof Error ? transcriptionError.message : '录音转写失败：未知错误。')
      setStatus('转写失败。请根据错误提示检查 Key、余额、网络或文件格式。')
    } finally {
      setIsTranscribing(false)
    }
  }

  const copyTranscript = async (): Promise<void> => {
    if (!transcriptText.trim()) {
      setCopyStatus('没有可复制的转写文本。')
      return
    }

    try {
      await navigator.clipboard.writeText(transcriptText)
      setCopyStatus('已复制到剪贴板。')
    } catch {
      setCopyStatus('复制失败，可以手动选中文本复制。')
    }
  }

  const handleTranscriptChange = (value: string): void => {
    setTranscriptText(value)
    setAnalysisStatus('转写文本已修改，建议点击“重新提取问题”同步问题列表。')
    setReviewReport(null)
    setReportStatus('转写文本已修改，建议重新提取问题后再生成复盘报告。')
    setReportCopyStatus('')
    resetEnhancementState()
  }

  const updateSpeakerAlias = (speaker: string, patch: Partial<SpeakerAlias>): void => {
    setSpeakerAliases((current) => ({
      ...current,
      [speaker]: {
        role: current[speaker]?.role || 'other',
        name: current[speaker]?.name || '',
        ...patch
      }
    }))
  }

  const applySpeakerAliases = (): void => {
    if (detectedSpeakers.length === 0) {
      setSpeakerStatus('当前转写文本里还没有识别到发言人。')
      return
    }

    const normalizedAliases = detectedSpeakers.reduce<SpeakerAliases>((aliases, speaker) => {
      aliases[speaker] = speakerAliases[speaker] || { role: 'other', name: '' }
      return aliases
    }, {})
    const nextTranscript = result
      ? buildPlainUtterances(result, normalizedAliases)
      : applySpeakerAliasesToTranscript(transcriptText, normalizedAliases)
    const nextQuestions = extractInterviewReviewQuestions(nextTranscript)

    setSpeakerAliases(normalizedAliases)
    setTranscriptText(nextTranscript)
    setQuestions(nextQuestions)
    setSelectedQuestionId(nextQuestions[0]?.id || '')
    setReviewReport(null)
    setReportCopyStatus('')
    setReportStatus(nextQuestions.length ? '已应用发言人命名，可以重新生成复盘报告。' : '已应用发言人命名，但还没有提取到明确问题。')
    setAnalysisStatus(nextQuestions.length ? `已根据新发言人命名提取 ${nextQuestions.length} 个疑似面试问题。` : '没有提取到明确问题。建议确认面试官角色是否选对。')
    setSpeakerStatus('发言人命名已应用。小技巧：把提问方设成“面试官”，把作答方设成“候选人”，问题提取会明显更准。')
  }

  const extractQuestionsFromTranscript = (): void => {
    const nextQuestions = extractInterviewReviewQuestions(transcriptText)
    setQuestions(nextQuestions)
    setSelectedQuestionId(nextQuestions[0]?.id || '')
    setReviewReport(null)
    setReportStatus(nextQuestions.length ? '问题列表已更新，可以重新生成复盘报告。' : '还没有可生成报告的问题。')
    setReportCopyStatus('')
    setAnalysisStatus(nextQuestions.length ? `已提取 ${nextQuestions.length} 个疑似面试问题。` : '没有提取到明确问题。可以检查转写文本里是否有面试官问句，或手动补充问号。')
  }

  const buildCurrentReviewSnapshot = (): {
    nextQuestions: InterviewReviewExtractedQuestion[]
    nextAnswerAnalyses: InterviewReviewAnswerAnalysis[]
    nextReport: InterviewReviewReport
  } | null => {
    if (!transcriptText.trim()) {
      return null
    }

    const nextQuestions = questions.length > 0 ? questions : extractInterviewReviewQuestions(transcriptText)
    if (nextQuestions.length === 0) {
      return null
    }

    const nextAnswerAnalyses = analyzeInterviewReviewAnswers(transcriptText, nextQuestions)
    const nextReport = reviewReport || buildLocalInterviewReviewReport({
      transcriptText,
      questions: nextQuestions,
      answerAnalyses: nextAnswerAnalyses,
      fileName: result?.fileName || selectedFile?.name,
      durationSec: result?.durationSec
    })

    return { nextQuestions, nextAnswerAnalyses, nextReport }
  }

  const refreshUsageStats = async (): Promise<void> => {
    try {
      setUsageStats(await window.huomiantong.loadUsage())
    } catch {
      // 用量刷新失败不影响当前复盘结果展示。
    }
  }

  const generateDeepReport = async (): Promise<void> => {
    const snapshot = buildCurrentReviewSnapshot()

    if (!snapshot) {
      setDeepReportStatus('请先完成转写并提取到至少 1 个问题，再生成 AI 深度报告。')
      return
    }

    setQuestions(snapshot.nextQuestions)
    setReviewReport(snapshot.nextReport)
    setReportStatus('已自动准备本地报告底稿，正在生成 AI 深度报告。')
    setIsGeneratingDeepReport(true)
    setDeepReportStatus('正在调用当前回答模型生成深度报告...')

    try {
      const response = await window.huomiantong.generateInterviewReviewDeepReport({
        settings,
        title: defaultInterviewReviewTitle(settings, result?.fileName || selectedFile?.name),
        transcriptText,
        questions: toReviewQuestionRecords(snapshot.nextQuestions),
        answerAnalyses: toReviewAnswerAnalysisRecords(snapshot.nextAnswerAnalyses),
        localReportMarkdown: snapshot.nextReport.markdown,
        audioFileName: result?.fileName || selectedFile?.name,
        durationSec: result?.durationSec
      })

      setDeepReportText(response.reportMarkdown)
      setDeepReportStatus(`AI 深度报告已生成：${response.provider === 'local' ? '本地草案' : settings.providers[response.provider].model || response.provider}，耗时 ${(response.latencyMs / 1000).toFixed(1)} 秒。`)

      if (response.usage) {
        await refreshUsageStats()
      }
    } catch (deepReportError) {
      setDeepReportStatus(deepReportError instanceof Error ? `AI 深度报告失败：${deepReportError.message}` : 'AI 深度报告失败：未知错误。')
    } finally {
      setIsGeneratingDeepReport(false)
    }
  }

  const generateDeepTalk = async (): Promise<void> => {
    const snapshot = buildCurrentReviewSnapshot()

    if (!snapshot) {
      setDeepTalkStatus('请先完成转写并提取到至少 1 个问题，再生成 AI 深度话术。')
      return
    }

    const targetQuestion = selectedQuestion || snapshot.nextQuestions[0]
    const targetAnalysis = snapshot.nextAnswerAnalyses.find((analysis) => analysis.questionId === targetQuestion?.id)

    if (!targetQuestion) {
      setDeepTalkStatus('还没有可优化的问题。')
      return
    }

    setQuestions(snapshot.nextQuestions)
    setReviewReport(snapshot.nextReport)
    setIsGeneratingDeepTalk(true)
    setDeepTalkStatus(`正在为 Q${targetQuestion.order} 生成更自然的口语版...`)

    try {
      const response = await window.huomiantong.generateInterviewReviewDeepTalk({
        settings,
        question: targetQuestion.question,
        questionLabel: targetQuestion.intentLabel,
        answerText: targetAnalysis?.answerText || '',
        answerScore: targetAnalysis?.score,
        answerIssues: targetAnalysis?.issues,
        answerSuggestions: targetAnalysis?.suggestions,
        localReportMarkdown: snapshot.nextReport.markdown,
        targetLength: settings.answer.answerStyle === 'fast' ? 'short' : settings.answer.answerStyle === 'star' ? 'long' : 'standard'
      })

      setDeepTalkTitle(`Q${targetQuestion.order} ${response.title}`)
      setDeepTalkText(response.talkMarkdown)
      setDeepTalkStatus(`AI 深度话术已生成：${response.provider === 'local' ? '本地草案' : settings.providers[response.provider].model || response.provider}，耗时 ${(response.latencyMs / 1000).toFixed(1)} 秒。`)

      if (response.usage) {
        await refreshUsageStats()
      }
    } catch (deepTalkError) {
      setDeepTalkStatus(deepTalkError instanceof Error ? `AI 深度话术失败：${deepTalkError.message}` : 'AI 深度话术失败：未知错误。')
    } finally {
      setIsGeneratingDeepTalk(false)
    }
  }

  const generateLongAudioOptimization = (): void => {
    if (!selectedFile && !transcriptText.trim()) {
      setLongAudioStatus('请先选择录音或粘贴一段转写文本，再生成长录音优化建议。')
      return
    }

    const snapshot = buildCurrentReviewSnapshot()
    const nextQuestions = snapshot?.nextQuestions || questions
    const nextAnswerAnalyses = snapshot?.nextAnswerAnalyses || answerAnalyses
    const plan = buildLongAudioOptimizationMarkdown({
      selectedFile,
      result,
      transcriptText,
      questions: nextQuestions,
      answerAnalyses: nextAnswerAnalyses,
      detectedSpeakers
    })

    if (snapshot) {
      setQuestions(snapshot.nextQuestions)
      setReviewReport(snapshot.nextReport)
    }

    setLongAudioPlanText(plan)
    setLongAudioStatus('长录音优化建议已生成；这一步不消耗 Token。')
  }

  const copyEnhancementText = async (text: string, fallbackStatus: string, onStatus: (value: string) => void): Promise<void> => {
    if (!text.trim()) {
      onStatus(fallbackStatus)
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      onStatus('已复制到剪贴板。')
    } catch {
      onStatus('复制失败，可以手动选中文本复制。')
    }
  }

  const downloadEnhancementText = (
    title: string,
    text: string,
    format: 'md' | 'word',
    onStatus: (value: string) => void
  ): void => {
    if (!text.trim()) {
      onStatus(`还没有可下载的${title}。`)
      return
    }

    const baseTitle = defaultInterviewReviewTitle(settings, result?.fileName || selectedFile?.name)
    const fileName = safeFileName(`${baseTitle}-${title}`)

    if (format === 'word') {
      downloadText(`${fileName}.doc`, enhancementMarkdownToWordHtml(title, text), 'application/msword;charset=utf-8')
      onStatus(`${title} Word 已开始下载。`)
      return
    }

    downloadText(`${fileName}.md`, text)
    onStatus(`${title} MD 已开始下载。`)
  }

  const generateReviewReport = (): void => {
    if (!transcriptText.trim()) {
      setReportStatus('请先上传录音或粘贴一段面试转写文本。')
      return
    }

    const nextQuestions = questions.length > 0 ? questions : extractInterviewReviewQuestions(transcriptText)
    if (nextQuestions.length === 0) {
      setQuestions([])
      setSelectedQuestionId('')
      setReviewReport(null)
      setReportStatus('暂时没有识别到面试问题。建议给面试官问句补问号，或加“面试官：”标签后重试。')
      return
    }

    const nextAnswerAnalyses = analyzeInterviewReviewAnswers(transcriptText, nextQuestions)
    const nextReport = buildLocalInterviewReviewReport({
      transcriptText,
      questions: nextQuestions,
      answerAnalyses: nextAnswerAnalyses,
      fileName: result?.fileName || selectedFile?.name,
      durationSec: result?.durationSec
    })

    setQuestions(nextQuestions)
    setSelectedQuestionId((currentId) => currentId || nextQuestions[0]?.id || '')
    setReviewReport(nextReport)
    setReportCopyStatus('')
    setReportStatus(`已生成本地复盘报告：${nextReport.overview.questionCount} 个问题，平均 ${nextReport.overallScore || '-'} 分；本地分析不消耗模型 Token。`)
  }

  const copyReviewReport = async (): Promise<void> => {
    if (!reviewReport) {
      setReportCopyStatus('还没有可复制的复盘报告。')
      return
    }

    try {
      await navigator.clipboard.writeText(reviewReport.markdown)
      setReportCopyStatus('复盘报告已复制到剪贴板。')
    } catch {
      setReportCopyStatus('复制失败，可以手动选中下方 Markdown 复制。')
    }
  }

  const createCurrentReviewRecord = (title: string): InterviewReviewRecord | null => {
    if (!reviewReport) {
      return null
    }

    return buildInterviewReviewRecord({
      title,
      settings,
      transcriptText,
      questions,
      answerAnalyses,
      report: reviewReport,
      audioFileName: result?.fileName || selectedFile?.name,
      audioFileSize: result?.fileSize || selectedFile?.size,
      audioDurationSec: result?.durationSec
    })
  }

  const saveCurrentReview = async (): Promise<void> => {
    if (!reviewReport) {
      setSavedReviewStatus('请先生成复盘报告，再保存记录。')
      return
    }

    const defaultTitle = defaultInterviewReviewTitle(settings, result?.fileName || selectedFile?.name)
    const input = window.prompt('保存复盘记录名称', defaultTitle)
    if (input === null) {
      setSavedReviewStatus('已取消保存。')
      return
    }

    const record = createCurrentReviewRecord(input.trim() || defaultTitle)
    if (!record) {
      setSavedReviewStatus('保存失败：当前没有可保存的报告。')
      return
    }

    try {
      const nextRecords = await window.huomiantong.saveInterviewReview(record)
      setSavedReviews(nextRecords)
      setSavedReviewStatus(`已保存复盘记录：${record.title}；仅保存文字和报告，不保存原始录音。`)
    } catch (saveError) {
      setSavedReviewStatus(saveError instanceof Error ? `保存失败：${saveError.message}` : '保存失败：未知错误。')
    }
  }

  const exportCurrentReview = (format: 'md' | 'word'): void => {
    if (!reviewReport) {
      setSavedReviewStatus('请先生成复盘报告，再导出文件。')
      return
    }

    const title = defaultInterviewReviewTitle(settings, result?.fileName || selectedFile?.name)
    const record = createCurrentReviewRecord(title)
    if (!record) {
      setSavedReviewStatus('导出失败：当前没有可导出的报告。')
      return
    }

    exportReviewRecord(record, format)
  }

  const exportReviewRecord = (record: InterviewReviewRecord, format: 'md' | 'word'): void => {
    const fileName = interviewReviewExportFileName(record)
    if (format === 'word') {
      downloadText(`${fileName}.doc`, interviewReviewRecordToWordHtml(record, privacyMode), 'application/msword;charset=utf-8')
      setSavedReviewStatus(`已导出 Word：${record.title}${privacyMode ? '（已按隐私模式脱敏）' : '（未脱敏）'}`)
      return
    }

    downloadText(`${fileName}.md`, interviewReviewRecordToMarkdown(record, privacyMode))
    setSavedReviewStatus(`已导出 MD：${record.title}${privacyMode ? '（已按隐私模式脱敏）' : '（未脱敏）'}`)
  }

  const deleteSavedReview = async (record: InterviewReviewRecord): Promise<void> => {
    if (!window.confirm(`确定删除复盘记录“${record.title}”吗？`)) {
      return
    }

    try {
      const nextRecords = await window.huomiantong.deleteInterviewReviews([record.id])
      setSavedReviews(nextRecords)
      setSavedReviewStatus(`已删除复盘记录：${record.title}`)
    } catch (deleteError) {
      setSavedReviewStatus(deleteError instanceof Error ? `删除失败：${deleteError.message}` : '删除失败：未知错误。')
    }
  }

  return (
    <section className="interview-review-page" data-onboarding-target="interview-review">
      <div className="interview-review-hero">
        <div>
          <span className="eyebrow">Interview Review</span>
          <h3>面试复盘</h3>
          <p>上传真实面试录音，先转成可编辑文字；后续会继续接问题提取、回答质量分析和完整复盘报告。</p>
        </div>
        <div className="interview-review-hero-badges">
          <span className={deepgramKeyReady ? 'ready' : 'warn'}>
            {deepgramKeyReady ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            Deepgram {deepgramKeyReady ? '已配置' : '未配置'}
          </span>
          <span>
            <ShieldCheck size={15} />
            原始录音不落库
          </span>
          <span className={privacyMode ? 'ready' : 'warn'}>
            <LockKeyhole size={15} />
            隐私模式{privacyMode ? '已开' : '未开'}
          </span>
        </div>
      </div>

      <div className="interview-review-grid">
        <section className="panel interview-review-upload-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Audio Upload</span>
              <h3>上传录音</h3>
            </div>
          </div>

          <input ref={fileInputRef} accept={audioAccept} className="sr-only-input" onChange={handleFileChange} type="file" />

          <button
            className={isDragOver ? 'interview-review-dropzone dragging' : 'interview-review-dropzone'}
            onClick={pickFile}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDropFile}
            type="button"
          >
            <span className="interview-review-drop-icon">
              <UploadCloud size={26} />
            </span>
            <strong>{selectedFile ? selectedFile.name : '点击选择，或把录音拖到这里'}</strong>
            <small>支持 mp3、wav、m4a、mp4、webm、ogg、flac；第一版建议 120MB 以内。</small>
          </button>

          {selectedFile && (
            <div className="interview-review-file-card">
              <FileAudio size={20} />
              <div>
                <strong>{selectedFile.name}</strong>
                <span>{formatFileSize(selectedFile.size)} · {selectedFile.type || '未知类型'}</span>
              </div>
            </div>
          )}

          <div className="interview-review-usage-card">
            <article>
              <DollarSign size={17} />
              <div>
                <strong>用量提醒</strong>
                <span>{reviewUsageText}</span>
              </div>
            </article>
            <article>
              <ShieldCheck size={17} />
              <div>
                <strong>隐私提醒</strong>
                <span>原始录音只用于本次 Deepgram 文件转写，软件不会默认保存音频文件；保存记录只保存文字、问题、分析和报告。</span>
              </div>
            </article>
          </div>

          {!deepgramKeyReady && (
            <div className="interview-review-alert">
              <AlertCircle size={17} />
              <div>
                <strong>需要先配置 Deepgram Key</strong>
                <span>这个模块复用「设置中心 → 语音转写」里的 Deepgram Key。</span>
              </div>
              <button className="ghost-button compact" type="button" onClick={onOpenSettings}>
                去设置
              </button>
            </div>
          )}

          <div className="interview-review-actions">
            <button className="primary-button" disabled={!canTranscribe} onClick={() => void transcribeFile()} type="button">
              {isTranscribing ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
              {isTranscribing ? '转写中' : '开始转写'}
            </button>
            <button className="ghost-button" onClick={clearAll} type="button">
              <RotateCcw size={16} />
              清空
            </button>
          </div>

          <div className={error ? 'interview-review-status error' : 'interview-review-status'}>
            {error || status}
          </div>
        </section>

        <section className="panel interview-review-result-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">Transcript</span>
              <h3>转写结果</h3>
            </div>
            <button className="ghost-button compact" onClick={() => void copyTranscript()} type="button">
              <ClipboardCopy size={15} />
              复制
            </button>
          </div>

          <div className="interview-review-meta-row">
            <span>时长：{formatDuration(result?.durationSec)}</span>
            <span>置信度：{formatConfidence(result?.confidence)}</span>
            <span>片段：{result?.utterances.length || 0}</span>
            <span>模型：{result?.model || 'nova-3'}</span>
          </div>

          {detectedSpeakers.length > 0 && (
            <div className="interview-review-speaker-card">
              <div className="interview-review-speaker-head">
                <UsersRound size={17} />
                <div>
                  <strong>发言人命名</strong>
                  <small>确认谁是面试官、谁是候选人；应用后会自动重排转写并重新提取问题。</small>
                </div>
              </div>
              <div className="interview-review-speaker-list">
                {detectedSpeakers.map((speaker) => (
                  <label key={speaker}>
                    <span>{speaker}</span>
                    <select
                      onChange={(event) => updateSpeakerAlias(speaker, { role: event.target.value as ReviewSpeakerRole })}
                      value={speakerAliases[speaker]?.role || 'other'}
                    >
                      <option value="interviewer">面试官</option>
                      <option value="candidate">候选人</option>
                      <option value="other">其他人</option>
                    </select>
                    <input
                      onChange={(event) => updateSpeakerAlias(speaker, { name: event.target.value })}
                      placeholder="可选姓名/备注"
                      value={speakerAliases[speaker]?.name || ''}
                    />
                  </label>
                ))}
              </div>
              <div className="interview-review-speaker-actions">
                <button className="ghost-button compact" onClick={applySpeakerAliases} type="button">
                  应用命名并重新提取
                </button>
                {speakerStatus && <small>{speakerStatus}</small>}
              </div>
            </div>
          )}

          <textarea
            className="interview-review-textarea"
            onChange={(event) => handleTranscriptChange(event.target.value)}
            placeholder="转写完成后会显示在这里。你可以手动修正错别字，再进入后续的问题提取和复盘报告。"
            value={transcriptText}
          />
          {copyStatus && <small className="interview-review-copy-status">{copyStatus}</small>}
        </section>
      </div>

      <section className="panel interview-review-question-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Question Mining</span>
            <h3>面试问题提取</h3>
          </div>
          <button className="primary-button compact" onClick={extractQuestionsFromTranscript} type="button" disabled={!transcriptText.trim()}>
            <SearchCheck size={15} />
            重新提取问题
          </button>
        </div>

        <div className="interview-review-question-summary">
          <span><ListChecks size={15} /> 共 {questions.length} 个问题</span>
          <span>已匹配回答 {answerSummary.answeredCount}/{questions.length}</span>
          <span>平均质量 {answerSummary.averageScore || '-'} 分</span>
          {answerSummary.riskCount > 0 && <span>高风险 {answerSummary.riskCount} 个</span>}
          {questionSummary.slice(0, 5).map((item) => (
            <span key={item.label}>{item.label} × {item.count}</span>
          ))}
          <small>{analysisStatus}</small>
        </div>

        {questions.length > 0 ? (
          <div className="interview-review-question-layout">
            <div className="interview-review-question-list" aria-label="提取到的面试问题">
              {questions.map((item) => (
                <button
                  className={selectedQuestion?.id === item.id ? 'active' : ''}
                  key={item.id}
                  onClick={() => setSelectedQuestionId(item.id)}
                  type="button"
                >
                  <span>Q{item.order}</span>
                  <strong>{item.question}</strong>
                  <small>
                    {item.intentLabel} · {answerAnalyses.find((analysis) => analysis.questionId === item.id)?.score ?? '-'} 分 · {formatQuestionSource(item.source)}
                  </small>
                </button>
              ))}
            </div>

            {selectedQuestion && (
              <article className="interview-review-question-detail">
                <div className="interview-review-question-detail-head">
                  <span>Q{selectedQuestion.order}</span>
                  <strong>{selectedQuestion.intentLabel}</strong>
                  <small>{selectedQuestion.startSec === undefined ? '无时间戳' : `约 ${formatDuration(selectedQuestion.startSec)}`}</small>
                </div>
                <h4>{selectedQuestion.question}</h4>
                <div className="interview-review-question-tags">
                  <span>置信度 {selectedQuestion.confidence}%</span>
                  <span>{formatQuestionSource(selectedQuestion.source)}</span>
                  {selectedQuestion.speaker && <span>{selectedQuestion.speaker}</span>}
                </div>
                {(selectedQuestion.contextBefore || selectedQuestion.contextAfter) && (
                  <div className="interview-review-question-context">
                    {selectedQuestion.contextBefore && <p><strong>前文：</strong>{selectedQuestion.contextBefore}</p>}
                    {selectedQuestion.contextAfter && <p><strong>后文：</strong>{selectedQuestion.contextAfter}</p>}
                  </div>
                )}
                {selectedAnswerAnalysis && (
                  <div className={`interview-review-answer-analysis ${selectedAnswerAnalysis.level}`}>
                    <div className="interview-review-answer-head">
                      <span>{formatAnswerLevel(selectedAnswerAnalysis.level)}</span>
                      <strong>{selectedAnswerAnalysis.score} 分</strong>
                      <small>{selectedAnswerAnalysis.wordCount} 字左右</small>
                    </div>
                    <div className="interview-review-answer-metrics">
                      <span>贴题 {selectedAnswerAnalysis.metrics.relevance}</span>
                      <span>完整 {selectedAnswerAnalysis.metrics.completeness}</span>
                      <span>简洁 {selectedAnswerAnalysis.metrics.concision}</span>
                      <span>{getInterviewReviewEvidenceMetricLabel(selectedQuestion)} {selectedAnswerAnalysis.metrics.evidence}</span>
                    </div>
                    <div className="interview-review-answer-text">
                      <strong>识别到的回答片段</strong>
                      <p>{selectedAnswerAnalysis.answerText || '暂时没有识别到回答片段。'}</p>
                    </div>
                    {selectedAnswerAnalysis.issues.length > 0 && (
                      <div className="interview-review-answer-list">
                        <strong>问题点</strong>
                        {selectedAnswerAnalysis.issues.map((issue) => (
                          <span key={issue}>{issue}</span>
                        ))}
                      </div>
                    )}
                    <div className="interview-review-answer-list">
                      <strong>优化建议</strong>
                      {selectedAnswerAnalysis.suggestions.map((suggestion) => (
                        <span key={suggestion}>{suggestion}</span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            )}
          </div>
        ) : (
          <div className="interview-review-question-empty">
            <strong>还没有问题列表</strong>
            <span>上传录音并转写后会自动提取；如果转写文本没有标点，可以手动加问号后重新提取。</span>
          </div>
        )}
      </section>

      <section className="panel interview-review-report-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Review Report</span>
            <h3>整场复盘报告</h3>
          </div>
          <div className="interview-review-report-actions">
            <button className="primary-button compact" onClick={generateReviewReport} type="button" disabled={!transcriptText.trim()}>
              <BarChart3 size={15} />
              生成复盘报告
            </button>
            <button className="ghost-button compact" onClick={() => void saveCurrentReview()} type="button" disabled={!reviewReport}>
              <Save size={15} />
              保存记录
            </button>
            <button className="ghost-button compact" onClick={() => exportCurrentReview('md')} type="button" disabled={!reviewReport}>
              <Download size={15} />
              导出 MD
            </button>
            <button className="ghost-button compact" onClick={() => exportCurrentReview('word')} type="button" disabled={!reviewReport}>
              <Download size={15} />
              导出 Word
            </button>
            <button className="ghost-button compact" onClick={() => void copyReviewReport()} type="button" disabled={!reviewReport}>
              <ClipboardCopy size={15} />
              复制报告
            </button>
          </div>
        </div>

        <div className="interview-review-report-status">
          <FileText size={15} />
          <span>{reportCopyStatus || reportStatus}</span>
        </div>

        <div className="interview-review-privacy-strip">
          <LockKeyhole size={15} />
          <span>{reviewPrivacyText}</span>
          {!privacyMode && (
            <button className="ghost-button compact" onClick={onOpenSettings} type="button">
              去开启
            </button>
          )}
        </div>

        {reviewReport ? (
          <div className="interview-review-report-body">
            <div className="interview-review-report-kpis">
              <article>
                <span>整体评分</span>
                <strong>{reviewReport.overallScore || '-'}</strong>
                <small>{reviewReport.overallLevel}</small>
              </article>
              <article>
                <span>识别问题</span>
                <strong>{reviewReport.overview.questionCount}</strong>
                <small>已答 {reviewReport.overview.answeredCount}</small>
              </article>
              <article>
                <span>风险回答</span>
                <strong>{reviewReport.overview.riskCount}</strong>
                <small>需优先处理</small>
              </article>
              <article>
                <span>依据均分</span>
                <strong>{reviewReport.overview.averageEvidence || '-'}</strong>
                <small>按题型评估</small>
              </article>
            </div>

            <div className="interview-review-report-headline">
              <strong>一句话结论</strong>
              <p>{reviewReport.headline}</p>
            </div>

            <div className="interview-review-report-grid">
              <article>
                <strong>表现亮点</strong>
                {reviewReport.strengths.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </article>
              <article>
                <strong>主要薄弱点</strong>
                {reviewReport.weakPoints.map((item) => (
                  <span key={item.title}>
                    <b>{item.title}</b>：{item.detail}
                  </span>
                ))}
              </article>
              <article>
                <strong>下一步训练</strong>
                {reviewReport.actionPlan.map((item) => (
                  <span key={item.title}>
                    <b>{item.title}</b>：{item.detail}
                  </span>
                ))}
              </article>
            </div>

            <div className="interview-review-report-insights">
              <article>
                <strong>高风险回答</strong>
                {reviewReport.highRiskAnswers.length > 0 ? (
                  reviewReport.highRiskAnswers.map((item) => (
                    <button key={`${item.questionOrder}-${item.score}`} onClick={() => setSelectedQuestionId(questions[item.questionOrder - 1]?.id || selectedQuestionId)} type="button">
                      <span>Q{item.questionOrder} · {item.score} 分 · {item.typeLabel}</span>
                      <b>{item.question}</b>
                      <small>{item.issueSummary}</small>
                    </button>
                  ))
                ) : (
                  <p>没有明显高风险回答。</p>
                )}
              </article>
              <article>
                <strong>可沉淀回答</strong>
                {reviewReport.excellentAnswers.length > 0 ? (
                  reviewReport.excellentAnswers.map((item) => (
                    <button key={`${item.questionOrder}-${item.score}`} onClick={() => setSelectedQuestionId(questions[item.questionOrder - 1]?.id || selectedQuestionId)} type="button">
                      <span>Q{item.questionOrder} · {item.score} 分 · {item.typeLabel}</span>
                      <b>{item.question}</b>
                      <small>{item.suggestion}</small>
                    </button>
                  ))
                ) : (
                  <p>暂时没有识别到高分回答。</p>
                )}
              </article>
            </div>

            <textarea className="interview-review-report-markdown" readOnly value={reviewReport.markdown} />
          </div>
        ) : (
          <div className="interview-review-question-empty">
            <strong>还没有生成报告</strong>
            <span>完成转写后点击“生成复盘报告”，系统会先用本地规则输出一版整场报告，不消耗 Token。</span>
          </div>
        )}

        <div className="interview-review-saved-records">
          <div className="interview-review-saved-records-head">
            <div>
              <strong>最近保存</strong>
              <span>{savedReviewStatus}</span>
            </div>
            <small>{savedReviews.length} 条</small>
          </div>
          {savedReviews.length > 0 ? (
            <div className="interview-review-saved-list">
              {savedReviews.slice(0, 5).map((record) => (
                <article key={record.id}>
                  <div>
                    <strong>{record.title}</strong>
                    <span>
                      {formatRecordTime(record.updatedAt)} · {record.questionCount} 问 · {record.overallScore || '-'} 分 · 风险 {record.riskCount}
                    </span>
                  </div>
                  <div className="interview-review-saved-actions">
                    <button className="ghost-button compact" onClick={() => exportReviewRecord(record, 'md')} type="button">
                      MD
                    </button>
                    <button className="ghost-button compact" onClick={() => exportReviewRecord(record, 'word')} type="button">
                      Word
                    </button>
                    <button className="danger-button compact" onClick={() => void deleteSavedReview(record)} type="button">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="interview-review-saved-empty">
              生成报告后点击“保存记录”，这里会显示最近 5 条复盘。
            </div>
          )}
        </div>
      </section>

      <section className="panel interview-review-next-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">AI Preview</span>
            <h3>报告增强与预览下载</h3>
          </div>
        </div>
        <div className="interview-review-next-grid">
          <article>
            <strong>AI 深度报告</strong>
            <span>整场面试的教练版复盘：总结高风险问题、表达薄弱点、岗位匹配建议和下一步训练方向。</span>
            <div className="interview-review-next-actions">
              <button className="primary-button compact" disabled={!transcriptText.trim() || isGeneratingDeepReport} onClick={() => void generateDeepReport()} type="button">
                {isGeneratingDeepReport ? <Loader2 className="spin" size={15} /> : <BarChart3 size={15} />}
                {isGeneratingDeepReport ? '生成中' : '生成深度报告'}
              </button>
            </div>
            <small>{deepReportStatus}</small>
            <EnhancementPreview
              title="AI 深度报告"
              text={deepReportText}
              placeholder="生成后会先在这里预览，确认内容靠谱后再复制或下载。"
              onCopy={() => void copyEnhancementText(deepReportText, '还没有可复制的 AI 深度报告。', setDeepReportStatus)}
              onDownloadMd={() => downloadEnhancementText('AI 深度报告', deepReportText, 'md', setDeepReportStatus)}
              onDownloadWord={() => downloadEnhancementText('AI 深度报告', deepReportText, 'word', setDeepReportStatus)}
            />
          </article>
          <article>
            <strong>AI 深度话术</strong>
            <span>针对当前选中的那一道题，改成更像真人现场说出来的回答，并补一版可能追问的备选口径。</span>
            <div className="interview-review-next-actions">
              <button className="primary-button compact" disabled={!transcriptText.trim() || isGeneratingDeepTalk} onClick={() => void generateDeepTalk()} type="button">
                {isGeneratingDeepTalk ? <Loader2 className="spin" size={15} /> : <FileText size={15} />}
                {isGeneratingDeepTalk ? '生成中' : '生成选中题话术'}
              </button>
            </div>
            <small>{deepTalkStatus}</small>
            <EnhancementPreview
              title={deepTalkTitle}
              text={deepTalkText}
              placeholder="选中左侧某个问题后生成，预览确认自然度，再复制到个人答案库。"
              onCopy={() => void copyEnhancementText(deepTalkText, '还没有可复制的 AI 深度话术。', setDeepTalkStatus)}
              onDownloadMd={() => downloadEnhancementText(deepTalkTitle, deepTalkText, 'md', setDeepTalkStatus)}
              onDownloadWord={() => downloadEnhancementText(deepTalkTitle, deepTalkText, 'word', setDeepTalkStatus)}
            />
          </article>
          <article>
            <strong>长录音优化</strong>
            <span>不消耗 Token，专门检查 20-60 分钟录音的分段、说话人命名、漏题和失败重试顺序。</span>
            <div className="interview-review-next-actions">
              <button className="primary-button compact" disabled={!selectedFile && !transcriptText.trim()} onClick={generateLongAudioOptimization} type="button">
                <RefreshCw size={15} />
                生成优化建议
              </button>
            </div>
            <small>{longAudioStatus}</small>
            <EnhancementPreview
              title="长录音优化建议"
              text={longAudioPlanText}
              placeholder="上传或粘贴长录音转写后生成，先看建议是否有用，再下载给自己复核。"
              onCopy={() => void copyEnhancementText(longAudioPlanText, '还没有可复制的长录音优化建议。', setLongAudioStatus)}
              onDownloadMd={() => downloadEnhancementText('长录音优化建议', longAudioPlanText, 'md', setLongAudioStatus)}
              onDownloadWord={() => downloadEnhancementText('长录音优化建议', longAudioPlanText, 'word', setLongAudioStatus)}
            />
          </article>
        </div>
      </section>
    </section>
  )
}
