# App 打包前准备清单

> 用途：在准备打包 Electron 安装包之前，逐项确认以下内容，避免打包后发现问题反复拆包。
> 适用场景：给自己用 / 给朋友分发打包版 App。

---

## □ 1. 项目信息

- [ ] 版本号已更新（`package.json` 中的 `version` 字段）
- [ ] 应用名称正确（`name` / `productName`）
- [ ] 应用描述已填写（`description` 字段）
- [ ] 作者信息已更新

## □ 2. 应用图标

- [x] 已准备应用图标（至少需要 256x256 PNG 或 .ico）：`build/icon.ico`
- [ ] 图标在任务栏和标题栏显示正常
- [ ] 图标在文件资源管理器中显示正常

## □ 3. 功能验证（构建前）

- [ ] `npm run build` 通过，无 TypeScript 错误
- [ ] 主窗口能正常启动
- [ ] 悬浮窗能正常打开
- [ ] 各页面切换正常：面试台/简历库/会话记录/设置/模拟训练/作战室
- [ ] API Key 能保存和读取
- [ ] 测试连接能返回成功/失败
- [ ] 语音转写功能可用（麦克风和电脑音频）
- [ ] 简历导入正常（PDF/DOCX/MD）
- [ ] 会话保存和导出正常（MD/Word）
- [ ] 备份导出和导入正常

## □ 4. 隐私与安全

- [ ] API Key 已测试保存和重启后读取
- [ ] 隐私模式开关正常
- [ ] 备份文件确认不含敏感信息（如选择不导出 Key）
- [ ] 确认不会自动上传任何数据

## □ 5. 数据备份

- [ ] 已导出当前完整备份（设置 + 会话 + 用量）
- [ ] 备份文件保存在安全位置
- [ ] 已知晓导入备份会覆盖当前数据

## □ 6. 构建配置

- [ ] `electron-builder.yml` 或打包配置已确认
- [ ] 输出目录和目标平台正确（Windows NSIS 或 portable）
- [ ] 更新方式已确认（手动下载安装 / 软件内检查更新 / 自动下载更新）
- [ ] 如使用 GitHub Releases，已配置发布仓库、版本号规则和 Release 上传流程
- [ ] 已阅读 `docs/update-release-guide.md`，确认 `latest.yml`、安装包和版本号发布规则
- [ ] 是否启用 asar 打包
- [ ] 是否包含 node_modules 中需要的原生模块
- [ ] 是否排除不必要的文件（如 src/、.git/、node_modules/.cache）
- [ ] 已确认 `docs/**/*` 会通过 `extraResources` 进入安装包资源目录
- [ ] 已确认用户数据走 `app.getPath('userData')`，不会写入安装目录
- [ ] 已阅读 `docs/packaging-resource-strategy.md`，知道安装资源和用户隐私数据的边界

## □ 7. 安装包测试（构建后）

- [ ] 安装包能正常安装
- [ ] 安装后应用能正常启动
- [ ] 首次启动无报错弹窗
- [ ] 帮助中心能搜索并打开 `docs/` 文档
- [ ] API Key、简历、会话、用量记录能在重启后保留
- [ ] 覆盖安装新版本后，API Key、简历、会话、用量记录仍然保留
- [ ] 设置中心“检查更新”入口不会误报；如已接自动更新，则能正确提示新版本/无更新
- [ ] 安装目录内没有用户简历、会话记录或明文备份文件
- [ ] 悬浮窗功能正常
- [ ] 已保存的数据能正常读取
- [ ] 应用能正常关闭

## □ 8. 给朋友分发前的额外检查

- [ ] 已准备 Windows 安装说明（见 `docs/windows-install-guide.md`）
- [ ] 已知晓 SmartScreen 可能拦截，需告知朋友如何安全运行
- [ ] 已准备 API Key 配置说明
- [ ] 推荐模型和 Deepgram 的免费额度说明已包含

## □ 9. 版本记录

| 项 | 内容 |
|----|------|
| 版本号 | |
| 构建日期 | |
| 构建人 | |
| 安装包路径 | |
| 安装包大小 | |
| 已知问题 | |

## 2026-07-30 第一轮打包验收记录

- `npm run dist` 已通过，生成 `release/huomiantong-setup-0.1.0.exe`、blockmap 和 `latest.yml`。
- 测试安装目录：`%LOCALAPPDATA%/Programs/huomiantong-test/`。
- 安装包静默安装成功，安装版主窗口可启动。
- `resources/docs` 已进入安装目录，共检查到 104 个文档资源。
- GitHub Actions 已发布 `v0.1.1`，Release 附件包含安装包、blockmap、`latest.yml`。
- 已安装的 `0.1.0` 能自动下载 `0.1.1` 到 `%LOCALAPPDATA%/huomiantong-updater/pending/`。
- 使用下载到的 `0.1.1` 更新包覆盖安装成功，安装目录 `app.asar/package.json` 确认为 `0.1.1`，更新后可启动。
- 已把现有 `huomiantong-logo.png` 转为 `build/icon.ico`，并接入 exe、安装器和卸载器图标配置；`npm run dist` 已生成 `release/huomiantong-setup-0.1.1.exe`，`latest.yml` 指向 `0.1.1`。
- 已从 `release/win-unpacked/获面通.exe` 提取到应用图标；任务栏、标题栏、资源管理器里的实际显示仍需人工看一眼。
- 待补验收：设置页「重启安装」按钮人工点击、真实 API Key 保存读取、麦克风/电脑音频真测、任务栏/标题栏/资源管理器图标视觉复核、代码签名。

> 完成以上检查后，可参考 `docs/packaged-app-regression.md` 做打包后人工验收。
