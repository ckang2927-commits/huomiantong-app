# docs 文档维护规则

> 目标：让 `docs/` 从“文件堆”变成可长期维护的资料库。以后新增、修改、交给 DeepSeek 的文档都按这里执行。

## 一、文档分工

| 类型 | 放什么 | 代表文档 |
|---|---|---|
| 总导航 | 所有文档入口和阅读路线 | `README.md` |
| 总计划 | 产品想法、优先级、完成状态 | `product-optimization-backlog.md` |
| 工程边界 | 架构拆分、后续加功能规则 | `refactor-roadmap.md` |
| 用户指南 | 给用户照着操作的软件说明 | `quick-start.md`、`training-guide.md` |
| 排障指南 | 常见错误、语音、API、导出问题 | `audio-troubleshooting.md`、`faq-and-troubleshooting.md` |
| 验收脚本 | 修改后怎么点测 | `regression-checklist.md`、`manual-test-*.md` |
| DeepSeek 任务书 | 给 DeepSeek 执行的低风险任务 | `deepseek-*-plan.md` |
| 历史记录 | 已完成任务、旧回归、旧阶段资料 | `regression-run-*.md`、旧 DeepSeek 计划 |
| 资产文件 | Logo、图片、截图 | `*.png` |

## 二、唯一事实源规则

- 产品下一步计划只以 `product-optimization-backlog.md` 为准。
- 文档入口只以 `README.md` 为准。
- 工程结构和拆分边界只以 `refactor-roadmap.md` 为准。
- 回归验收只以 `regression-checklist.md` 和对应 `manual-test-*.md` 为准。
- DeepSeek 能不能做，只以 `deepseek-safe-task-list.md` 和当前任务书为准。

## 三、新增文档命名

| 场景 | 命名建议 | 示例 |
|---|---|---|
| 用户指南 | `xxx-guide.md` | `training-guide.md` |
| 故障排查 | `xxx-troubleshooting.md` | `audio-troubleshooting.md` |
| 人工验收 | `manual-test-xxx.md` | `manual-test-audio.md` |
| 发布/打包 | `xxx-checklist.md` 或 `xxx-regression.md` | `app-packaging-checklist.md` |
| DeepSeek 任务书 | `deepseek-xxx-plan.md` | `deepseek-realistic-interview-plan.md` |
| 回归记录 | `regression-run-YYYY-MM-DD.md` | `regression-run-2026-07-21.md` |
| 示例素材 | `sample-xxx.md` | `sample-jd-question-bank.md` |

## 四、新增文档必须包含

- 文档用途：谁看、什么时候看。
- 状态说明：推荐、草案、任务书、历史记录、验收用。
- 是否涉及联网、Token、API Key、隐私。
- 如果是计划文档：必须写优先级、难点、预估耗时、验收标准。
- 如果是 DeepSeek 任务书：必须写允许修改范围和禁止修改范围。

## 五、DeepSeek 文档规则

DeepSeek 适合做：

- 用户说明文档初稿。
- 静态 UI 文案。
- 人工验收脚本。
- 低风险组件 UI 初稿。
- 文档导航、模板、说明卡片。

DeepSeek 不适合做：

- `src/main/**`
- `src/preload/**`
- 音频采集、Deepgram、TTS 实际逻辑。
- AI 回答生成、RAG、训练服务、流式输出。
- API Key 加密、备份恢复、删除逻辑。
- 新增依赖和大型重构。

## 六、归档流程

1. 不直接删除文档。
2. 先把候选写入 `archive-candidates.md`。
3. 确认是否还有代码、README、任务书引用。
4. 如果只是旧历史，移动到未来的 `docs/archive/`。
5. 如果内容重复，合并到核心文档后再归档。
6. 归档后更新 `README.md`。

## 七、每次改文档后的检查

- `README.md` 是否能找到新文档。
- 是否运行 `npm run docs:index` 更新帮助中心自动索引。
- 如果只是验收索引是否最新，运行 `npm run docs:index:check`。
- 是否出现重复事实源。
- 是否把“草案/静态 UI”写成“已完成真实功能”。
- 是否写死会变的信息：模型名、价格、免费额度、官网政策。
- 是否误导用户输入或暴露 API Key。
- 如果是验收文档，是否明确“构建通过不等于功能可用”。
