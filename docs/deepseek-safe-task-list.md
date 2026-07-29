# DeepSeek 可执行任务清单与协作规范

> 目的：把基础、低风险、不容易破坏核心链路的工作交给 DeepSeek 做，节省 Codex 额度；核心逻辑、音频、模型调用、数据安全等高风险部分继续由 Codex 把关。

> 执行入口：具体任务不要散着做，统一从 `docs/deepseek-execution-plan.md` 领取。DeepSeek 每次先读本文件，再读执行计划表，然后只做计划表里一个任务或一个小批次。

## 一、即使计划都做完，软件后续可能还缺什么

| 方向 | 还缺什么 | 为什么重要 | 是否适合 DeepSeek |
|---|---|---|---|
| 新手引导 | 首次启动向导、API Key 填写指引、Deepgram 语音测试流程 | 新用户不知道先点哪里，容易觉得软件坏了 | 适合做静态 UI 初稿 |
| 设置中心 | 把 API、回答、语音、悬浮窗、快捷键、隐私、训练、诊断分区 | 现在功能越来越多，需要统一管理入口 | 适合做骨架，不适合改保存逻辑 |
| 用户手册 | 如何导入简历、如何开始面试、如何查错、如何备份 | 以后你给朋友用，不需要每次口头教 | 很适合 |
| 回归测试记录 | 每次改完后记录哪些点测过、哪些没测 | 防止“构建通过但页面还是错” | 很适合 |
| UI 空状态 | 没有简历、没有会话、没有 Key、没有错误日志时的提示 | 降低用户迷茫感 | 很适合 |
| 错误文案库 | 401/402/429、麦克风、Deepgram、电脑音频的人话解释 | 用户看不懂英文报错 | 适合做文案补充，规则接入需 Codex |
| 示例数据 | 示例候选人、示例问题、示例训练报告 | 方便演示和测试 | 适合，但不能污染真实数据 |
| 产品说明页 | 版本号、功能说明、本地数据说明、隐私说明 | 软件更像成熟产品 | 很适合 |
| 轻量 UI 美化 | 卡片排版、按钮 hover、空状态插画区、说明条 | 改善观感，不影响核心逻辑 | 适合，但必须局部改 |
| 文档整理 | 把分散想法整理到计划表，补验收标准 | 保持我们开发不跑偏 | 很适合 |
| 手动测试脚本 | 写“点测步骤”而不是自动化代码 | 你可以照着一步步确认功能 | 很适合 |
| 快捷键说明 | 在设置页展示已有快捷键、说明冲突规则 | 用户知道怎么用 | 适合展示，不适合注册全局快捷键 |

## 二、适合交给 DeepSeek 做的低风险任务

### A. 文档类任务（最适合）

| 任务 | 具体要求 | 产物位置 | 验收标准 |
|---|---|---|---|
| 整理用户使用手册 | 按“安装/启动/导入简历/API 设置/面试台/语音/会话/备份/排错”写 | `docs/user-guide.md` | 中文清楚、能给朋友照着用 |
| 补充回归测试清单 | 给每个模块补“怎么点、应该看到什么、失败怎么看” | `docs/regression-checklist.md` | 不删除旧内容，只追加 |
| 整理错误解释词典 | 收集 401/402/429、Deepgram、麦克风、电脑音频的解释 | `docs/error-dictionary.md` | 只写文档，不改代码 |
| 写设置中心说明 | 把 8 个设置分区解释成用户能看懂的话 | `docs/settings-center-spec.md` | 每个分区有字段、默认值、解释 |
| 写发布前检查表 | 打包前检查 Key、备份、隐私、启动器、构建 | `docs/release-checklist.md` | 条目可勾选、具体可操作 |

### B. 静态 UI / 展示类任务（可以做，但要限制范围）

| 任务 | 可以改哪里 | 禁止改哪里 | 验收标准 |
|---|---|---|---|
| 设置中心骨架 UI 初稿 | `src/renderer/views/SettingsView.tsx`、`src/renderer/components/settings/*`、`src/renderer/styles.css` | 不改 `AppSettings`、不改主进程、不改保存逻辑 | 8 个分区能切换，现有功能还在 |
| 空状态文案优化 | 各 view/component 里的空状态文字 | 不改业务判断条件 | 没数据时提示更友好 |
| 按钮/卡片 hover 效果 | `src/renderer/styles.css` | 不改点击事件逻辑 | 构建通过，页面不乱 |
| 关于与帮助页静态卡片 | 新增 `AboutDiagnosticsPanel.tsx` | 不读写系统文件、不调用主进程 | 显示版本、数据路径占位、作战室入口说明 |
| 设置分区说明条 | settings 组件内的说明文本 | 不改 API Key 保存/测试逻辑 | 用户知道每项设置干啥 |

### C. 常量/文案类任务（适合）

| 任务 | 可以改哪里 | 注意事项 |
|---|---|---|
| 等待话术扩充 | 等待话术常量所在文件 | 话术要自然短句，不要太官方 |
| 错误建议文案补充 | `diagnosticLog.ts` 的解释文案可以先提方案 | DeepSeek 先写文案，不直接改规则也可以 |
| 设置项中文说明 | settings 组件文案 | 不能泄露 Key，不要引导规避检测 |
| 模板说明优化 | 训练模板说明、JD 模板说明 | 不改模板核心字段结构 |

## 三、DeepSeek 不建议碰的高风险任务

| 禁止/谨慎任务 | 原因 | 交给谁 |
|---|---|---|
| `src/main` 主进程 IPC、窗口、存储、备份、安全逻辑 | 改错可能导致数据丢失、窗口打不开、Key 泄露 | Codex |
| `src/preload` 暴露接口 | 改错会破坏前后端通信，也有安全风险 | Codex |
| API Key 加密、备份导入覆盖、删除会话/删除简历 | 涉及不可逆数据和隐私 | Codex |
| Deepgram WebSocket、麦克风、电脑音频采集 | 之前问题多，容易一改又坏 | Codex |
| AI 回答生成链路、流式输出、RAG 证据检索 | 影响核心回答质量和速度 | Codex |
| 训练评分、错题收藏、趋势存储 | 影响训练数据一致性 | Codex |
| `App.tsx` 大改、全局状态 store 大改 | 容易把模块重新塞回“大房间” | Codex |
| 新增 npm 依赖 | 可能引入体积、构建、兼容问题 | 先问 Codex/用户 |
| 批量重命名/移动文件 | 容易打断 import 和既有计划 | 先问 Codex/用户 |
| “隐藏/规避检测”相关功能 | 产品边界不允许 | 不做 |

## 四、DeepSeek 每次开工必须遵守的工程规范

### 1. 先读文件，别盲改

开工前必须先阅读：

- `docs/deepseek-safe-task-list.md`
- `docs/deepseek-execution-plan.md`
- `docs/product-optimization-backlog.md`
- `docs/refactor-roadmap.md`
- `docs/regression-checklist.md`
- 当前要改的组件文件

### 2. 每次只做一个小任务

一次只允许做一个小范围任务，例如：

- 只写 `docs/user-guide.md`
- 只补 `SettingsView` 的分区 UI 骨架
- 只优化某个空状态文案

不要一次同时改设置、语音、会话、训练、主进程。

### 3. 不允许动这些区域，除非明确批准

- `src/main/**`
- `src/preload/**`
- `src/shared/types.ts`
- `src/renderer/hooks/useAudioTranscription.ts`
- `src/renderer/lib/audio/**`
- `src/renderer/hooks/useAnswerGeneration.ts`
- `src/main/services/answerService.ts`
- `src/main/services/modelClient.ts`
- `src/renderer/stores/useSettingsStore.ts`
- 删除文件、移动文件、改存储 key、改备份格式

### 4. 组件要放对位置

- 页面：`src/renderer/views`
- 设置页组件：`src/renderer/components/settings`
- 会话组件：`src/renderer/components/sessions`
- 训练组件：`src/renderer/components/training`
- 纯逻辑：`src/renderer/lib`
- hooks：`src/renderer/hooks`
- 共享类型：优先不要动 `src/shared/types.ts`

### 5. 做完必须验证

至少执行：

```bash
npm run build
```

如果只是文档，可以不用构建，但必须说明“只改文档，未运行构建”。

### 6. 汇报格式必须固定

DeepSeek 每次完成后必须按这个格式汇报：

```md
## 本次修改
- 改了什么
- 为什么这么改

## 修改文件
- 文件路径 1
- 文件路径 2

## 没有碰的高风险区域
- src/main
- src/preload
- 音频采集
- API Key 加密

## 验证结果
- npm run build 是否通过
- 如果没运行，原因是什么

## 需要 Codex 复核的点
- 哪些地方可能影响功能
```

## 五、可以直接发给 DeepSeek 的提示词模板

```text
你现在在开发 Windows Electron 项目“获面通”，路径：
C:\Users\kangg\Desktop\huomiantong-app

这次只允许做一个低风险任务：
【把这里替换成具体任务，例如：新增 docs/user-guide.md 用户使用手册】

必须遵守：
1. 先阅读 docs/product-optimization-backlog.md、docs/refactor-roadmap.md、docs/regression-checklist.md。
2. 不允许修改 src/main、src/preload、音频采集、AI 回答生成、API Key 加密、备份导入、删除数据逻辑。
3. 不允许新增 npm 依赖。
4. 不允许大改 App.tsx。
5. 如果要改 UI，只能改指定组件和 styles.css。
6. 做完后必须列出修改文件、验证方式、有没有运行 npm run build。
7. 不能删除旧功能，不能改坏现有 API 设置、语音转写、简历库、会话记录。

完成后按固定格式汇报：
本次修改 / 修改文件 / 没有碰的高风险区域 / 验证结果 / 需要 Codex 复核的点。
```

## 六、我建议优先交给 DeepSeek 的 8 个任务

| 顺序 | 任务 | 难度 | 风险 | 备注 |
|---|---|---|---|---|
| 1 | 写 `docs/user-guide.md` 用户使用手册 | 低 | 低 | 最适合 DeepSeek |
| 2 | 写 `docs/settings-center-spec.md` 设置中心详细说明 | 低 | 低 | 先文档后代码 |
| 3 | 补 `docs/regression-checklist.md` 的具体点测步骤 | 低 | 低 | 提高后续验收效率 |
| 4 | 写 `docs/error-dictionary.md` 错误解释词典 | 低 | 低 | 后续 Codex 再接入代码 |
| 5 | 做设置中心静态 UI 骨架 | 中 | 中 | 只许搬现有组件，不改保存逻辑 |
| 6 | 优化空状态文案 | 低 | 低 | 只改展示文字 |
| 7 | 写发布前检查表 `docs/release-checklist.md` | 低 | 低 | 给朋友使用前照着查 |
| 8 | 做关于/帮助静态面板 | 中 | 中 | 只做展示，不做系统读写 |

## 七、Codex 复核重点

DeepSeek 做完后，Codex 应重点检查：

- 是否误改 `src/main`、`src/preload`、音频、回答生成、存储。
- 是否把现有功能入口删了。
- `npm run build` 是否真的通过。
- 页面是否实际打开过，而不是只说“代码没报错”。
- UI 是否又出现左右布局割裂、滚动条异常、按钮看不到的问题。
- 是否新增了不必要依赖。
- 是否留下无用文件、临时文件、重复组件。
