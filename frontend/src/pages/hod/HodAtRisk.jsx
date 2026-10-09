import React, { useEffect, useState } from 'react';
import { staffService } from '../../services/staffService';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';

export const HodAtRisk = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await staffService.getAtRiskStudents();
      setStudents(data || []);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState message="Loading at-risk candidates from MySQL database..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Load At-Risk Overview"
        description={error}
        onRetry={load}
      />
    );
  }

  const columns = [
    {
      header: 'Register Number',
      accessor: 'regNo',
      sortable: true,
      render: (val) => <span className="table-cell-mono">{val}</span>
    },
    {
      header: 'Student Name',
      accessor: 'name',
      sortable: true,
      render: (val) => <span className="table-cell-bold">{val}</span>
    },
    {
      header: 'Department',
      accessor: 'department',
      sortable: true,
      render: (val, row) => <span>{val || row.departmentName || 'Not Provided'}</span>
    },
    {
      header: 'Readiness Score',
      accessor: 'readinessScore',
      sortable: true,
      render: (val) => (
        val != null ? (
          <span style={{ fontWeight: 700, color: 'var(--status-at-risk-bar)' }}>
            {val}%
          </span>
        ) : (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>Pending</span>
        )
      )
    },
    {
      header: 'Deficit Area',
      accessor: 'skillGaps',
      render: (val) => {
        const first = Array.isArray(val) && val.length > 0 ? val[0] : 'General';
        return <span style={{ fontWeight: 600 }}>{first}</span>;
      }
    },
    {
      header: 'Status',
      accessor: 'classification',
      render: () => <Badge status="At Risk">At Risk</Badge>
    }
  ];

  return (
    <div>
      <PageHeader
        title="At-Risk Placement Candidates Summary"
        subtitle="Institution-wide surveillance of candidates flagged for urgent remedial mentoring."
      />

      {students.length === 0 ? (
        <EmptyState
          title="No at-risk students identified."
          description="All candidates in the database currently meet or exceed minimum placement readiness criteria."
        />
      ) : (
        <div className="card">
          <DataTable
            columns={columns}
            data={students}
            searchPlaceholder="Filter at-risk candidates..."
            defaultPageSize={10}
          />
        </div>
      )}
    </div>
  );
};
