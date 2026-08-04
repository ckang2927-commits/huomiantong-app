import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const root = process.cwd()
const outDir = join(tmpdir(), `huomiantong-review-deep-talk-${Date.now()}`)
const localReportMarkdown = [
  '# 面试复盘报告',
  '原始本地报告不要被覆盖。',
  '## 5. 高风险回答',
  '- 回答偏书面，需要压缩成口语。'
].join('\n')

mkdirSync(outDir, { recursive: true })
writeElectronStub(outDir)

try {
  execFileSync(
    process.execPath,
    [
      'node_modules/typescript/bin/tsc',
      'src/main/services/interviewReviewEnhancementService.ts',
      'src/shared/types.ts',
      'src/shared/roleJdTemplates.ts',
      'src/shared/speechProviders.ts',
      'src/shared/mockInterview.ts',
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
  const { generateInterviewReviewDeepTalk } = requireCompiled(requireFromTemp, 'interviewReviewEnhancementService.js')
  const noKeyResult = await generateInterviewReviewDeepTalk(buildRequest({ enabled: true, apiKey: '' }))
  const emptyAnswerResult = await generateInterviewReviewDeepTalk({
    ...buildRequest({ enabled: true, apiKey: '' }),
    question: '还没有可优化的问题',
    answerText: ''
  })
  const failureServer = await createFailureServer()

  try {
    const failureResult = await generateInterviewReviewDeepTalk(buildRequest({
      enabled: true,
      apiKey: 'test-key',
      baseUrl: failureServer.baseUrl,
      model: 'fake-model'
    }))
    const results = [
      validateNoKeyFallback(noKeyResult),
      validateModelFailureFallback(failureResult),
      validateEmptyAnswerFallback(emptyAnswerResult),
      validateEmptyQuestionUiGuard()
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
      console.error(`\nAI 深度话术兜底回归失败：${failed.length}/${results.length}`)
      process.exitCode = 1
    } else {
      console.log(`\nAI 深度话术兜底回归通过：${results.length}/${results.length}`)
    }
  } finally {
    await failureServer.close()
  }
} finally {
  rmSync(outDir, { recursive: true, force: true })
}

function validateNoKeyFallback(result) {
  const errors = []

  expect(result.provider === 'local', '无 Key 时 provider 应为 local', errors)
  expect(!result.usage, '无 Key 时不应记录模型用量', errors)
  expect(result.title.includes('口语优化版'), '无 Key 时应保留话术标题', errors)
  expect(result.talkMarkdown.includes('## 直接回答'), '无 Key 时应返回可直接使用的话术草案', errors)
  expect(result.talkMarkdown.includes('当前未调用 AI'), '无 Key 时应给出未调用 AI 说明', errors)

  return {
    name: '无 Key 时回退本地话术草案',
    ok: errors.length === 0,
    details: [`provider: ${result.provider}`, `title: ${result.title}`],
    errors
  }
}

function validateModelFailureFallback(result) {
  const errors = []

  expect(result.provider === 'local', '模型失败时 provider 应回退为 local', errors)
  expect(!result.usage, '模型失败时不应记录模型用量', errors)
  expect(result.talkMarkdown.includes('## 直接回答'), '模型失败时应保留本地话术草案', errors)
  expect(result.talkMarkdown.includes('AI 深度话术失败'), '模型失败时应显示失败原因', errors)
  expect(result.talkMarkdown.includes('forced failure'), '模型失败时应带上服务端错误摘要', errors)
  expect(result.talkMarkdown.includes('当前已退回本地草案'), '模型失败时应明确说明已回退', errors)

  return {
    name: '模型失败时回退本地话术草案',
    ok: errors.length === 0,
    details: [`provider: ${result.provider}`, `latencyMs: ${result.latencyMs}`],
    errors
  }
}

function validateEmptyAnswerFallback(result) {
  const errors = []

  expect(result.provider === 'local', '空回答兜底时 provider 应为 local', errors)
  expect(result.talkMarkdown.includes('我会先按真实经历直接回答'), '空回答时应给出可见的本地占位话术', errors)
  expect(result.talkMarkdown.includes('追问备份'), '空回答时仍应给出追问备份结构', errors)

  return {
    name: '选中问题无回答时仍有本地话术草案',
    ok: errors.length === 0,
    details: [`title: ${result.title}`],
    errors
  }
}

function validateEmptyQuestionUiGuard() {
  const errors = []
  const viewSource = readFileSync(join(root, 'src/renderer/views/InterviewReviewView.tsx'), 'utf8')

  expect(viewSource.includes('请先完成转写并提取到至少 1 个问题，再生成 AI 深度话术。'), '没有复盘快照时应显示可见提示', errors)
  expect(viewSource.includes('还没有可优化的问题。'), '没有选中/可用问题时应显示可见提示', errors)

  return {
    name: '没有可优化问题时 UI 有可见提示',
    ok: errors.length === 0,
    details: ['checked InterviewReviewView.tsx'],
    errors
  }
}

function buildRequest(providerPatch) {
  return {
    settings: buildSettings(providerPatch),
    question: '如果业务方质疑你的结论，你会怎么处理？',
    questionLabel: '方法过程',
    answerText: '我会先复核口径、SQL 和样本，再用可视化解释差异。',
    answerScore: 62,
    answerIssues: ['证据感偏弱。'],
    answerSuggestions: ['补充复核步骤和对齐机制。'],
    localReportMarkdown,
    targetLength: 'standard'
  }
}

function buildSettings(providerPatch) {
  const deepseek = {
    enabled: providerPatch.enabled,
    apiKey: providerPatch.apiKey,
    baseUrl: providerPatch.baseUrl || 'https://api.deepseek.com',
    model: providerPatch.model || 'deepseek-v4-flash'
  }

  return {
    providers: {
      deepgram: { enabled: true, apiKey: '' },
      deepseek,
      dashscope: { enabled: false, apiKey: '', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus-latest' },
      openai: { enabled: false, apiKey: '', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini' },
      anthropic: { enabled: false, apiKey: '', baseUrl: 'https://api.anthropic.com', model: 'claude-3-5-haiku-latest' }
    },
    speech: {
      sttProvider: 'deepgram',
      endpointingMs: 800,
      providers: {
        deepgram: { enabled: true, apiKey: '' },
        aliyun: { enabled: false, apiKey: '' },
        tencent: { enabled: false, apiKey: '' },
        baidu: { enabled: false, apiKey: '' },
        volcengine: { enabled: false, apiKey: '' },
        iflytek: { enabled: false, apiKey: '' }
      }
    },
    resume: {
      id: 'default-resume',
      profileName: '默认候选人',
      candidateName: '',
      targetRole: '数据分析师',
      formalResume: '',
      detailedResume: '',
      otherResumes: []
    },
    resumeProfiles: [],
    activeResumeId: 'default-resume',
    answer: {
      llmProvider: 'deepseek',
      answerStyle: 'standard',
      interviewMode: 'dataAnalyst',
      responseLanguage: 'zh',
      fastFirst: true,
      roleJdTemplates: {},
      customTrainingPresets: []
    }
  }
}

function createFailureServer() {
  const server = createServer((_request, response) => {
    response.writeHead(500, { 'content-type': 'text/plain;charset=utf-8' })
    response.end('forced failure')
  })

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((done) => server.close(done))
      })
    })
  })
}

function writeElectronStub(targetDir) {
  const moduleDir = join(targetDir, 'node_modules', 'electron')
  mkdirSync(moduleDir, { recursive: true })
  writeFileSync(
    join(moduleDir, 'index.js'),
    [
      "const path = require('node:path')",
      'module.exports = {',
      '  app: { getPath: () => path.join(process.cwd(), ".tmp-electron-stub"), getVersion: () => "0.1.3" },',
      '  safeStorage: { isEncryptionAvailable: () => false, encryptString: (value) => Buffer.from(String(value)), decryptString: (value) => Buffer.from(value).toString("utf8") },',
      '  dialog: { showSaveDialog: async () => ({ canceled: true }), showOpenDialog: async () => ({ canceled: true, filePaths: [] }) },',
      '  shell: { openPath: async () => "" },',
      '  BrowserWindow: class {},',
      '  ipcMain: { handle: () => undefined, on: () => undefined },',
      '  Menu: { setApplicationMenu: () => undefined }',
      '}'
    ].join('\n'),
    'utf8'
  )
}

function expect(condition, message, errors) {
  if (!condition) {
    errors.push(message)
  }
}

function requireCompiled(requireFromTemp, fileName) {
  const candidates = [join(outDir, 'main', 'services', fileName), join(outDir, 'services', fileName), join(outDir, fileName)]
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
