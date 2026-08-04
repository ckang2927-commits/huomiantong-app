import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdirSync, rmSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const root = process.cwd()
const outDir = join(tmpdir(), `huomiantong-long-audio-${Date.now()}`)

mkdirSync(outDir, { recursive: true })

try {
  execFileSync(
    process.execPath,
    [
      'node_modules/typescript/bin/tsc',
      'src/renderer/lib/longAudioOptimization.ts',
      'src/renderer/lib/interviewReviewAnalyzer.ts',
      'src/shared/questionIntent.ts',
      'src/shared/types.ts',
      '--module',
      'commonjs',
      '--target',
      'ES2022',
      '--moduleResolution',
      'node',
      '--outDir',
      outDir,
      '--skipLibCheck',
      '--esModuleInterop'
    ],
    { cwd: root, stdio: 'pipe' }
  )

  const requireFromTemp = createRequire(join(outDir, 'runner.cjs'))
  const { buildLongAudioOptimizationMarkdown } = requireCompiled(requireFromTemp, 'longAudioOptimization.js')
  const twentyMinutePlan = buildLongAudioOptimizationMarkdown(buildInput({ durationSec: 20 * 60, sizeMb: 35, utteranceCount: 80, questionCount: 5, riskCount: 0, speakers: ['说话人 1', '说话人 2'] }))
  const sixtyMinutePlan = buildLongAudioOptimizationMarkdown(buildInput({ durationSec: 60 * 60, sizeMb: 95, utteranceCount: 180, questionCount: 2, riskCount: 2, speakers: [] }))
  const noResultPlan = buildLongAudioOptimizationMarkdown(buildInput({ durationSec: 0, sizeMb: 2, utteranceCount: 0, questionCount: 0, riskCount: 0, speakers: [] }))
  const results = [
    validateTwentyMinutePlan(twentyMinutePlan),
    validateSixtyMinutePlan(sixtyMinutePlan),
    validateNoResultPlan(noResultPlan),
    validateDeepgramTimeoutCopy()
  ]
  const failed = results.filter((item) => !item.ok)

  for (const result of results) {
    const status = result.ok ? 'PASS' : 'FAIL'
    console.log(`${status} ${result.name}`)
    for (const detail of result.details) {
      console.log(`  ${detail}`)
    }
    if (result.errors.length) {
      console.log(`  errors: ${result.errors.join('；')}`)
    }
  }

  if (failed.length) {
    console.error(`\n长录音本地策略回归失败：${failed.length}/${results.length}`)
    process.exitCode = 1
  } else {
    console.log(`\n长录音本地策略回归通过：${results.length}/${results.length}`)
  }
} finally {
  rmSync(outDir, { recursive: true, force: true })
}

function validateTwentyMinutePlan(plan) {
  const errors = []

  expect(plan.includes('# 长录音优化建议'), '应生成长录音优化标题', errors)
  expect(plan.includes('音频时长：20 分钟'), '20 分钟录音应显示时长', errors)
  expect(plan.includes('20 分钟左右切分复查'), '20 分钟录音应建议 20 分钟切分策略', errors)
  expect(plan.includes('预计 1 段'), '20 分钟录音应给出预计段数', errors)
  expect(plan.includes('已识别到 2 类发言人'), '有说话人时应提示先校正角色', errors)

  return {
    name: '20 分钟录音策略建议',
    ok: errors.length === 0,
    details: [excerpt(plan)],
    errors
  }
}

function validateSixtyMinutePlan(plan) {
  const errors = []

  expect(plan.includes('音频时长：60 分钟'), '60 分钟录音应显示时长', errors)
  expect(plan.includes('15 分钟左右切分复查'), '60 分钟录音应建议 15 分钟切分策略', errors)
  expect(plan.includes('预计 4 段'), '60 分钟录音应给出预计段数', errors)
  expect(plan.includes('当前片段数 180'), '高片段数应提示转写偏碎', errors)
  expect(plan.includes('问题提取偏少'), '长文本但问题少时应提示漏题排查', errors)
  expect(plan.includes('有 2 个高风险回答'), '高风险回答应提示优先生成话术', errors)
  expect(plan.includes('如果 Deepgram 超时或 60 分钟录音失败'), '60 分钟失败重试文案应存在', errors)

  return {
    name: '60 分钟录音策略建议',
    ok: errors.length === 0,
    details: [excerpt(plan)],
    errors
  }
}

function validateNoResultPlan(plan) {
  const errors = []

  expect(plan.includes('音频时长：待 Deepgram 返回'), '未转写时应提示等待 Deepgram 返回时长', errors)
  expect(plan.includes('暂未识别到发言人标签'), '未识别发言人时应提示补标签', errors)
  expect(plan.includes('推荐验收顺序'), '应保留手动复核顺序', errors)

  return {
    name: '未完成转写时仍有可见建议',
    ok: errors.length === 0,
    details: [excerpt(plan)],
    errors
  }
}

function validateDeepgramTimeoutCopy() {
  const errors = []
  const serviceSource = readFileSync(join(root, 'src/main/services/interviewReviewService.ts'), 'utf8')

  expect(serviceSource.includes('MIN_DEEPGRAM_TIMEOUT_MS = 180_000'), 'Deepgram 文件转写最短超时应为 3 分钟', errors)
  expect(serviceSource.includes('MAX_DEEPGRAM_TIMEOUT_MS = 600_000'), 'Deepgram 文件转写最长超时应为 10 分钟', errors)
  expect(serviceSource.includes('裁成 20 分钟左右的小段再上传'), '超时错误应提示按 20 分钟左右分段上传', errors)
  expect(serviceSource.includes('长录音优化'), '超时错误应提示查看长录音优化建议', errors)

  return {
    name: 'Deepgram 超时和失败重试文案',
    ok: errors.length === 0,
    details: ['checked interviewReviewService.ts'],
    errors
  }
}

function buildInput({ durationSec, sizeMb, utteranceCount, questionCount, riskCount, speakers }) {
  return {
    selectedFile: { name: durationSec >= 45 * 60 ? 'long-60min.wav' : 'middle-20min.wav', size: sizeMb * 1024 * 1024 },
    result: durationSec
      ? {
          transcript: 'sample',
          provider: 'deepgram',
          model: 'nova-3',
          fileName: durationSec >= 45 * 60 ? 'long-60min.wav' : 'middle-20min.wav',
          fileSize: sizeMb * 1024 * 1024,
          mimeType: 'audio/wav',
          durationSec,
          utterances: Array.from({ length: utteranceCount }, (_, index) => ({ speaker: String(index % 2), text: `片段 ${index + 1}` })),
          latencyMs: 1000
        }
      : null,
    transcriptText: durationSec >= 45 * 60 ? '这是一段很长的转写。'.repeat(140) : '短转写文本。',
    questions: Array.from({ length: questionCount }, (_, index) => ({
      id: `q${index + 1}`,
      order: index + 1,
      segmentIndex: index,
      question: `问题 ${index + 1}`,
      originalText: `问题 ${index + 1}`,
      intentCategory: 'general',
      intentLabel: '通用问题',
      confidence: 80,
      source: 'speaker',
      contextBefore: '',
      contextAfter: ''
    })),
    answerAnalyses: Array.from({ length: Math.max(questionCount, riskCount) }, (_, index) => ({
      questionId: `q${index + 1}`,
      answerText: '候选人回答',
      wordCount: 20,
      score: index < riskCount ? 45 : 78,
      level: index < riskCount ? 'risk' : 'good',
      metrics: { relevance: 70, completeness: 70, concision: 80, evidence: 65 },
      issues: [],
      suggestions: []
    })),
    detectedSpeakers: speakers
  }
}

function expect(condition, message, errors) {
  if (!condition) {
    errors.push(message)
  }
}

function excerpt(text) {
  return text.replace(/\s+/g, ' ').slice(0, 180)
}

function requireCompiled(requireFromTemp, fileName) {
  const candidates = [join(outDir, 'renderer', 'lib', fileName), join(outDir, 'lib', fileName), join(outDir, fileName)]
  let lastError

  for (const candidate of candidates) {
    try {
      return requireFromTemp(candidate)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}
