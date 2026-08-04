# 当前执行与验收总表

最后更新：2026-08-04

这个文档是本轮工作的唯一执行清单。后续 Codex 按这里推进任务；每完成一项，必须同步更新本文档和 `docs/product-optimization-backlog.md`。

## 状态标记

- ✅ 已完成：代码/文档已落地，并通过对应自动验收。
- 🟡 待人工验收：代码已落地，但必须由用户用真实 Key、真实语音、真实录音或安装版点测。
- 🔵 Codex 执行中：当前由 Codex 继续推进。
- ⏳ Codex 待做：不需要用户先验收，Codex 可以继续做。
- ⏸ 暂停：本轮不推进。
- ❌ 阻塞：缺少真实凭证、真实录音、安装包或用户决策。

## 做完 / 没做完总览

| 分类 | 数量 | 当前结论 |
|------|------|----------|
| 已完成并通过自动验收 | 12 | P3-9 本地 RAG 回归、P3-10 拟真面试本地回归、P3-13 问题队列本地回归、P3-14 面试复盘本地回归、P3-15 AI 深度报告兜底回归、P3-16 AI 深度话术兜底回归、P3-17 长录音本地策略回归、P3-20 更新入口技术检查、发布前资源检查、漫游式新手引导结构检查、帮助中心索引、构建验证已通过 |
| Codex 还需要继续做 | 0 | `v0.1.4` 已正式发布，自动发布链路已完成 |
| 需要用户人工验收 | 8 | 真实 Key、真实麦克风、真实电脑音频、真实录音、安装版入口等 |
| 本轮暂停 | 2 | 国内语音服务商接入、背景/按钮主题换肤 |
| 发布前仍未完成 | 0 | 线上 Release 已完成；剩余为用户自己的更新点测 |

## Codex 本轮待做任务

这些任务不需要用户先操作，Codex 可以继续做。每项做完后要在“执行记录”里写结果。

| 编号 | 状态 | 任务 | Codex 要做什么 | 自动验收方式 | 同步到总计划 |
|------|------|------|----------------|--------------|--------------|
| C-1 | ✅ 已完成 | P3-9 RAG v2 本地回归 | 新增 `npm run validate:rag`，覆盖第一家公司、上一家公司、RFM、转化漏斗、多候选人隔离 | `npm run validate:rag` 5/5 通过 | P3-9 |
| C-2 | ✅ 已完成 | P3-10 拟真面试本地回归 | 新增 `npm run validate:realistic`，用模拟数据检查配置归一化、题库规模、难度/侧重点选题、已用题排除 | `npm run validate:realistic` 5/5 通过；`npm run build` | P3-10 |
| C-3 | ✅ 已完成 | P3-13 问题队列本地回归 | 新增队列纯逻辑和 `npm run validate:queue`，验证连续多问题、生成中排队、缓存命中继续下一题、历史/待生成字段保留 | `npm run validate:queue` 6/6 通过；`npm run build` | P3-13 |
| C-4 | ✅ 已完成 | P3-14 面试复盘本地回归 | 新增 `npm run validate:review`，用模拟转写文本验证问题提取、回答切片、质量评分、本地报告生成和说话人格式兼容 | `npm run validate:review` 6/6 通过；`npm run build` | P3-14 |
| C-5 | ✅ 已完成 | P3-15 AI 深度报告兜底检查 | 新增 `npm run validate:deep-report`，验证无 Key、模型失败时能回退本地草案，不覆盖本地报告且不记录失败用量 | `npm run validate:deep-report` 3/3 通过；`npm run build` | P3-15 |
| C-6 | ✅ 已完成 | P3-16 AI 深度话术兜底检查 | 新增 `npm run validate:deep-talk`，验证无 Key、选中问题无回答、模型失败和没有可优化问题时有可见提示和本地草案 | `npm run validate:deep-talk` 4/4 通过；`npm run build` | P3-16 |
| C-7 | ✅ 已完成 | P3-17 长录音本地策略检查 | 新增 `npm run validate:long-audio`，验证 20/60 分钟场景提示、超时说明、分段建议、失败重试文案 | `npm run validate:long-audio` 4/4 通过；`npm run build` | P3-17 |
| C-8 | ✅ 已完成 | P3-20 更新日志/更新入口技术检查 | 新增 `npm run validate:update-flow`，检查“检查更新不自动下载”、下载后再重启安装、开发模式提示和 IPC 通道 | `npm run validate:update-flow` 6/6 通过；`npm run build` | P3-20 / P3-22-7 |
| C-9 | ✅ 已完成 | 发布前资源检查 | 确认 `resources/piper` 正式资源、`package.json` 文案、临时文件归档状态 | `npm run validate:release-resources` 6/6 通过；不运行 `npm run dist` | 发布前必做清单 |
| C-10 | ✅ 已完成 | 漫游式新手引导 | 将现有卡片式引导升级为 21 步镂空蒙层引导；面试台细分当前候选人、目标岗位、实时转写、AI 建议回答、回答策略、语音设置和面试预热题目；每一步提供粗略说明和详细说明，仅支持下一步/跳过 | `npm run validate:onboarding-tour` 6/6 通过；`npm run build`；人工窗口点测待 U-2 | P3-22-8 |

## 用户人工验收任务

这些任务必须由用户或真实使用者操作，因为需要真实账号、真实硬件、真实录音或安装版环境。

| 编号 | 状态 | 任务 | 用户要验什么 | 通过标准 | 对应 Codex 准备 |
|------|------|------|--------------|----------|----------------|
| U-1 | 🟡 待人工验收 | API Key 真实保存和测试 | 填 DeepSeek/Deepgram Key，保存后重启软件再测试连接 | 成功/失败都有中文状态；重启后 Key 仍在 | C-8 / P3-22 |
| U-2 | 🟡 待人工验收 | 漫游式新手引导完整流程 | 首次打开、面试台 7 个重点区域、目标高亮、页面锁定、下一步、跳过、设置里重开教程；点击目标岗位和顶部 Deepgram/DeepSeek 状态后检查精准跳转与闪烁 | 目标区域定位准确；背景不可点击；只用下一步切换；跳转后姓名/岗位或设置对应区域闪烁；跳过后可正常使用软件 | P3-22-8 |
| U-3 | 🟡 待人工验收 | 真实麦克风转写 | 用真实麦克风说问题、暂停/恢复、无关语气词过滤 | 不误触发、不卡死、状态提示清楚 | C-3 |
| U-4 | 🟡 待人工验收 | 电脑音频转写 | 选择屏幕/窗口音频并开始转写 | 有权限提示、来源选择和错误提示 | P3-22 / 语音基础链路 |
| U-5 | 🟡 待人工验收 | 拟真面试跑完整一轮 | 选择声音、题数、难度，完成一轮并生成复盘 | 题数真实生效；报告生成；进度打勾 | C-2 |
| U-6 | 🟡 待人工验收 | 真实录音上传复盘 | 上传 5/20/60 分钟真实录音，检查转写、问题提取、报告质量 | 不崩溃；问题提取可用；报告有参考价值 | C-4 / C-7 |
| U-7 | 🟡 待人工验收 | 更新日志安装版入口 | 在安装版设置页确认“诊断日志”下面有“更新日志” | 能查看历代版本、待发布内容和更新按钮 | C-8 |
| U-8 | 🟡 待人工验收 | 覆盖更新后的数据保留 | 安装版覆盖更新后检查 Key、简历、会话、复盘记录 | 用户数据不丢 | 发布前安装版点测 |

## 本轮暂停任务

| 编号 | 状态 | 任务 | 暂停原因 | 恢复条件 |
|------|------|------|----------|----------|
| P-1 | ⏸ 暂停 | P3-12 国内语音服务商接入 | 用户决定先停，避免拖慢主线 | 用户重新要求接腾讯云/阿里/百度/火山/讯飞 STT |
| P-2 | ⏸ 暂停 | 背景/按钮主题换肤 | 用户决定先不折腾主题 | 用户重新要求做主题或 UI 皮肤 |

## 发布前未完成清单

| 编号 | 状态 | 任务 | 完成条件 |
|------|------|------|----------|
| R-1 | ✅ 已完成自动检查 / 待安装版点测 | Piper 正式资源确认 | `resources/piper` 静态检查通过；安装版内试听仍需发布前人工点测 |
| R-2 | 🟡 待人工验收 | P3-22 新手体验全链路 | 用户完成首次打开、配置、训练、拟真面试、设置重开教程 |
| R-3 | ✅ 已完成 | 提升版本号 | 已从 `0.1.3` 提升到 `0.1.4` |
| R-4 | ✅ 已完成 | 正式发布安装包和线上更新 | 已生成 `0.1.4` 安装包，推送 `v0.1.4` 标签，GitHub Release 已产出 `latest.yml` |

## 执行记录

| 日期 | 执行人 | 事项 | 结果 | 验收 |
|------|--------|------|------|------|
| 2026-08-03 | Codex | P3-12 国内语音服务商标记暂停 | 已同步到总计划 | 文档检查 |
| 2026-08-03 | Codex | P3-9 RAG 本地回归脚本 | 新增 `scripts/validate-rag-v2.mjs` 和 `npm run validate:rag` | 5/5 通过 |
| 2026-08-03 | Codex | P3-10 拟真面试本地回归脚本 | 新增 `scripts/validate-realistic-interview.mjs` 和 `npm run validate:realistic` | 5/5 通过 |
| 2026-08-03 | Codex | P3-13 问题队列本地回归脚本 | 新增 `src/renderer/lib/answerQueueMachine.ts`、`scripts/validate-answer-queue.mjs` 和 `npm run validate:queue` | 6/6 通过 |
| 2026-08-03 | Codex | P3-14 面试复盘本地回归脚本 | 新增 `scripts/validate-interview-review.mjs` 和 `npm run validate:review`；修正 HR 稳定性题评分优先级 | 6/6 通过 |
| 2026-08-03 | Codex | P3-15 AI 深度报告兜底回归脚本 | 新增 `scripts/validate-review-deep-report.mjs` 和 `npm run validate:deep-report` | 3/3 通过 |
| 2026-08-03 | Codex | P3-16 AI 深度话术兜底回归脚本 | 新增 `scripts/validate-review-deep-talk.mjs` 和 `npm run validate:deep-talk` | 4/4 通过 |
| 2026-08-03 | Codex | P3-17 长录音本地策略回归脚本 | 新增 `src/renderer/lib/longAudioOptimization.ts`、`scripts/validate-long-audio.mjs` 和 `npm run validate:long-audio` | 4/4 通过 |
| 2026-08-03 | Codex | P3-20 更新入口技术检查脚本 | 新增 `scripts/validate-update-flow.mjs` 和 `npm run validate:update-flow` | 6/6 通过 |
| 2026-08-03 | Codex | 发布前资源检查脚本 | 新增 `scripts/validate-release-resources.mjs`、`docs/release-resource-regression.md`，确认 Piper/extraResources/临时文件归档状态 | 6/6 通过 |
| 2026-08-04 | Codex | 漫游式新手引导细化 | 引导扩展为 21 步；面试台新增 7 个重点区域说明；目标岗位可点击跳转简历字段；Deepgram/DeepSeek 顶部状态可精准跳转设置；简历和设置目标区域增加闪烁定位 | `npm run validate:onboarding-tour` 6/6；`npm run build` 通过，待 U-2 人工点测 |
| 2026-08-04 | Codex | 帮助中心索引刷新 | 文档索引更新到 111 份 | `npm run docs:index:check` 通过 |
| 2026-08-04 | Codex | v0.1.4 正式发布完成 | 版本号升到 `0.1.4`，新增完整更新说明，软件内更新弹窗和更新日志同步到本次发布；已推送标签并生成 GitHub Release | `npm run dist`、发布资源检查、线上 Release 验证均通过 |
| 2026-08-03 | Codex | 构建验证 | TypeScript 和 Electron 构建通过 | `npm run build` 通过 |

## 同步规则

- Codex 每完成一项，必须同时更新本文档的状态、执行记录和 `docs/product-optimization-backlog.md` 对应 P 编号。
- 用户完成一项人工验收后，Codex 要把对应 `U-*` 状态从“待人工验收”改成“已通过”或“发现问题”，并把问题拆回 Codex 待做任务。
- 本轮不生成安装包；只有用户明确说“生成安装包/打包/发布”时才运行 `npm run dist`。
- 如果任务状态出现冲突，以本文档的“做完 / 没做完总览”和总计划顶部“当前执行总览”为准。
