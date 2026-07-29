import { AlertTriangle, CheckCircle2, Target } from 'lucide-react'
import { buildResumeJdMatch } from '../../lib/resumeJdMatcher'
import type { ResumeProfile } from '../../../shared/types'

type ResumeJdMatchPanelProps = {
  resume: ResumeProfile
  jd: string
}

export function ResumeJdMatchPanel({ resume, jd }: ResumeJdMatchPanelProps): JSX.Element {
  const result = buildResumeJdMatch(resume, jd)

  return (
    <section className={`resume-jd-match-panel ${result.level}`}>
      <div className="resume-jd-match-top">
        <div className="resume-jd-score">
          <strong>{result.score}</strong>
          <span>匹配分</span>
        </div>
        <div>
          <div className="resume-jd-match-title">
            <Target size={17} />
            <strong>简历-JD 匹配评分</strong>
          </div>
          <p>{result.summary}</p>
        </div>
      </div>

      <div className="resume-jd-score-grid">
        {result.sectionScores.map((item) => (
          <article key={item.label}>
            <div>
              <span>{item.label}</span>
              <strong>{item.score}</strong>
            </div>
            <div className="resume-jd-meter" aria-hidden="true">
              <span style={{ width: `${item.score}%` }} />
            </div>
            <small>{item.hint}</small>
          </article>
        ))}
      </div>

      <div className="resume-jd-match-columns">
        <article>
          <div className="resume-jd-column-title">
            <CheckCircle2 size={16} />
            <strong>已命中证据</strong>
          </div>
          {result.matchedKeywords.length === 0 ? (
            <p className="resume-jd-empty">暂时没有从简历里命中 JD 核心能力。</p>
          ) : (
            <div className="resume-jd-keyword-list">
              {result.matchedKeywords.map((item) => (
                <span key={item.label}>
                  {item.label}
                  <small>{item.sourceLabels.join(' / ')}</small>
                </span>
              ))}
            </div>
          )}
        </article>

        <article>
          <div className="resume-jd-column-title">
            <AlertTriangle size={16} />
            <strong>缺口与补强</strong>
          </div>
          {result.missingKeywords.length === 0 ? (
            <p className="resume-jd-empty">核心能力基本都有证据，下一步优化表达顺序即可。</p>
          ) : (
            <div className="resume-jd-gap-list">
              {result.missingKeywords.slice(0, 5).map((item) => (
                <div key={item.label}>
                  <strong>{item.label}</strong>
                  <span>{item.category}</span>
                  <p>{item.advice}</p>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>

      {(result.extraJdKeywords.length > 0 || result.resumeWarnings.length > 0) && (
        <div className="resume-jd-extra">
          {result.extraJdKeywords.length > 0 && (
            <div>
              <strong>JD 原文缺失词</strong>
              <p>{result.extraJdKeywords.join('、')}</p>
            </div>
          )}
          {result.resumeWarnings.length > 0 && (
            <div>
              <strong>材料提醒</strong>
              <p>{result.resumeWarnings.join(' ')}</p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
