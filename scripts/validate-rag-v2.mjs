import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const root = process.cwd()
const outDir = join(tmpdir(), `huomiantong-rag-v2-${Date.now()}`)

mkdirSync(outDir, { recursive: true })

try {
  execFileSync(
    process.execPath,
    [
      'node_modules/typescript/bin/tsc',
      'src/main/services/evidenceService.ts',
      'src/shared/questionIntent.ts',
      'src/shared/roleJdTemplates.ts',
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
  const { findEvidence, evidenceSourceLabel } = requireFromTemp(join(outDir, 'main/services/evidenceService.js'))

  const cases = [
    {
      name: '第一家公司地点',
      question: '你的第一家公司在哪里？',
      settings: buildSettings(),
      topIncludes: ['北京星河科技', '北京朝阳'],
      topExcludes: ['上海云帆数据']
    },
    {
      name: '最近公司地点',
      question: '你上一家公司在哪个城市？',
      settings: buildSettings(),
      topIncludes: ['上海云帆数据', '上海浦东'],
      topExcludes: ['北京星河科技']
    },
    {
      name: 'RFM 项目命中其他简历',
      question: '讲一下你做过的 RFM 用户分层项目。',
      settings: buildSettings(),
      topIncludes: ['RFM', '用户分层'],
      includes: ['RFM', '复购率', '用户分层'],
      sourceType: 'extra'
    },
    {
      name: '指标/漏斗分析命中正式简历',
      question: '你们转化漏斗分析怎么做的？',
      settings: buildSettings(),
      topIncludes: ['转化漏斗', 'SQL'],
      includes: ['转化漏斗', 'SQL', '看板'],
      excludes: ['金融风控']
    },
    {
      name: '多候选人隔离',
      question: '这个候选人的金融风控项目是什么？',
      settings: {
        ...buildSettings(),
        resumeProfiles: [buildSettings().resume, buildOtherCandidateResume()]
      },
      excludes: ['金融风控', '信贷违约']
    }
  ]

  const results = cases.map((item) => runCase(item, findEvidence, evidenceSourceLabel))
  const failed = results.filter((item) => !item.ok)

  for (const result of results) {
    const status = result.ok ? 'PASS' : 'FAIL'
    console.log(`${status} ${result.name}`)
    console.log(`  question: ${result.question}`)
    console.log(`  top: ${result.top || '无命中'}`)
    console.log(`  sources: ${result.sources || '-'}`)
    if (result.errors.length) {
      console.log(`  errors: ${result.errors.join('；')}`)
    }
  }

  if (failed.length) {
    console.error(`\nRAG v2 回归失败：${failed.length}/${results.length}`)
    process.exitCode = 1
  } else {
    console.log(`\nRAG v2 回归通过：${results.length}/${results.length}`)
  }
} finally {
  rmSync(outDir, { recursive: true, force: true })
}

function runCase(testCase, findEvidence, evidenceSourceLabel) {
  const snippets = findEvidence(testCase.question, testCase.settings)
  const joined = snippets.map((item) => item.text).join('\n')
  const top = snippets[0]?.text || ''
  const sources = snippets.map((item) => evidenceSourceLabel(item)).join(', ')
  const errors = []

  for (const expected of testCase.includes || []) {
    if (!joined.includes(expected)) {
      errors.push(`缺少预期依据：${expected}`)
    }
  }

  for (const expected of testCase.topIncludes || []) {
    if (!top.includes(expected)) {
      errors.push(`首条证据缺少：${expected}`)
    }
  }

  for (const blocked of testCase.excludes || []) {
    if (joined.includes(blocked)) {
      errors.push(`混入不应出现的依据：${blocked}`)
    }
  }

  for (const blocked of testCase.topExcludes || []) {
    if (top.includes(blocked)) {
      errors.push(`首条证据混入：${blocked}`)
    }
  }

  if (testCase.source && !sources.includes(testCase.source)) {
    errors.push(`未命中预期来源：${testCase.source}`)
  }

  if (testCase.sourceType && !snippets.some((item) => item.source === testCase.sourceType)) {
    errors.push(`未命中预期来源类型：${testCase.sourceType}`)
  }

  return {
    name: testCase.name,
    question: testCase.question,
    ok: errors.length === 0,
    top,
    sources,
    errors
  }
}

function buildSettings() {
  return {
    providers: {},
    speech: { sttProvider: 'deepgram', endpointingMs: 800, providers: {} },
    answer: {
      llmProvider: 'deepseek',
      answerStyle: 'standard',
      interviewMode: 'dataAnalyst',
      responseLanguage: 'zh',
      fastFirst: true,
      roleJdTemplates: {}
    },
    resume: {
      id: 'candidate-a',
      candidateName: '候选人A',
      targetRole: '数据分析师',
      formalResume: [
        '工作经历：2019.07-2021.06 北京星河科技有限公司 数据分析师，办公地点在北京朝阳。主要负责用户增长看板、SQL 取数、转化漏斗分析和经营日报。',
        '工作经历：2021.07-2024.12 上海云帆数据有限公司 高级数据分析师，办公地点在上海浦东。主要负责指标体系、业务复盘和跨部门数据需求。',
        '项目经历：搭建电商转化漏斗看板，用 SQL 统一曝光、点击、加购、下单口径，帮助运营定位商品详情页流失。'
      ].join('\n\n'),
      detailedResume: [
        '建模项目：负责用户流失预测模型，使用 Python、sklearn、逻辑回归和特征工程，输出高风险用户名单。',
        '实验项目：设计会员权益 A/B 实验，关注样本量、显著性、转化率和复购率，推动策略复盘。'
      ].join('\n\n'),
      otherResumes: [
        {
          id: 'rfm-note',
          title: 'RFM 用户分层项目补充',
          text: 'RFM 用户分层项目：基于最近购买时间、购买频次、消费金额划分高价值用户、沉默用户和流失风险用户，复购率提升 12%。',
          file: { name: 'rfm-note.md', extension: '.md', size: 1200, addedAt: 1, textLength: 80 },
          createdAt: 1
        }
      ]
    }
  }
}

function buildOtherCandidateResume() {
  return {
    id: 'candidate-b',
    candidateName: '候选人B',
    targetRole: '数据分析师',
    formalResume: '工作经历：金融风控数据分析师，负责信贷违约预测、评分卡和贷后监控。',
    detailedResume: '金融风控项目：通过逻辑回归和 XGBoost 建立信贷违约模型。',
    otherResumes: []
  }
}
