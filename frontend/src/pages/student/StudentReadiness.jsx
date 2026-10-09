import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { readinessService } from '../../services/readinessService';
import { useCms } from '../../context/CmsContext';
import { PageHeader } from '../../components/common/PageHeader';
import { ProgressBar } from '../../components/common/ProgressBar';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';
import { CheckIcon, AlertTriangleIcon, ArrowRightIcon } from '../../components/common/Icons';

export const StudentReadiness = () => {
  const { cms } = useCms();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, hist] = await Promise.all([
        readinessService.getReadinessAnalysis(),
        readinessService.getReadinessHistory().catch(() => [])
      ]);
      setData(res);
      setHistory(hist || []);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState message="Loading placement readiness evaluation from MySQL database..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Readiness Prediction"
        description={error}
        onRetry={load}
      />
    );
  }

  if (!data || data.readinessScore === null || data.readinessScore === undefined) {
    return (
      <div>
        <PageHeader
          title={cms('readiness.title', 'Placement Readiness Evaluation')}
          subtitle={cms('readiness.subtitle', 'Comprehensive diagnostic synthesis connecting your Aptitude, Technical assessment, and academic performance.')}
        />
        <EmptyState
          title={cms('readiness.empty_title', 'Complete both Aptitude and Technical Assessments to generate your Placement Readiness Score.')}
          description={cms('readiness.empty_desc', 'A student must complete both the Aptitude Assessment and Technical Assessment before the placement readiness prediction is generated from your actual performance data.')}
          actionLabel="Attend Assessment Hub"
          onAction={() => window.location.href = '/student/assessment'}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={cms('readiness.title', 'Placement Readiness Evaluation')}
        subtitle={cms('readiness.subtitle', 'Comprehensive diagnostic synthesis connecting your Aptitude, Technical assessment, and academic performance.')}
        actions={
          <Link to="/student/company-matching">
            <Button variant="primary" icon={ArrowRightIcon}>
              View Company Matching
            </Button>
          </Link>
        }
      />

      {/* Main Score Banner Card */}
      <div className="card" style={{ marginBottom: '24px', backgroundColor: '#FFFFFF' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '32px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderRight: '1px solid var(--color-border)', paddingRight: '24px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)' }}>
              Overall Assessment
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <span style={{ fontSize: '3.75rem', fontWeight: 800, color: 'var(--color-navy-950)', lineHeight: 1 }}>
                {data.readinessScore}%
              </span>
              <Badge status={data.classification}>
                {data.classification}
              </Badge>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Your profile satisfies the benchmark criteria for major campus placement drives with strong aptitude and technical foundations.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--color-navy-950)' }}>
              Domain Performance Scores
            </h3>
            <ProgressBar label="Academic Performance" value={data.academicScore} variant="primary" />
            <ProgressBar label="Aptitude Assessment" value={data.aptitudeScore} variant="primary" />
            <ProgressBar label="Technical Assessment" value={data.technicalScore} variant="primary" />
            <ProgressBar label="Programming Performance" value={data.programmingScore} variant="primary" />
            <ProgressBar label="Technical Skills" value={data.technicalSkillsScore} variant="primary" />
            <ProgressBar label="Communication" value={data.communicationScore} variant="primary" />
          </div>
        </div>
      </div>

      {/* Section: How Your Readiness Was Evaluated (Requirement 13) */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="section-title-bar">
          <div>
            <h3 className="section-heading-sm">How Your Readiness Was Evaluated</h3>
            <p className="form-hint">
              Multi-factor assessment inputs evaluated for predictive placement readiness classification
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            Evaluation Framework
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {(data.factors || []).map((f, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-subtle)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-navy-950)', fontSize: '0.875rem' }}>
                  {f.name}
                </span>
                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {f.score}%
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {f.description}
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '8px', fontSize: '0.6875rem', color: 'var(--color-text-muted)', borderTop: '1px dashed var(--color-border)' }}>
                Factor Weighting: <strong>{f.weight}</strong>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '16px', padding: '12px 16px', backgroundColor: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <strong>Analytical Notice:</strong> {data.evaluationNote}
        </div>
      </div>

      {/* Strengths & Areas to Improve Grid */}
      <div className="dashboard-grid-2">
        {/* Strengths Card */}
        <div className="card">
          <div className="section-title-bar">
            <div>
              <h3 className="section-heading-sm">Validated Strengths</h3>
              <p className="form-hint">Competencies where your profile exceeds standard placement cutoffs</p>
            </div>
            <div className="badge-highly-ready" style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
              Competitive Edge
            </div>
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px', padding: 0 }}>
            {(data.strengths || []).map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--status-highly-ready-bg)', color: 'var(--status-highly-ready-bar)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <CheckIcon width={14} height={14} />
                </div>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas to Improve Card */}
        <div className="card">
          <div className="section-title-bar">
            <div>
              <h3 className="section-heading-sm">Areas To Improve</h3>
              <p className="form-hint">Recommended focal points to elevate your overall readiness</p>
            </div>
            <div className="badge-needs-improvement" style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
              High Priority
            </div>
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px', padding: 0 }}>
            {(data.areasToImprove || []).map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--status-needs-imp-bg)', color: 'var(--status-needs-imp-bar)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <AlertTriangleIcon width={14} height={14} />
                </div>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)', lineHeight: 1.5 }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Real Readiness Score Trajectory Section */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="section-title-bar" style={{ marginBottom: '14px' }}>
          <div>
            <h3 className="section-heading-sm">{cms('readiness.trajectory_title', 'Readiness Score Trajectory')}</h3>
            <p className="form-hint">{cms('readiness.trajectory_subtitle', 'Chronological progression of your placement readiness evaluations')}</p>
          </div>
        </div>

        {history && history.length >= 2 ? (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(130px, 1fr))`, gap: '14px' }}>
            {history.map((h, i) => (
              <div key={i} style={{ padding: '14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-bg-subtle)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  Eval #{i + 1}
                </span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
                  {h.readinessScore}%
                </div>
                <div style={{ marginTop: '6px' }}>
                  <Badge status={h.classification}>{h.classification}</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem', fontStyle: 'italic', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' }}>
            {cms('readiness.trajectory_empty', 'Readiness trajectory will appear after sufficient assessment and academic data is available.')}
          </div>
        )}
      </div>

      {/* Readiness Classification Rubric */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h3 className="section-heading-sm" style={{ marginBottom: '16px' }}>
          {cms('readiness.rubric_title', 'Institutional Readiness Classification Rubric')}
        </h3>
        <div className="dashboard-grid-4">
          <div style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: data.classification === 'Highly Ready' ? 'var(--status-highly-ready-bg)' : '#FFFFFF' }}>
            <Badge status="Highly Ready">Highly Ready (&ge; 85%)</Badge>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              {cms('readiness.desc_highly_ready', 'Exceptional readiness across coding, aptitude, and high CGPA. Eligible for super-dream and product interviews.')}
            </p>
          </div>

          <div style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: data.classification === 'Ready' ? 'var(--status-ready-bg)' : '#FFFFFF' }}>
            <Badge status="Ready">Ready (70% - 84%)</Badge>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              {cms('readiness.desc_ready', 'Meets core corporate hiring cutoffs. Eligible for major IT services and technology solutions drives.')}
            </p>
          </div>

          <div style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: data.classification === 'Needs Improvement' ? 'var(--status-needs-imp-bg)' : '#FFFFFF' }}>
            <Badge status="Needs Improvement">Needs Improvement (55% - 69%)</Badge>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              {cms('readiness.desc_needs_improvement', 'Specific gaps detected in either aptitude speed or technical frameworks. Requires targeted practice modules.')}
            </p>
          </div>

          <div style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: data.classification === 'At Risk' ? 'var(--status-at-risk-bg)' : '#FFFFFF' }}>
            <Badge status="At Risk">At Risk (&lt; 55%)</Badge>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              {cms('readiness.desc_at_risk', 'High backlog risk or severe deficit in coding/quantitative benchmarks. Flagged for placement mentor support.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
