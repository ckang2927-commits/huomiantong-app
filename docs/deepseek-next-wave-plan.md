# DeepSeek 下一批安全任务计划

> 目的：把低风险、适合 DeepSeek 做的工作单独沉淀，尽量节省 Codex 额度。  
> 范围：只做文档、静态 UI、文案、说明卡片、CSS 微调，不碰核心业务链路。

## 执行原则

1. 开工前先读：
   - `docs/deepseek-safe-task-list.md`
   - `docs/deepseek-next-wave-plan.md`
2. 一次只做一个任务，或一个很小的批次。
3. 只改任务允许的文件。
4. 纯文档任务可以不跑构建，但必须说明原因。
5. 代码/组件/CSS 任务必须跑 `npm run build`。
6. 做完后更新状态、完成记录、需要 Codex 复核的点。
7. 绝对不要碰这些高风险区域：
   - `src/main/**`
   - `src/preload/**`
   - 音频采集、Deepgram、AI 回答生成
   - API Key 加密、备份导入、删除数据逻辑
   - 新增 npm 依赖
   - 大改 `App.tsx`

## 文档类任务

| 编号 | 状态 | 任务 | 产物位置 | 具体要求 | 验收标准 | 推荐指数 |
|---|---|---|---|---|---|---|
| N1 | ✅ 已完成，待 Codex 复核 | 新手五分钟上手指南 | `docs/quick-start.md` | 写安装、启动、配置 API、导入简历、开启语音、保存会话、导出 | 新用户能照着走完整流程 | ★★★★★ |
| N2 | ✅ 已完成，待 Codex 复核 | 模型与提供商选择指南 | `docs/model-provider-guide.md` | 解释 DeepSeek、阿里、OpenAI、Anthropic、Deepgram 分别干啥，什么时候用哪个 | 看完能知道该选谁，不乱填 | ★★★★★ |
| N3 | ✅ 已完成，待 Codex 复核 | 语音与电脑音频排障指南 | `docs/audio-troubleshooting.md` | 解释麦克风权限、设备未找到、`Not supported`、电脑音频来源选择、卡住怎么办 | 常见音频问题能自己排查 | ★★★★★ |
| N4 | ✅ 已完成，待 Codex 复核 | 简历库使用指南 | `docs/resume-library-guide.md` | 讲正式简历、万字简历、其他简历、命名规范、搜索、多人简历管理 | 能看懂怎么导入和找人 | ★★★★☆ |
| N5 | ✅ 已完成，待 Codex 复核 | 会话记录使用指南 | `docs/session-history-guide.md` | 讲刷新、打开、重命名、删除、多选、导出 Markdown/Word | 会话记录操作不再靠猜 | ★★★★★ |
| N6 | ✅ 已完成，待 Codex 复核 | 模拟训练使用指南 | `docs/training-guide.md` | 讲 10/15/20 轮训练、语音模拟、参考答案、错题、趋势、复盘 | 能独立开始一次训练 | ★★★★★ |
| N7 | ✅ 已完成，待 Codex 复核 | 用量预算与费用说明 | `docs/usage-budget-guide.md` | 讲 token 和金额的关系、不同模型计费思路、预算上限、剩余额度提醒 | 用户能看懂“花了多少钱” | ★★★★★ |
| N8 | ✅ 已完成，待 Codex 复核 | 常见问题与错误索引 | `docs/faq-and-troubleshooting.md` | 汇总 401/402/403/429、Deepgram、保存失败、导出空白、回答太长、反应慢 | 问题能先从这里找答案 | ★★★★★ |
| N9 | ✅ 已完成，待 Codex 复核 | 发布与回归执行指南 | `docs/release-regression-guide.md` | 整合发布前检查和手动回归点测步骤，写“怎么点 / 预期 / 失败看哪里” | 能直接拿来做验收清单 | ★★★★☆ |
| N10 | ✅ 已完成，待 Codex 复核 | DeepSeek 交付与交接模板 | `docs/deepseek-handoff-template.md` | 统一 DeepSeek 完成后怎么汇报、怎么列文件、怎么写验证结果 | 后续交付格式统一 | ★★★★☆ |
| N11 | ✅ 已完成，待 Codex 复核 | 产品说明与隐私摘要 | `docs/product-about.md` | 讲产品定位、本地数据、隐私模式、网络依赖、适用场景 | 用户知道这软件是什么、不是什么 | ★★★★☆ |
| N12 | ✅ 已完成，待 Codex 复核 | 已知问题清单 | `docs/known-issues.md` | 记录当前版本的限制、临时绕过方式、暂时不支持的能力 | 减少用户误会和反复问 | ★★★★☆ |

## 静态 UI / 文案类任务

| 编号 | 状态 | 任务 | 可改文件 | 禁止修改 | 具体要求 | 验收标准 | 推荐指数 |
|---|---|---|---|---|---|---|---|
| N13 | ✅ 已完成，待 Codex 复核 | 设置页帮助中心卡片升级 | `src/renderer/components/settings/HelpQuickLinksPanel.tsx`、`src/renderer/views/SettingsView.tsx`、`src/renderer/styles.css` | 不加新路由、不碰主进程 | 把常用文档入口做得更清楚，支持快速跳转或路径提示 | 用户一眼知道去哪看帮助 | ★★★★★ |
| N14 | ✅ 已完成，待 Codex 复核 | FAQ 静态卡片 | `src/renderer/components/settings/FAQPanel.tsx`、`src/renderer/views/SettingsView.tsx`、`src/renderer/styles.css` | 不接新接口、不改业务逻辑 | 汇总常见问题：401/402、音频、保存、导出、回答慢 | 用户不用每次都找聊天记录问 | ★★★★★ |
| N15 | ✅ 已完成，待 Codex 复核 | 模型与费用说明卡片 | `src/renderer/components/settings/ModelProviderPanel.tsx`、`src/renderer/views/SettingsView.tsx`、`src/renderer/styles.css` | 不改模型调用逻辑 | 说明不同提供商适合做什么、计费思路、预算提示 | 用户看设置页就懂模型区别 | ★★★★★ |
| N16 | ✅ 已完成，待 Codex 复核 | 语音排障卡片 | `src/renderer/components/settings/AudioTroubleshootingPanel.tsx`、`src/renderer/views/SettingsView.tsx`、`src/renderer/styles.css` | 不碰音频采集链路 | 把麦克风/电脑音频的常见故障写成可操作提示 | 见卡就能先自救 | ★★★★☆ |
| N17 | ✅ 已完成，待 Codex 复核 | 空状态文案继续优化 | `src/renderer/views/*`、`src/renderer/components/*` | 不改业务判断条件 | 继续把会话、训练、简历、诊断等空状态写得更像人话 | 没数据时不空、不冷 | ★★★★☆ |
| N18 | ✅ 已完成，待 Codex 复核 | 按钮与卡片视觉统一 | `src/renderer/styles.css` | 不改点击事件、不改布局结构 | 统一 hover、active、disabled、焦点、保存成功提示样式 | 页面看起来更顺、更稳 | ★★★★☆ |
| N19 | ✅ 已完成，待 Codex 复核 | 设置页说明条补强 | `src/renderer/components/settings/*`、`src/renderer/styles.css` | 不改保存逻辑 | 给 API、回答、语音、隐私、备份、快捷键补说明文字 | 每个设置块都知道是干啥的 | ★★★★☆ |
| N20 | ✅ 已完成，待 Codex 复核 | Toast 与保存提示优化 | `src/renderer/components/*`、`src/renderer/styles.css` | 不改数据逻辑 | 保存成功、刷新成功、错误提示的位置和样式再顺一点 | 弹窗不挡事，信息能看清 | ★★★★☆ |

## 建议执行顺序

1. N1 新手五分钟上手指南
2. N2 模型与提供商选择指南
3. N3 语音与电脑音频排障指南
4. N7 用量预算与费用说明
5. N8 常见问题与错误索引
6. N13 设置页帮助中心卡片升级
7. N14 FAQ 静态卡片
8. N15 模型与费用说明卡片
9. N16 语音排障卡片
10. N17 空状态文案继续优化
11. N18 按钮与卡片视觉统一
12. N19 设置页说明条补强
13. N20 Toast 与保存提示优化
14. N4 / N5 / N6 / N9 / N10 / N11 / N12 作为后续文档批次继续排

## DeepSeek 启动提示词

```text
你现在在开发 Windows Electron 项目“获面通”，路径：
C:\Users\kangg\Desktop\huomiantong-app

请先阅读：
1. docs/deepseek-safe-task-list.md
2. docs/deepseek-next-wave-plan.md

本次只执行 deepseek-next-wave-plan.md 里的任务：【填写任务编号，例如 N1】。

要求：
1. 先制定执行计划，再按计划完成。
2. 只能修改该任务允许的文件。
3. 不允许修改 src/main、src/preload、音频采集、Deepgram、AI 回答生成、API Key 加密、备份导入、删除数据逻辑。
4. 不允许新增 npm 依赖。
5. 纯文档任务可以不运行构建，但要说明“只改文档，未运行构建”。
6. 代码 / UI / CSS 任务必须运行 npm run build。
7. 完成后更新该任务状态、完成记录和需要 Codex 复核的点。
8. 最后按固定格式汇报修改文件、验证结果和风险点。
```

## Codex 验收时看什么

- 是否碰了高风险区域。
- 是否新增了不必要依赖。
- 文档内容是否和当前项目一致。
- UI 改动是否只是静态展示和文案，不牵连业务逻辑。
- 代码类任务是否真的跑过 `npm run build`。
- 如果是 UI 任务，后续还需要实际打开页面做视觉验收。

> 备注：`N1-N20` 全部完成并通过 Codex 验收后，继续下一本任务书：`docs/deepseek-third-wave-plan.md`。
