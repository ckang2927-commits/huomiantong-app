# DeepSeek 第四批任务书（N41-N60）

> 使用前提：只有在 `docs/deepseek-third-wave-plan.md` 的 `N21-N40` 全部完成，并经过 Codex 复核后，才能开始本文件。  
> 目标：围绕“打包成 App、给朋友使用、演示素材、人工验收、产品化收尾、后续高风险功能预研”继续安排低风险任务。  
> 特别说明：本批次只围绕个人使用、朋友使用和打包版 App 演示，不做无关商业场景。

## 执行原则

1. 开工前先读：
   - `docs/deepseek-safe-task-list.md`
   - `docs/deepseek-next-wave-plan.md`
   - `docs/deepseek-third-wave-plan.md`
   - `docs/deepseek-fourth-wave-plan.md`
2. 一次只做一个任务，或者一个极小批次。
3. 只改任务允许的文件。
4. 纯文档任务可以不跑构建，但必须说明原因。
5. 代码 / UI / CSS 任务必须跑 `npm run build`。
6. 完成后更新状态、完成记录、需要 Codex 复核的点。
7. 不允许碰：
   - `src/main/**`
   - `src/preload/**`
   - 音频采集、Deepgram、AI 回答生成
   - API Key 加密、备份导入、删除数据逻辑
   - 新增 npm 依赖
   - 大改 `App.tsx`

## 打包与发布准备文档

| 编号 | 状态 | 任务 | 产物位置 | 具体要求 | 验收标准 | 推荐指数 |
|---|---|---|---|---|---|---|
| N41 | ✅ 已完成，待 Codex 复核 | App 打包前准备清单 | `docs/app-packaging-checklist.md` | 写打包前需要确认的项目：Logo、版本号、启动器、API 设置、备份、隐私、构建、导出 | 能照着检查是否适合打包 | ★★★★★ |
| N42 | ✅ 已完成，待 Codex 复核 | Windows 安装与未知发布者说明 | `docs/windows-install-guide.md` | 解释未签名 exe 的“未知发布者”、SmartScreen、如何安全运行、如何给朋友说明 | 给朋友用时不慌 | ★★★★★ |
| N43 | ✅ 已完成，待 Codex 复核 | 打包后人工验收脚本 | `docs/packaged-app-regression.md` | 写安装包安装后怎么点测：启动、设置、简历、语音、会话、导出、悬浮窗 | 打包后能系统验收 | ★★★★★ |
| N44 | ✅ 已完成，待 Codex 复核 | 版本发布说明模板 | `docs/release-notes-template.md` | 写每次版本更新说明模板：新增、修复、已知问题、升级注意 | 后续发给朋友看得懂 | ★★★★☆ |
| N45 | ✅ 已完成，待 Codex 复核 | 个人使用与朋友分发边界说明 | `docs/personal-sharing-notes.md` | 说明仅个人/朋友使用、不涉及收费、不上架、不承诺商业 SLA、注意不要泄露 API Key | 软件边界清楚 | ★★★★☆ |

## 演示与样例素材

| 编号 | 状态 | 任务 | 产物位置 | 具体要求 | 验收标准 | 推荐指数 |
|---|---|---|---|---|---|---|
| N46 | ✅ 已完成，待 Codex 复核 | 一分钟演示脚本 | `docs/demo-one-minute-script.md` | 写 1 分钟给朋友演示软件的讲解稿：它干啥、怎么用、亮点在哪 | 能直接照着讲 | ★★★★★ |
| N47 | ✅ 已完成，待 Codex 复核 | 五分钟完整演示流程 | `docs/demo-five-minute-flow.md` | 从导入简历、配置模型、语音转写、生成答案、保存会话、导出文档完整走一遍 | 演示流程顺畅 | ★★★★★ |
| N48 | ✅ 已完成，待 Codex 复核 | 示例候选人素材说明 | `docs/sample-candidate-pack.md` | 设计虚拟候选人姓名、岗位、简历摘要、JD、面试问题，不使用真实隐私 | 可用于演示，不污染真实数据 | ★★★★★ |
| N49 | ✅ 已完成，待 Codex 复核 | 示例 JD 与问题库 | `docs/sample-jd-question-bank.md` | 按数据分析、AI 产品、前端、全栈、后端列示例 JD 和常见问题 | 演示和测试都有素材 | ★★★★☆ |
| N50 | ✅ 已完成，待 Codex 复核 | 示例回答好坏对比 | `docs/sample-answer-comparison.md` | 同一道题展示“差回答 / 合格回答 / 优秀回答”，说明区别 | 帮用户理解好答案标准 | ★★★★★ |

## 人工验收与质量控制

| 编号 | 状态 | 任务 | 产物位置 | 具体要求 | 验收标准 | 推荐指数 |
|---|---|---|---|---|---|---|
| N51 | ✅ 已完成，待 Codex 复核 | 主窗口人工验收脚本 | `docs/manual-test-main-window.md` | 面试台、简历库、设置、会话记录、作战室、模拟训练逐页点测 | 用户能照着验收主窗口 | ★★★★★ |
| N52 | ✅ 已完成，待 Codex 复核 | 悬浮窗人工验收脚本 | `docs/manual-test-floating-window.md` | 测悬浮窗打开、关闭、最大化、同步答案、滚动、复制、尺寸变化 | 悬浮窗问题能被发现 | ★★★★★ |
| N53 | ✅ 已完成，待 Codex 复核 | 导入导出人工验收脚本 | `docs/manual-test-import-export.md` | 测 PDF/DOCX/MD 简历导入、会话 MD/Word 导出、隐私脱敏 | 导入导出不再凭感觉 | ★★★★★ |
| N54 | ✅ 已完成，待 Codex 复核 | API 设置人工验收脚本 | `docs/manual-test-api-settings.md` | 测 DeepSeek、阿里、OpenAI、Anthropic、Deepgram 配置、保存、测试连接、错误提示 | API 设置问题可定位 | ★★★★★ |
| N55 | ✅ 已完成，待 Codex 复核 | 语音链路人工验收脚本 | `docs/manual-test-audio.md` | 写麦克风、电脑音频、设备选择、权限、Deepgram、转写延迟的点测流程 | 语音问题验收更系统 | ★★★★★ |

## 产品文案与视觉收尾

| 编号 | 状态 | 任务 | 可改文件 | 禁止修改 | 具体要求 | 验收标准 | 推荐指数 |
|---|---|---|---|---|---|---|---|
| N56 | ✅ 已完成，待 Codex 复核 | 全局产品文案风格指南 | `docs/product-copy-style-guide.md` | 不改代码 | 规定按钮、提示、错误、空状态的语气：自然、短句、人话、不官方 | 后续文案有统一标准 | ★★★★★ |
| N57 | ✅ 已完成，待 Codex 复核 | 全站按钮文案巡检方案 | `docs/button-copy-audit.md` | 不改代码 | 列出需要巡检的按钮：保存、刷新、导入、导出、生成、测试连接、删除 | 方便后续统一按钮文案 | ★★★★☆ |
| N58 | ✅ 已完成，待 Codex 复核 | 全站错误提示文案巡检方案 | `docs/error-copy-audit.md` | 不改代码 | 汇总错误提示应该怎么说人话，避免技术黑话 | 错误提示更友好 | ★★★★★ |
| N59 | ✅ 已完成，待 Codex 复核 | UI 视觉一致性检查表 | `docs/ui-consistency-checklist.md` | 不改代码 | 检查卡片、按钮、弹窗、滚动条、左侧导航、设置页排版 | UI 验收更细 | ★★★★☆ |
| N60 | ✅ 已完成，待 Codex 复核 | 下一阶段高风险功能预研 | `docs/high-risk-feature-research.md` | 只写方案，不改代码 | 预研预判触发、RAG v2、语音速度优化、问题自动拆分、回答长度控制 | 给 Codex 后续开发参考 | ★★★★★ |

## 建议执行顺序

1. N41 App 打包前准备清单
2. N42 Windows 安装与未知发布者说明
3. N43 打包后人工验收脚本
4. N46 一分钟演示脚本
5. N47 五分钟完整演示流程
6. N48 示例候选人素材说明
7. N50 示例回答好坏对比
8. N51 主窗口人工验收脚本
9. N52 悬浮窗人工验收脚本
10. N53 导入导出人工验收脚本
11. N54 API 设置人工验收脚本
12. N55 语音链路人工验收脚本
13. N56 全局产品文案风格指南
14. N58 全站错误提示文案巡检方案
15. N59 UI 视觉一致性检查表
16. N60 下一阶段高风险功能预研
17. N44 版本发布说明模板
18. N45 个人使用与朋友分发边界说明
19. N49 示例 JD 与问题库
20. N57 全站按钮文案巡检方案

## DeepSeek 启动提示词

```text
你现在在开发 Windows Electron 项目“获面通”，路径：
C:\Users\kangg\Desktop\huomiantong-app

请先阅读：
1. docs/deepseek-safe-task-list.md
2. docs/deepseek-fourth-wave-plan.md

本次只执行 docs/deepseek-fourth-wave-plan.md 里的任务：【填写任务编号，例如 N41】。

要求：
1. 先制定执行计划，再按计划完成。
2. 只能修改该任务允许的文件。
3. 不允许修改 src/main、src/preload、音频采集、Deepgram、AI 回答生成、API Key 加密、备份导入、删除数据逻辑。
4. 不允许新增 npm 依赖。
5. 纯文档任务可以不运行构建，但要说明“只改文档，未运行构建”。
6. 如果任务明确允许改 UI / CSS，必须运行 npm run build。
7. 完成后更新该任务状态、完成记录和需要 Codex 复核的点。
8. 最后按固定格式汇报修改文件、验证结果和风险点。
```

## Codex 验收时看什么

- 是否误写了与个人/朋友打包版 App 无关的场景。
- 是否碰了高风险区域。
- 是否新增了不必要依赖。
- 文档是否符合“打包成 App / 给朋友使用 / 个人使用”的方向。
- 人工验收脚本是否真的能一步步照着点。
- 预研文档是否只写方案，没有偷偷改代码。
