import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { hodService } from '../../services/hodService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';
import {
  UsersIcon,
  TargetIcon,
  AlertTriangleIcon,
  BarChartIcon,
  BuildingIcon,
  BriefcaseIcon
} from '../../components/common/Icons';

export const HodDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, d] = await Promise.all([
        hodService.getDashboardMetrics(),
        hodService.getDepartmentAnalytics()
      ]);
      setMetrics(m);
      setDepartments(d || []);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState message="Loading HOD executive metrics from MySQL database..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Executive Intelligence"
        description={error}
        onRetry={load}
      />
    );
  }

  const total = metrics?.totalStudents || 0;
  const highlyReadyPct = total > 0 ? ((metrics.highlyReadyCount / total) * 100).toFixed(1) : 0;
  const readyPct = total > 0 ? ((metrics.readyCount / total) * 100).toFixed(1) : 0;
  const needsImpPct = total > 0 ? ((metrics.needsImprovementCount / total) * 100).toFixed(1) : 0;
  const atRiskPct = total > 0 ? ((metrics.atRiskCount / total) * 100).toFixed(1) : 0;

  return (
    <div>
      <PageHeader
        title="Placement HOD Executive Intelligence"
        subtitle="Institution-wide placement readiness analytics, cross-department benchmarking, and staff oversight."
        actions={
          <Link to="/hod/analytics">
            <Button variant="primary" icon={BarChartIcon}>
              View Analytics Report
            </Button>
          </Link>
        }
      />

      {/* 6 Metric Cards Grid */}
      <div className="dashboard-grid-3">
        <StatCard label="Total Candidates" value={total} subtext="Assessed in MySQL" icon={UsersIcon} />
        <StatCard label="Average Readiness" value={`${metrics?.averageReadinessScore || 0}%`} subtext="Institution-wide Benchmark" icon={BarChartIcon} />
        <StatCard label="Highly Ready" value={metrics?.highlyReadyCount || 0} subtext={`${highlyReadyPct}% Tier-1 Qualified`} icon={TargetIcon} />
        <StatCard label="Ready" value={metrics?.readyCount || 0} subtext={`${readyPct}% Standard Cutoffs`} icon={TargetIcon} />
        <StatCard label="Needs Improvement" value={metrics?.needsImprovementCount || 0} subtext={`${needsImpPct}% Needs Mentoring`} icon={AlertTriangleIcon} />
        <StatCard label="At Risk" value={metrics?.atRiskCount || 0} subtext={`${atRiskPct}% Flagged for Remediation`} icon={AlertTriangleIcon} />
      </div>

      {/* Department Breakdown Overview Table */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="section-title-bar">
          <div>
            <h3 className="section-heading-sm">Department Performance Benchmark</h3>
            <p className="form-hint">Comparative candidate cohort volumes and average readiness from database</p>
          </div>
          <Link to="/hod/departments" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
            Full Department Details &rarr;
          </Link>
        </div>

        {departments.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No department records available in MySQL.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Candidates</th>
                  <th>Avg Readiness</th>
                  <th>At-Risk Count</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, idx) => (
                  <tr key={idx}>
                    <td className="table-cell-bold">{dept.name || dept.department || dept.departmentName || 'Department'} ({dept.code || '—'})</td>
                    <td><strong>{dept.studentsCount ?? dept.studentCount ?? 0}</strong></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700 }}>
                          {dept.averageReadiness != null ? `${dept.averageReadiness}%` : 'Pending'}
                        </span>
                        {dept.averageReadiness != null && (
                          <div style={{ width: '80px' }}>
                            <ProgressBar value={dept.averageReadiness} variant={dept.averageReadiness >= 75 ? 'ready' : 'needsImprovement'} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: dept.atRiskCount > 0 ? 'var(--status-at-risk-bar)' : 'inherit' }}>
                        {dept.atRiskCount}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${dept.averageReadiness >= 75 ? 'badge-ready' : 'badge-needs-improvement'}`}>
                        {dept.averageReadiness >= 75 ? 'Strong Pool' : 'Needs Focus'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
