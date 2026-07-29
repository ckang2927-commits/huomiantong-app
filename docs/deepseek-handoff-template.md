# DeepSeek 交付与交接模板

> 每次 DeepSeek 完成任务后，按此模板汇报。

## 汇报格式

```markdown
## 本次完成了什么
- [一句话说明做了什么]

## 改了哪些文件
- [文件路径 1]
- [文件路径 2]

## 怎么验证的
- npm run build 通过 / 只改文档未运行构建
- [其他验证方式]

## 需要 Codex 复核的点
- [风险点 1]
- [风险点 2]
```

## 示例

```markdown
## 本次完成了什么
- 创建了新手五分钟上手指南，帮助新用户快速上手

## 改了哪些文件
- docs/quick-start.md

## 怎么验证的
- 只改文档，未运行构建

## 需要 Codex 复核的点
- 检查操作步骤是否与实际功能一致
```


---

## 完整填写示例

```markdown
## DeepSeek 执行结果：拟真面试模式基础建设

### 本次完成
| 任务 | 状态 | 说明 |
|------|------|------|
| R1 | ✅ 已完成，待 Codex 复核 | 新建 MockInterviewConfigPanel 配置卡片 |
| R2 | ✅ 已完成，待 Codex 复核 | 每个选项增加 hint 说明文字 |

### 修改文件
- `src/renderer/components/training/RealisticInterviewReportPreview.tsx` — 新增
- `src/renderer/views/TrainingView.tsx` — 导入新组件
- `src/renderer/styles.css` — 追加报告模板样式

### 验证结果
- `npm run build`：✅ 通过
- 新增依赖：无
- 禁止区域：未触碰

### 尚未接入
- 真实 AI 面试官提问与语音播报
- 真实语音作答与结束判断
- AI 随机追问与调度器
- 真实详细报告生成

### 需要 Codex 复核的点
1. 配置面板的字段是否覆盖所有需求
2. 报告模板样式是否与设计系统一致
3. 构建已通过，UI 需要实际打开验收
```

### 快速自查清单

提交前确认：

- [ ] 每个修改文件都列出来了
- [ ] 没有遗漏任务（对照任务书逐项检查）
- [ ] `npm run build` 的结果写清楚了
- [ ] 明确标注了哪些尚未接入
- [ ] 没有触碰高风险区域
- [ ] 更新了对应任务书的状态
