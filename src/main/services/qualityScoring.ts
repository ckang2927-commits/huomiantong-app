import type { AnswerQualityScore, EvidenceSnippet, FabricationRisk } from '../../shared/types'

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function scoreAnswer(answer: string, evidence: EvidenceSnippet[]): AnswerQualityScore {
  const evidenceScore = evidence.length === 0 ? 45 : Math.min(95, 58 + evidence.length * 8 + Math.max(...evidence.map((item) => item.score)) * 2)
  const hasStructure = /背景|目标|做法|结果|复盘|然后|STAR|指标|口径|落地|影响|问题|动作/.test(answer)
  const structure = hasStructure ? 82 : answer.length > 120 ? 70 : 56
  const clarity = answer.length < 40 ? 42 : answer.length > 900 ? 62 : answer.length > 160 ? 86 : 74
  const riskyWords = ['我主导了', '千万级', '亿级', '从0到1', '搭建了完整', '负责全部', '显著提升了']
  const riskyCount = riskyWords.filter((word) => answer.includes(word)).length
  const riskControl = evidence.length === 0 ? 72 - riskyCount * 10 : 88 - riskyCount * 4
  const total = clampScore(evidenceScore * 0.34 + structure * 0.24 + clarity * 0.22 + riskControl * 0.2)
  const notes: string[] = []

  if (evidence.length === 0) {
    notes.push('简历命中依据较少，回答应保持泛化和方法论。')
  } else {
    notes.push(`命中 ${evidence.length} 条简历依据，适合展开真实项目细节。`)
  }

  if (!hasStructure) {
    notes.push('结构感偏弱，可以补一句背景、动作或结果。')
  }

  if (riskyCount > 0) {
    notes.push('存在偏强表述，建议确认简历中是否有事实支撑。')
  }

  return {
    total,
    resumeFit: clampScore(evidenceScore),
    structure: clampScore(structure),
    clarity: clampScore(clarity),
    riskControl: clampScore(riskControl),
    notes
  }
}

export function detectFabricationRisk(answer: string, evidence: EvidenceSnippet[]): FabricationRisk {
  const evidenceText = evidence.map((item) => item.text).join('\n').toLowerCase()
  const concretePatterns = [
    /提升(?:了)?\s*\d+%?/g,
    /降低(?:了)?\s*\d+%?/g,
    /增长(?:了)?\s*\d+%?/g,
    /\d+(?:万|亿|千|百)?(?:用户|订单|请求|数据|营收|成本|效率)/g,
    /从\s*0\s*到\s*1/g,
    /我(?:主导|负责|搭建|设计|落地|推动)了/g,
    /Kafka|Flink|Spark|ClickHouse|Kubernetes|Redis|MySQL|PostgreSQL|Hive|Airflow/gi
  ]
  const unsupportedClaims = concretePatterns
    .flatMap((pattern) => answer.match(pattern) || [])
    .filter((claim, index, all) => all.indexOf(claim) === index)
    .filter((claim) => !evidenceText.includes(claim.toLowerCase()))
    .slice(0, 6)
  const reasons: string[] = []
  let score = 12

  if (evidence.length === 0) {
    score += 45
    reasons.push('当前问题没有命中明确简历依据，回答应避免具体项目经历。')
  }

  if (unsupportedClaims.length > 0) {
    score += unsupportedClaims.length * 10
    reasons.push('回答里出现了简历依据中未直接命中的具体数字、技术或强经历表述。')
  }

  if (/我(?:主导|负责|搭建|设计|落地|推动)了/.test(answer) && evidence.length < 2) {
    score += 15
    reasons.push('“我主导/负责/搭建”类表述较强，建议确认简历中有对应事实。')
  }

  const finalScore = Math.max(0, Math.min(100, score))
  const level = finalScore >= 70 ? 'high' : finalScore >= 40 ? 'medium' : 'low'

  if (reasons.length === 0) {
    reasons.push('回答基本围绕已命中的简历依据，编造风险较低。')
  }

  return {
    level,
    score: finalScore,
    reasons,
    unsupportedClaims
  }
}
