import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { assessmentService } from '../../services/assessmentService';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState, ErrorState } from '../../components/common/StateViews';
import {
  FileTextIcon,
  CheckIcon,
  ArrowRightIcon,
  TargetIcon,
  LayersIcon,
  BriefcaseIcon
} from '../../components/common/Icons';
import { useCms } from '../../context/CmsContext';

export const StudentAssessment = () => {
  const { cms } = useCms();
  const navigate = useNavigate();
  const [assessmentStatus, setAssessmentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assessmentService.getAssessmentStatus();
      setAssessmentStatus(data);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const handleUpdate = () => loadStatus();
    window.addEventListener('assessment-updated', handleUpdate);
    return () => window.removeEventListener('assessment-updated', handleUpdate);
  }, []);

  if (loading) return <LoadingState message="Loading assessment portal..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Assessment Status"
        description={error}
        onRetry={loadStatus}
      />
    );
  }

  const aptitude = assessmentStatus?.aptitude || { status: 'Not Attempted', score: 0, totalQuestions: 20, percentage: 0 };
  const technical = assessmentStatus?.technical || { status: 'Not Attempted', score: 0, totalQuestions: 20, percentage: 0 };

  const bothCompleted = aptitude.status === 'Completed' && technical.status === 'Completed';

  return (
    <div>
      <PageHeader
        title={cms('assessment.hub.title', 'Placement Screening Assessments')}
        subtitle={cms('assessment.hub.subtitle', 'Standardized MCQ-based assessments evaluating quantitative aptitude, logical reasoning, and core technical proficiencies.')}
      />

      {/* Prominent Completion Status Callout if both completed */}
      {bothCompleted && (
        <div
          style={{
            backgroundColor: 'var(--status-highly-ready-bg)',
            border: '1px solid var(--status-highly-ready-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-highly-ready-bar)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <CheckIcon width={20} height={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--status-highly-ready-text)', fontSize: '0.9375rem' }}>
                All Diagnostic Assessments Successfully Completed
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--status-highly-ready-text)', marginTop: '2px' }}>
                Aptitude Score: {aptitude.score}/20 ({aptitude.percentage}%) &bull; Technical Score: {technical.score}/20 ({technical.percentage}%) &bull; Readiness Score Generated
              </div>
            </div>
          </div>

          <Link to="/student/readiness">
            <Button variant="primary" size="sm" icon={TargetIcon}>
              View Placement Readiness Score
            </Button>
          </Link>
        </div>
      )}

      {/* Assessment Hub Cards Grid (Requirement 1) */}
      <div className="assessment-hub-grid">
        {/* 1. Aptitude Assessment Card */}
        <div className="assessment-card">
          <div>
            <div className="assessment-card-header">
              <div>
                <span className="assessment-card-category">Assessment 1</span>
                <h2 className="assessment-card-title">{cms('assessment.aptitude.title', 'APTITUDE ASSESSMENT')}</h2>
              </div>
              <Badge status={aptitude.status === 'Completed' ? 'Ready' : 'Neutral'}>
                {aptitude.status}
              </Badge>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {cms('assessment.aptitude.desc', 'Evaluates quantitative speed, percentages, profit and loss, time and work, logical sequences, coding-decoding, and verbal reasoning skills.')}
            </p>

            <div className="assessment-meta-list">
              <div className="assessment-meta-item">
                <span className="assessment-meta-label">Questions</span>
                <span className="assessment-meta-value">20</span>
              </div>
              <div className="assessment-meta-item">
                <span className="assessment-meta-label">Duration</span>
                <span className="assessment-meta-value">20 Minutes</span>
              </div>
              <div className="assessment-meta-item">
                <span className="assessment-meta-label">Type</span>
                <span className="assessment-meta-value">Multiple Choice Questions</span>
              </div>
              <div className="assessment-meta-item">
                <span className="assessment-meta-label">Status</span>
                <span className="assessment-meta-value">
                  {aptitude.status === 'Completed'
                    ? `${aptitude.score} / 20 (${aptitude.percentage}%)`
                    : 'Not Attempted'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            {aptitude.status === 'Completed' ? (
              <>
                <Link to="/student/assessment/result?type=aptitude" style={{ flex: 1 }}>
                  <Button variant="outline" style={{ width: '100%' }}>
                    View Result
                  </Button>
                </Link>
                <Link to="/student/assessment/aptitude" style={{ flex: 1 }}>
                  <Button variant="primary" style={{ width: '100%' }}>
                    Retake Assessment
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/student/assessment/aptitude" style={{ width: '100%' }}>
                <Button variant="primary" style={{ width: '100%' }} icon={ArrowRightIcon}>
                  Start Assessment
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* 2. Technical Assessment Card */}
        <div className="assessment-card">
          <div>
            <div className="assessment-card-header">
              <div>
                <span className="assessment-card-category">Assessment 2</span>
                <h2 className="assessment-card-title">{cms('assessment.technical.title', 'TECHNICAL ASSESSMENT')}</h2>
              </div>
              <Badge status={technical.status === 'Completed' ? 'Ready' : 'Neutral'}>
                {technical.status}
              </Badge>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {cms('assessment.technical.desc', 'Evaluates core software engineering knowledge including Java, Python, SQL, DBMS, Data Structures, OOP, Web Basics, Spring Boot, OS, and Networks.')}
            </p>

            <div className="assessment-meta-list">
              <div className="assessment-meta-item">
                <span className="assessment-meta-label">Questions</span>
                <span className="assessment-meta-value">20</span>
              </div>
              <div className="assessment-meta-item">
                <span className="assessment-meta-label">Duration</span>
                <span className="assessment-meta-value">20 Minutes</span>
              </div>
              <div className="assessment-meta-item">
                <span className="assessment-meta-label">Type</span>
                <span className="assessment-meta-value">Multiple Choice Questions</span>
              </div>
              <div className="assessment-meta-item">
                <span className="assessment-meta-label">Status</span>
                <span className="assessment-meta-value">
                  {technical.status === 'Completed'
                    ? `${technical.score} / 20 (${technical.percentage}%)`
                    : 'Not Attempted'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            {technical.status === 'Completed' ? (
              <>
                <Link to="/student/assessment/result?type=technical" style={{ flex: 1 }}>
                  <Button variant="outline" style={{ width: '100%' }}>
                    View Result
                  </Button>
                </Link>
                <Link to="/student/assessment/technical" style={{ flex: 1 }}>
                  <Button variant="primary" style={{ width: '100%' }}>
                    Retake Assessment
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/student/assessment/technical" style={{ width: '100%' }}>
                <Button variant="primary" style={{ width: '100%' }} icon={ArrowRightIcon}>
                  Start Assessment
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Online Assessment Rules & Workflow Explanation */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h3 className="section-heading-sm" style={{ marginBottom: '12px' }}>
          Assessment Rules &amp; Evaluation Workflow
        </h3>

        <div className="dashboard-grid-3">
          <div style={{ padding: '16px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: 600, color: 'var(--color-navy-900)', fontSize: '0.875rem', marginBottom: '4px' }}>
              Timed Environment
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Each section has a strict 20-minute countdown timer. When the timer expires, your selections are automatically submitted.
            </p>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: 600, color: 'var(--color-navy-900)', fontSize: '0.875rem', marginBottom: '4px' }}>
              Single Selection
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Only one option can be chosen per question. You can change your selection or use the question palette to jump between questions.
            </p>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: 600, color: 'var(--color-navy-900)', fontSize: '0.875rem', marginBottom: '4px' }}>
              Readiness Integration
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Assessment scores directly feed into the Placement Readiness Engine to calculate your company compatibility and skill gaps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
