# 联网搜索来源记录模板

> 用于记录联网搜索公司公开信息的来源，便于用户追溯和评估可信度。
> 最终产品接入联网搜索后，每条搜索结果的来源信息按此格式记录。

---

## 通用搜索来源模板

```yaml
query: 搜索关键词
source_url: https://...
source_title: 页面标题
fetch_date: 2026-07-22
publish_date: 2026-07-20（如果有）
domain_authority: 高/中/低
credibility: medium
content_summary: 提取的关键内容摘要
```

## 常用搜索来源

### 公司官网
```yaml
query: 星辰科技有限公司 官网
source_url: https://www.example.com/about
source_title: 关于我们 - 星辰科技
fetch_date: 2026-07-22
publish_date: 2026
domain_authority: 高
credibility: medium
content_summary: 公司成立于2018年，专注B端智能客服，服务500+企业客户，团队800+人
notes: 官网信息通常准确但可能有宣传成分，建议多方核实
```

### 招聘页面（BOSS/拉勾/猎聘）
```yaml
query: 星辰科技 数据分析师 招聘
source_url: https://www.zhipin.com/...
source_title: 数据分析师 - 星辰科技 - BOSS直聘
fetch_date: 2026-07-22
publish_date: 2026-07-15
domain_authority: 中
credibility: medium
content_summary: 岗位职责：搭建核心指标看板、A/B实验分析、专题报告；薪资范围：20-30K
notes: 招聘信息可能已下架或调整，以实际沟通为准
```

### 企查查/天眼查
```yaml
query: 星辰科技有限公司
source_url: https://www.qcc.com/...
source_title: 星辰科技有限公司 - 企查查
fetch_date: 2026-07-22
publish_date: 2026-07-22（工商信息更新日期）
domain_authority: 高
credibility: high
content_summary: 注册资本1000万，成立日期2018-03-15，参保人数500+，C轮融资
notes: 工商信息权威性高，但融资信息可能滞后
```

### 36氪/IT桔子（融资新闻）
```yaml
query: 星辰科技 C轮 融资
source_url: https://36kr.com/...
source_title: 星辰科技完成C轮融资，腾讯领投
fetch_date: 2026-07-22
publish_date: 2026-06-15
domain_authority: 中
credibility: medium
content_summary: 星辰科技完成C轮融资，金额未披露，腾讯领投，老股东跟投
notes: 媒体报道可能有偏差，建议综合多篇报道交叉验证
```

### 知乎/脉脉（口碑）
```yaml
query: 星辰科技 工作体验
source_url: https://www.zhihu.com/...
source_title: 在星辰科技工作是什么体验？
fetch_date: 2026-07-22
publish_date: 2026-05-20
domain_authority: 低
credibility: low
content_summary: 匿名用户评价：技术氛围好，加班适中，年终奖2-4个月
notes: 匿名评价可信度低，仅作为参考，不要写入正式面试内容
```

## 来源可信度评估

| 来源类型 | 默认可信度 | 建议 |
|----------|:----------:|------|
| 公司官网 | 中 | 基本信息准确，但可能有宣传成分 |
| 工商信息（企查查） | 高 | 权威性高，信息滞后风险低 |
| 招聘网站 | 中 | 薪资范围有参考价值，但可能过时 |
| 新闻媒体 | 中 | 多方交叉验证后可信度提升 |
| 社交媒体评价 | 低 | 仅作参考，不要作为面试依据 |
| 行业报告 | 中 | 关注发布机构和数据来源说明 |

## 多来源交叉验证

建议每个关键字段至少来自 2-3 个独立来源，系统会自动标注"已验证"状态。
如果只有一个来源且可信度为中或低，保持"待确认"状态。
