import type { InterviewReviewTranscriptionResult } from '../../shared/types'
import type { InterviewReviewAnswerAnalysis, InterviewReviewExtractedQuestion } from './interviewReviewAnalyzer'

export type LongAudioOptimizationFile = {
  name: string
  size: number
}

export type LongAudioOptimizationInput = {
  selectedFile: LongAudioOptimizationFile | null
  result: InterviewReviewTranscriptionResult | null
  transcriptText: string
  questions: InterviewReviewExtractedQuestion[]
  answerAnalyses: InterviewReviewAnswerAnalysis[]
  detectedSpeakers: string[]
}

export function buildLongAudioOptimizationMarkdown(input: LongAudioOptimizationInput): string {
  const durationSec = input.result?.durationSec
  const durationMinutes = durationSec ? Math.ceil(durationSec / 60) : 0
  const fileSizeText = input.selectedFile ? formatLongAudioFileSize(input.selectedFile.size) : '未知'
  const utteranceCount = input.result?.utterances.length || 0
  const averageAnswerScore = input.answerAnalyses.length
    ? Math.round(input.answerAnalyses.reduce((sum, item) => sum + item.score, 0) / input.answerAnalyses.length)
    : 0
  const riskCount = input.answerAnalyses.filter((item) => item.level === 'risk').length
  const isLong = durationMinutes >= 20 || (input.selectedFile?.size || 0) >= 30 * 1024 * 1024
  const isVeryLong = durationMinutes >= 45 || (input.selectedFile?.size || 0) >= 80 * 1024 * 1024
  const splitMinutes = isVeryLong ? 15 : 20
  const estimatedChunks = durationMinutes ? Math.max(1, Math.ceil(durationMinutes / splitMinutes)) : '待转写后判断'

  const recommendations = [
    isLong
      ? `建议按 ${splitMinutes} 分钟左右切分复查，预计 ${estimatedChunks} 段；长录音不要只看一次自动提取结果。`
      : '当前不像长录音，但仍建议先确认发言人角色，再生成报告。',
    input.detectedSpeakers.length
      ? `已识别到 ${input.detectedSpeakers.length} 类发言人：先把提问方设为“面试官”，作答方设为“候选人”，再重新提取问题。`
      : '暂未识别到发言人标签：建议在转写文本里补“面试官：/候选人：”后重新提取。',
    utteranceCount > 120
      ? `当前片段数 ${utteranceCount}，说明原始转写偏碎；系统已做连续说话合并，但仍建议人工扫一遍关键问答边界。`
      : `当前片段数 ${utteranceCount || '未知'}，碎片压力不算高。`,
    input.questions.length <= 3 && input.transcriptText.length > 1200
      ? '问题提取偏少：优先检查面试官是否被标成候选人，或在关键问句后补问号。'
      : `当前已提取 ${input.questions.length} 个问题，可先按高风险问题逐个复盘。`,
    riskCount > 0
      ? `有 ${riskCount} 个高风险回答：建议优先生成 AI 深度话术，把长回答压缩成 100-300 字。`
      : '暂未发现明显高风险回答，可以重点优化表达自然度和证据感。',
    '如果 Deepgram 超时或 60 分钟录音失败：先重试一次；仍失败就裁剪成 15-20 分钟小段分别上传。'
  ]

  return [
    '# 长录音优化建议',
    '',
    `- 文件：${input.selectedFile?.name || input.result?.fileName || '未选择'}`,
    `- 文件大小：${fileSizeText}`,
    `- 音频时长：${durationMinutes ? `${durationMinutes} 分钟` : '待 Deepgram 返回'}`,
    `- 转写片段：${utteranceCount || '待转写'}`,
    `- 识别问题：${input.questions.length}`,
    `- 平均回答质量：${averageAnswerScore || '-'}`,
    '',
    '## 建议动作',
    ...recommendations.map((item) => `- ${item}`),
    '',
    '## 推荐验收顺序',
    '1. 先确认发言人命名是否正确。',
    '2. 点“重新提取问题”。',
    '3. 先检查问题列表是否接近腾讯会议转写的粒度。',
    '4. 再生成本地报告、AI 深度报告和 AI 深度话术。',
    '5. 如果长录音明显漏题，按 15-20 分钟切段后逐段复盘。'
  ].join('\n')
}

function formatLongAudioFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}
