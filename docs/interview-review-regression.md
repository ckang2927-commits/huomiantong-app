# 面试复盘本地回归记录

最后更新：2026-08-03

## 覆盖目标

这份回归用于验证“面试复盘”在没有真实 Deepgram Key、没有真实录音文件的情况下，仍能用模拟转写文本稳定跑通核心本地逻辑。

## 自动验收

命令：

```bash
npm run validate:review
```

当前结果：6/6 通过。

## 已覆盖场景

- 从带时间戳和说话人标签的转写文本中提取面试问题。
- 按问题顺序切分候选人回答片段，避免把面试官追问当成候选人回答。
- 识别自我介绍、项目经历、方法过程、HR 稳定性/意愿题，并使用对应评分策略。
- 生成本地复盘报告，包含整体评分、已回答数量、薄弱点、建议和 Markdown 标题。
- 兼容“说话人 1 / 说话人 2”这类腾讯会议转写格式。
- 检查问题文本清洗不会把正常中文问题破坏成残缺符号。

## 本轮修正

- 调整 `getInterviewReviewAnswerReviewMode` 的优先级：带“家里、支持、意愿、到岗、通勤、租房”等稳定性语义的问题，优先按 HR 意愿题评分，再考虑地点短事实题。

## 涉及文件

- `src/renderer/lib/interviewReviewAnalyzer.ts`
- `src/renderer/lib/interviewReviewReport.ts`
- `scripts/validate-interview-review.mjs`
- `package.json`

## 仍需人工复测

- 用真实 Deepgram Key 上传 5 分钟真实录音，确认转写成功、说话人识别可编辑。
- 上传 20 分钟以上录音，确认不会卡死，失败时有可恢复提示。
- 人工检查复盘报告的薄弱点、建议和 AI 深度报告质量是否符合真实面试语境。
