# 打包资源与用户数据策略

> 状态：P3-1 已完成策略设计，代码当前已基本符合；真正结论仍要以 `npm run dist` 后的安装包验收为准。

## 1. 目标

把获面通打包成 Windows App 时，需要明确三类东西放在哪里：

1. **随 App 一起发布的只读资源**：帮助文档、静态图标、前端构建产物。
2. **用户自己的私密数据**：API Key、候选人简历、会话记录、用量预算。
3. **用户主动导出的文件**：备份 JSON、会话 Markdown/Word、复盘报告。

核心原则：

- 安装目录只放程序和只读资源。
- 用户数据必须放系统用户数据目录，不写进安装目录。
- 打包版必须能打开 `docs/` 文档。
- API Key、简历、会话不能随安装包一起分发。

## 2. 当前代码现状

| 类型 | 当前位置/逻辑 | 文件依据 | 当前判断 |
|------|---------------|----------|----------|
| 前端/主进程构建产物 | `out/**/*` 被打进安装包 | `package.json` 的 `build.files` | ✅ 合理 |
| 帮助文档 | `docs/**/*` 通过 `extraResources` 打进安装包资源目录 | `package.json` 的 `build.extraResources` | ✅ 合理 |
| 打开帮助文档 | 依次查找开发目录、App 路径、`process.resourcesPath/docs` | `src/main/services/docService.ts` | ✅ 已覆盖打包路径 |
| 设置/API Key/简历 | `settings.json` 写入 `app.getPath('userData')` | `src/main/services/jsonStorage.ts`、`settingsStore.ts` | ✅ 合理 |
| 会话记录 | `sessions.json` 写入 `app.getPath('userData')` | `src/main/services/sessionStore.ts` | ✅ 合理 |
| 用量预算/Token 统计 | `usage.json` 写入 `app.getPath('userData')` | `src/main/services/usageStore.ts` | ✅ 合理 |
| 备份导出 | 用户主动下载 JSON，不自动写安装目录 | `src/main/services/backupService.ts`、renderer 下载逻辑 | ✅ 合理 |

## 3. 打包后目录策略

### 3.1 安装目录

安装目录只允许包含：

- `out/` 构建产物
- `package.json`
- `resources/docs/` 帮助文档
- Electron 运行所需资源

安装目录不允许保存：

- API Key
- 简历正文
- 会话记录
- 用量记录
- 用户备份文件

### 3.2 用户数据目录

获面通运行时数据统一走 Electron 的：

```text
app.getPath('userData')
```

当前会保存这些文件：

| 文件 | 内容 | 敏感级别 | 说明 |
|------|------|----------|------|
| `settings.json` | API 配置、简历、候选人、回答策略 | 高 | API Key 已尝试使用 `safeStorage` 加密 |
| `sessions.json` | 面试会话、转写、回答、依据 | 高 | 默认最多保存最近 50 条会话 |
| `usage.json` | 各模型用量、预算金额 | 中 | 不含 API Key，但可能反映使用习惯 |

注意：`safeStorage` 在部分开发/系统环境可能不可用，代码会退回 `plain:` 存储。正式给朋友使用前，要在目标 Windows 机器上验证 Key 是否能加密保存。

### 3.3 用户导出目录

以下文件由用户自己选择保存位置：

- 备份 JSON
- 会话 Markdown
- 会话 Word HTML
- 训练/复盘导出

这些文件不应该自动保存到安装目录。

## 4. 帮助中心文档策略

当前帮助中心已经升级为“构建期自动索引 + 打开 docs 文件”：

- 文档本体：打包时进入 `resources/docs`
- 搜索索引：由 `scripts/generate-help-doc-index.mjs` 扫描 `docs/*.md` 自动生成到 `src/renderer/lib/generatedHelpDocs.ts`
- 打开文档：走 `window.huomiantong.openDoc(doc.path)`，主进程只允许打开 `docs/` 下的 `.md`

当前注意点：

- `npm run build` 会自动先执行 `npm run docs:index`。
- 如果只改文档，也可以手动运行 `npm run docs:index`。
- `generatedHelpDocs.ts` 是生成文件，不要手工修改。
- 打包后文档路径需要安装包实测确认。

P3-2 已完成：

- 构建期自动扫描 `docs/*.md`
- 自动生成帮助中心索引
- 新文档自动出现在帮助中心
- 打包版继续能搜索和打开文档，最终以 P3-11 安装包验收为准

## 5. 打包前必须验证

### 5.1 开发环境验证

- [ ] `npm run build` 通过。
- [ ] 帮助中心能搜索到 `quick-start.md`、`audio-troubleshooting.md`、`product-optimization-backlog.md`。
- [ ] 点击帮助中心结果能打开 `.md` 文档。
- [ ] 保存 API Key 后重启仍能读取。
- [ ] 新增候选人和会话后，重启仍存在。

### 5.2 安装包验证

- [ ] 执行 `npm run dist` 生成安装包。
- [ ] 安装到非项目目录。
- [ ] 首次启动无白屏。
- [ ] 帮助中心搜索正常。
- [ ] 帮助文档能从安装包资源目录打开。
- [ ] 用户数据写入 `userData`，不是安装目录。
- [ ] 卸载/升级前已提示用户备份数据。

## 6. 当前结论

P3-1 的策略结论：

- 当前 `docs` 打包策略方向正确。
- 当前用户数据存储方向正确。
- 当前帮助文档打开服务已考虑打包路径。
- 主要缺口是：打包后尚未跑安装包实测。

因此后续顺序不变：

1. P3-3：全局导航瘦身。
2. P3-4：帮助中心知识库体验升级。
3. P3-11：最后做打包版专项验收。
