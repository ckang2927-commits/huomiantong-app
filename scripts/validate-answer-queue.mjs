import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const root = process.cwd()
const outDir = join(tmpdir(), `huomiantong-answer-queue-${Date.now()}`)

mkdirSync(outDir, { recursive: true })

try {
  execFileSync(
    process.execPath,
    [
      'node_modules/typescript/bin/tsc',
      'src/renderer/lib/answerQueueMachine.ts',
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
  const queueMachine = requireCompiled(requireFromTemp, 'answerQueueMachine.js')
  const results = [
    validateIdleQuestionStartsImmediately(queueMachine),
    validateMultipleQuestionsQueueInFifo(queueMachine),
    validateFinishContinuesNextQuestion(queueMachine),
    validateCachedAnswerContinuesNextQuestion(queueMachine),
    validateResetClearsQueue(queueMachine),
    validateQueuedItemKeepsReviewFields(queueMachine)
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
    console.error(`\n问题队列本地回归失败：${failed.length}/${results.length}`)
    process.exitCode = 1
  } else {
    console.log(`\n问题队列本地回归通过：${results.length}/${results.length}`)
  }
} finally {
  rmSync(outDir, { recursive: true, force: true })
}

function validateIdleQuestionStartsImmediately(machine) {
  const errors = []
  const ids = idFactory()
  const state = machine.createAnswerQueueState()
  const item = machine.createQueuedAnswer('  第一题：介绍一个指标体系项目  ', buildTranscript('第一题'), ids)
  const result = machine.receiveQuestionWhileGenerating(state, item)

  expect(result.queued === false, '空闲状态下第一题不应进入队列', errors)
  expect(result.state.isGenerating === true, '空闲收到问题后应进入生成中', errors)
  expect(result.state.activeQuestion === '第一题：介绍一个指标体系项目', '当前问题应保存为去空格后的题目', errors)
  expect(result.state.queuedAnswers.length === 0, '第一题直接生成时队列应为空', errors)

  return {
    name: '空闲时第一题直接生成',
    ok: errors.length === 0,
    details: [`active: ${result.state.activeQuestion}`, `queued: ${result.state.queuedAnswers.length}`],
    errors
  }
}

function validateMultipleQuestionsQueueInFifo(machine) {
  const errors = []
  const ids = idFactory()
  const q1 = machine.createQueuedAnswer('第一题', buildTranscript('第一题'), ids)
  const q2 = machine.createQueuedAnswer('第二题', buildTranscript('第二题'), ids)
  const q3 = machine.createQueuedAnswer('第三题', buildTranscript('第三题'), ids)

  let current = machine.receiveQuestionWhileGenerating(machine.createAnswerQueueState(), q1).state
  current = machine.receiveQuestionWhileGenerating(current, q2).state
  current = machine.receiveQuestionWhileGenerating(current, q3).state

  expect(current.activeQuestion === '第一题', '生成中 activeQuestion 应保留第一题', errors)
  expect(current.queuedAnswers.length === 2, '第二题和第三题应进入队列', errors)
  expect(current.queuedAnswers.map((item) => item.question).join('>') === '第二题>第三题', '队列顺序应保持 FIFO', errors)

  return {
    name: '生成中连续问题按 FIFO 排队',
    ok: errors.length === 0,
    details: [`active: ${current.activeQuestion}`, `queue: ${current.queuedAnswers.map((item) => item.question).join(' -> ')}`],
    errors
  }
}

function validateFinishContinuesNextQuestion(machine) {
  const errors = []
  const state = buildThreeQuestionState(machine)
  const afterFirst = machine.finishCurrentQuestion(state)
  const afterSecond = machine.finishCurrentQuestion(afterFirst.state)
  const afterThird = machine.finishCurrentQuestion(afterSecond.state)

  expect(afterFirst.nextQueued?.question === '第二题', '第一题完成后应继续第二题', errors)
  expect(afterFirst.state.isGenerating === true, '继续第二题时仍应处于生成中', errors)
  expect(afterFirst.state.queuedAnswers.map((item) => item.question).join('>') === '第三题', '第一题完成后队列只应剩第三题', errors)
  expect(afterSecond.nextQueued?.question === '第三题', '第二题完成后应继续第三题', errors)
  expect(afterThird.nextQueued === undefined, '最后一题完成后不应再有下一题', errors)
  expect(afterThird.state.isGenerating === false && afterThird.state.activeQuestion === '', '队列完成后应回到空闲状态', errors)

  return {
    name: '当前答案完成后自动继续下一题',
    ok: errors.length === 0,
    details: [`after first: ${afterFirst.nextQueued?.question || 'none'}`, `after second: ${afterSecond.nextQueued?.question || 'none'}`, `idle: ${!afterThird.state.isGenerating}`],
    errors
  }
}

function validateCachedAnswerContinuesNextQuestion(machine) {
  const errors = []
  const state = buildThreeQuestionState(machine)
  const afterCachedHit = machine.finishCurrentQuestion(state)

  expect(afterCachedHit.nextQueued?.question === '第二题', '缓存命中完成后也应取出下一题', errors)
  expect(afterCachedHit.state.activeQuestion === '第二题', '缓存命中后 activeQuestion 应切到下一题', errors)
  expect(afterCachedHit.state.queuedAnswers.length === 1, '缓存命中后队列数量应减少 1', errors)

  return {
    name: '缓存命中后继续处理下一题',
    ok: errors.length === 0,
    details: [`next: ${afterCachedHit.nextQueued?.question || 'none'}`, `left: ${afterCachedHit.state.queuedAnswers.length}`],
    errors
  }
}

function validateResetClearsQueue(machine) {
  const errors = []
  const reset = machine.resetAnswerQueueState()

  expect(reset.isGenerating === false, '重置后不应保留生成中状态', errors)
  expect(reset.activeQuestion === '', '重置后不应保留当前问题', errors)
  expect(reset.queuedAnswers.length === 0, '重置后队列应为空', errors)

  return {
    name: '开始新会话时队列状态清空',
    ok: errors.length === 0,
    details: [`active: ${reset.activeQuestion || 'empty'}`, `queued: ${reset.queuedAnswers.length}`],
    errors
  }
}

function validateQueuedItemKeepsReviewFields(machine) {
  const errors = []
  const ids = idFactory()
  const transcript = buildTranscript('请讲讲 AB 实验')
  const item = machine.createQueuedAnswer('请讲讲 AB 实验', transcript, ids)
  const queue = machine.appendQueuedAnswer([], item)
  const shifted = machine.shiftQueuedAnswer(queue)

  expect(item.id === 'queue-1', '排队项应有稳定 id，供“待生成”标签切换', errors)
  expect(item.question === '请讲讲 AB 实验', '排队项应保留问题文本', errors)
  expect(item.transcript.length === 1 && item.transcript[0].text.includes('AB 实验'), '排队项应保留当时的转写上下文', errors)
  expect(shifted.nextQueued?.id === item.id, '取出下一题时不应丢失 id', errors)

  return {
    name: '待生成/历史切换所需字段保留',
    ok: errors.length === 0,
    details: [`id: ${item.id}`, `question: ${item.question}`, `transcript lines: ${item.transcript.length}`],
    errors
  }
}

function buildThreeQuestionState(machine) {
  const ids = idFactory()
  const q1 = machine.createQueuedAnswer('第一题', buildTranscript('第一题'), ids)
  const q2 = machine.createQueuedAnswer('第二题', buildTranscript('第二题'), ids)
  const q3 = machine.createQueuedAnswer('第三题', buildTranscript('第三题'), ids)
  let current = machine.receiveQuestionWhileGenerating(machine.createAnswerQueueState(), q1).state
  current = machine.receiveQuestionWhileGenerating(current, q2).state
  current = machine.receiveQuestionWhileGenerating(current, q3).state
  return current
}

function buildTranscript(text) {
  return [{ id: `line-${text}`, text, at: 1, source: 'manual' }]
}

function idFactory() {
  let index = 0
  return () => `queue-${++index}`
}

function expect(condition, message, errors) {
  if (!condition) {
    errors.push(message)
  }
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
