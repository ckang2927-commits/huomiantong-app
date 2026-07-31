import fs from 'node:fs'
import path from 'node:path'
import { dataAnalystInterviewQuestionBank } from '../src/shared/dataAnalystInterviewQuestionBank.ts'

const outputPath = path.resolve('docs/data-analyst-question-bank-500.md')
const lines = [
  '# 数据分析师面试题库（500 题）',
  '',
  `> 内置题库：${dataAnalystInterviewQuestionBank.length} 道。每道题包含难度、侧重点、训练模式和参考答案。`,
  '',
  '## 使用说明',
  '',
  '- 这是一份模拟训练素材库，不代表任何公司的真实面试原题。',
  '- 参考答案用于练习答题结构，不能替代候选人的真实经历。',
  '- 后续可以把录音转写后的真实问题继续整理到同一结构中。',
  ''
]

dataAnalystInterviewQuestionBank.forEach((item, index) => {
  lines.push(
    `## ${index + 1}. ${item.question}`,
    '',
    `- 难度：${item.difficulty}`,
    `- 侧重点：${item.tags[0] || item.focus}`,
    `- 训练模式：${item.trainingMode}`,
    `- 标签：${item.tags.slice(1).join('、') || '综合'}`,
    '',
    `**参考答案：**${item.referenceAnswer}`,
    ''
  )
})

fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8')
console.log(`已导出 ${dataAnalystInterviewQuestionBank.length} 道题：${outputPath}`)
