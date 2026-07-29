# 获面通

个人简历驱动的实时模拟面试回答助手。

## 当前版本目标

- Windows 桌面端
- 本地保存 API 配置
- 导入正式简历和万字解释版简历
- Deepgram 麦克风实时转写
- 模拟转写与 AI 回答工作流
- 正式简历导入 PDF / Word(.docx) / Markdown
- 万字解释版简历导入 Word(.docx) / Markdown
- 可见悬浮窗显示建议回答
- 会话记录与导出基础能力

## 本地运行

最简单方式：双击桌面的 `Start-Huomiantong.cmd`。

```powershell
npm install
npm run dev
```

## 使用流程

1. 打开 `API 设置`，填写 Deepgram 和 DeepSeek / DashScope 等 Key。
2. 打开 `简历库`，导入或粘贴正式简历和万字解释版简历。
3. 回到 `面试台`，点击 `麦克风转写` 或 `模拟转写`。
4. 点击 `生成回答`，或打开 `自动回答`。
5. 点击 `打开悬浮窗` 查看实时答案。

## 注意

- 不要把 `.env` 或真实 API Key 提交/发给别人。
- 朋友试用时建议让对方填写自己的 API Key。
- 本工具用于个人学习、模拟面试和效率辅助。
