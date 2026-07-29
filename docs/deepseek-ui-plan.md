# DeepSeek 静态 UI 任务书

> 作用：专门给 DeepSeek 做静态 UI、文案、样式微调。  
> 范围：只改展示层，不碰主逻辑、音频、模型、数据写入。

## 执行原则

1. 开工前先读：
   - `docs/deepseek-safe-task-list.md`
   - `docs/deepseek-task-book.md`
   - 本文件
2. 一次只做一个任务，或者一个很小批次。
3. 只改任务允许的组件和样式文件。
4. 代码 / UI / CSS 任务必须运行 `npm run build`。
5. 不要碰 `src/main/**`、`src/preload/**`、音频、Deepgram、AI 回答生成、训练主逻辑、API Key 加密、备份导入、删除数据逻辑。

## 任务池

| 编号 | 状态 | 任务 | 允许修改 | 具体要求 |
|---|---|---|---|---|
| UI1 | 待做 → ✅ 已在 N/B/UI 系列中完成 | 设置中心按钮区排版 | `src/renderer/views/SettingsView.tsx`、`src/renderer/styles.css` | 做成上方按钮区 + 下方内容区，保持页面清楚 |
| UI2 | 待做 → ✅ 已在 N/B/UI 系列中完成 | 设置页说明条统一 | 相关设置组件 + `styles.css` | 每个设置块都补一句人话说明 |
| UI3 | 待做 → ✅ 已在 N/B/UI 系列中完成 | 帮助页卡片统一 | `docs` 相关页面、`styles.css` | 文档入口做成统一卡片风格 |
| UI4 | 待做 → ✅ 已在 N/B/UI 系列中完成 | 空状态统一 | 各 view 组件 + `styles.css` | 没数据时更像产品，不像报错页 |
| UI5 | 待做 → ✅ 已在 N/B/UI 系列中完成 | Toast 文案统一 | 相关前端组件 | 保存成功、失败、提示、警告文案统一口气 |
| UI6 | 待做 → ✅ 已在 N/B/UI 系列中完成 | 按钮交互统一 | `src/renderer/styles.css` | hover、active、disabled 更一致 |
| UI7 | 待做 → ✅ 已在 N/B/UI 系列中完成 | 训练页说明卡片 | `TrainingView.tsx`、`styles.css` | 把题数、难度、模式说明写清楚 |
| UI8 | 待做 → ✅ 已在 N/B/UI 系列中完成 | 会话记录卡片 | `SessionsView.tsx`、`styles.css` | 增加重命名、删除、多选、导出提示 |
| UI9 | 待做 → ✅ 已在 N/B/UI 系列中完成 | 简历库文件态展示 | 简历库相关组件 + `styles.css` | 文件名、格式、时间、大小更清楚 |
| UI10 | 待做 → ✅ 已在 N/B/UI 系列中完成 | 模型与费用卡片 | API 设置相关组件 + `styles.css` | 让模型、余额、用量、预算一眼能看懂 |
| UI11 | 待做 → ✅ 已在 N/B/UI 系列中完成 | 模态窗与浮窗排版 | 相关弹窗组件 + `styles.css` | 调整尺寸、位置、滚动条和关闭按钮 |
| UI12 | 待做 → ✅ 已在 N/B/UI 系列中完成 | 视觉统一收尾 | `styles.css` | 圆角、间距、按钮宽度、标题层级统一 |

## 还能继续加的 UI 任务

- 设置页二级菜单。
- 会话记录 hover 效果。
- 训练页进度条与状态提示。
- 简历库导入区说明。
- 预算面板数字样式。
- 错误提示卡片美化。

## 可直接复制给 DeepSeek 的提示词

```text
你现在在开发 Windows Electron 项目“获面通”，路径：
C:\Users\kangg\Desktop\huomiantong-app

请先阅读：
1. docs/deepseek-safe-task-list.md
2. docs/deepseek-task-book.md
3. docs/deepseek-ui-plan.md

本次只执行任务：【填写任务编号，例如 UI1】。

要求：
1. 先给出简短执行计划。
2. 一次只做一个任务。
3. 只能改允许的 UI / CSS / 文案文件。
4. 不要碰 src/main、src/preload、音频、Deepgram、AI 回答生成、训练主逻辑、API Key 加密、备份导入、删除数据逻辑。
5. 代码 / UI / CSS 任务必须运行 npm run build。
6. 做完后汇报修改文件、验证结果和需要 Codex 复核的点。
```

