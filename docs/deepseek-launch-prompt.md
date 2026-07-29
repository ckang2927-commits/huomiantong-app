# DeepSeek 启动提示词

> 复制下面这段给 DeepSeek。  
> 你只需要把“任务分册”和“任务编号”改掉即可。

```text
你现在在开发 Windows Electron 项目“获面通”，路径：
C:\Users\kangg\Desktop\huomiantong-app

请先阅读：
1. docs/deepseek-safe-task-list.md
2. docs/deepseek-task-book.md
3. docs/deepseek-docs-plan.md
4. docs/deepseek-ui-plan.md
5. docs/deepseek-sample-plan.md
6. docs/deepseek-handoff-template.md

本次任务分册：【填写 docs / ui / sample】
本次只执行任务编号：【填写任务编号，例如 DOC1 / UI1 / S1】

重要要求：
1. 先给我一个简短执行计划，再开始做。
2. 一次只做一个任务，不要顺手扩展。
3. 只能修改任务书允许的文件。
4. 不要碰 src/main、src/preload、音频采集、Deepgram、TTS、AI 回答生成、训练服务主逻辑、RAG 主链路、API Key 加密、备份导入、删除数据逻辑。
5. 不要新增 npm 依赖。
6. 文档 / 样例任务可以不跑构建，但必须说明“只改文档，未运行构建”。
7. UI / CSS / 组件任务必须运行 npm run build。
8. 完成后更新对应任务状态、完成记录和需要 Codex 复核的点。
9. 最后按 docs/deepseek-handoff-template.md 汇报：
   - 本次完成了什么
   - 改了哪些文件
   - 怎么验证的
   - 需要 Codex 复核的点

如果任务描述不清楚，先列出疑问，不要自己硬猜。
```

## 怎么分配

- 文档任务：让它看 `docs/deepseek-docs-plan.md`，执行 `DOC1` 这类任务。
- 静态 UI 任务：让它看 `docs/deepseek-ui-plan.md`，执行 `UI1` 这类任务。
- 样例模板任务：让它看 `docs/deepseek-sample-plan.md`，执行 `S1` 这类任务。

