import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const root = process.cwd()
const outDir = join(tmpdir(), `huomiantong-realistic-${Date.now()}`)

mkdirSync(outDir, { recursive: true })

try {
  execFileSync(
    process.execPath,
    [
      'node_modules/typescript/bin/tsc',
      'src/shared/mockInterview.ts',
      'src/shared/dataAnalystInterviewQuestionBank.ts',
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
  const {
    defaultMockInterviewConfig,
    mockInterviewFocusOptions,
    normalizeMockInterviewConfig
  } = requireCompiled(requireFromTemp, 'mockInterview.js')
  const {
    dataAnalystInterviewQuestionBank,
    selectDataAnalystInterviewQuestion
  } = requireCompiled(requireFromTemp, 'dataAnalystInterviewQuestionBank.js')

  const originalRandom = Math.random
  Math.random = () => 0

  const results = [
    validateConfigBounds(normalizeMockInterviewConfig),
    validateInvalidConfigFallback(normalizeMockInterviewConfig, defaultMockInterviewConfig, mockInterviewFocusOptions),
    validateQuestionBankScale(dataAnalystInterviewQuestionBank),
    validateFocusedQuestionSelection(selectDataAnalystInterviewQuestion),
    validateUsedQuestionExclusion(selectDataAnalystInterviewQuestion)
  ]

  Math.random = originalRandom

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
    console.error(`\n拟真面试本地回归失败：${failed.length}/${results.length}`)
    process.exitCode = 1
  } else {
    console.log(`\n拟真面试本地回归通过：${results.length}/${results.length}`)
  }
} finally {
  rmSync(outDir, { recursive: true, force: true })
}

function validateConfigBounds(normalizeMockInterviewConfig) {
  const config = normalizeMockInterviewConfig({
    durationMinutes: 999,
    questionCount: -20,
    difficulty: 'pressure',
    focus: ['项目深挖', '技术深度', '表达流畅', '压力追问', '业务理解', '简历真实性', '额外无效项'],
    interviewerStyle: 'techLead',
    interviewerVoiceURI: `  ${'voice-'.repeat(80)}  `,
    questionStrategy: 'adaptive'
  })
  const errors = []

  expect(config.durationMinutes === 180, '时长应被限制到 180 分钟', errors)
  expect(config.questionCount === 3, '题数应被限制到最少 3 题', errors)
  expect(config.difficulty === 'pressure', '压力面难度应保留', errors)
  expect(config.focus.length === 6 && !config.focus.includes('额外无效项'), '侧重点应最多保留 6 个有效项', errors)
  expect(config.interviewerStyle === 'techLead', '技术主管型面试官应保留', errors)
  expect(config.interviewerVoiceURI.length <= 240 && config.interviewerVoiceURI.startsWith('voice-'), '声音 URI 应 trim 并限制长度', errors)
  expect(config.questionStrategy === 'adaptive', '自适应追问策略应保留', errors)

  return {
    name: '配置边界值归一化',
    ok: errors.length === 0,
    details: [`normalized: ${JSON.stringify(config)}`],
    errors
  }
}

function validateInvalidConfigFallback(normalizeMockInterviewConfig, defaultMockInterviewConfig, mockInterviewFocusOptions) {
  const config = normalizeMockInterviewConfig({
    durationMinutes: Number.NaN,
    questionCount: 'abc',
    difficulty: 'wild',
    focus: ['不存在的侧重点'],
    interviewerStyle: 'unknown',
    interviewerVoiceURI: 123,
    questionStrategy: 'chaos'
  })
  const errors = []

  expect(config.durationMinutes === defaultMockInterviewConfig.durationMinutes, '非法时长应回退默认值', errors)
  expect(config.questionCount === defaultMockInterviewConfig.questionCount, '非法题数应回退默认值', errors)
  expect(config.difficulty === defaultMockInterviewConfig.difficulty, '非法难度应回退默认值', errors)
  expect(arrayEquals(config.focus, defaultMockInterviewConfig.focus), '非法侧重点应回退默认侧重点', errors)
  expect(config.focus.every((item) => mockInterviewFocusOptions.includes(item)), '侧重点必须来自合法选项', errors)
  expect(config.interviewerStyle === defaultMockInterviewConfig.interviewerStyle, '非法面试官风格应回退默认值', errors)
  expect(config.interviewerVoiceURI === defaultMockInterviewConfig.interviewerVoiceURI, '非法声音 URI 应回退默认值', errors)
  expect(config.questionStrategy === defaultMockInterviewConfig.questionStrategy, '非法追问策略应回退默认值', errors)

  return {
    name: '非法配置回退默认值',
    ok: errors.length === 0,
    details: [`fallback: ${JSON.stringify(config)}`],
    errors
  }
}

function validateQuestionBankScale(dataAnalystInterviewQuestionBank) {
  const errors = []
  const difficulties = new Set(dataAnalystInterviewQuestionBank.map((item) => item.difficulty))
  const focusTypes = new Set(dataAnalystInterviewQuestionBank.map((item) => item.focus))

  expect(dataAnalystInterviewQuestionBank.length >= 400, '数据分析师拟真题库应至少 400 题', errors)
  expect(['easy', 'medium', 'hard', 'pressure'].every((item) => difficulties.has(item)), '题库应覆盖四种难度', errors)
  expect(['businessMetrics', 'sqlData', 'projectDeepDive', 'experimentGrowth', 'communication'].every((item) => focusTypes.has(item)), '题库应覆盖五类侧重点', errors)

  return {
    name: '数据分析师题库规模与覆盖',
    ok: errors.length === 0,
    details: [`count: ${dataAnalystInterviewQuestionBank.length}`, `difficulties: ${Array.from(difficulties).join(', ')}`, `focus: ${Array.from(focusTypes).join(', ')}`],
    errors
  }
}

function validateFocusedQuestionSelection(selectDataAnalystInterviewQuestion) {
  const cases = [
    {
      name: '压力表达场景',
      input: {
        difficulty: 'pressure',
        focus: ['压力追问', '表达流畅'],
        trainingMode: 'pressure',
        usedQuestions: [],
        baseIndex: 0
      },
      expectedDifficulty: 'pressure',
      expectedFocus: 'communication'
    },
    {
      name: '项目深挖场景',
      input: {
        difficulty: 'hard',
        focus: ['项目深挖', '简历真实性'],
        trainingMode: 'projectFollowUp',
        usedQuestions: [],
        baseIndex: 0
      },
      expectedDifficulty: 'hard',
      expectedFocus: 'projectDeepDive'
    }
  ]
  const errors = []
  const details = []

  for (const item of cases) {
    const selected = selectDataAnalystInterviewQuestion(item.input)
    details.push(`${item.name}: ${selected.id}`)
    expect(selected.difficulty === item.expectedDifficulty, `${item.name} 应命中 ${item.expectedDifficulty} 难度`, errors)
    expect(selected.focus === item.expectedFocus, `${item.name} 应命中 ${item.expectedFocus} 侧重点`, errors)
    expect(selected.question && selected.referenceAnswer, `${item.name} 应包含问题和参考答案`, errors)
  }

  return {
    name: '难度与侧重点选题',
    ok: errors.length === 0,
    details,
    errors
  }
}

function validateUsedQuestionExclusion(selectDataAnalystInterviewQuestion) {
  const first = selectDataAnalystInterviewQuestion({
    difficulty: 'medium',
    focus: ['项目深挖', '简历真实性'],
    trainingMode: 'projectFollowUp',
    usedQuestions: [],
    baseIndex: 0
  })
  const second = selectDataAnalystInterviewQuestion({
    difficulty: 'medium',
    focus: ['项目深挖', '简历真实性'],
    trainingMode: 'projectFollowUp',
    usedQuestions: [first.question],
    baseIndex: 0
  })
  const errors = []

  expect(first.question !== second.question, '已使用过的问题不应再次被选中', errors)

  return {
    name: '已使用题目排除',
    ok: errors.length === 0,
    details: [`first: ${first.id}`, `second: ${second.id}`],
    errors
  }
}

function expect(condition, message, errors) {
  if (!condition) {
    errors.push(message)
  }
}

function arrayEquals(left, right) {
  return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((item, index) => item === right[index])
}

function requireCompiled(requireFromTemp, fileName) {
  const candidates = [join(outDir, fileName), join(outDir, 'shared', fileName)]
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
