# 获面通：模型选择决策树

> 快速决定选哪个模型。

## 决策流程

```
面试中需要 AI 回答？
├── 需要实时、快速 → DeepSeek v4 Flash ✅ 
├── 需要高质量、深度 → 有代理？
│   ├── 是 → OpenAI gpt-4.1-mini
│   └── 否 → DeepSeek v4 Pro 或 阿里 qwen3.7-plus
├── 需要长对话 → Anthropic Claude
└── 国内网络？→ 阿里百炼 DashScope

需要语音转写？
└── Deepgram（唯一选择）
```

## 快速推荐

| 你的情况 | 推荐 |
|---------|------|
| 第一次用、预算有限 | DeepSeek v4 Flash + Deepgram |
| 国内网络不好 | 阿里百炼 qwen3.7-plus + Deepgram |
| 面试需要深度回答 | DeepSeek v4 Pro 或 OpenAI |
| 海外用户 | OpenAI 或 Anthropic |
