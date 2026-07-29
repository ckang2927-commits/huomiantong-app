# 获面通拆分路线图

这个文档用来约束后续开发：不再把新功能塞回 `App.tsx` 或 `src/main/index.ts` 这种“大房间”，而是按模块放到对应目录。

## 已完成

- 模拟训练已补充线上面试语音练习：支持 AI 面试官朗读问题、自动朗读下一题、麦克风语音作答转写，并在作答区旁展示基于全部简历材料 + 岗位 JD + AI 优化生成的练习参考答案。
- 模拟训练已新增成绩趋势看板：完整训练结束后自动记录平均分、较上一轮变化、历史最好、累计均分、最近走势和薄弱点标签。
- 模拟训练已新增错题/高频问题收藏夹：低分题自动收集、手动收藏、标签标记、高频次数、删除/清空，以及一键生成错题专项训练。
- API 设置里的 JD 编辑器已新增简历-JD 匹配评分：本地计算匹配分、能力覆盖、缺失关键词、补强建议和材料提醒，不消耗 Token。

- `src/renderer/App.tsx` 已从业务大杂烩改成页面装配入口。
- `src/main/index.ts` 已从 1000+ 行主进程大文件改成 IPC 装配入口。
- 主进程已拆出窗口、存储、备份、会话、设置、用量、回答服务。
- 渲染进程已拆出页面 views、业务 hooks、布局 components。
- 设置页和金额用量面板已拆出独立配置卡、备份区、预算区和模型用量明细。
- 岗位按钮已升级为可编辑 JD 模板库，内置模板已补强到进阶能力/建模/工程化层面，并支持本地按简历生成和 AI 深度生成 JD 建议。
- 简历证据检索已从简单关键词匹配升级为本地智能 RAG v1：分块、短语匹配、岗位 JD 加权、技能主题扩展和来源去重。
- 左侧已新增独立“模拟训练”模块，支持 10 / 15 / 20 题连续训练、训练模板预设、自定义模板增删改、固定题纲、AI 面试官追问、逐题点评打分、草稿自动保存/进入页面自动恢复、最终复盘报告、保存到会话记录和 MD/Word 导出。
- 模拟训练已新增口语表达评分：语音作答时本地分析语速、口头禅、停顿提示、结构感和作答时长，提交后随训练轮次保存，并写入 MD/Word 导出内容。
- 会话导出、依据格式化、音频采集和 Deepgram WebSocket 已拆成独立模块。
- 面试台已新增语音设置卡片：支持麦克风设备选择、本地记忆默认设备、权限/Deepgram/电脑音频支持状态、连接延迟和输入音量反馈。
- 已建立功能回归清单：`docs/regression-checklist.md`。

## 后续加功能规则

- 新功能不能直接堆进 `src/renderer/App.tsx`，只能在这里做状态装配和页面切换。
- 新 IPC 不能直接堆业务逻辑进 `src/main/index.ts`，这里只注册通道，业务放 `src/main/services`。
- 新页面放 `src/renderer/views`，可复用小块放 `src/renderer/components`。
- 新前端业务状态放 `src/renderer/hooks`。
- 新主进程业务能力放 `src/main/services`。
- 前后端共用类型放 `src/shared/types.ts`，不要在多个文件里重复写类型。
- 单文件接近 250 行时必须考虑拆分；超过 350 行必须优先拆分，除非只是纯 UI。

## 还需要拆多少

### P1：回答服务拆分（已完成）

原最大文件 `src/main/services/answerService.ts` 已从约 448 行降到约 65 行。  
已拆成：

- `evidenceService.ts`：简历证据切片、命中、排序。
- `promptService.ts`：不同岗位和回答风格的提示词生成。
- `modelClient.ts`：OpenAI-compatible、Anthropic、Deepgram 测试连接。
- `qualityScoring.ts`：回答质量评分、编造风险检测。
- `answerService.ts`：只做流程编排。

预计耗时：40-70 分钟。

### P2：面试台页面拆分（已完成）

`src/renderer/views/WorkspaceView.tsx` 已从约 285 行降到约 95 行。  
已拆成：

- `TranscriptPanel.tsx`：实时转写和历史问题。
- `AnswerPanel.tsx`：等待话术、正式答案、依据和风险提示。
- `InterviewControls.tsx`：麦克风、电脑音频、自动回答、模拟面试按钮。
- `ReviewPanel.tsx`：复盘与导出入口。

预计耗时：40-60 分钟。

### P3：简历库逻辑拆分（已完成）

`src/renderer/hooks/useResumeProfiles.ts` 已从约 247 行降到约 185 行，`ResumeView.tsx` 已从约 200 行降到约 94 行。  
已拆成：

- `useResumeProfiles.ts`：保留新增、选择、删除、更新候选人的状态动作。
- `resumeProfileHelpers.ts`：档案同步、搜索过滤、文件元信息和其他简历导入 helper。
- `ResumeProfileList.tsx`：候选人列表和搜索。
- `ResumeProfileBar.tsx`：候选人列表和搜索。
- `ResumeIdentityFields.tsx`：档案名、姓名、岗位字段。
- `ResumeFileCard.tsx`：正式简历和万字简历文件卡片。
- `OtherResumeSection.tsx`：其他简历和补充材料列表。

预计耗时：50-80 分钟。

### P4：设置页和用量面板拆分（已完成）

`SettingsView.tsx` 已改成设置页装配入口，`UsageMoneyPanel.tsx` 已改成金额用量装配入口。  
已拆成：

- `src/renderer/components/settings/ModelRouterPanel.tsx`：回答模型、面试模式、回答风格和设置保存。
- `src/renderer/components/settings/SettingsBackupPanel.tsx`：数据备份导入导出。
- `src/renderer/components/settings/ShortcutGrid.tsx`：快捷键提示。
- `src/renderer/components/settings/ProviderCard.tsx`：单个平台配置卡片。
- `src/renderer/components/settings/ProviderList.tsx`：DeepSeek、阿里、OpenAI、Anthropic、Deepgram 列表。
- `src/renderer/components/usage/BudgetEditor.tsx`：金额预算编辑。
- `src/renderer/components/usage/UsageSummaryGrid.tsx`：当前模型、总花费和剩余金额摘要。
- `src/renderer/components/usage/UsageBreakdown.tsx`：模型维度用量展示。
- `src/renderer/components/usage/usagePricing.ts`：模型计价和金额估算工具。

验证：`npm run build` 已通过，`npm run dev` 已启动并连接主窗口与悬浮窗。

### P5：会话记录与语音 Hook 优化（已完成）

`useAudioTranscription.ts` 已从采集、编码、WebSocket、解析混在一起，改成只做转写状态编排。  
已拆成：

- `src/renderer/lib/sessionExport.ts`：会话 Markdown/Word 导出、下载、悬浮窗记录、复盘统计。
- `src/renderer/lib/evidenceFormatting.ts`：依据来源名称、依据标签、Markdown 依据段落。
- `src/renderer/lib/audio/audioTypes.ts`：麦克风/电脑音频监听模式和 Deepgram payload 类型。
- `src/renderer/lib/audio/audioCapture.ts`：麦克风、电脑音频采集和媒体流释放。
- `src/renderer/lib/audio/deepgramTranscriptionClient.ts`：Deepgram WebSocket、MediaRecorder、实时/最终转写解析。
- `src/renderer/hooks/useAudioTranscription.ts`：只保留开始、停止、错误提示和转写状态。

验证：`npm run build` 已通过，`npm run dev` 已启动并连接主窗口与悬浮窗。

## 当前剩余

- 已完成：P1、P2、P3、P4。
- 已完成：P5 会话记录与语音 Hook 优化。
- 已完成：岗位按钮增强为 JD 模板库，并支持根据正式简历、万字简历、其他简历本地生成或调用当前模型深度生成适配 JD。
- 已完成：本地智能 RAG v1，回答证据会同时参考面试问题、当前岗位 JD 和当前候选人全部简历材料。
- 已完成：独立模拟训练模块，训练题数可选 10 / 15 / 20，内置数据分析、AI 产品、前端、全栈、后端和压力面训练模板，并支持复制内置模板、自定义模板增删改、固定题纲优先出题、本地兜底、草稿自动恢复、保存历史会话、口语表达评分和导出 Word/MD。
- 还剩：按 `docs/regression-checklist.md` 做一轮功能回归，确认面试台、简历库、API 设置、会话记录、导出和悬浮窗都可用。

## 执行方式

- 不再让你频繁说“继续”。
- 我每次按一个 P 阶段连续推进，中间只发短进度。
- 每个阶段完成后必须跑 `npm run build`。
- 如果改到主窗口/悬浮窗/语音/导入导出，必须重启 `npm run dev` 看启动日志。
- 如果构建失败，我先修到构建通过，不把半成品丢给你。
- 如果发现会影响产品方向的问题，再停下来问你。
