import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const root = process.cwd()
const outDir = join(tmpdir(), `huomiantong-review-deep-report-${Date.now()}`)
const localReportMarkdown = [
  '# 面试复盘报告',
  '原始本地报告不要被覆盖。',
  '## 4. 主要薄弱点',
  '- 需要补充业务证据。'
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
  const { generateInterviewReviewDeepReport } = requireCompiled(requireFromTemp, 'interviewReviewEnhancementService.js')
  const noKeyResult = await generateInterviewReviewDeepReport(buildRequest({ enabled: true, apiKey: '' }))
  const failureServer = await createFailureServer()

  try {
    const failureResult = await generateInterviewReviewDeepReport(buildRequest({
      enabled: true,
      apiKey: 'test-key',
      baseUrl: failureServer.baseUrl,
      model: 'fake-model'
    }))
    const results = [
      validateNoKeyFallback(noKeyResult),
      validateModelFailureFallback(failureResult),
      validateLocalReportUnchanged(noKeyResult, failureResult)
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
      console.error(`\nAI 深度报告兜底回归失败：${failed.length}/${results.length}`)
      process.exitCode = 1
    } else {
      console.log(`\nAI 深度报告兜底回归通过：${results.length}/${results.length}`)
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
  expect(result.reportMarkdown.includes('# AI 深度复盘（本地草案）'), '无 Key 时应返回本地深度草案标题', errors)
  expect(result.reportMarkdown.includes('当前未调用 AI'), '无 Key 时应给出未调用 AI 说明', errors)
  expect(result.reportMarkdown.includes('问题数：2'), '本地草案应保留问题数量摘要', errors)

  return {
    name: '无 Key 时回退本地草案',
    ok: errors.length === 0,
    details: [`provider: ${result.provider}`, `latencyMs: ${result.latencyMs}`],
    errors
  }
}

function validateModelFailureFallback(result) {
  const errors = []

  expect(result.provider === 'local', '模型失败时 provider 应回退为 local', errors)
  expect(!result.usage, '模型失败时不应记录模型用量', errors)
  expect(result.reportMarkdown.includes('# AI 深度复盘（本地草案）'), '模型失败时应保留本地深度草案', errors)
  expect(result.reportMarkdown.includes('AI 深度报告失败'), '模型失败时应显示失败原因', errors)
  expect(result.reportMarkdown.includes('forced failure'), '模型失败时应带上服务端错误摘要', errors)
  expect(result.reportMarkdown.includes('当前已退回本地草案'), '模型失败时应明确说明已回退', errors)

  return {
    name: '模型失败时回退本地草案',
    ok: errors.length === 0,
    details: [`provider: ${result.provider}`, `latencyMs: ${result.latencyMs}`],
    errors
  }
}

function validateLocalReportUnchanged(noKeyResult, failureResult) {
  const errors = []

  expect(localReportMarkdown.includes('原始本地报告不要被覆盖'), '测试用本地报告应保持原始内容', errors)
  expect(noKeyResult.reportMarkdown !== localReportMarkdown, '深度报告结果可以是独立草案，但不应改写输入字符串', errors)
  expect(failureResult.reportMarkdown !== localReportMarkdown, '失败结果可以是独立草案，但不应改写输入字符串', errors)
  expect(noKeyResult.reportMarkdown.includes('下一轮建议'), '兜底草案应包含可执行建议', errors)
  expect(failureResult.reportMarkdown.includes('下一轮建议'), '失败兜底草案应包含可执行建议', errors)

  return {
    name: '不覆盖本地报告输入',
    ok: errors.length === 0,
    details: [`local report length: ${localReportMarkdown.length}`],
    errors
  }
}

function buildRequest(providerPatch) {
  return {
    settings: buildSettings(providerPatch),
    title: '模拟复盘',
    transcriptText: '面试官：请介绍转化漏斗项目。候选人：我用 SQL 拆漏斗，转化率提升 12%。',
    questions: [
      {
        id: 'q1',
        order: 1,
        question: '请介绍转化漏斗项目。',
        intentLabel: '项目经历',
        confidence: 96,
        source: 'speaker'
      },
      {
        id: 'q2',
        order: 2,
        question: '如果业务方质疑结论，你怎么处理？',
        intentLabel: '方法过程',
        confidence: 94,
        source: 'speaker'
      }
    ],
    answerAnalyses: [
      {
        questionId: 'q1',
        answerText: '我用 SQL 拆曝光、点击、加购、下单四层漏斗，最后转化率提升 12%。',
        wordCount: 35,
        score: 78,
        level: 'good',
        metrics: { relevance: 82, completeness: 76, concision: 88, evidence: 72 },
        issues: [],
        suggestions: ['补充业务背景和口径。']
      },
      {
        questionId: 'q2',
        answerText: '我会先复核口径、SQL 和样本，再用可视化解释差异。',
        wordCount: 28,
        score: 62,
        level: 'warn',
        metrics: { relevance: 68, completeness: 60, concision: 88, evidence: 55 },
        issues: ['证据感偏弱。'],
        suggestions: ['补充复核步骤和对齐机制。']
      }
    ],
    localReportMarkdown,
    audioFileName: 'sample-review.wav',
    durationSec: 180
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
