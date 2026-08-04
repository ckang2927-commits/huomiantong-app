# AI 深度话术兜底回归记录

最后更新：2026-08-03

## 覆盖目标

这份回归用于验证面试复盘里的“AI 深度话术”在不可调用模型、没有回答片段或没有可优化问题时，仍有可见提示和本地草案。

## 自动验收

命令：

```bash
npm run validate:deep-talk
```

当前结果：4/4 通过。

## 已覆盖场景

- 未填写回答模型 API Key 时，返回本地话术草案。
- 模型接口返回 500 失败时，返回本地话术草案，并展示失败原因。
- 选中问题没有识别到候选人回答时，仍给出可见的本地占位话术和追问备份结构。
- 没有复盘快照或没有可优化问题时，页面有中文可见提示。

## 涉及文件

- `src/main/services/interviewReviewEnhancementService.ts`
- `src/renderer/views/InterviewReviewView.tsx`
- `scripts/validate-review-deep-talk.mjs`
- `package.json`

## 仍需人工复测

- 用真实 DeepSeek Key 对不同题型生成话术，确认不编造经历、不像书面模板。
- 选中空回答/低分回答/高分回答分别生成一次，确认复制和下载入口可用。
