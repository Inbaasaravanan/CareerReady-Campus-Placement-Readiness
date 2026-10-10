import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { assessmentService } from '../../services/assessmentService';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState, EmptyState, ErrorState } from '../../components/common/StateViews';
import {
  CheckIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  TargetIcon,
  BriefcaseIcon
} from '../../components/common/Icons';

export const AssessmentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryType = searchParams.get('type') || 'aptitude';

  const [activeType, setActiveType] = useState(queryType);
  const [results, setResults] = useState(null);
  const [allStatus, setAllStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReview, setShowReview] = useState(false);

  const loadResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, statuses] = await Promise.all([
        assessmentService.getAssessmentResult(activeType),
        assessmentService.getAssessmentStatus()
      ]);
      setResults(res);
      setAllStatus(statuses);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryType && queryType !== activeType) {
      setActiveType(queryType);
    }
  }, [queryType]);

  useEffect(() => {
    loadResults();
  }, [activeType]);

  if (loading) return <LoadingState message="Loading assessment evaluation from MySQL database..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Assessment Result"
        description={error}
        onRetry={loadResults}
      />
    );
  }

  const isAptitude = activeType === 'aptitude';
  const otherType = isAptitude ? 'technical' : 'aptitude';
  const bothCompleted = allStatus?.aptitude?.status === 'Completed' && allStatus?.technical?.status === 'Completed';

  if (!results || results.status === 'Not Attempted') {
    return (
      <div>
        <PageHeader
          title={`${isAptitude ? 'Aptitude' : 'Technical'} Assessment Result`}
          subtitle="Performance evaluation benchmark recorded for predictive placement readiness analysis."
          actions={
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`btn btn-sm ${isAptitude ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveType('aptitude')}
              >
                Aptitude Score
              </button>
              <button
                type="button"
                className={`btn btn-sm ${!isAptitude ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveType('technical')}
              >
                Technical Score
              </button>
            </div>
          }
        />
        <EmptyState
          title="No assessment data available."
          description={`You have not submitted the ${isAptitude ? 'Aptitude' : 'Technical'} assessment yet.`}
          actionLabel={`Start ${isAptitude ? 'Aptitude' : 'Technical'} Assessment`}
          onAction={() => navigate(`/student/assessment/${isAptitude ? 'aptitude' : 'technical'}`)}
        />
      </div>
    );
  }

  const currentResult = results;

  return (
    <div>
      <PageHeader
        title={`${isAptitude ? 'Aptitude' : 'Technical'} Assessment Result`}
        subtitle="Performance evaluation benchmark recorded for predictive placement readiness analysis."
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className={`btn btn-sm ${isAptitude ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveType('aptitude')}
            >
              Aptitude Score
            </button>
            <button
              type="button"
              className={`btn btn-sm ${!isAptitude ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveType('technical')}
            >
              Technical Score
            </button>
          </div>
        }
      />

      {/* Main Banner Card */}
      <div className="result-banner-card">
        <div className="result-banner-grid">
          {/* Left: Prominent Score Display */}
          <div className="result-score-highlight">
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)' }}>
              Assessment Completed
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <span className="result-score-number">{currentResult.score} / {currentResult.totalQuestions || 20}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <span className="result-percentage-tag">{currentResult.percentage}% Score</span>
              <Badge status={currentResult.percentage >= 70 ? 'Ready' : 'Needs Improvement'}>
                {currentResult.performance || 'Completed'}
              </Badge>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
              Submitted at: {currentResult.completedAt ? new Date(currentResult.completedAt).toLocaleString() : 'Recently'}
            </p>
          </div>

          {/* Right: Summary Metrics Grid */}
          <div className="result-breakdown-stats">
            <div className="result-stat-cell">
              <span className="result-stat-val correct">{currentResult.correctCount}</span>
              <span className="result-stat-label">Correct Answers (+{currentResult.correctCount} Marks)</span>
            </div>
            <div className="result-stat-cell">
              <span className="result-stat-val incorrect">{currentResult.incorrectCount}</span>
              <span className="result-stat-label">Incorrect Answers (0 Marks)</span>
            </div>
            <div className="result-stat-cell">
              <span className="result-stat-val">{currentResult.totalQuestions || 20}</span>
              <span className="result-stat-label">Total Questions Evaluated</span>
            </div>
            <div className="result-stat-cell">
              <span className="result-stat-val accuracy">{currentResult.percentage}%</span>
              <span className="result-stat-label">Benchmark Accuracy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Pipeline Status Summary */}
      <div className="card" style={{ marginTop: '24px', marginBottom: '24px' }}>
        <div className="section-title-bar">
          <div>
            <h3 className="section-heading-sm">Dual Assessment Status</h3>
            <p className="form-hint">Both assessments feed the Random Forest Placement Readiness Model</p>
          </div>
        </div>

        <div className="dashboard-grid-2">
          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: isAptitude ? '#F8FAFC' : '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.9375rem' }}>1. Aptitude Assessment</strong>
              <Badge status={allStatus?.aptitude?.status === 'Completed' ? 'Ready' : 'Needs Improvement'}>
                {allStatus?.aptitude?.status || 'Pending'}
              </Badge>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Score: {allStatus?.aptitude?.score || 0} / 20 ({allStatus?.aptitude?.percentage || 0}%)
            </p>
          </div>

          <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: !isAptitude ? '#F8FAFC' : '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.9375rem' }}>2. Technical Assessment</strong>
              <Badge status={allStatus?.technical?.status === 'Completed' ? 'Ready' : 'Needs Improvement'}>
                {allStatus?.technical?.status || 'Pending'}
              </Badge>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Score: {allStatus?.technical?.score || 0} / 20 ({allStatus?.technical?.percentage || 0}%)
            </p>
          </div>
        </div>
      </div>

      {/* Next Step Connected Flow Card */}
      <div className="readiness-connected-flow-card">
        <div>
          <h3>
            {bothCompleted
              ? 'Both Assessments Completed • Random Forest Prediction Active'
              : 'Complete Remaining Assessment for Placement Readiness'}
          </h3>
          <p>
            {bothCompleted
              ? 'Your aptitude and technical assessment benchmarks are synthesized in MySQL and evaluated by the Random Forest classifier.'
              : `You have completed ${isAptitude ? 'Aptitude' : 'Technical'}. Complete the ${otherType === 'technical' ? 'Technical' : 'Aptitude'} test to update your readiness prediction.`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {!bothCompleted ? (
            <Link to={`/student/assessment/${otherType}`}>
              <Button variant="dark" icon={ArrowRightIcon}>
                Start {otherType === 'technical' ? 'Technical' : 'Aptitude'} Assessment
              </Button>
            </Link>
          ) : (
            <Link to="/student/readiness">
              <Button variant="dark" icon={TargetIcon}>
                View Placement Readiness Analysis
              </Button>
            </Link>
          )}
          <Link to="/student/company-matching">
            <Button variant="outline-hero" icon={BriefcaseIcon}>
              View Company Matching
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
