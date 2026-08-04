# AI 深度报告兜底回归记录

最后更新：2026-08-03

## 覆盖目标

这份回归用于验证面试复盘里的“AI 深度报告”在不可调用模型时，不会让用户空等或丢失本地复盘内容。

## 自动验收

命令：

```bash
npm run validate:deep-report
```

当前结果：3/3 通过。

## 已覆盖场景

- 未填写回答模型 API Key 时，直接返回本地深度草案。
- 模型接口返回 500 失败时，返回本地深度草案，并展示失败原因。
- 失败路径不记录模型用量，不会把失败响应当成正式 AI 报告。
- 输入的本地复盘报告保持独立，不被深度报告兜底结果覆盖。

## 涉及文件

- `src/main/services/interviewReviewEnhancementService.ts`
- `scripts/validate-review-deep-report.mjs`
- `package.json`

## 仍需人工复测

- 用真实 DeepSeek Key 点击“AI 深度报告”，确认模型报告质量、耗时、用量刷新正常。
- 用错误 Key 或错误 Base URL 点测，确认 UI 展示本地草案而不是空白或卡死。
