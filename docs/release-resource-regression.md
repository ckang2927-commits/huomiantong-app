# 发布前资源检查回归记录

检查日期：2026-08-04

## 结论

`npm run validate:release-resources` 已用于本次 `v0.1.4` 正式发布检查，覆盖资源、安装包和 `latest.yml`。

## 覆盖范围

- `package.json` 已提升到 `0.1.4`，`productName` 为“获面通”。
- `extraResources` 已包含 `docs` 和 `resources/piper`，并排除 `probe*` 临时文件。
- Piper 正式运行需要的 exe、DLL、模型和 `espeak-ng-data` 数据存在。
- 三套本地面试官声音模型存在：`zh_CN-xiao_ya-medium`、`zh_CN-huayan-medium`、`zh_CN-chaowen-medium`。
- 项目根目录和 `docs` 下没有遗留 `.tmp-*`、probe 音频、主题预览图或临时截图；本地临时归档目录不进入 Git 和安装包。
- 本轮正式发布已运行 `npm run dist`，生成 `release/huomiantong-setup-0.1.4.exe`、blockmap 和 `latest.yml`。
- GitHub Release 已上传 `huomiantong-setup-0.1.4.exe`、`huomiantong-setup-0.1.4.exe.blockmap` 和 `latest.yml`。

## 仍需人工确认

- 建议用旧安装版点击“设置 -> 更新日志 -> 检查更新”验证能发现 `v0.1.4`。
- 安装版仍需要人工点测启动、覆盖更新、Piper 试听和更新日志入口。
- 当前 Windows 安装包未做代码签名，正式对外说明里需要继续提示 SmartScreen 风险。
