# 更新入口技术回归记录

最后更新：2026-08-03

## 覆盖目标

这份回归用于验证设置里的“更新日志/检查更新”模块不会再次出现“点击检查更新就自动下载”的问题。

## 自动验收

命令：

```bash
npm run validate:update-flow
```

当前结果：6/6 通过。

## 已覆盖场景

- `autoUpdater.autoDownload = false`，检查更新不自动下载。
- `checkForUpdatesManually` 只调用 `checkForUpdates`，不调用下载或安装。
- 下载更新必须处于 `available` 状态。
- 重启安装必须处于 `downloaded` 状态，并调用 `quitAndInstall`。
- 开发模式提示不会连接正式自动更新。
- 设置页按钮按状态显示：`available` 才显示下载，`downloaded` 才显示重启安装。
- 主进程和 preload 的更新 IPC 通道完整。

## 涉及文件

- `src/main/services/updateService.ts`
- `src/main/index.ts`
- `src/preload/index.ts`
- `src/renderer/components/settings/UpdateLogPanel.tsx`
- `scripts/validate-update-flow.mjs`
- `package.json`

## 仍需人工复测

- 在安装版里点击“检查更新”，确认不会立刻下载。
- 有新版本时点击“下载更新”，完成后再点击“重启安装”。
- 覆盖更新后确认 API Key、简历、会话、复盘记录仍保留。
