import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const root = process.cwd()
const outDir = join(tmpdir(), `huomiantong-interview-review-${Date.now()}`)

mkdirSync(outDir, { recursive: true })

try {
  execFileSync(
    process.execPath,
    [
      'node_modules/typescript/bin/tsc',
      'src/renderer/lib/interviewReviewAnalyzer.ts',
      'src/renderer/lib/interviewReviewReport.ts',
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
  const analyzer = requireCompiled(requireFromTemp, 'interviewReviewAnalyzer.js')
  const reportBuilder = requireCompiled(requireFromTemp, 'interviewReviewReport.js')
  const transcript = buildTranscript()
  const questions = analyzer.extractInterviewReviewQuestions(transcript)
  const analyses = analyzer.analyzeInterviewReviewAnswers(transcript, questions)
  const report = reportBuilder.buildLocalInterviewReviewReport({
    transcriptText: transcript,
    questions,
    answerAnalyses: analyses,
    fileName: 'review-sample.txt',
    durationSec: 210
  })

  const results = [
    validateQuestionExtraction(questions),
    validateAnswerSlicing(questions, analyses),
    validateQualityScoring(questions, analyses, analyzer),
    validateLocalReport(report, questions, analyses),
    validateSpeakerMeetingStyle(analyzer),
    validateNoQuestionTextCorruption(questions)
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
    console.error(`\n面试复盘本地回归失败：${failed.length}/${results.length}`)
    process.exitCode = 1
  } else {
    console.log(`\n面试复盘本地回归通过：${results.length}/${results.length}`)
  }
} finally {
  rmSync(outDir, { recursive: true, force: true })
}

function validateQuestionExtraction(questions) {
  const errors = []
  const joined = questions.map((item) => item.question).join('\n')

  expect(questions.length >= 4, `应至少识别 4 个问题，实际 ${questions.length}`, errors)
  expect(joined.includes('自我介绍'), '应识别自我介绍问题', errors)
  expect(joined.includes('转化漏斗'), '应识别转化漏斗项目问题', errors)
  expect(joined.includes('业务方质疑') || joined.includes('质疑你的结论'), '应识别业务质疑处理问题', errors)
  expect(joined.includes('家里') || joined.includes('换城市'), '应识别 HR 稳定性问题', errors)

  return {
    name: '从转写文本提取面试问题',
    ok: errors.length === 0,
    details: questions.map((item) => `Q${item.order}: ${item.question} (${item.intentLabel}, ${item.confidence})`),
    errors
  }
}

function validateAnswerSlicing(questions, analyses) {
  const errors = []
  const answerMap = buildAnswerMap(questions, analyses)
  const intro = findAnswer(answerMap, '自我介绍')
  const funnel = findAnswer(answerMap, '转化漏斗')
  const challenge = findAnswer(answerMap, '业务方质疑')

  expect(analyses.length === questions.length, '每个问题都应有一条回答分析', errors)
  expect(Boolean(intro?.answerText.includes('三年数据分析')), '自我介绍后应切到候选人的自我介绍回答', errors)
  expect(Boolean(funnel?.answerText.includes('SQL') && funnel.answerText.includes('12%')), '转化漏斗回答应保留 SQL 和 12% 结果', errors)
  expect(Boolean(challenge?.answerText.includes('口径') && challenge.answerText.includes('可视化')), '业务质疑回答应保留处理步骤', errors)

  return {
    name: '按问题切分候选人回答片段',
    ok: errors.length === 0,
    details: analyses.map((item) => `${item.questionId}: ${item.wordCount} 字/词，${item.level}`),
    errors
  }
}

function validateQualityScoring(questions, analyses, analyzer) {
  const errors = []
  const answerMap = buildAnswerMap(questions, analyses)
  const intro = findEntry(answerMap, '自我介绍')
  const funnel = findEntry(answerMap, '转化漏斗')
  const hr = findEntry(answerMap, '家里') || findEntry(answerMap, '换城市')

  expect(Boolean(funnel?.analysis.score && funnel.analysis.score >= 60), `项目题有结构和指标时分数不应过低，实际 ${funnel?.analysis.score ?? '-'}`, errors)
  expect(Boolean(funnel && analyzer.getInterviewReviewAnswerReviewMode(funnel.question) === 'businessEvidence'), '项目题应按业务证据模式评分', errors)
  expect(Boolean(intro && analyzer.getInterviewReviewAnswerReviewMode(intro.question) === 'selfIntro'), '自我介绍题应按自我介绍模式评分', errors)
  expect(Boolean(hr && analyzer.getInterviewReviewAnswerReviewMode(hr.question) === 'hrIntent'), '稳定性/意愿题应按 HR 意愿模式评分', errors)

  return {
    name: '回答质量评分与题型策略',
    ok: errors.length === 0,
    details: [
      `intro: ${intro?.analysis.score ?? '-'} / ${intro ? analyzer.getInterviewReviewAnswerReviewMode(intro.question) : '-'}`,
      `funnel: ${funnel?.analysis.score ?? '-'} / ${funnel ? analyzer.getInterviewReviewAnswerReviewMode(funnel.question) : '-'}`,
      `hr: ${hr?.analysis.score ?? '-'} / ${hr ? analyzer.getInterviewReviewAnswerReviewMode(hr.question) : '-'}`
    ],
    errors
  }
}

function validateLocalReport(report, questions, analyses) {
  const errors = []

  expect(report.overview.questionCount === questions.length, '报告问题数量应等于提取结果', errors)
  expect(report.overview.answeredCount >= 4, '报告应统计到已回答问题', errors)
  expect(report.overallScore > 0, '报告整体评分应大于 0', errors)
  expect(report.markdown.includes('# 面试复盘报告'), 'Markdown 应包含报告标题', errors)
  expect(report.markdown.includes('review-sample.txt'), 'Markdown 应包含录音文件名', errors)
  expect(report.markdown.includes('## 4. 主要薄弱点'), 'Markdown 应包含薄弱点章节', errors)
  expect(analyses.some((item) => item.suggestions.length > 0), '至少应产出一条优化建议', errors)

  return {
    name: '生成本地复盘报告',
    ok: errors.length === 0,
    details: [`score: ${report.overallScore}`, `level: ${report.overallLevel}`, `answered: ${report.overview.answeredCount}/${report.overview.questionCount}`],
    errors
  }
}

function validateSpeakerMeetingStyle(analyzer) {
  const errors = []
  const meetingTranscript = [
    '说话人 1 00:00',
    '请介绍一下你最近的数据分析项目。',
    '说话人 2 00:08',
    '我最近做的是会员分层项目，用 RFM 拆用户价值，最后复购率提升 8%。',
    '说话人 1 00:35',
    '这个项目里你个人负责什么？',
    '说话人 2 00:42',
    '我负责 SQL 取数、标签口径和看板搭建。'
  ].join('\n')
  const questions = analyzer.extractInterviewReviewQuestions(meetingTranscript)
  const analyses = analyzer.analyzeInterviewReviewAnswers(meetingTranscript, questions)

  expect(questions.length >= 2, `腾讯会议/说话人格式应至少识别 2 个问题，实际 ${questions.length}`, errors)
  expect(analyses.some((item) => item.answerText.includes('会员分层')), '说话人格式应能切出候选人回答', errors)

  return {
    name: '兼容腾讯会议说话人格式',
    ok: errors.length === 0,
    details: questions.map((item) => `Q${item.order}: ${item.question}`),
    errors
  }
}

function validateNoQuestionTextCorruption(questions) {
  const errors = []
  const corrupted = questions.filter((item) => item.question.length < 5 || /^[?？\sA-Z/]+$/i.test(item.question))

  expect(corrupted.length === 0, `问题文本不应被清洗成残缺内容：${corrupted.map((item) => item.question).join(', ')}`, errors)

  return {
    name: '问题文本清洗不破坏中文',
    ok: errors.length === 0,
    details: [`checked: ${questions.length}`],
    errors
  }
}

function buildTranscript() {
  return [
    '[00:00] 面试官：请你先做一个自我介绍。',
    '[00:08] 候选人：我叫小王，做了三年数据分析，主要负责 SQL 取数、指标看板和增长分析。',
    '[00:35] 面试官：你做过的转化漏斗项目是怎么分析的？',
    '[00:42] 候选人：当时我们发现商品详情页到下单流失较高，我先用 SQL 拆曝光、点击、加购、下单四层漏斗，再按渠道和品类分组定位问题，最后推动运营改版，转化率提升 12%。',
    '[01:30] 面试官：如果业务方质疑你的结论，你会怎么处理？',
    '[01:37] 候选人：我会先确认口径和数据范围，再把 SQL、样本和异常值排查过程拿出来复核。如果确实有偏差，我会更新结论；如果没有，我会用可视化和对照组解释。',
    '[02:15] 面试官：如果换城市，家里支持吗？',
    '[02:20] 候选人：支持，我已经和家里沟通过，主要考虑长期发展机会，也可以提前租房并按公司要求到岗。'
  ].join('\n')
}

function buildAnswerMap(questions, analyses) {
  const questionMap = new Map(questions.map((question) => [question.id, question]))
  return analyses.map((analysis) => ({
    question: questionMap.get(analysis.questionId),
    analysis
  })).filter((item) => item.question)
}

function findAnswer(entries, keyword) {
  return findEntry(entries, keyword)?.analysis
}

function findEntry(entries, keyword) {
  return entries.find((item) => item.question.question.includes(keyword))
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
