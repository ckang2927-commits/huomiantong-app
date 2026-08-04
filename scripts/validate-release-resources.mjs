import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const expectedVersion = '0.1.4'
const results = [
  validatePackageMetadata(),
  validateExtraResources(),
  validatePiperRuntime(),
  validatePiperVoices(),
  validateTemporaryFilesClean(),
  validateReleaseArtifacts()
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
  console.error(`\n发布前资源检查失败：${failed.length}/${results.length}`)
  process.exitCode = 1
} else {
  console.log(`\n发布前资源检查通过：${results.length}/${results.length}`)
}

function validatePackageMetadata() {
  const errors = []
  const pkg = readPackage()

  expect(pkg.version === expectedVersion, `正式发布版本应为 ${expectedVersion}`, errors)
  expect(pkg.build?.productName === '获面通', 'productName 应为中文“获面通”', errors)
  expect(pkg.build?.win?.signAndEditExecutable === false, '当前未做代码签名，应显式关闭签名编辑', errors)
  expect(pkg.scripts?.dist === 'npm run build && electron-builder', 'dist 脚本应保留本地打包入口', errors)
  expect(pkg.scripts?.['dist:publish'] === 'npm run build && electron-builder --publish always', 'dist:publish 应保留 GitHub Release 发布入口', errors)

  return {
    name: 'package.json 发布元信息',
    ok: errors.length === 0,
    details: [`version: ${pkg.version}`, `productName: ${pkg.build?.productName}`],
    errors
  }
}

function validateExtraResources() {
  const errors = []
  const pkg = readPackage()
  const extraResources = pkg.build?.extraResources || []
  const docsResource = extraResources.find((item) => item.from === 'docs' && item.to === 'docs')
  const piperResource = extraResources.find((item) => item.from === 'resources/piper' && item.to === 'piper')

  expect(Boolean(docsResource), 'docs 应进入 extraResources', errors)
  expect(Boolean(piperResource), 'resources/piper 应进入 extraResources', errors)
  expect(Boolean(piperResource?.filter?.includes('!probe*')), 'piper extraResources 应排除 probe*', errors)
  expect((pkg.build?.files || []).includes('node_modules/pinyin-pro/**/*'), 'pinyin-pro 应进入安装包文件列表', errors)
  expect((pkg.build?.asarUnpack || []).some((item) => item.includes('onnxruntime-node')), 'onnxruntime-node 原生文件应 asarUnpack', errors)

  return {
    name: '打包资源配置',
    ok: errors.length === 0,
    details: [`extraResources: ${extraResources.length}`],
    errors
  }
}

function validatePiperRuntime() {
  const errors = []
  const required = [
    'resources/piper/piper/piper.exe',
    'resources/piper/piper/piper_phonemize.dll',
    'resources/piper/piper/espeak-ng.dll',
    'resources/piper/piper/onnxruntime.dll',
    'resources/piper/piper/espeak-ng-data/cmn_dict',
    'resources/piper/onnxruntime.dll',
    'resources/piper/sherpa-onnx-non-streaming-tts.exe'
  ]

  for (const file of required) {
    expect(fileExistsWithSize(file), `${file} 缺失或为空`, errors)
  }

  const piperFiles = listFiles('resources/piper')
  const probeFiles = piperFiles.filter((file) => /(^|[\\/])probe/i.test(file) || /\.(wav|mp3)$/i.test(file))
  expect(probeFiles.length === 0, `resources/piper 不应包含 probe 或临时音频：${probeFiles.join(', ')}`, errors)

  return {
    name: 'Piper 正式运行资源',
    ok: errors.length === 0,
    details: [`files: ${piperFiles.length}`],
    errors
  }
}

function validatePiperVoices() {
  const errors = []
  const voiceModels = ['zh_CN-xiao_ya-medium', 'zh_CN-huayan-medium', 'zh_CN-chaowen-medium']

  for (const model of voiceModels) {
    expect(fileExistsWithSize(`resources/piper/voices/${model}/${model}.onnx`), `${model}.onnx 缺失或为空`, errors)
    expect(fileExistsWithSize(`resources/piper/voices/${model}/${model}.onnx.json`), `${model}.onnx.json 缺失或为空`, errors)
    expect(fileExistsWithSize(`resources/piper/voices/${model}/tokens.txt`), `${model}/tokens.txt 缺失或为空`, errors)
  }

  return {
    name: '三套本地面试官声音模型',
    ok: errors.length === 0,
    details: voiceModels,
    errors
  }
}

function validateTemporaryFilesClean() {
  const errors = []
  const rootEntries = readdirSync(root, { withFileTypes: true }).map((entry) => entry.name)
  const rootTemp = rootEntries.filter((name) => /^\.tmp-|probe|theme.*preview|screenshot/i.test(name))
  const docsPreview = listFiles('docs').filter((file) => /ui-preview|theme.*preview|screenshot|probe|make_workspace_previews/i.test(file))

  expect(rootTemp.length === 0, `项目根目录不应保留临时/探测文件：${rootTemp.join(', ')}`, errors)
  expect(docsPreview.length === 0, `docs 不应保留主题预览/探测草稿：${docsPreview.join(', ')}`, errors)

  return {
    name: '临时与主题预览资源清理',
    ok: errors.length === 0,
    details: ['root/docs temp files: clean'],
    errors
  }
}

function validateReleaseArtifacts() {
  const errors = []
  const pkg = readPackage()
  const setupName = `release/huomiantong-setup-${pkg.version}.exe`
  const blockmapName = `${setupName}.blockmap`
  const latestText = readText('release/latest.yml')

  expect(fileExistsWithSize(setupName), `缺少正式安装包：${setupName}`, errors)
  expect(fileExistsWithSize(blockmapName), `缺少 blockmap：${blockmapName}`, errors)
  expect(latestText.includes(`version: ${pkg.version}`), 'latest.yml 应指向本次正式版本号', errors)
  expect(latestText.includes(`url: huomiantong-setup-${pkg.version}.exe`), 'latest.yml 应指向本次安装包文件', errors)

  return {
    name: '正式发布安装包与更新元数据',
    ok: errors.length === 0,
    details: [setupName, 'release/latest.yml'],
    errors
  }
}

function readPackage() {
  return JSON.parse(readText('package.json'))
}

function readText(relativePath) {
  const filePath = join(root, relativePath)
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : ''
}

function fileExistsWithSize(relativePath) {
  const file = join(root, relativePath)
  return existsSync(file) && statSync(file).isFile() && statSync(file).size > 0
}

function listFiles(relativePath) {
  const base = join(root, relativePath)

  if (!existsSync(base)) {
    return []
  }

  const result = []
  walk(base, result)
  return result.map((file) => relative(root, file))
}

function walk(current, result) {
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const next = join(current, entry.name)
    if (entry.isDirectory()) {
      walk(next, result)
    } else {
      result.push(next)
    }
  }
}

function expect(condition, message, errors) {
  if (!condition) {
    errors.push(message)
  }
}
