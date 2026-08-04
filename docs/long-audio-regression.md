# 长录音本地策略回归记录

最后更新：2026-08-03

## 覆盖目标

这份回归用于验证面试复盘里的“长录音优化”在 20-60 分钟录音场景下，能给出分段、发言人校正、漏题排查和失败重试建议。

## 自动验收

命令：

```bash
npm run validate:long-audio
```

当前结果：4/4 通过。

## 已覆盖场景

- 20 分钟录音：提示 20 分钟左右切分复查、预计段数、发言人角色校正。
- 60 分钟录音：提示 15 分钟左右切分复查、预计 4 段、转写偏碎、问题提取偏少、高风险回答优先处理。
- 未完成转写时：仍展示待 Deepgram 返回、补发言人标签和手动复核顺序。
- Deepgram 超时错误：保留 3-10 分钟动态超时、分段上传和查看长录音优化建议的文案。

## 本轮修正

- 将长录音优化 Markdown 生成逻辑从 `InterviewReviewView.tsx` 抽到 `src/renderer/lib/longAudioOptimization.ts`，便于自动回归和后续复用。

## 涉及文件

- `src/renderer/lib/longAudioOptimization.ts`
- `src/renderer/views/InterviewReviewView.tsx`
- `src/main/services/interviewReviewService.ts`
- `scripts/validate-long-audio.mjs`
- `package.json`

## 仍需人工复测

- 上传 20 分钟真实录音，确认建议中的段数、问题数量和发言人提示符合实际。
- 上传 60 分钟真实录音或大文件，确认失败时不空白、不卡死，能按提示分段重试。
