# DeepSeek 第三批任务书（N21-N40）

> 使用前提：只有在 `docs/deepseek-next-wave-plan.md` 的 `N1-N20` 全部完成，并且经过 Codex 复核后，才能开始本文件。  
> 目标：继续把低风险、可复用、可文档化的工作交给 DeepSeek，减少 Codex 在说明文档和静态展示上的消耗。

## 执行原则

1. 开工前先读：
   - `docs/deepseek-safe-task-list.md`
   - `docs/deepseek-next-wave-plan.md`
   - `docs/deepseek-third-wave-plan.md`
2. 一次只做一个任务，或者一个极小批次。
3. 只改任务允许的文件。
4. 纯文档任务可以不跑构建，但必须说明原因。
5. 代码 / UI / CSS 任务必须跑 `npm run build`。
6. 完成后更新状态、完成记录、需要 Codex 复核的点。
7. 仍然不要碰：
   - `src/main/**`
   - `src/preload/**`
   - 音频采集、Deepgram、AI 回答生成
   - API Key 加密、备份导入、删除数据逻辑
   - 新增 npm 依赖
   - 大改 `App.tsx`

## 文档批次

| 编号 | 状态 | 任务 | 产物位置 | 具体要求 | 验收标准 | 推荐指数 |
|---|---|---|---|---|---|---|
| N21 | ✅ 已完成，待 Codex 复核 | 产品术语表与统一叫法 | `docs/terminology-glossary.md` | 统一“面试台 / 作战室 / 模拟训练 / 会话记录 / 悬浮窗 / 预热缓存 / 候选人 / JD”等叫法 | 后续文档和界面名词不再乱 | ★★★★★ |
| N22 | ✅ 已完成，待 Codex 复核 | 场景化上手指南 | `docs/use-case-quickstart.md` | 分“自己用 / 给朋友用 / 打包版 App 演示”三个场景说明软件怎么开始用 | 用户能按场景快速入门 | ★★★★★ |
| N23 | ✅ 已完成，待 Codex 复核 | 模型选择决策树 | `docs/model-choice-guide.md` | 讲 DeepSeek、阿里、OpenAI、Anthropic 什么时候更适合用 | 用户看完知道该怎么选模型 | ★★★★★ |
| N24 | ✅ 已完成，待 Codex 复核 | 语音排障决策树 | `docs/audio-troubleshooting-guide.md` | 讲麦克风权限、设备未找到、`Not supported`、电脑音频来源、卡住、转圈 | 用户能先自己排查语音问题 | ★★★★★ |
| N25 | ✅ 已完成，待 Codex 复核 | 用量预算案例库 | `docs/usage-budget-examples.md` | 用 10 元 / 50 元 / 100 元举例，说明不同模型大概能用多久 | 用户能看懂“花了多少钱” | ★★★★★ |
| N26 | ✅ 已完成，待 Codex 复核 | 岗位题库样例文档 | `docs/interview-question-examples.md` | 按数据分析、AI 产品、前端、全栈、后端、压力面列样例题 | 有演示和教学价值 | ★★★★☆ |
| N27 | ✅ 已完成，待 Codex 复核 | 回答风格样例库 | `docs/answer-style-examples.md` | 同一道题给 `fast` / `standard` / `star` 三种回答示例 | 看完能感受风格差别 | ★★★★★ |
| N28 | ✅ 已完成，待 Codex 复核 | 简历版本与命名规范 | `docs/resume-versioning-guide.md` | 说明正式简历、万字简历、其他简历、版本快照、命名规则 | 多候选人场景不混乱 | ★★★★☆ |
| N29 | ✅ 已完成，待 Codex 复核 | 会话记录整理指南 | `docs/session-record-guide.md` | 讲打开、刷新、重命名、删除、多选、导出、批量处理 | 会话记录操作更清楚 | ★★★★★ |
| N30 | ✅ 已完成，待 Codex 复核 | 模拟训练复盘指南 | `docs/training-review-guide.md` | 讲训练结束后怎么看分数、薄弱点、错题、趋势和下一步训练 | 复盘逻辑讲得更透 | ★★★★★ |

## 静态 UI / 文案批次

| 编号 | 状态 | 任务 | 可改文件 | 禁止修改 | 具体要求 | 验收标准 | 推荐指数 |
|---|---|---|---|---|---|---|---|
| N31 | ✅ 已完成，待 Codex 复核 | 设置页帮助中心升级 | `src/renderer/components/settings/HelpQuickLinksPanel.tsx`、`src/renderer/views/SettingsView.tsx`、`src/renderer/styles.css` | 不新增路由、不碰主进程 | 把常用文档入口做得更清楚，支持快速跳转或路径提示 | 用户一眼知道去哪里看帮助 | ★★★★★ |
| N32 | ✅ 已完成，待 Codex 复核 | FAQ 静态卡片 | `src/renderer/components/settings/FAQPanel.tsx`、`src/renderer/views/SettingsView.tsx`、`src/renderer/styles.css` | 不接新接口、不改业务逻辑 | 把 401/402/音频/保存/导出/回答慢 放到一个问答卡片里 | 用户不用回聊天记录翻问题 | ★★★★★ |
| N33 | ✅ 已完成，待 Codex 复核 | 模型说明静态卡片 | `src/renderer/components/settings/ModelProviderPanel.tsx`、`src/renderer/views/SettingsView.tsx`、`src/renderer/styles.css` | 不改模型调用逻辑 | 说明各服务商适合干什么、费用思路、注意事项 | 用户看设置页就能分清楚 | ★★★★★ |
| N34 | ✅ 已完成，待 Codex 复核 | 音频排障静态卡片 | `src/renderer/components/settings/AudioTroubleshootingPanel.tsx`、`src/renderer/views/SettingsView.tsx`、`src/renderer/styles.css` | 不碰音频采集链路 | 讲麦克风、电脑音频、权限、设备名、卡住转圈怎么处理 | 常见音频问题有地方先看 | ★★★★☆ |
| N35 | ✅ 已完成，待 Codex 复核 | 用量预算说明卡片 | `src/renderer/components/settings/BudgetExplainerPanel.tsx`、`src/renderer/views/SettingsView.tsx`、`src/renderer/styles.css` | 不改计费逻辑 | 解释 token、金额预算、剩余额度、模型切换计费 | 设置页就能看懂花费 | ★★★★☆ |
| N36 | ✅ 已完成，待 Codex 复核 | 产品说明与隐私摘要卡片 | `src/renderer/components/settings/AboutSummaryPanel.tsx`、`src/renderer/views/SettingsView.tsx`、`src/renderer/styles.css` | 不读写系统文件、不调 IPC | 讲清楚软件定位、本地数据、隐私模式、网络依赖 | 用户知道软件边界 | ★★★★☆ |
| N37 | ✅ 已完成，待 Codex 复核 | 空状态文案统一巡检 | `src/renderer/views/*`、`src/renderer/components/*` | 不改业务判断条件 | 再统一检查会话、训练、简历、诊断、导出等空状态 | 空状态更像人说的话 | ★★★★☆ |
| N38 | ✅ 已完成，待 Codex 复核 | 按钮 / Toast / 保存提示统一 | `src/renderer/components/*`、`src/renderer/styles.css` | 不改数据逻辑 | 统一保存成功、刷新成功、错误提示、删除确认的文案和样式 | 弹窗不乱、提示更顺 | ★★★★☆ |
| N39 | ✅ 已完成，待 Codex 复核 | 标题 / 副标题 / placeholder 统一 | `src/renderer/views/*`、`src/renderer/components/*` | 不改功能逻辑 | 统一页面标题、说明副标题、输入框占位词 | 全站术语更一致 | ★★★★☆ |
| N40 | ✅ 已完成，待 Codex 复核 | 卡片 / 徽章 / CSS 视觉统一 | `src/renderer/styles.css` | 不改点击事件、不改布局结构 | 统一卡片边距、徽章、标签、滚动条、hover 效果 | 页面看起来更稳更整齐 | ★★★★☆ |

## 建议执行顺序

1. N21 术语表与统一叫法
2. N23 模型选择决策树
3. N24 语音排障决策树
4. N25 用量预算案例库
5. N22 场景化上手指南
6. N27 回答风格样例库
7. N29 会话记录整理指南
8. N30 模拟训练复盘指南
9. N31 设置页帮助中心升级
10. N32 FAQ 静态卡片
11. N33 模型说明静态卡片
12. N34 音频排障静态卡片
13. N35 用量预算说明卡片
14. N36 产品说明与隐私摘要卡片
15. N37 空状态文案统一巡检
16. N38 按钮 / Toast / 保存提示统一
17. N39 标题 / 副标题 / placeholder 统一
18. N40 卡片 / 徽章 / CSS 视觉统一
19. N26 岗位题库样例文档
20. N28 简历版本与命名规范

## DeepSeek 启动提示词

```text
你现在在开发 Windows Electron 项目“获面通”，路径：
C:\Users\kangg\Desktop\huomiantong-app

请先阅读：
1. docs/deepseek-safe-task-list.md
2. docs/deepseek-third-wave-plan.md

本次只执行 docs/deepseek-third-wave-plan.md 里的任务：【填写任务编号，例如 N21】。

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
- 文档和 UI 是否与现有项目术语一致。
- 静态 UI 是否只做展示，不牵连业务逻辑。
- 代码类任务是否真的跑过 `npm run build`。
- 如果是 UI 任务，后续仍需要真实打开页面验收。

> 备注：`N21-N40` 全部完成并通过 Codex 验收后，继续下一本任务书：`docs/deepseek-fourth-wave-plan.md`。
