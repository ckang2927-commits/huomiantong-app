# DeepSeek 样例与模板任务书

> 作用：专门给 DeepSeek 做样例、模板、示例素材、交付物框架。  
> 范围：只做可复用的文本素材，不碰核心逻辑。

## 执行原则

1. 开工前先读：
   - `docs/deepseek-safe-task-list.md`
   - `docs/deepseek-task-book.md`
   - 本文件
2. 一次只做一个任务，或者一个很小批次。
3. 只改任务允许的 docs 文件。
4. 纯文档任务不强制跑构建，但要说明原因。
5. 不要碰 `src/main/**`、`src/preload/**`、音频、Deepgram、AI 回答生成、训练主逻辑、API Key 加密、备份导入、删除数据逻辑。

## 任务池

| 编号 | 状态 | 任务 | 产物位置 | 具体要求 |
|---|---|---|---|---|
| S1 | 待做 → ✅ 已通过 N/B 系列完成 | 岗位题库样例 | `docs/interview-question-examples.md` | 按数据分析、AI 产品、前端、全栈、后端、HR 分组 |
| S2 | 待做 → ✅ 已通过 N/B 系列完成 | 回答风格样例 | `docs/answer-style-examples.md` | 同一题给简洁、结构、强势、谦逊、业务型示例 |
| S3 | 待做 → ✅ 已通过 N/B 系列完成 | 候选人包样例 | `docs/sample-candidate-pack.md` | 给一套完整的候选人资料展示样例 |
| S4 | 待做 → ✅ 已通过 N/B 系列完成 | 背景补全样例 | `docs/sample-background-prep-output.md` | 给出背景补全结果长什么样 |
| S5 | 待做 → ✅ 已通过 N/B 系列完成 | 参考答案对照 | `docs/sample-answer-comparison.md` | 做“原始回答 / 优化回答 / 推荐理由”对照 |
| S6 | 待做 → ✅ 已通过 N/B 系列完成 | 复盘报告样例 | `docs/training-review-guide.md`、相关样例文档 | 展示训练结束后怎么复盘 |
| S7 | 待做 → ✅ 已通过 N/B 系列完成 | 发布说明模板 | `docs/release-notes-template.md` | 新增、修复、已知问题、升级提示 |
| S8 | 待做 → ✅ 已通过 N/B 系列完成 | 回归记录模板 | `docs/regression-run-template.md` | 记录日期、版本、改动、通过项、失败项 |
| S9 | 待做 → ✅ 已通过 N/B 系列完成 | DeepSeek 交付模板 | `docs/deepseek-handoff-template.md` | 统一汇报格式 |
| S10 | 待做 → ✅ 已通过 N/B 系列完成 | 预算案例样例 | `docs/usage-budget-examples.md` | 用金额解释不同模型大概能用多久 |
| S11 | 待做 → ✅ 已通过 N/B 系列完成 | 错误解释样例 | `docs/faq-and-troubleshooting.md` | 给常见报错补人话解释 |
| S12 | 待做 → ✅ 已通过 N/B 系列完成 | 产品文案样例 | `docs/product-copy-style-guide.md`、相关文档 | 统一更自然的口气 |

## 还能继续加的样例任务

- 模拟训练题目样例。
- 拟真面试对话样例。
- 训练错题样例。
- 会话记录导出样例。
- 简历命名样例。
- 背景资料样例。
- 朋友分享说明样例。

## 可直接复制给 DeepSeek 的提示词

```text
你现在在开发 Windows Electron 项目“获面通”，路径：
C:\Users\kangg\Desktop\huomiantong-app

请先阅读：
1. docs/deepseek-safe-task-list.md
2. docs/deepseek-task-book.md
3. docs/deepseek-sample-plan.md

本次只执行任务：【填写任务编号，例如 S1】。

要求：
1. 先给一个简短执行计划。
2. 一次只做一个任务。
3. 只改允许的 docs 文件。
4. 不要碰 src/main、src/preload、音频、Deepgram、AI 回答生成、训练主逻辑、API Key 加密、备份导入、删除数据逻辑。
5. 不新增 npm 依赖。
6. 纯文档任务可以不跑构建，但要说明原因。
7. 做完后按 docs/deepseek-handoff-template.md 汇报。
```

