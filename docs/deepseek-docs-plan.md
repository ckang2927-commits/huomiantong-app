# DeepSeek 文档任务书

> 作用：专门给 DeepSeek 做纯文档工作，尽量省 Codex 额度。  
> 范围：只写 `docs/` 下的说明、索引、FAQ、验收、排障、模板、术语，不碰核心代码。

## 执行原则

1. 开工前先读：
   - `docs/deepseek-safe-task-list.md`
   - `docs/deepseek-task-book.md`
   - 本文件
2. 一次只做一个任务，或者一个很小批次。
3. 只改任务允许的文档文件。
4. 纯文档任务不强制跑构建，但要说明“只改文档，未运行构建”。
5. 不要碰 `src/main/**`、`src/preload/**`、音频、Deepgram、AI 回答生成、训练主逻辑、API Key 加密、备份导入、删除数据逻辑。
6. 做完后按 `docs/deepseek-handoff-template.md` 汇报。

## 任务池

| 编号 | 状态 | 任务 | 产物位置 | 具体要求 |
|---|---|---|---|---|
| DOC1 | 待做 → ✅ 已通过 N/B 系列完成 | `docs/README.md` 导航再整理 | `docs/README.md` | 把入口按“新手 / 设置 / 音频 / 简历 / 会话 / 训练 / 预算 / DeepSeek”重排 |
| DOC2 | 待做 → ✅ 已通过 N/B 系列完成 | 主界面点测文档 | `docs/manual-test-main-window.md` | 讲清打开软件、主界面按钮、页面跳转、空状态 |
| DOC3 | 待做 → ✅ 已通过 N/B 系列完成 | API 设置点测文档 | `docs/manual-test-api-settings.md` | 讲清模型、Key、保存、测试、错误提示 |
| DOC4 | 待做 → ✅ 已通过 N/B 系列完成 | 音频点测文档 | `docs/manual-test-audio.md` | 讲清麦克风、电脑音频、权限、失败原因 |
| DOC5 | 待做 → ✅ 已通过 N/B 系列完成 | 悬浮窗点测文档 | `docs/manual-test-floating-window.md` | 讲清显示、隐藏、拖动、缩放、关闭 |
| DOC6 | 待做 → ✅ 已通过 N/B 系列完成 | 导入导出点测文档 | `docs/manual-test-import-export.md` | 讲清简历导入、会话导出、Word/MD、失败看什么 |
| DOC7 | 待做 → ✅ 已通过 N/B 系列完成 | FAQ 与排障补充 | `docs/faq-and-troubleshooting.md` | 补 401/402/429、语音、导出、保存、模型错误 |
| DOC8 | 待做 → ✅ 已通过 N/B 系列完成 | 模型与预算补充 | `docs/model-choice-guide.md`、`docs/usage-budget-examples.md` | 补更多选择案例和金额案例 |
| DOC9 | 待做 → ✅ 已通过 N/B 系列完成 | 训练说明补充 | `docs/training-guide.md`、`docs/training-review-guide.md` | 补训练流程、复盘、参考答案、错题本说明 |
| DOC10 | 待做 → ✅ 已通过 N/B 系列完成 | 简历与会话说明补充 | `docs/resume-library-guide.md`、`docs/session-history-guide.md` | 补多人简历、重命名、删除、多选、导出 |
| DOC11 | 待做 → ✅ 已通过 N/B 系列完成 | 发布回归材料补充 | `docs/release-regression-guide.md`、`docs/regression-checklist.md` | 补人工点测步骤、失败定位、验收方式 |
| DOC12 | 待做 → ✅ 已通过 N/B 系列完成 | 产品说明收尾 | `docs/product-about.md`、`docs/known-issues.md` | 补产品定位、边界、当前限制、适用场景 |

## 还能继续加的文档任务

- 术语表继续补全。
- 产品 copy 风格继续统一。
- 错误解释继续补例子。
- 训练与拟真面试继续补“怎么用”。
- 预算说明继续补“花多少钱”。
- 朋友分享说明继续补“能不能给朋友用”。

## 可直接复制给 DeepSeek 的提示词

```text
你现在在开发 Windows Electron 项目“获面通”，路径：
C:\Users\kangg\Desktop\huomiantong-app

请先阅读：
1. docs/deepseek-safe-task-list.md
2. docs/deepseek-task-book.md
3. docs/deepseek-docs-plan.md

本次只执行任务：【填写任务编号，例如 DOC1】。

要求：
1. 先给一个简短执行计划。
2. 一次只做一个任务。
3. 只改任务允许的 docs 文件。
4. 不碰 src/main、src/preload、音频、Deepgram、AI 回答生成、训练主逻辑、API Key 加密、备份导入、删除数据逻辑。
5. 不新增 npm 依赖。
6. 纯文档任务可以不跑构建，但要说明原因。
7. 完成后按 docs/deepseek-handoff-template.md 汇报修改文件、验证结果和风险点。
```

