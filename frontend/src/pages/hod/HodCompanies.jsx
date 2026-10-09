import React, { useEffect, useState } from 'react';
import { hodService } from '../../services/hodService';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';

export const HodCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, metrics] = await Promise.all([
        hodService.getCompanyAnalytics(),
        hodService.getDashboardMetrics()
      ]);
      setCompanies(data || []);
      setTotalStudents(metrics?.totalStudents || 0);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState message="Loading company analytics from MySQL database..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Recruiter Analytics"
        description={error}
        onRetry={load}
      />
    );
  }

  const columns = [
    {
      header: 'Company Name',
      accessor: 'companyName',
      sortable: true,
      render: (val, row) => <span className="table-cell-bold">{val || row.name}</span>
    },
    {
      header: 'Partner ID',
      accessor: 'companyId',
      sortable: true,
      render: (val) => <span>#{val}</span>
    },
    {
      header: 'Average Match',
      accessor: 'averageMatchPercentage',
      sortable: true,
      render: (val, row) => <strong>{val || row.matchPercentage || 0}%</strong>
    },
    {
      header: 'Qualified Candidates',
      accessor: 'eligibleStudents',
      sortable: true,
      render: (val, row) => {
        const count = val || row.eligibleStudentsCount || 0;
        const pct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
        return (
          <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
            {count} / {totalStudents} ({pct}%)
          </span>
        );
      }
    },
    {
      header: 'Top Matched Skills',
      accessor: 'topMatchedSkills',
      render: (val) => Array.isArray(val) ? val.slice(0, 3).join(', ') : 'General'
    }
  ];

  return (
    <div>
      <PageHeader
        title="Recruiting Companies & Drive Analytics"
        subtitle={`Recruiter pipeline, qualification benchmarks, and candidate pools across ${companies.length} corporate recruitment drives.`}
      />

      {companies.length === 0 ? (
        <EmptyState
          title="No company matches available."
          description="There are currently no partner companies configured in the database."
        />
      ) : (
        <div className="card">
          <DataTable
            columns={columns}
            data={companies}
            searchPlaceholder="Search recruiters, criteria, or status..."
            defaultPageSize={10}
          />
        </div>
      )}
    </div>
  );
};
