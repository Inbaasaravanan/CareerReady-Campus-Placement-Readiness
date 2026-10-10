import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { staffService } from '../../services/staffService';
import { hodService } from '../../services/hodService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';
import {
  UsersIcon,
  TargetIcon,
  AlertTriangleIcon,
  BriefcaseIcon,
  LayersIcon,
  CheckIcon
} from '../../components/common/Icons';

export const StaffDashboard = () => {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [myStudents, setMyStudents] = useState([]);
  const [departmentMetrics, setDepartmentMetrics] = useState([]);
  const [commonSkillGaps, setCommonSkillGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashStats, studentList, myMentees, deptMetrics, skillGaps] = await Promise.all([
        staffService.getDashboardStats(),
        staffService.getStudents(),
        staffService.getMyStudents().catch(() => []),
        hodService.getDepartmentAnalytics().catch(() => []),
        staffService.getSkillGapsAnalytics().catch(() => [])
      ]);
      setStats(dashStats);
      setStudents(studentList);
      setMyStudents(myMentees || []);
      setDepartmentMetrics(deptMetrics || []);
      setCommonSkillGaps(skillGaps || []);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState message="Loading placement analytics from MySQL database..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Staff Analytics"
        description={error}
        onRetry={load}
      />
    );
  }

  const totalStudents = stats?.totalStudents || 0;
  const completedAssessments = stats?.assessmentsCompleted || 0;
  const completionPercentage = totalStudents > 0 ? Math.round((completedAssessments / totalStudents) * 100) : 0;
  const avgAptitude = stats?.averageAptitudeScore || 0;
  const avgTechnical = stats?.averageTechnicalScore || 0;
  const avgReadiness = stats?.averageReadinessScore || 0;
  const atRiskCount = stats?.atRisk || 0;

  return (
    <div>
      <PageHeader
        title="Placement Staff Assessment & Readiness Dashboard"
        subtitle="Cohort surveillance, assessment monitoring, and predictive readiness diagnostics from MySQL database."
        actions={
          <Link to="/staff/at-risk">
            <Button variant="danger" icon={AlertTriangleIcon}>
              View At-Risk Students ({atRiskCount})
            </Button>
          </Link>
        }
      />

      {/* Core Monitoring Stats Grid */}
      <div className="dashboard-grid-6">
        <StatCard
          label="Total Students"
          value={totalStudents}
          subtext="Registered in MySQL"
          icon={UsersIcon}
        />
        <StatCard
          label="Assessments Completed"
          value={completedAssessments}
          subtext={`${completionPercentage}% Attempt Rate`}
          icon={CheckIcon}
        />
        <StatCard
          label="Avg Aptitude Score"
          value={`${avgAptitude}%`}
          subtext="Quant & Verbal"
          icon={LayersIcon}
        />
        <StatCard
          label="Avg Technical Score"
          value={`${avgTechnical}%`}
          subtext="Core CS & Stacks"
          icon={BriefcaseIcon}
        />
        <StatCard
          label="Avg Readiness Score"
          value={`${avgReadiness}%`}
          subtext="Random Forest Model"
          icon={TargetIcon}
        />
        <StatCard
          label="At-Risk Students"
          value={atRiskCount}
          subtext={totalStudents > 0 ? `${((atRiskCount / totalStudents) * 100).toFixed(1)}% Flagged` : '0%'}
          icon={AlertTriangleIcon}
        />
      </div>

      {/* My Assigned Students Section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="section-title-bar">
          <div>
            <h3 className="section-heading-sm">My Assigned Students (Mentees)</h3>
            <p className="form-hint">Candidates paired with you for direct placement coaching and performance surveillance</p>
          </div>
          <Link to="/staff/students" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
            View Full List ({myStudents.length}) &rarr;
          </Link>
        </div>

        {myStudents.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No students have been assigned to you yet.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Register Number</th>
                  <th>Student Name</th>
                  <th>Department</th>
                  <th>Aptitude</th>
                  <th>Technical</th>
                  <th>Readiness Score</th>
                  <th>Classification</th>
                </tr>
              </thead>
              <tbody>
                {myStudents.slice(0, 5).map((s, idx) => (
                  <tr key={idx}>
                    <td className="table-cell-mono" style={{ fontWeight: 600 }}>{s.registerNumber || s.regNo || 'Not Provided'}</td>
                    <td className="table-cell-bold">{s.studentName || s.name}</td>
                    <td>{s.department || s.departmentName || 'Not Provided'}</td>
                    <td><strong>{s.aptitudeScore != null ? `${s.aptitudeScore}%` : 'Pending'}</strong></td>
                    <td><strong>{s.technicalScore != null ? `${s.technicalScore}%` : 'Pending'}</strong></td>
                    <td>
                      {s.readinessScore != null ? (
                        <span style={{ fontWeight: 700, color: Number(s.readinessScore) >= 70 ? 'var(--color-primary)' : 'var(--status-at-risk-bar)' }}>
                          {s.readinessScore}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>Pending</span>
                      )}
                    </td>
                    <td>
                      <Badge variant={s.readinessScore != null && Number(s.readinessScore) >= 70 ? 'success' : s.readinessScore != null && Number(s.readinessScore) >= 55 ? 'warning' : 'danger'}>
                        {s.classificationDisplay || s.classification || 'Evaluating'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Overview Grid: Assessment Completion & Readiness Distribution */}
      <div className="dashboard-grid-2" style={{ marginBottom: '24px' }}>
        {/* Readiness Distribution Card */}
        <div className="card">
          <div className="section-title-bar">
            <div>
              <h3 className="section-heading-sm">Cohort Readiness Distribution</h3>
              <p className="form-hint">Classification breakdown across {totalStudents} evaluated candidates</p>
            </div>
            <Link to="/staff/readiness" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              Deep Analytics &rarr;
            </Link>
          </div>

          {totalStudents > 0 ? (
            <>
              <div style={{ display: 'flex', height: '14px', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{ width: `${(stats.highlyReady / totalStudents) * 100}%`, backgroundColor: 'var(--status-highly-ready-bar)' }} title="Highly Ready" />
                <div style={{ width: `${(stats.ready / totalStudents) * 100}%`, backgroundColor: 'var(--status-ready-bar)' }} title="Ready" />
                <div style={{ width: `${(stats.needsImprovement / totalStudents) * 100}%`, backgroundColor: 'var(--status-needs-imp-bar)' }} title="Needs Improvement" />
                <div style={{ width: `${(stats.atRisk / totalStudents) * 100}%`, backgroundColor: 'var(--status-at-risk-bar)' }} title="At Risk" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '0.8125rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--status-highly-ready-bar)' }} />
                  <span>Highly Ready (85%+): <strong>{stats.highlyReady}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--status-ready-bar)' }} />
                  <span>Ready (70-84%): <strong>{stats.ready}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--status-needs-imp-bar)' }} />
                  <span>Needs Improvement (55-69%): <strong>{stats.needsImprovement}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--status-at-risk-bar)' }} />
                  <span>At Risk (&lt;55%): <strong>{stats.atRisk}</strong></span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No readiness prediction records available in the database yet.
            </div>
          )}
        </div>

        {/* Most Critical Skill Gaps */}
        <div className="card">
          <div className="section-title-bar">
            <div>
              <h3 className="section-heading-sm">Most Common Skill Deficits</h3>
              <p className="form-hint">Skill gaps identified dynamically from database evaluation</p>
            </div>
            <Link to="/staff/skill-gaps" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
              Full Gap Roster &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {commonSkillGaps.length > 0 ? (
              commonSkillGaps.slice(0, 5).map((gap, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 600 }}>{gap.skillName || gap.skill}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--status-at-risk-bar)', fontWeight: 700 }}>
                      {gap.studentCount} Students
                    </span>
                    <Badge variant="warning">
                      {totalStudents > 0 ? `${((gap.studentCount / totalStudents) * 100).toFixed(1)}%` : '0%'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No skill gaps identified across current candidates.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="section-title-bar">
          <div>
            <h3 className="section-heading-sm">Departmental Placement Readiness Performance</h3>
            <p className="form-hint">Live academic department metrics from MySQL</p>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Code</th>
                <th>Enrolled Candidates</th>
                <th>Average CGPA</th>
                <th>Avg Readiness Score</th>
                <th>At-Risk Count</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {departmentMetrics.length > 0 ? (
                departmentMetrics.map((dept, idx) => (
                  <tr key={idx}>
                    <td className="table-cell-bold">{dept.name}</td>
                    <td><Badge variant="outline">{dept.code}</Badge></td>
                    <td><strong>{dept.studentsCount} Students</strong></td>
                    <td>{dept.averageCGPA} / 10</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700 }}>{dept.averageReadiness}%</span>
                        <div style={{ width: '80px' }}>
                          <ProgressBar value={dept.averageReadiness} variant={dept.averageReadiness >= 75 ? 'ready' : 'needsImprovement'} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: dept.atRiskCount > 0 ? 'var(--status-at-risk-bar)' : 'inherit' }}>
                        {dept.atRiskCount} Flagged
                      </span>
                    </td>
                    <td>
                      <Badge status={dept.averageReadiness >= 75 ? 'Ready' : 'Needs Improvement'}>
                        {dept.averageReadiness >= 75 ? 'On Track' : 'Needs Focus'}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)' }}>
                    No department data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
