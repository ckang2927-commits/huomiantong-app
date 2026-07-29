# docs 待归档 / 待合并候选清单

> 这不是删除清单。这里先记录哪些文档可能重复、过时或更适合归档，等确认没有引用和价值后再移动或合并。

## 一、当前不建议移动的核心文档

这些文档继续留在 `docs/` 根目录：

- `README.md`
- `docs-maintenance.md`
- `product-optimization-backlog.md`
- `refactor-roadmap.md`
- `regression-checklist.md`
- `deepseek-safe-task-list.md`
- 当前正在执行的 DeepSeek 任务书，例如 `deepseek-realistic-interview-plan.md`

## 二、可合并候选

| 候选文档 | 建议去向 | 原因 |
|---|---|---|
| `product-info.md` | 合并到 `product-about.md` | 两者都在讲产品信息和隐私边界，容易重复 |
| `audio-troubleshooting-guide.md` | 合并到 `audio-troubleshooting.md` | 一个是短决策树，一个是完整排障，后续可合并成“快速排查 + 详细说明” |
| `session-record-guide.md` | 合并到 `session-history-guide.md` | 都是会话记录说明，内容边界接近 |
| `release-regression-guide.md` | 合并到 `packaged-app-regression.md` 或 `regression-checklist.md` | 都是发布/回归相关，后续可减少入口 |
| `model-choice-guide.md` | 合并到 `model-provider-guide.md` | 都是模型选择说明，保留一个更清晰 |
| `usage-budget-examples.md` | 合并到 `usage-budget-guide.md` | 预算说明和例子可以放在同一篇里 |

## 三、可归档候选

| 候选文档 | 建议 | 原因 |
|---|---|---|
| `deepseek-next-wave-plan.md` | 未来移动到 `docs/archive/` | N1-N20 已完成，保留历史即可 |
| `deepseek-third-wave-plan.md` | 未来移动到 `docs/archive/` | N21-N40 已完成，保留历史即可 |
| `deepseek-fourth-wave-plan.md` | 未来移动到 `docs/archive/` | N41-N60 已完成，保留历史即可 |
| `deepseek-execution-record.md` | 未来移动到 `docs/archive/` | 属于完成记录，不是当前入口 |
| `deepseek-phase1-docs.md` | 未来移动到 `docs/archive/` | 内容很长，更多是阶段合并大文档 |
| `deepseek-alignment-plan.md` | 未来移动到 `docs/archive/` | 属于对齐记录，不应作为当前事实源 |
| `regression-run-2026-07-21.md` | 未来移动到 `docs/archive/` | 历史回归记录 |

## 四、暂时保留但需要校准

| 文档 | 校准点 |
|---|---|
| `manual-test-*.md` | 需要按真实界面逐项点测，补通过/失败/截图位置 |
| `sample-*.md` | 需要确认是否仍符合当前岗位和训练模块 |
| `product-copy-style-guide.md` | 后续 UI 文案稳定后再统一校准 |
| `button-copy-audit.md` | 需要和当前界面按钮逐项对齐 |
| `error-copy-audit.md` | 需要和当前错误弹窗/诊断日志逐项对齐 |
| `high-risk-feature-research.md` | 需要和 `product-optimization-backlog.md` 的 P2 系列保持同步 |

## 五、正式归档前检查

- `docs/README.md` 是否引用了它。
- `src/renderer/components/settings/HelpQuickLinksPanel.tsx` 是否引用了它。
- 其他文档是否链接了它。
- 它是否包含唯一信息，能否先合并到核心文档。
- 用户是否明确同意移动或删除。

