# 背景资料补全中心 — 人工验收脚本

> 用途：针对背景资料补全中心的静态 UI 和文档逐项验收。
> 注意：本验收只检查外观、文案、按钮和空状态，不测试联网、AI 生成或保存功能（这些尚未接入）。

---

## 验收记录

| 日期 | 版本 | 验收人 | 结果 |
|------|------|--------|------|
| | | | |

---

## 1. 文档验收

- [ ] docs/background-prep-center.md — 模块定位、7 个资料包、来源标签、可信度说明完整
- [ ] docs/background-prep-fields.md — 每个资料包的字段设计清晰
- [ ] docs/background-prep-risk-copy.md — 各场景风险文案齐全
- [ ] docs/sample-background-prep-output.md — 示例输出能展示标签和可信度
- [ ] docs/background-company-public-info.md — 联网搜索设计方案合理
- [ ] docs/background-salary-safety.md — 薪资谈判安全边界清晰
- [ ] docs/background-privacy-fields.md — 隐私分级和建议正确
- [ ] docs/background-ai-disclaimer.md — 免责声明完整
- [ ] docs/background-hr-question-bank.md — HR 问题清单覆盖全面
- [ ] docs/background-salary-question-bank.md — 薪资问题清单覆盖全面
- [ ] docs/background-company-question-bank.md — 公司问题清单覆盖全面
- [ ] docs/background-work-detail-question-bank.md — 工作细节问题清单覆盖全面
- [ ] docs/background-save-naming-guide.md — 命名规范合理
- [ ] docs/background-quality-score.md — 评分维度设计合理
- [ ] docs/background-user-confirm-checklist.md — 确认清单实用
- [ ] docs/background-source-record-template.md — 来源记录模板完整
- [ ] docs/background-search-source-template.md — 搜索来源模板完整

## 2. UI 验收（设置页 → 背景资料）

- [ ] 进入设置页，找到"背景资料补全工作台"
- [ ] 资料包类型、公司名称、目标岗位、用户确认、AI 模拟参考/待确认输入区显示正常
- [ ] 来源标签（正式简历/万字简历/…）显示正常
- [ ] 可信度等级（高/中/低/待确认）显示正常
- [ ] 点击"联网搜索公开资料"后能回填公开资料列表
- [ ] 公开资料条目支持勾选/取消勾选，全选/清空按钮可用
- [ ] 只有勾选的公开资料会进入按简历生成或 AI 深度生成内容
- [ ] 点击"保存到其他简历"后弹出保存名称输入框，确认后当前候选人的其他简历新增一份 md 资料
- [ ] 继续滚动看到"一致性检查报告"
- [ ] 冲突卡片显示等级（高/中/低）和建议

## 3. 空状态文案

- [ ] 所有新组件不报错、不白屏
- [ ] UI 在 1920×1080 和 1366×768 分辨率下布局正常
- [ ] 卡片 hover 效果正常

## 4. 构建验证

- [ ] npm run build 通过

## 5. 功能验证

- [ ] 按简历生成不消耗 Token，能生成本地草稿
- [ ] AI 深度生成在保存 API 设置后可调用当前回答模型
- [ ] 联网搜索失败时要展示明确错误，不白屏、不卡死
- [ ] 所有资料包的"生成"按钮（如果存在）应该显示为占位或后续接入

---

## 失败记录

| 编号 | 检查项 | 问题描述 | 是否修复 |
|------|--------|----------|----------|
| | | | |

