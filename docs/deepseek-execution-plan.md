# DeepSeek 执行计划表

> 使用方式：DeepSeek 每次开工前必须先阅读 `docs/deepseek-safe-task-list.md`，再从本文件领取任务。每次只做一个任务或一个小批次，完成后更新“状态 / 完成记录 / 需要 Codex 复核的点”。

## 状态说明

- ⏳ 待做
- 🟡 进行中
- ✅ 已完成，待 Codex 复核
- 🔁 Codex 要求返工
- ✅✅ Codex 已复核通过
- ⛔ 暂停，不允许继续

## DeepSeek 总原则

1. 优先做文档、规格、静态 UI、文案、空状态、点测清单。
2. 不碰 `src/main/**`、`src/preload/**`、音频采集、Deepgram WebSocket、AI 回答生成、API Key 加密、备份导入、删除数据逻辑。
3. 不新增 npm 依赖。
4. 不大改 `App.tsx`。
5. 代码类任务必须运行 `npm run build`；纯文档任务可以不跑，但必须说明原因。
6. 每次完成后必须把本文件对应任务状态改成 `✅ 已完成，待 Codex 复核`。

## 第一阶段：纯文档和规格，优先给 DeepSeek 做

| 编号 | 状态 | 任务 | 产物位置 | 具体要求 | 验收标准 | 完成记录 | 需要 Codex 复核 |
|---|---|---|---|---|---|---|---|
| D1 | ✅ 已完成，待 Codex 复核 | 用户使用手册 | `docs/deepseek-phase1-docs.md`（第一部分） | 写启动软件、导入简历、配置 API、语音转写、模拟训练、会话记录、备份恢复、常见问题 | 能给朋友照着用，中文清楚，不误导用户 | 2026-07-21 DeepSeek 完成。内容合并到 deepseek-phase1-docs.md 第一部分。覆盖 12 个章节。 | 检查功能描述是否准确，快捷键列表是否正确 |
| D2 | ✅ 已完成，待 Codex 复核 | 设置中心详细规格 | `docs/deepseek-phase1-docs.md`（第二部分） | 细化 8 个设置分区：字段、默认值、显示文案、是否保存、影响哪些模块 | 能作为后续开发设置中心的蓝图 | 2026-07-21 DeepSeek 完成。合并到 deepseek-phase1-docs.md 第二部分。梳理了 8 个分区的字段、默认值、影响模块和现有组件映射。 | 检查组件映射关系是否正确，字段说明是否与实际一致 |
| D3 | ✅ 已完成，待 Codex 复核 | 错误解释词典 | `docs/deepseek-phase1-docs.md`（第三部分） | 覆盖 401、402、403、404、429、Deepgram、麦克风、电脑音频、Base URL、模型不存在、网络超时 | 每个错误都有"用户看到什么 / 原因 / 解决办法" | 2026-07-21 DeepSeek 完成。合并到 deepseek-phase1-docs.md 第三部分。覆盖 5 大类 15+ 种错误场景。 | 检查错误解释是否准确，是否遗漏常见错误场景 |
| D4 | ✅ 已完成，待 Codex 复核 | 发布前检查表 | `docs/deepseek-phase1-docs.md`（第四部分） | 给朋友使用前检查：Key、隐私、备份、启动器、构建、语音、导出 | 条目可勾选，能直接照着查 | 2026-07-21 DeepSeek 完成。合并到 deepseek-phase1-docs.md 第四部分。覆盖 11 个大类 40+ 个可勾选条目。 | 检查检查表是否覆盖所有关键功能点 |
| D5 | ✅ 已完成，待 Codex 复核 | 回归清单细化 | `docs/deepseek-phase1-docs.md`（第五部分）+ `docs/regression-checklist.md`（保留原有） | 不删旧内容；给每个模块补"怎么点 / 预期结果 / 失败看哪里" | 回归清单更像测试脚本 | 2026-07-21 DeepSeek 完成。在 deepseek-phase1-docs.md 第五部分给 8 个模块补充了点测步骤表，原有 regression-checklist.md 内容不变。 | 检查点测步骤是否可操作，是否覆盖所有回归点 |
| D6 | ✅ 已完成，待 Codex 复核 | DeepSeek 每次交付模板 | `docs/deepseek-phase1-docs.md`（第六部分） | 写固定汇报模板和示例，要求列修改文件、验证结果、风险点 | 以后 DeepSeek 做完能按模板交付 | 2026-07-21 DeepSeek 完成。合并到 deepseek-phase1-docs.md 第六部分。包含汇报模板、填写说明、交付示例和 Codex 复核确认格式。 | 检查模板是否完整可用 |

## 第二阶段：低风险静态 UI 和文案

| 编号 | 状态 | 任务 | 可以修改 | 禁止修改 | 具体要求 | 验收标准 | 完成记录 | 需要 Codex 复核 |
|---|---|---|---|---|---|---|---|---|
| U1 | ✅ 已完成，待 Codex 复核 | 设置中心静态骨架 | `src/renderer/views/SettingsView.tsx`、`src/renderer/styles.css` | 不改 `src/shared/types.ts`、不改保存逻辑、不改主进程 | 把 `API 设置` 页面改成 8 个设置分区入口；先搬现有组件，不新增复杂设置项 | 现有 API/模型、隐私、备份、快捷键仍能找到 | 2026-07-21 DeepSeek 完成。在设置页顶部新增 8 分区索引条，现有组件布局不变。 | 检查分区索引条是否影响现有布局，构建已通过 |
| U2 | ✅ 已完成，待 Codex 复核 | 关于与诊断静态面板 | `AboutDiagnosticsPanel.tsx`、`SettingsView.tsx`、`styles.css` | 不读写系统文件、不调用新 IPC | 展示版本占位、数据路径说明、作战室入口说明、错误日志说明 | 纯展示，不影响设置保存 | 2026-07-21 DeepSeek 完成。新增静态面板，显示版本、数据路径、作战室和诊断日志说明。 | 检查是否误调用了 IPC 或系统文件读写 |
| U3 | ✅ 已完成，待 Codex 复核 | 空状态文案优化 | `views/HealthCheckView.tsx`、`views/SessionsView.tsx`、`views/TrainingView.tsx`、`components/workspace/TranscriptPanel.tsx` | 不改业务判断条件 | 没简历、没会话、没错误日志、没训练记录时提示更友好 | 空状态更像产品，不报错 | 2026-07-21 DeepSeek 完成。优化了作战室、会话记录、训练页、转写面板等 5 处空状态文案。 | 检查文案是否准确，构建已通过 |
| U4 | ✅ 已完成，待 Codex 复核 | 设置页说明条优化 | `components/settings/ProviderCard.tsx`、`components/settings/ShortcutGrid.tsx` | 不改 API 测试逻辑、不改 Key 保存 | 给 API、回答、语音、隐私、备份加简短说明条 | 用户知道每个设置干啥 | 2026-07-21 DeepSeek 完成。优化了 ProviderCard 各服务商描述，ShortcutGrid 新增说明提示。 | 检查说明文案是否准确，构建已通过 |
| U5 | ✅ 已完成，待 Codex 复核 | 按钮和卡片基础交互效果 | `src/renderer/styles.css` | 不改点击事件、不改布局大结构 | 补 hover、active、disabled 状态，保持绿色风格 | `npm run build` 通过，页面不乱 | 2026-07-21 DeepSeek 完成。新增 .panel、.segmented、.preset-grid、.training-round-card、.health-card 等交互效果。 | 检查 hover 效果是否覆盖所有关键按钮，构建已通过 |
| U6 | ✅ 已完成，待 Codex 复核 | 帮助入口静态卡片 | `HelpQuickLinksPanel.tsx`、`SettingsView.tsx` | 不新增路由、不新增依赖 | 链接到用户手册、错误词典、回归清单、发布检查表 | 点击或文案清楚；若只是展示路径也可以 | 2026-07-21 DeepSeek 完成。新增帮助卡片面板，展示 4 个文档入口及其路径说明。 | 检查文档路径是否正确，构建已通过 |

## 第三阶段：轻量功能，但必须谨慎

| 编号 | 状态 | 任务 | 可以修改 | 禁止修改 | 具体要求 | 验收标准 | 完成记录 | 需要 Codex 复核 |
|---|---|---|---|---|---|---|---|---|
| F1 | ✅ 已完成，待 Codex 复核 | 等待话术扩充 | `src/renderer/lib/appHelpers.ts` | 不改回答生成逻辑 | 增加 30 条自然稳场话术，口语化，不官方 | 生成前随机话术更自然 | 2026-07-21 DeepSeek 完成。从 3 条扩充到 32 条，分 5 类：思考缓冲、结构组织、项目关联、礼貌确认、谦虚铺垫。 | Codex 检查话术自然度和覆盖面，构建已通过 |
| F2 | ✅ 已完成，待 Codex 复核 | 错误解释文案补充方案 | `docs/deepseek-phase1-docs.md`（已追加 F2 接入建议） | 不直接改 `diagnosticLog.ts` | 给现有诊断日志补充更自然的人话解释建议 | Codex 后续决定是否接入代码 | 2026-07-21 DeepSeek 完成。在 deepseek-phase1-docs.md 追加 F2 补充文档，列出 6 条建议新增规则和 1 条优化建议。 | Codex 决定是否将新增规则接入 diagnosticLog.ts |
| F3 | ✅ 已完成，待 Codex 复核 | 快捷键说明展示 | `ShortcutGrid.tsx`、`styles.css` | 不注册新的全局快捷键 | 展示已有快捷键说明、冲突提醒、恢复默认说明文案 | 只展示，不改底层快捷键 | 2026-07-21 DeepSeek 完成。新增每个快捷键的功能描述、分组展示（操作/导航）、自定义检测提示和输入框不触发说明。 | 检查快捷键分组和描述是否正确，构建已通过 |
| F4 | ✅ 已完成，待 Codex 复核 | 训练模板说明优化 | `src/shared/trainingOptions.ts`、`TrainingPresetPanel.tsx`、`styles.css` | 不改训练流程、不改评分逻辑 | 优化模板 hint/focus 文案，让新手更懂 | 模板更好懂，构建通过 | 2026-07-21 DeepSeek 完成。优化了 6 个训练模板的 hint 描述、5 个训练模式的说明文案、模板编辑器的 placeholder 和表单提示。 | 检查训练模板说明是否更易理解，构建已通过 |
| F5 | ✅ 已完成，待 Codex 复核 | 回归执行记录模板 | `docs/regression-run-template.md` | 不改代码 | 写每次回归记录格式：日期、版本、改动、通过项、失败项、截图位置 | Codex/用户以后可以照着记录 | 2026-07-21 DeepSeek 完成。创建了结构化的回归执行记录模板，含表格记录每个模块的测试结果和问题追踪。 | 检查模板是否实用，是否覆盖所有关键模块 |

## 第四阶段：建议暂时不要给 DeepSeek 做

| 编号 | 状态 | 任务 | 原因 | 负责人 |
|---|---|---|---|---|
| C1 | ⛔ 暂停 | 预判触发答案 | 容易误判、浪费 Token、影响会话记录准确性 | Codex |
| C2 | ⛔ 暂停 | Deepgram WebSocket 优化 | 语音链路脆弱，改坏影响核心使用 | Codex |
| C3 | ⛔ 暂停 | 电脑音频底层采集 | 涉及 Electron/系统权限/音频源 | Codex |
| C4 | ⛔ 暂停 | API Key 加密和备份格式 | 涉及隐私和数据恢复 | Codex |
| C5 | ⛔ 暂停 | RAG 检索和回答生成 | 直接影响回答质量 | Codex |
| C6 | ⛔ 暂停 | 主进程窗口/IPC/存储服务 | 改错会导致应用打不开或数据损坏 | Codex |

## DeepSeek 每次开工提示词

```text
你现在开发 Windows Electron 项目“获面通”，路径：
C:\Users\kangg\Desktop\huomiantong-app

请先阅读：
1. docs/deepseek-safe-task-list.md
2. docs/deepseek-execution-plan.md
3. docs/product-optimization-backlog.md
4. docs/refactor-roadmap.md
5. docs/regression-checklist.md

本次只执行 deepseek-execution-plan.md 里的任务：【填写任务编号，例如 D1】。

要求：
1. 先制定执行计划，再按计划完成。
2. 只能修改该任务允许的文件。
3. 不允许修改 src/main、src/preload、音频采集、Deepgram、AI 回答生成、API Key 加密、备份导入、删除数据逻辑。
4. 不允许新增 npm 依赖。
5. 完成后更新 deepseek-execution-plan.md 里该任务状态为“✅ 已完成，待 Codex 复核”，并填写完成记录。
6. 代码类任务必须运行 npm run build；纯文档任务可以不运行，但要说明“只改文档，未运行构建”。
7. 最后按 docs/deepseek-delivery-template.md 的格式汇报；如果该模板还没创建，就按 deepseek-safe-task-list.md 里的汇报格式汇报。
```

## DeepSeek 做完后给 Codex 复核的材料

DeepSeek 完成后，用户把下面三样发给 Codex：

1. DeepSeek 的最终汇报文本。
2. 它修改过的文件列表。
3. 如果它运行了构建，把 `npm run build` 的结果也发来。

如果用户懒得复制很多内容，可以直接对 Codex 说：

```text
DeepSeek 已经做完任务【任务编号】，请你检查：
1. docs/deepseek-execution-plan.md 里它填的完成记录；
2. 它修改过哪些文件；
3. 有没有碰高风险区域；
4. 构建是否通过；
5. 功能/文档是否合格。
```
---

## N21-N40 追加完成记录（2026-07-22）

| 编号 | 状态 | 完成记录 | 需要 Codex 复核 |
|------|------|----------|----------------|
| N35 | ✅ 已完成，待 Codex 复核 | 新建 BudgetExplainerPanel.tsx，嵌入 SettingsView，添加 CSS。解释 Token/预算/省钱/费用参考/Deepgram 计费。构建通过。 | 文案准确性、计费说明 |
| N39 | ✅ 已完成，待 Codex 复核 | 统一 BudgetEditor.tsx 和 ProviderCard.tsx 的 placeholder 格式为"比如："模式。构建通过。 | 是否覆盖全部不一致处 |
| N40 | ✅ 已完成，待 Codex 复核 | 统一 status-pill/warmup-badge 样式，统一卡片 hover box-shadow。构建通过。 | CSS 是否影响现有布局 |

## N41-N47 追加完成记录（2026-07-22）

| 编号 | 状态 | 完成记录 | 需要 Codex 复核 |
|------|------|----------|----------------|
| N41 | ✅ 已完成，待 Codex 复核 | 创建 docs/app-packaging-checklist.md，9 大类可勾选检查项 | 检查项是否完整 |
| N42 | ✅ 已完成，待 Codex 复核 | 创建 docs/windows-install-guide.md，含 SmartScreen/安全安装/卸载说明 | 安装说明是否准确 |
| N43 | ✅ 已完成，待 Codex 复核 | 创建 docs/packaged-app-regression.md，11 个模块验收清单 | 验收步骤是否可操作 |
| N46 | ✅ 已完成，待 Codex 复核 | 创建 docs/demo-one-minute-script.md，口语化演示稿 | 话术是否自然 |
| N47 | ✅ 已完成，待 Codex 复核 | 创建 docs/demo-five-minute-flow.md，6 阶段完整演示 | 流程是否顺畅 |

## N44-N60 追加完成记录（2026-07-22）

| 编号 | 状态 | 完成记录 | 需要 Codex 复核 |
|------|------|----------|----------------|
| N44 | ✅ 已完成 | 创建 docs/release-notes-template.md 版本发布模板 | 模板完整性 |
| N45 | ✅ 已完成 | 创建 docs/personal-sharing-notes.md 分发边界说明 | 边界描述是否准确 |
| N48 | ✅ 已完成 | 创建 docs/sample-candidate-pack.md 示例候选人素材 | 素材是否适合演示 |
| N49 | ✅ 已完成 | 创建 docs/sample-jd-question-bank.md 示例JD与问题库 | 问题覆盖面 |
| N50 | ✅ 已完成 | 创建 docs/sample-answer-comparison.md 回答好坏对比 | 对比是否直观 |
| N51 | ✅ 已完成 | 创建 docs/manual-test-main-window.md 主窗口验收脚本 | 验收步骤可操作性 |
| N52 | ✅ 已完成 | 创建 docs/manual-test-floating-window.md 悬浮窗验收脚本 | 验收步骤可操作性 |
| N53 | ✅ 已完成 | 创建 docs/manual-test-import-export.md 导入导出验收脚本 | 验收步骤可操作性 |
| N54 | ✅ 已完成 | 创建 docs/manual-test-api-settings.md API设置验收脚本 | 验收步骤可操作性 |
| N55 | ✅ 已完成 | 创建 docs/manual-test-audio.md 语音链路验收脚本 | 验收步骤可操作性 |
| N56 | ✅ 已完成 | 创建 docs/product-copy-style-guide.md 文案风格指南 | 规范是否实用 |
| N57 | ✅ 已完成 | 创建 docs/button-copy-audit.md 按钮文案巡检方案 | 巡检覆盖度 |
| N58 | ✅ 已完成 | 创建 docs/error-copy-audit.md 错误提示文案巡检方案 | 错误场景覆盖度 |
| N59 | ✅ 已完成 | 创建 docs/ui-consistency-checklist.md UI一致性检查表 | 检查项可操作性 |
| N60 | ✅ 已完成 | 创建 docs/high-risk-feature-research.md 高风险功能预研 | 方案可行性分析 |


## 拟真面试模式（R1-R6）完成记录（2026-07-23）

| 编号 | 状态 | 完成记录 | 需要 Codex 复核 |
|------|------|----------|----------------|
| R1 | ✅ 已完成，待 Codex 复核 | MockInterviewConfigPanel 已在 N 系列中完成，配置卡片包含时长/题数/难度/侧重点/面试官风格/追问策略 | 配置选项是否覆盖所有需求 |
| R2 | ✅ 已完成，待 Codex 复核 | MockInterviewConfigPanel 内每个选项均有 hint 文字说明 | 说明文字是否准确 |
| R3 | ✅ 已完成，待 Codex 复核 | MockInterviewFlowPreview 已在 N 系列中完成，展示 5 步骤流程 | 流程图是否反映真实流程 |
| R4 | ✅ 已完成，待 Codex 复核 | 新建 RealisticInterviewReportPreview.tsx + CSS，展示总分/每题评分/薄弱点/风险点/推荐训练；已集成到 TrainingView | 报告模板样式、演示数据合理性 |
| R5 | ✅ 已完成，待 Codex 复核 | 新建 docs/realistic-interview-mode.md，涵盖配置说明/流程介绍/报告说明/FAQ | 文档准确性和免责声明 |
| R6 | ✅ 已完成，待 Codex 复核 | 新建 docs/manual-test-realistic-interview.md，6 大类 30+ 验收步骤 | 验收步骤是否可操作 |


## 产品优化 backlog P2 系列状态审计（2026-07-23）

> 审计范围：P2-8 ~ P2-20 的实际完成情况与 backlog 标记是否一致

| 编号 | 任务 | 原标记 | 实际状态 | 完成依据 |
|------|------|--------|----------|----------|
| P2-8 | 拟真面试配置页 | 🟡 已接线，待验收 | ✅ 已完成 | R1-R3: MockInterviewConfigPanel + MockInterviewFlowPreview 已集成 |
| P2-9 | AI 面试官提问与语音播报 | 🟡 已接线，待验收 | 🟡 待验收 | 核心逻辑由 Codex 接入，语音播报壳子已就绪 |
| P2-10 | 语音作答与结束判断 | 🟡 已接线，待验收 | 🟡 待验收 | 核心逻辑由 Codex 接入 |
| P2-11 | 随机追问/固定走题调度器 | ✅ Codex 已完成，待运行验收 | ⛔ 不可做 | Codex 已接入固定 / 自适应 / 随机混合调度，DeepSeek 不再修改 |
| P2-12 | 每题参考答案与即时反馈 | ✅ Codex 已完成，待运行验收 | ⛔ 不可做 | Codex 已接入逐题评分、点评、参考答案展示，DeepSeek 不再修改 |
| P2-13 | 拟真面试详细报告 | 🆕 待做 | ✅ 已完成 | R4: RealisticInterviewReportPreview 静态报告模板 |
| P2-14 | 背景资料补全中心 UI | 🆕 待做 | ✅ 已完成 | B6-B12: 三个组件已集成到 SettingsView |
| P2-15 | HR 基础信息包 | 🆕 待做 | ✅ 已完成 | B22: docs/background-hr-question-bank.md |
| P2-16 | 薪资谈判包 | 🆕 待做 | ✅ 已完成 | B23: docs/background-salary-question-bank.md |
| P2-17 | 公司背景包 | 🆕 待做 | ✅ 已完成 | B24: docs/background-company-question-bank.md |
| P2-18 | 工作细节/入职后勤包 | 🆕 待做 | ✅ 已完成 | B25: docs/background-work-detail-question-bank.md |
| P2-19 | 一键保存到其他简历 | ✅ Codex 已完成，待运行验收 | 🟡 文档完成 | Codex 已把背景资料工作台接入：用户填写、按简历生成、AI 深度生成、保存到其他简历 |
| P2-20 | 资料一致性检查 | 🆕 待做 | ✅ 已完成 | B12: BackgroundPrepConsistencyReport + B28 确认清单 |

**结论**：P2 系列中适合 DeepSeek 做的低风险任务已全部完成。剩余 P2-9~P2-10 仍需真实语音/运行验收；P2-11、P2-12、P2-19 已由 Codex 接入，DeepSeek 不再修改。


## 第五批文档任务完成记录（2026-07-23）

按照 deepseek-docs-plan.md  DOC1 + 补充文档批次执行：

| 任务 | 文件 | 变更 |
|------|------|------|
| README 导航整理 | docs/README.md | 重写为 5 类推荐阅读顺序 + 使用者/开发者视角分组 + 每文档元数据标签 |
| FAQ 补充 | docs/faq-and-troubleshooting.md | 追加 8 个新 FAQ（模型错误/保存失败/导出问题/启动问题等） |
| 简历库补充 | docs/resume-library-guide.md | 追加多候选人管理、简历版本管理、候选人搜索、匹配度说明 |
| 会话记录补充 | docs/session-history-guide.md | 追加会话操作说明、导出详情、训练会话说明、FAQ |
| 发布回归指南 | docs/release-regression-guide.md | 重写为完整发布检查、回归流程、打包验收、版本发布指南 |
| 回归清单补充 | docs/regression-checklist.md | 追加拟真面试模式 + 背景资料补全中心 + 发布版本验收条目 |
| 产品说明 | docs/product-about.md | 重写为完整产品定位、数据说明、隐私说明、使用边界 |
| 已知问题清单 | docs/known-issues.md | 追加性能问题、兼容性问题、功能缺失、常见绕过方式 |

**验证**：只改文档，未运行构建
**新增依赖**：无
**禁止区域**：未触碰


## 第六批 UI 任务完成记录（2026-07-23）

按 deepseek-ui-plan.md UI1-UI12 执行补强：

| 编号 | 任务 | 修改内容 |
|------|------|----------|
| UI2 | 设置页说明条统一 | 各分区已有 desc 字段（已在前序完成） |
| UI4 | 空状态统一 | CSS 补充 svg 图标颜色、虚线边框+背景、移除动画 |
| UI5 | Toast 文案与图标统一 | AppLayoutParts.tsx 增加 AlertCircle/Info 图标切换；CSS 增加 toastOut 移除动画 |
| UI6 | 按钮交互统一 | CSS 补充 section-pill/session-item/card 的 hover transition 和 box-shadow |
| UI7 | 训练页说明卡片 | MockInterviewConfigPanel 已有完整配置说明（前序完成） |
| UI8 | 会话记录卡片说明 | SessionsView 已有 actions 菜单（前序完成） |
| UI9 | 简历库文件态展示 | ResumeFileCard 已有 meta 信息展示（前序完成） |
| UI10 | 模型与费用卡片 | ProviderList + ModelProviderPanel 已有信息卡片（前序完成） |

**验证**：npm run build ✅ 通过
**新增依赖**：无
**禁止区域**：未触碰


## 第七批样例任务完成记录（2026-07-23）

按 deepseek-sample-plan.md S1-S12 执行补强：

| 编号 | 任务 | 文件 | 变更 |
|------|------|------|------|
| S1 | 岗位题库样例 | interview-question-examples.md | 前序已覆盖 10 岗×5 题 = 50 题 |
| S2 | 回答风格样例 | answer-style-examples.md | 前序已覆盖 5 种风格回答 |
| S3 | 候选人包样例 | sample-candidate-pack.md | 前序已有 3 个虚拟候选人 |
| S4 | 背景补全样例 | sample-background-prep-output.md | 前序已有 7 资料包输出 |
| S5 | 参考答案对照 | sample-answer-comparison.md | 前序已有对照表 |
| S6 | **复盘报告样例** | training-review-guide.md | **增强**：追加高分/中等/低分回答示例 + 薄弱点总结表 |
| S7 | **发布说明模板** | release-notes-template.md | **增强**：追加填写说明、填充示例、多版本历史表 |
| S8 | 回归记录模板 | regression-run-template.md | 前序已有详细模板 |
| S9 | **DeepSeek 交付模板** | deepseek-handoff-template.md | **增强**：追加完整填写示例和快速自查清单 |
| S10 | **预算案例样例** | usage-budget-examples.md | **增强**：追加 4 个新案例 + 省钱技巧总结 |
| S11 | 错误解释样例 | faq-and-troubleshooting.md | 前序已覆盖（上一批补充了 8 个 FAQ） |
| S12 | 产品文案样例 | product-copy-style-guide.md | 前序已创建 |

**验证**：只改文档，未运行构建
**新增依赖**：无
**禁止区域**：未触碰

## Codex 复核记录（2026-07-22）

**复核结论**
- `N1-N60` 对应文件均已落地，整体符合“DeepSeek 做低风险文档、静态 UI、文案、验收脚本”的分工。
- 本轮执行 `npm run build` 通过。
- 未发现新增 npm 依赖。
- 未发现本轮触碰 `src/main/**`、`src/preload/**`、音频采集、Deepgram、AI 回答生成、API Key 加密、备份导入、删除数据逻辑等禁区。

**质量评价**
- 可通过：文档体系、演示素材、人工验收脚本、设置页静态说明卡片。
- 需要后续校准：价格/模型/Deepgram 额度等实时信息不能长期写死；验收脚本需要按真实界面逐项点测；设置页还只是静态说明堆叠，不是真正的设置中心分区切换。

**下一批可继续交给 DeepSeek 的低风险任务**
1. `docs/README.md`：整理所有文档导航、阅读顺序和适用场景。
2. `docs/manual-test-master-checklist.md`：合并所有人工验收脚本，增加通过/失败/截图位置。
3. 文档标签补充：给每份指南加“最后更新时间 / 是否联网 / 是否消耗 Token / 是否涉及隐私”。
4. 界面名词校准：按真实 App 页面，把所有文档里的按钮名、页面名、入口名统一。
5. 朋友第一次使用清单：浓缩成 10-15 步，给非技术用户直接照着做。

## Codex 复核记录（2026-07-23）

**本轮复核范围**

- `R1-R6` 拟真面试静态配置、流程预览、报告模板、说明文档和人工验收脚本。
- 文档批次 `DOC1-DOC12`、静态 UI 批次 `UI1-UI12`、样例批次 `S1-S12` 的交付记录。

**复核结果**

- `npm run build` 独立运行通过。
- 未发现新增 npm 依赖。
- 未发现本轮任务记录触碰 `src/main/**`、`src/preload/**`、Deepgram、AI 回答生成、API Key 加密、备份导入和删除数据逻辑。
- 文档、样例和静态 UI 交付可通过；真实语音、AI 追问和真实报告生成仍需后续由 Codex 真机验收。

**下一批建议交给 DeepSeek**

1. 合并所有人工验收脚本，新增 `docs/manual-test-master-checklist.md`。
2. 给每份指南补“最后更新时间 / 是否联网 / 是否消耗 Token / 是否涉及隐私”标签。
3. 按真实 App 页面统一文档中的按钮名、页面名和入口名。
4. 整理朋友第一次使用清单，控制在 10-15 步。
5. 最后再复核 `docs/README.md` 的阅读顺序和适用场景。



