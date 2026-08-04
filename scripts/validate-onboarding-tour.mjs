import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const onboarding = readText('src/renderer/components/NewUserOnboarding.tsx')
const appLayout = readText('src/renderer/components/AppLayoutParts.tsx')
const styles = readText('src/renderer/styles.css')
const packageJson = JSON.parse(readText('package.json'))

const results = [
  checkStepCoverage(),
  checkTargetAnchors(),
  checkInteractionLock(),
  checkProgressAndSkip(),
  checkJumpFocusWiring(),
  checkBuildScript()
]
const failed = results.filter((result) => !result.ok)

for (const result of results) {
  console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.name}`)
  for (const detail of result.details) {
    console.log(`  ${detail}`)
  }
  if (result.errors.length) {
    console.log(`  errors: ${result.errors.join('；')}`)
  }
}

if (failed.length) {
  console.error(`\n漫游式新手引导结构检查失败：${failed.length}/${results.length}`)
  process.exitCode = 1
} else {
  console.log(`\n漫游式新手引导结构检查通过：${results.length}/${results.length}`)
}

function checkStepCoverage() {
  const expectedIds = [
    'sidebar',
    'topbar',
    'workspace',
    'workspace-candidate',
    'workspace-role',
    'workspace-transcript',
    'workspace-answer',
    'workspace-strategy',
    'workspace-audio-settings',
    'workspace-warmup',
    'training',
    'realistic-interview',
    'checkup',
    'resume',
    'sessions',
    'interview-review',
    'help',
    'settings-map',
    'settings-api',
    'settings-voice',
    'settings-updates'
  ]
  const errors = []

  for (const id of expectedIds) {
    expect(onboarding.includes(`id: '${id}'`), `缺少步骤 ${id}`, errors)
  }

  expect(onboarding.match(/id: '/g)?.length === expectedIds.length, '步骤数量应与核心模块清单一致', errors)
  expect(onboarding.includes('summary:') && onboarding.includes('detail:'), '每一步必须同时包含粗略 summary 和详细 detail', errors)

  return {
    name: '引导步骤覆盖',
    ok: errors.length === 0,
    details: [`steps: ${expectedIds.length}`, '覆盖主导航、核心页面、设置目录和三个设置子模块'],
    errors
  }
}

function checkTargetAnchors() {
  const selectors = [...onboarding.matchAll(/targetSelector: '\[data-onboarding-target="([^"]+)"\]'/g)].map((match) => match[1])
  const files = [
    'src/renderer/components/AppLayoutParts.tsx',
    'src/renderer/views/WorkspaceView.tsx',
    'src/renderer/components/workspace/TranscriptPanel.tsx',
    'src/renderer/components/workspace/AnswerPanel.tsx',
    'src/renderer/components/workspace/EvidenceRiskPanel.tsx',
    'src/renderer/views/TrainingView.tsx',
    'src/renderer/views/RealisticInterviewView.tsx',
    'src/renderer/views/HealthCheckView.tsx',
    'src/renderer/views/ResumeView.tsx',
    'src/renderer/views/SessionsView.tsx',
    'src/renderer/views/HelpCenterView.tsx',
    'src/renderer/views/InterviewReviewView.tsx',
    'src/renderer/views/SettingsView.tsx',
    'src/renderer/components/settings/ApiModelConsole.tsx',
    'src/renderer/components/settings/SpeechProviderSettingsPanel.tsx',
    'src/renderer/components/settings/UpdateLogPanel.tsx'
  ]
  const source = files.map(readText).join('\n')
  const errors = []

  expect(selectors.length === 21, '应有 21 个目标选择器', errors)
  for (const selector of selectors) {
    expect(source.includes(`data-onboarding-target="${selector}"`), `目标锚点不存在：${selector}`, errors)
  }

  return {
    name: '目标区域锚点',
    ok: errors.length === 0,
    details: [`selectors: ${selectors.length}`, '每个目标选择器都有对应页面锚点'],
    errors
  }
}

function checkJumpFocusWiring() {
  const errors = []
  const app = readText('src/renderer/App.tsx')
  const resumeFields = readText('src/renderer/components/resume/ResumeIdentityFields.tsx')
  const providerCard = readText('src/renderer/components/settings/ProviderCard.tsx')
  const speechPanel = readText('src/renderer/components/settings/SpeechProviderSettingsPanel.tsx')

  expect(app.includes("huomiantong:resume-focus"), '缺少简历字段定位事件', errors)
  expect(app.includes("huomiantong:settings-focus"), '缺少设置区域定位事件', errors)
  expect(resumeFields.includes('data-resume-focus="candidateName"') && resumeFields.includes('data-resume-focus="targetRole"'), '简历姓名/目标岗位缺少定位锚点', errors)
  expect(resumeFields.includes("className={`field-block resume-focus-field"), '简历字段缺少闪烁状态样式', errors)
  expect(providerCard.includes('data-settings-provider={provider}') && providerCard.includes('focus-flash'), '回答模型卡片缺少精准定位和闪烁状态', errors)
  expect(speechPanel.includes('data-onboarding-target="settings-voice"') && speechPanel.includes('focus-flash'), '语音转写面板缺少精准定位和闪烁状态', errors)
  expect(styles.includes('.focus-flash') && styles.includes('.resume-focus-field.flash'), '缺少跳转后的闪烁 CSS', errors)

  return {
    name: '跳转定位和闪烁反馈',
    ok: errors.length === 0,
    details: ['目标岗位跳转简历字段', 'Deepgram/DeepSeek 跳转设置对应区域', '跳转后目标区域闪烁提示'],
    errors
  }
}

function checkInteractionLock() {
  const errors = []

  expect(onboarding.includes('onboarding-tour-blocker'), '缺少全屏点击拦截层', errors)
  expect(onboarding.includes('onboarding-tour-spotlight'), '缺少目标高亮层', errors)
  expect(styles.includes('.onboarding-tour-blocker') && styles.includes('pointer-events: auto'), '背景拦截层必须接管点击', errors)
  expect(styles.includes('.onboarding-tour-root') && styles.includes('pointer-events: none'), '引导根节点不能阻止浮窗自身交互', errors)
  expect(styles.includes('.onboarding-tour-card') && styles.includes('pointer-events: auto'), '说明浮窗必须可交互', errors)

  return {
    name: '蒙层和点击锁定',
    ok: errors.length === 0,
    details: ['背景区域点击拦截', '目标区域高亮', '说明浮窗保持可操作'],
    errors
  }
}

function checkProgressAndSkip() {
  const errors = []

  expect(onboarding.includes('function next()'), '缺少下一步推进逻辑', errors)
  expect(onboarding.includes('function skip()'), '缺少跳过逻辑', errors)
  expect(onboarding.includes('localStorage.setItem(ONBOARDING_DONE_KEY'), '完成或跳过后必须持久化状态', errors)
  expect(onboarding.includes("event.key === 'Escape'"), '缺少 Esc 跳过支持', errors)
  expect(onboarding.includes('下一步') && onboarding.includes('跳过引导'), '用户可见控件必须包含下一步和跳过引导', errors)
  expect(!onboarding.includes('primaryLabel') && !onboarding.includes('secondaryLabel'), '漫游引导中不应保留旧的跳转/外链动作', errors)

  return {
    name: '下一步/跳过流程',
    ok: errors.length === 0,
    details: ['仅允许下一步推进', '支持跳过、关闭和 Esc', '不混入旧卡片式外链按钮'],
    errors
  }
}

function checkBuildScript() {
  const errors = []
  expect(packageJson.scripts?.build === 'tsc --noEmit && electron-vite build', 'build 脚本不应被引导回归改坏', errors)

  return {
    name: '项目构建入口',
    ok: errors.length === 0,
    details: ['保留现有 TypeScript + electron-vite 构建链路'],
    errors
  }
}

function readText(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8')
}

function expect(condition, message, errors) {
  if (!condition) {
    errors.push(message)
  }
}
