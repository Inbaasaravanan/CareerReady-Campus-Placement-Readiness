import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import { assessmentService } from '../../services/assessmentService';
import { companyService } from '../../services/companyService';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { PageHeader } from '../../components/common/PageHeader';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';
import {
  TargetIcon,
  BriefcaseIcon,
  LayersIcon,
  BarChartIcon,
  ArrowRightIcon,
  CheckIcon,
  FileTextIcon
} from '../../components/common/Icons';
import { useCms } from '../../context/CmsContext';

export const StudentDashboard = () => {
  const { cms } = useCms();
  const [data, setData] = useState(null);
  const [assessmentStatus, setAssessmentStatus] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profile, assessments, companyList] = await Promise.all([
        studentService.getProfile(),
        assessmentService.getAssessmentStatus().catch(() => null),
        companyService.getCompanyMatches('All').catch(() => [])
      ]);
      setData(profile);
      setAssessmentStatus(assessments);
      setCompanies(companyList || []);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('assessment-updated', handleUpdate);
    return () => window.removeEventListener('assessment-updated', handleUpdate);
  }, []);

  if (loading) return <LoadingState message="Loading placement analytics from MySQL database..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Connect to Server"
        description={error}
        onRetry={loadData}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="No students found."
        description="Student profile record is not registered in the MySQL database."
      />
    );
  }

  const aptitude = assessmentStatus?.aptitude || { status: 'Not Attempted', percentage: 0, score: 0 };
  const technical = assessmentStatus?.technical || { status: 'Not Attempted', percentage: 0, score: 0 };
  const bothTestsCompleted = aptitude.status === 'Completed' && technical.status === 'Completed';

  return (
    <div>
      <PageHeader
        title={`${cms('student.dashboard.welcome_prefix', 'Welcome back')}, ${data.name}`}
        subtitle={`Reg No: ${data.regNo} • ${data.department} • ${data.year}`}
        actions={
          <Link to="/student/assessment">
            <Button variant="primary" icon={ArrowRightIcon}>
              Assessment Hub
            </Button>
          </Link>
        }
      />

      {/* Structured Journey Flow Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="section-title-bar" style={{ marginBottom: '14px' }}>
          <div>
            <h3 className="section-heading-sm">{cms('student.dashboard.journey_title', 'Placement Readiness Evaluation Journey')}</h3>
            <p className="form-hint">{cms('student.dashboard.journey_subtitle', 'End-to-end analytical workflow from assessment to recruiter alignment')}</p>
          </div>
        </div>

        <div className="student-journey-grid">
          {/* Step 1: Assessment Status */}
          <div style={{ padding: '16px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.04em' }}>
              {cms('student.dashboard.step1_title', 'Step 1 • Assessment Status')}
            </span>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-navy-950)' }}>
              Aptitude: {aptitude.status === 'Completed' ? `${aptitude.percentage}%` : 'Pending'}
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-navy-950)' }}>
              Technical: {technical.status === 'Completed' ? `${technical.percentage}%` : 'Pending'}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'auto' }}>
              Online MCQ Qualifier
            </span>
          </div>

          {/* Step 2: Readiness */}
          <div style={{ padding: '16px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.04em' }}>
              {cms('student.dashboard.step2_title', 'Step 2 • Placement Readiness')}
            </span>
            {bothTestsCompleted && data.readinessScore !== null ? (
              <>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {data.readinessScore}%
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Badge status={data.classification}>{data.classification}</Badge>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Pending Tests
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.3 }}>
                  {cms('student.dashboard.readiness_pending', 'Complete both tests to calculate')}
                </span>
              </>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'auto' }}>
              Multi-criteria Prediction
            </span>
          </div>

          {/* Step 3: Company Matches */}
          <div style={{ padding: '16px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.04em' }}>
              {cms('student.dashboard.step3_title', 'Step 3 • Company Matches')}
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-navy-950)' }}>
              {companies.length} Companies
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--status-highly-ready-bar)', fontWeight: 600 }}>
              {companies.filter(c => c.eligibilityStatus === 'Eligible').length} Eligible for Drives
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'auto' }}>
              Recruitment Alignment
            </span>
          </div>

          {/* Step 4: Skill Gaps */}
          <div style={{ padding: '16px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.04em' }}>
              {cms('student.dashboard.step4_title', 'Step 4 • Skill Gaps')}
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-navy-950)' }}>
              Targeted Gaps
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--status-needs-imp-bar)', fontWeight: 600 }}>
              Company-Specific Analysis
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'auto' }}>
              Recruiter Skill Benchmarks
            </span>
          </div>
        </div>
      </div>

      {/* Assessment Status Cards Section (Requirement 27) */}
      <div className="student-assessments-grid">
        {/* Aptitude Card */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Assessment Module 1
            </span>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '4px 0 2px 0', color: 'var(--color-navy-950)' }}>
              Aptitude Assessment
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <Badge status={aptitude.status === 'Completed' ? 'Ready' : 'Neutral'}>
                {aptitude.status}
              </Badge>
              {aptitude.status === 'Completed' && (
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-navy-900)' }}>
                  Score: {aptitude.percentage}% ({aptitude.score}/20)
                </span>
              )}
            </div>
          </div>

          <div>
            {aptitude.status === 'Completed' ? (
              <Link to="/student/assessment/result?type=aptitude">
                <Button variant="outline" size="sm">
                  View Result
                </Button>
              </Link>
            ) : (
              <Link to="/student/assessment/aptitude">
                <Button variant="primary" size="sm" icon={ArrowRightIcon}>
                  Start Assessment
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Technical Card */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Assessment Module 2
            </span>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '4px 0 2px 0', color: 'var(--color-navy-950)' }}>
              Technical Assessment
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <Badge status={technical.status === 'Completed' ? 'Ready' : 'Neutral'}>
                {technical.status}
              </Badge>
              {technical.status === 'Completed' && (
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-navy-900)' }}>
                  Score: {technical.percentage}% ({technical.score}/20)
                </span>
              )}
            </div>
          </div>

          <div>
            {technical.status === 'Completed' ? (
              <Link to="/student/assessment/result?type=technical">
                <Button variant="outline" size="sm">
                  View Result
                </Button>
              </Link>
            ) : (
              <Link to="/student/assessment/technical">
                <Button variant="primary" size="sm" icon={ArrowRightIcon}>
                  Start Assessment
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Metric Cards (5 Cards) */}
      <div className="dashboard-grid-5">
        <StatCard
          label="Readiness Score"
          value={bothTestsCompleted && data.readinessScore !== null ? `${data.readinessScore}%` : 'Pending'}
          subtext={bothTestsCompleted && data.readinessScore !== null ? `Status: ${data.classification}` : 'Complete both assessments'}
          icon={TargetIcon}
        />
        <StatCard
          label="Cumulative CGPA"
          value={data.cgpa !== null && data.cgpa !== undefined ? `${data.cgpa}` : '0.0'}
          subtext={`Backlogs: ${data.backlogs ?? 0}`}
          icon={BarChartIcon}
        />
        <StatCard
          label="Aptitude Score"
          value={aptitude.status === 'Completed' ? `${aptitude.percentage}%` : 'Not Attempted'}
          subtext={aptitude.status === 'Completed' ? `${aptitude.score}/20 Score` : 'Quantitative & Verbal'}
          icon={LayersIcon}
        />
        <StatCard
          label="Technical Score"
          value={technical.status === 'Completed' ? `${technical.percentage}%` : 'Not Attempted'}
          subtext={technical.status === 'Completed' ? `${technical.score}/20 Score` : 'Core CS & Stacks'}
          icon={BriefcaseIcon}
        />
        <StatCard
          label="Eligible Drives"
          value={String(companies.filter(c => c.eligibilityStatus === 'Eligible').length)}
          subtext={`Out of ${companies.length} Companies`}
          icon={CheckIcon}
        />
      </div>

      {/* Split Grid: Performance Domain Breakdown + Top Company Matches */}
      <div className="dashboard-grid-2">
        {/* Domain Competency Card */}
        <div className="card">
          <div className="section-title-bar">
            <div>
              <h3 className="section-heading-sm">Performance Overview</h3>
              <p className="form-hint">Multi-domain competency distribution</p>
            </div>
            {bothTestsCompleted && data.classification && (
              <Badge status={data.classification}>
                {data.classification}
              </Badge>
            )}
          </div>

          <div>
            <ProgressBar label="Academic Performance" value={data.academicScore || 0} variant="primary" />
            <ProgressBar label="Aptitude Assessment" value={aptitude.status === 'Completed' ? aptitude.percentage : 0} variant="primary" />
            <ProgressBar label="Technical Assessment" value={technical.status === 'Completed' ? technical.percentage : 0} variant="primary" />
            <ProgressBar label="Programming Skills" value={data.programmingScore || 0} variant="primary" />
            <ProgressBar label="Communication" value={data.communicationScore || 0} variant="primary" />
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Evaluated against 2026-27 Tier-1 Campus Benchmarks
            </span>
            <Link to="/student/readiness" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              View Readiness Analysis &rarr;
            </Link>
          </div>
        </div>

        {/* Company Matches Card with Company-Specific Skill Gaps Preview */}
        <div className="card">
          <div className="section-title-bar">
            <div>
              <h3 className="section-heading-sm">Company Compatibility Preview</h3>
              <p className="form-hint">Company-specific skill gaps and match percentages</p>
            </div>
            <Link to="/student/company-matching" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              View All Companies &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {companies.slice(0, 3).map((comp) => (
              <div
                key={comp.id}
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--color-bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ color: 'var(--color-navy-950)', fontSize: '0.9375rem' }}>{comp.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>{comp.industry}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                      {comp.matchPercentage}%
                    </span>
                    <Badge status={comp.eligibilityStatus}>{comp.eligibilityStatus}</Badge>
                  </div>
                </div>

                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                    Skill Gaps:
                  </span>
                  {comp.skillGaps.map((gap, gIdx) => (
                    <span key={gIdx} className="skill-gap-box" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                      {gap}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
