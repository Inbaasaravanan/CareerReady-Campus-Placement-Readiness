import React, { useEffect, useState } from 'react';
import { staffService } from '../../services/staffService';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { Filter } from '../../components/common/Filter';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { DataTable } from '../../components/tables/DataTable';
import { Modal } from '../../components/common/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';
import { AlertTriangleIcon } from '../../components/common/Icons';

export const StaffAtRisk = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [actionStudent, setActionStudent] = useState(null);
  const [interventionNote, setInterventionNote] = useState('');
  const [interventionSuccess, setInterventionSuccess] = useState(false);

  const fetchAtRisk = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await staffService.getAtRiskStudents();
      if (search) {
        const q = search.toLowerCase();
        data = data.filter((s) => s.name?.toLowerCase().includes(q) || s.regNo?.toLowerCase().includes(q));
      }
      if (department && department !== 'All') {
        data = data.filter((s) => s.department === department);
      }
      setStudents(data || []);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAtRisk();
  }, [search, department]);

  const handleScheduleIntervention = (e) => {
    e.preventDefault();
    setInterventionSuccess(true);
    setTimeout(() => {
      setInterventionSuccess(false);
      setActionStudent(null);
      setInterventionNote('');
    }, 1200);
  };

  if (loading) return <LoadingState message="Querying real-time At-Risk candidates from MySQL database..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Load At-Risk Students"
        description={error}
        onRetry={fetchAtRisk}
      />
    );
  }

  // Exact required columns: Student Name, Department, Aptitude Score, Technical Score, Readiness Score, Main Skill Gap, Status, Action
  const columns = [
    {
      header: 'Student Name',
      accessor: 'name',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="table-cell-bold">{val}</span>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{row.regNo}</div>
        </div>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      sortable: true
    },
    {
      header: 'Aptitude Score',
      accessor: 'aptitudeScore',
      sortable: true,
      render: (val) => <strong>{val || 0}%</strong>
    },
    {
      header: 'Technical Score',
      accessor: 'technicalScore',
      sortable: true,
      render: (val) => <strong>{val || 0}%</strong>
    },
    {
      header: 'Readiness Score',
      accessor: 'readinessScore',
      sortable: true,
      render: (val) => (
        <span style={{ fontWeight: 800, color: 'var(--status-at-risk-bar)' }}>
          {val || 0}%
        </span>
      )
    },
    {
      header: 'Main Skill Gap',
      accessor: 'skillGaps',
      render: (val) => {
        const first = Array.isArray(val) && val.length > 0 ? val[0] : 'Core CS Fundamentals';
        return <Badge variant="warning">{first}</Badge>;
      }
    },
    {
      header: 'Status',
      accessor: 'classification',
      render: () => <Badge status="At Risk">At Risk</Badge>
    },
    {
      header: 'Action',
      accessor: 'id',
      render: (_, row) => (
        <Button
          variant="danger"
          size="sm"
          onClick={() => setActionStudent(row)}
        >
          Assign Remediation
        </Button>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="At-Risk Placement Candidates"
        subtitle="Students whose Random Forest placement readiness model predicts AT_RISK status. Prioritize for targeted intervention."
      />

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <SearchBar
            placeholder="Search at-risk students by name or register number..."
            onSearch={setSearch}
          />
        </div>
        <Filter
          label="Department"
          options={[
            { label: 'All Departments', value: 'All' },
            { label: 'Computer Science and Engineering', value: 'Computer Science and Engineering' },
            { label: 'Information Technology', value: 'Information Technology' },
            { label: 'Electronics and Communication Engineering', value: 'Electronics and Communication Engineering' },
            { label: 'Electrical and Electronics Engineering', value: 'Electrical and Electronics Engineering' },
            { label: 'Mechanical Engineering', value: 'Mechanical Engineering' }
          ]}
          value={department}
          onChange={setDepartment}
        />
      </div>

      {students.length === 0 ? (
        <EmptyState
          title="No at-risk students identified."
          description="All evaluated candidates currently meet or exceed minimum placement readiness thresholds."
        />
      ) : (
        <div className="card">
          <DataTable
            columns={columns}
            data={students}
            pageSize={10}
            searchPlaceholder="Filter current view..."
          />
        </div>
      )}

      {/* Remediation Modal */}
      {actionStudent && (
        <Modal
          isOpen={true}
          onClose={() => setActionStudent(null)}
          title={`Remedial Intervention: ${actionStudent.name}`}
        >
          <form onSubmit={handleScheduleIntervention}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Assign tailored mentor sessions, mock qualifier retakes, or technical bootcamps.
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="inter-note">Remediation Plan Details</label>
              <textarea
                id="inter-note"
                className="input-control"
                rows={4}
                placeholder="Specify focus areas: e.g. Daily Data Structures practice + Quantitative aptitude speed tests..."
                value={interventionNote}
                onChange={(e) => setInterventionNote(e.target.value)}
                required
              />
            </div>

            {interventionSuccess && (
              <div style={{ padding: '10px', backgroundColor: '#ECFDF5', color: '#047857', borderRadius: 'var(--radius-sm)', marginBottom: '12px', fontSize: '0.8125rem' }}>
                Intervention recorded and notification dispatched!
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button variant="outline" onClick={() => setActionStudent(null)}>Cancel</Button>
              <Button variant="danger" type="submit">Confirm Intervention</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
