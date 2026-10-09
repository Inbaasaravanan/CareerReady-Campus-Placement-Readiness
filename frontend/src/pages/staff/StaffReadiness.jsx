import React, { useEffect, useState } from 'react';
import { staffService } from '../../services/staffService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { ProgressBar } from '../../components/common/ProgressBar';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';
import { TargetIcon, BarChartIcon } from '../../components/common/Icons';

export const StaffReadiness = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await staffService.getDashboardStats();
      setStats(res);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState message="Loading cohort readiness analytics from MySQL database..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Readiness Analytics"
        description={error}
        onRetry={load}
      />
    );
  }

  const total = stats?.totalStudents || 0;
  const avgReadiness = stats?.averageReadinessScore || 0;
  const qualifiedCount = (stats?.highlyReady || 0) + (stats?.ready || 0);
  const belowBenchmarkCount = (stats?.needsImprovement || 0) + (stats?.atRisk || 0);

  return (
    <div>
      <PageHeader
        title="Cohort Readiness Analytics"
        subtitle="Departmental thresholds, category segmentations, and distribution curves evaluated in MySQL."
      />

      <div className="dashboard-grid-4">
        <StatCard label="Total Candidates" value={total} icon={TargetIcon} />
        <StatCard label="Institutional Readiness" value={`${avgReadiness}%`} subtext="Cohort Average" icon={BarChartIcon} />
        <StatCard label="Qualified for Drives" value={qualifiedCount} subtext="Highly Ready + Ready" icon={TargetIcon} />
        <StatCard label="Below Benchmark" value={belowBenchmarkCount} subtext="Requires Remediation" icon={TargetIcon} />
      </div>

      <div className="card">
        <h3 className="section-heading-sm" style={{ marginBottom: '16px' }}>Cohort Tier Distributions</h3>
        {total > 0 ? (
          <>
            <ProgressBar
              label={`Highly Ready (${stats.highlyReady} Candidates - ≥ 85%)`}
              value={Math.round((stats.highlyReady / total) * 100)}
              variant="success"
            />
            <ProgressBar
              label={`Ready (${stats.ready} Candidates - 70% to 84%)`}
              value={Math.round((stats.ready / total) * 100)}
              variant="primary"
            />
            <ProgressBar
              label={`Needs Improvement (${stats.needsImprovement} Candidates - 55% to 69%)`}
              value={Math.round((stats.needsImprovement / total) * 100)}
              variant="warning"
            />
            <ProgressBar
              label={`At Risk (${stats.atRisk} Candidates - < 55%)`}
              value={Math.round((stats.atRisk / total) * 100)}
              variant="danger"
            />
          </>
        ) : (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No candidate evaluation records currently present in the database.
          </div>
        )}
      </div>
    </div>
  );
};
