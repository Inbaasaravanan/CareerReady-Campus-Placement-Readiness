import React, { useEffect, useState } from 'react';
import { hodService } from '../../services/hodService';
import { PageHeader } from '../../components/common/PageHeader';
import { ProgressBar } from '../../components/common/ProgressBar';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';

export const HodAnalytics = () => {
  const [data, setData] = useState(null);
  const [atRiskData, setAtRiskData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [metrics, atRisk, companyList] = await Promise.all([
        hodService.getDashboardMetrics(),
        hodService.getAtRiskOverview().catch(() => null),
        hodService.getCompanyAnalytics().catch(() => [])
      ]);
      setData(metrics);
      setAtRiskData(atRisk);
      setCompanies(companyList || []);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState message="Loading institutional placement analytics from MySQL database..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Placement Analytics"
        description={error}
        onRetry={load}
      />
    );
  }

  const total = data?.totalStudents || 0;
  const highlyReadyPct = total > 0 ? ((data.highlyReadyCount / total) * 100).toFixed(1) : 0;
  const readyPct = total > 0 ? ((data.readyCount / total) * 100).toFixed(1) : 0;
  const needsImpPct = total > 0 ? ((data.needsImprovementCount / total) * 100).toFixed(1) : 0;
  const atRiskPct = total > 0 ? ((data.atRiskCount / total) * 100).toFixed(1) : 0;

  return (
    <div>
      <PageHeader
        title="Institutional Placement Analytics"
        subtitle={`Holistic statistical aggregates, cross-department trends, and readiness distributions for ${total} candidates.`}
      />

      {/* Grid: Readiness Distribution & Department Breakdown */}
      <div className="dashboard-grid-2">
        {/* Readiness Distribution Card */}
        <div className="card">
          <div className="section-title-bar">
            <div>
              <h3 className="section-heading-sm">Readiness Tier Distribution</h3>
              <p className="form-hint">Overall institutional cohort proportions from MySQL records</p>
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)' }}>
              Avg: {data?.averageReadinessScore != null ? `${data.averageReadinessScore}%` : 'Pending'}
            </span>
          </div>

          <div>
            <ProgressBar label={`Highly Ready (Score ≥ 85%): ${data?.highlyReadyCount || 0}`} value={Number(highlyReadyPct)} variant="success" />
            <ProgressBar label={`Ready (Score 70% - 84%): ${data?.readyCount || 0}`} value={Number(readyPct)} variant="primary" />
            <ProgressBar label={`Needs Improvement (Score 55% - 69%): ${data?.needsImprovementCount || 0}`} value={Number(needsImpPct)} variant="warning" />
            <ProgressBar label={`At Risk (Score < 55%): ${data?.atRiskCount || 0}`} value={Number(atRiskPct)} variant="danger" />
          </div>
        </div>

        {/* At-Risk Statistics Card */}
        <div className="card">
          <div className="section-title-bar">
            <div>
              <h3 className="section-heading-sm">At-Risk Student Distribution</h3>
              <p className="form-hint">Identification breakdown from Random Forest prediction</p>
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--status-at-risk-bar)' }}>
              {data?.atRiskCount || 0} Students Flagged
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {atRiskData && atRiskData.departmentWiseAtRisk && Object.keys(atRiskData.departmentWiseAtRisk).length > 0 ? (
              Object.entries(atRiskData.departmentWiseAtRisk).map(([dept, count], idx) => (
                <div key={idx} style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                    <span>{dept} Department</span>
                    <span>{count} Students ({data?.atRiskCount > 0 ? ((count / data.atRiskCount) * 100).toFixed(1) : 0}%)</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Requires targeted remedial mentoring and assessment qualifiers
                  </p>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                {data?.atRiskCount === 0 ? 'No students currently flagged as At-Risk in the database.' : 'Department breakdown loading...'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Company Matching Statistics Grid */}
      <div className="card" style={{ marginTop: '24px' }}>
        <h3 className="section-heading-sm" style={{ marginBottom: '16px' }}>
          Drive Matching & Company Eligibility Overview
        </h3>
        {companies.length > 0 ? (
          <div className="dashboard-grid-4">
            {companies.slice(0, 4).map((c, idx) => {
              const eligible = c.eligibleStudents || c.eligibleStudentsCount || 0;
              const coveragePct = total > 0 ? ((eligible / total) * 100).toFixed(1) : 0;
              return (
                <div key={idx} style={{ padding: '16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <span className="form-hint">{c.companyName || c.name} Drive</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
                    {eligible} / {total}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {coveragePct}% Candidate Coverage
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No company matching metrics available in the database yet.
          </div>
        )}
      </div>
    </div>
  );
};
