# 背景资料来源记录模板

> 每条背景资料都应记录来源，方便用户追溯和评估可信度。
> 最终产品中这些信息会跟随每个字段，用户可点开查看。

---

## 通用来源记录格式

```yaml
field: 字段名称
source_type: formal | detailed | other_cv | user_input | public | ai_simulated | unverified
source_url: https://...（如果有）
fetch_date: 2026-07-22
credibility: high | medium | low | unverified
notes: 补充说明
```

## 各来源类型模板

### 正式简历
```yaml
source_type: formal
source_description: 候选人正式简历
source_file: 康超帅-数据分析师-简历.pdf
credibility: high
notes: 简历内容已经过候选人确认
```

### 万字简历
```yaml
source_type: detailed
source_description: 候选人万字/详细版简历
source_file: 康超帅-数据分析师-万字简历.md
credibility: high
notes: 详细版简历包含更多项目细节
```

### 其他简历
```yaml
source_type: other_cv
source_description: 已保存的背景资料补充
source_file: hr-康超帅-2026-07-22.md
credibility: high
notes: 用户已逐条确认内容
```

### 用户填写
```yaml
source_type: user_input
source_description: 用户在补全中心手动填写
credibility: high
notes: 建议填写大概范围，不需要精确到门牌号
```

### 公开资料
```yaml
source_type: public
source_url: https://www.example.com/about
source_title: 公司官网 - 关于我们
fetch_date: 2026-07-22
credibility: medium
notes: 官网内容可能包含宣传成分，建议多方核实
```

### AI 模拟参考
```yaml
source_type: ai_simulated
source_description: AI 根据已有信息模拟生成
model: deepseek-v4-flash
generated_at: 2026-07-22T10:30:00+08:00
credibility: low
notes: 'AI 模拟参考 · 低可信度 · 仅供准备思路 · 需用户确认'
```

### 待确认
```yaml
source_type: unverified
credibility: unverified
notes: 该信息尚未经过验证，建议面试前自行确认
no_speak: true
```
