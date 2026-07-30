# 获面通软件更新发布指南

> 目的：让获面通打包后可以通过 GitHub Releases 自动检查更新，用户不用重新找安装包。

## 当前接入状态

- 代码已接入 `electron-updater`。
- 设置中心已有「检查更新」「发布说明」「重启安装」入口。
- 正式安装包启动后会自动检查更新；开发模式不会连更新源。
- 当前默认发布源配置为：`ckang2927-commits/huomiantong-app`。
- 已接入 GitHub Actions 自动发布：推送 `v*` 标签后会自动打 Windows 安装包并发布 Release。

## 重要边界

- `https://github.com/dashboard` 不是仓库地址，只是 GitHub 仪表盘。
- 公开仓库不能上传 `.env`、API Key、真实简历、录音、会话记录、备份文件。
- 自动更新只更新安装包文件，不应覆盖 `%APPDATA%/huomiantong/` 里的用户数据。
- 真正可更新的前提是 GitHub Release 里存在 `latest.yml` 和对应安装包。

## 第一次发布流程

1. 在 GitHub 创建公开仓库：`huomiantong-app`。
2. 确认远程地址类似：`https://github.com/ckang2927-commits/huomiantong-app.git`。
3. 本地执行敏感文件检查，确认没有真实 Key、简历、录音进入 Git。
4. 更新 `package.json` 的 `version`，例如从 `0.1.0` 改为 `0.1.1`。
5. 提交并推送代码到 `main`。
6. 创建并推送版本标签，例如 `v0.1.1`。
7. GitHub Actions 会自动执行 `npm run dist:publish`，生成安装包、blockmap 和 `latest.yml`。
8. 已安装旧版本的用户启动 App，或在设置中心点击「检查更新」。

## 后续每次更新流程

1. 修改功能并完成 `npm run build`。
2. 修改 `package.json` 版本号，版本号必须高于线上版本。
3. 提交并推送到 `main`。
4. 创建新的 GitHub tag，例如 `v0.1.2`。
5. 等 GitHub Actions 自动生成 Release。
6. 在旧版本 App 里点击「检查更新」验收。

## 验收清单

- 开发模式点击「检查更新」提示不会连接自动更新。
- 正式安装包启动 8 秒后自动检查更新。
- 没有新版本时提示当前已是最新版本。
- 有新版本时能自动下载，并显示下载进度。
- 下载完成后点击「重启安装」能覆盖安装。
- 覆盖安装后 API Key、简历、会话、复盘记录、预算记录都还在。

## 如果检查更新失败

- 提示 `latest.yml` 不存在：说明 Release 里没上传 `latest.yml`。
- 提示 404：检查 `package.json` 的 `owner/repo` 是否和真实仓库一致。
- 提示网络异常：检查当前网络是否能访问 GitHub Releases。
- 提示没有 Release：先创建公开 Release，再重新检查。
