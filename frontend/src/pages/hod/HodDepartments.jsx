import React, { useEffect, useState } from 'react';
import { hodService } from '../../services/hodService';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';

export const HodDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await hodService.getDepartmentAnalytics();
      setDepartments(data || []);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState message="Loading department analytics from MySQL database..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Department Analytics"
        description={error}
        onRetry={load}
      />
    );
  }

  const columns = [
    {
      header: 'Department',
      accessor: 'department',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="table-cell-bold">{val}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '8px' }}>({row.code})</span>
        </div>
      )
    },
    {
      header: 'Student Count',
      accessor: 'studentCount',
      sortable: true,
      render: (val) => <strong>{val} Students</strong>
    },
    {
      header: 'Average CGPA',
      accessor: 'averageCgpa',
      sortable: true,
      render: (val) => <span>{val} / 10</span>
    },
    {
      header: 'Average Readiness',
      accessor: 'averageReadiness',
      sortable: true,
      render: (val) => (
        val != null ? (
          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            {val}%
          </span>
        ) : (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>Pending Assessment</span>
        )
      )
    },
    {
      header: 'At-Risk Count',
      accessor: 'atRiskCount',
      sortable: true,
      render: (val) => (
        <span style={{ fontWeight: 700, color: val > 0 ? 'var(--status-at-risk-bar)' : 'inherit' }}>
          {val} Candidates
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val, row) => (
        <Badge status={row.averageReadiness != null ? (row.averageReadiness >= 70 ? 'Ready' : 'Needs Improvement') : 'warning'}>
          {row.averageReadiness != null ? (row.averageReadiness >= 70 ? 'On Track' : 'Needs Focus') : 'Pending'}
        </Badge>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Departmental Placement Performance"
        subtitle="Cross-department comparative performance, academic benchmarks, and cohort sizes from MySQL."
      />

      {departments.length === 0 ? (
        <EmptyState
          title="No departments found."
          description="There are currently no departmental analytics records in the database."
        />
      ) : (
        <div className="card">
          <DataTable
            columns={columns}
            data={departments}
            searchPlaceholder="Search departments by name or code..."
            defaultPageSize={10}
          />
        </div>
      )}
    </div>
  );
};
