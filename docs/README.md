# 获面通文档中心

> 这是 `docs/` 的唯一总入口。以后先从这 里找文档，不要在几十个文件里盲猜。

---

## 推荐阅读顺序

### 🆕 第一次使用软件
```
quick-start.md
  → help-center-guide.md
  → model-provider-guide.md
  → usage-budget-guide.md
  → resume-library-guide.md
  → audio-troubleshooting.md
  → training-guide.md
  → session-history-guide.md
  → terminology-glossary.md
```

### 📦 准备给朋友用
```
app-packaging-checklist.md
  → windows-install-guide.md
  → personal-sharing-notes.md
  → demo-one-minute-script.md
  → demo-five-minute-flow.md
```

### 🚀 准备打包发布
```
packaging-resource-strategy.md
  → app-packaging-checklist.md
  → windows-install-guide.md
  → personal-sharing-notes.md
  → demo-one-minute-script.md
  → demo-five-minute-flow.md
```

### 🧪 准备打包验收
```
release-regression-guide.md
  → regression-checklist.md
  → release-notes-template.md
  → packaged-app-regression.md
```

### ✅ 准备做功能回归
```
regression-checklist.md
  → manual-test-main-window.md
  → manual-test-api-settings.md
  → manual-test-audio.md
  → manual-test-floating-window.md
  → manual-test-import-export.md
  → manual-test-background-prep.md
  → manual-test-realistic-interview.md
  → regression-run-template.md
```

### 🔧 准备继续开发
```
product-optimization-backlog.md
  → refactor-roadmap.md
  → docs-maintenance.md
  → deepseek-safe-task-list.md
  → deepseek-execution-plan.md
```

---

## 使用者视角

### 新手上手

| 文档 | 说明 | 适合谁 | 联网 | 消耗 Token | 隐私/API Key |
|------|------|--------|:----:|:----------:|:------------:|
| `quick-start.md` | 从安装到第一次面试的完整流程 | 所有人 | 否 | 否 | 否 |
| `help-center-guide.md` | 软件内帮助中心与本地文档搜索说明 | 所有人 | 否 | 否 | 否 |
| `terminology-glossary.md` | 产品术语解释表 | 新手 | 否 | 否 | 否 |
| `product-about.md` | 产品定位、隐私说明、数据存储位置 | 所有人 | 否 | 否 | 否 |
| `known-issues.md` | 当前版本的已知限制和绕过方式 | 所有人 | 否 | 否 | 否 |

### API 与模型

| 文档 | 说明 | 适合谁 | 联网 | 消耗 Token | 隐私/API Key |
|------|------|--------|:----:|:----------:|:------------:|
| `model-provider-guide.md` | 各服务商配置方法（DeepSeek/阿里/OpenAI/Anthropic/Deepgram） | 所有用户 | 是（查看官网） | 否 | 是 |
| `model-choice-guide.md` | 如何选择适合的模型 | 所有用户 | 否 | 否 | 否 |
| `usage-budget-guide.md` | Token 用量和费用说明 | 所有用户 | 否 | 否 | 是 |
| `usage-budget-examples.md` | 不同模型的使用费用案例 | 所有用户 | 否 | 否 | 是 |

### 语音与排障

| 文档 | 说明 | 适合谁 | 联网 | 消耗 Token | 隐私/API Key |
|------|------|--------|:----:|:----------:|:------------:|
| `audio-troubleshooting.md` | 麦克风/电脑音频问题排查 | 遇到语音问题的用户 | 否 | 否 | 否 |
| `audio-troubleshooting-guide.md` | 音频排障详细指南 | 需要深度排障的用户 | 否 | 否 | 否 |
| `faq-and-troubleshooting.md` | 常见问题与错误索引 | 所有人 | 否 | 否 | 否 |

### 简历与候选人

| 文档 | 说明 | 适合谁 | 联网 | 消耗 Token | 隐私/API Key |
|------|------|--------|:----:|:----------:|:------------:|
| `resume-library-guide.md` | 简历库使用说明（导入/管理/候选人切换） | 所有用户 | 否 | 否 | 是 |
| `resume-versioning-guide.md` | 简历版本管理说明 | 需要管理多版本的用户 | 否 | 否 | 是 |

### 模拟训练

| 文档 | 说明 | 适合谁 | 联网 | 消耗 Token | 隐私/API Key |
|------|------|--------|:----:|:----------:|:------------:|
| `training-guide.md` | 模拟训练使用说明 | 使用训练功能的用户 | 否 | 是 | 否 |
| `training-review-guide.md` | 训练复盘和错题本说明 | 需要复盘的用户 | 否 | 否 | 否 |
| `realistic-interview-mode.md` | 拟真面试模式说明 | 使用拟真面试的用户 | 否 | 是（后续） | 否 |

### 会话与导出

| 文档 | 说明 | 适合谁 | 联网 | 消耗 Token | 隐私/API Key |
|------|------|--------|:----:|:----------:|:------------:|
| `session-history-guide.md` | 会话记录使用说明 | 所有用户 | 否 | 否 | 是 |
| `session-record-guide.md` | 会话记录详细管理指南 | 需要深度管理会话的用户 | 否 | 否 | 是 |

---

## 开发者/验收视角

### 人工验收脚本

| 文档 | 说明 | 适合谁 |
|------|------|--------|
| `manual-test-main-window.md` | 主窗口逐页点测 | 验收人员 |
| `manual-test-api-settings.md` | API 设置点测 | 验收人员 |
| `manual-test-audio.md` | 语音链路点测 | 验收人员 |
| `manual-test-floating-window.md` | 悬浮窗点测 | 验收人员 |
| `manual-test-import-export.md` | 导入导出点测 | 验收人员 |
| `manual-test-background-prep.md` | 背景资料补全中心点测 | 验收人员 |
| `manual-test-realistic-interview.md` | 拟真面试模式点测 | 验收人员 |
| `manual-test-interview-review.md` | 面试复盘录音上传与长录音点测 | 验收人员 |

### 打包发布

| 文档 | 说明 | 适合谁 |
|------|------|--------|
| `app-packaging-checklist.md` | 打包前检查清单 | 发布人员 |
| `packaging-resource-strategy.md` | 打包资源、用户数据、帮助文档路径策略 | 发布人员/开发 |
| `windows-install-guide.md` | Windows 安装说明 | 发布人员/朋友 |
| `packaged-app-regression.md` | 打包后人工验收 | 发布人员 |
| `release-notes-template.md` | 版本发布说明模板 | 发布人员 |
| `personal-sharing-notes.md` | 个人使用与分发边界说明 | 发布人员 |
| `release-regression-guide.md` | 发布与回归执行指南 | 发布人员 |

### DeepSeek 任务书与交接

| 文档 | 说明 | 适合谁 |
|------|------|--------|
| `deepseek-safe-task-list.md` | DeepSeek 可执行任务清单与安全规范 | DeepSeek |
| `deepseek-task-book.md` | 任务书总入口 | DeepSeek |
| `deepseek-execution-plan.md` | 执行计划表（含状态） | DeepSeek + Codex |
| `deepseek-docs-plan.md` | 文档任务书 | DeepSeek |
| `deepseek-ui-plan.md` | 静态 UI 任务书 | DeepSeek |
| `deepseek-sample-plan.md` | 样例模板任务书 | DeepSeek |
| `deepseek-background-prep-plan.md` | 背景资料补全中心任务书 | DeepSeek |
| `deepseek-realistic-interview-plan.md` | 拟真面试模式任务书 | DeepSeek |
| `deepseek-handoff-template.md` | DeepSeek 交付汇报模板 | DeepSeek |
| `deepseek-launch-prompt.md` | DeepSeek 启动提示词模板 | DeepSeek |

### 产品规划与后续优化

| 文档 | 说明 | 适合谁 |
|------|------|--------|
| `product-optimization-backlog.md` | 产品优化想法池和优先级 | 产品/开发 |
| `refactor-roadmap.md` | 代码重构路线图 | 开发 |
| `docs-maintenance.md` | 文档维护说明 | 开发 |
| `help-center-guide.md` | 帮助中心搜索策略与后续升级说明 | 开发/产品 |
| `ui-consistency-checklist.md` | UI 视觉一致性检查表 | 开发/验收 |
| `button-copy-audit.md` | 按钮文案巡检方案 | 开发 |
| `error-copy-audit.md` | 错误提示文案巡检方案 | 开发 |
| `product-copy-style-guide.md` | 文案风格指南 | 开发 |
| `high-risk-feature-research.md` | 高风险功能预研 | 开发 |

### 演示素材

| 文档 | 说明 | 适合谁 |
|------|------|--------|
| `demo-one-minute-script.md` | 一分钟演示讲稿 | 演示人员 |
| `demo-five-minute-flow.md` | 五分钟完整演示流程 | 演示人员 |
| `sample-candidate-pack.md` | 示例候选人素材 | 演示/测试 |
| `sample-jd-question-bank.md` | 示例 JD 与问题库 | 演示/测试 |
| `sample-answer-comparison.md` | 回答好坏对比示例 | 演示/测试 |
| `interview-question-examples.md` | 岗位题库样例 | 演示/测试 |
| `answer-style-examples.md` | 回答风格样例 | 演示/测试 |
| `sample-background-prep-output.md` | 背景资料补全输出样例 | 演示/测试 |

---

## 核心事实源

| 事实类型 | 唯一优先文档 | 说明 |
|---------|-------------|------|
| 产品下一步做什么 | `product-optimization-backlog.md` | 总计划表，新增想法先写这里 |
| 工程拆分边界 | `refactor-roadmap.md` | 代码结构、后续加功能规则 |
| DeepSeek 能做什么 | `deepseek-safe-task-list.md` | 低风险任务和禁区 |
| DeepSeek 当前任务 | 具体任务书 | 例如 `deepseek-docs-plan.md`、`deepseek-ui-plan.md` 等 |
| 回归验收标准 | `regression-checklist.md` | 功能是否真的可用，以人工验收为准 |
| 用户使用说明 | `quick-start.md` | 新手优先看，不要先看技术文档 |

---

## 状态说明

> 本文档状态：✅ 已整理（待 Codex 复核）
> 最后更新：2026-07-23
