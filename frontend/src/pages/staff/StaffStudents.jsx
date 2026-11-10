import React, { useEffect, useState, useMemo } from 'react';
import { staffService } from '../../services/staffService';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { Filter } from '../../components/common/Filter';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { DataTable } from '../../components/tables/DataTable';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';

export const StaffStudents = () => {
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchAssignedStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      // Backend automatically filters students assigned to the authenticated staff member
      const data = await staffService.getMyStudents();
      setAssignedStudents(data || []);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedStudents();
  }, []);

  // Compute stats strictly from assigned cohort with valid assessments
  const stats = useMemo(() => {
    const total = assignedStudents.length;
    const assessedStudents = assignedStudents.filter(
      (s) => s.readinessScore != null && !isNaN(Number(s.readinessScore))
    );
    const validCount = assessedStudents.length;
    const totalSum = assessedStudents.reduce((acc, curr) => acc + Number(curr.readinessScore), 0);
    const avgScore = validCount > 0 ? (totalSum / validCount).toFixed(1) : null;
    const atRiskCount = assignedStudents.filter(
      (s) => s.classification === 'At Risk' || (s.classificationDisplay && s.classificationDisplay.toLowerCase().includes('risk'))
    ).length;

    return { total, validCount, avgScore, atRiskCount };
  }, [assignedStudents]);

  // Client-side search and category filtering for the assigned cohort
  const filteredStudents = useMemo(() => {
    return assignedStudents.filter((s) => {
      if (category !== 'All') {
        const cat = category.toLowerCase();
        const studentCat = (s.classificationDisplay || s.classification || '').toLowerCase();
        if (!studentCat.includes(cat)) return false;
      }

      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.regNo && s.regNo.toLowerCase().includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q)) ||
        (s.deficitArea && s.deficitArea.toLowerCase().includes(q))
      );
    });
  }, [assignedStudents, search, category]);

  if (loading) return <LoadingState message="Loading assigned students from database..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Assigned Students"
        description={error}
        onRetry={fetchAssignedStudents}
      />
    );
  }

  // Exact required columns: Register Number, Student Name, Department, CGPA, Aptitude Score, Technical Score, Readiness Score, Deficit Area / Skill Gap, Status, Assigned Staff
  const columns = [
    {
      header: 'Register Number',
      accessor: 'regNo',
      sortable: true,
      render: (val) => <span className="table-cell-mono">{val || 'Not Provided'}</span>
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
      render: (val) => <span>{val || 'Not Provided'}</span>
    },
    {
      header: 'CGPA',
      accessor: 'cgpa',
      sortable: true,
      render: (val) => <span>{val != null ? Number(val).toFixed(2) : '—'}</span>
    },
    {
      header: 'Aptitude Score',
      accessor: 'aptitudeScore',
      sortable: true,
      render: (val) => (
        val != null ? (
          <strong>{val}%</strong>
        ) : (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>Pending</span>
        )
      )
    },
    {
      header: 'Technical Score',
      accessor: 'technicalScore',
      sortable: true,
      render: (val) => (
        val != null ? (
          <strong>{val}%</strong>
        ) : (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>Pending</span>
        )
      )
    },
    {
      header: 'Readiness Score',
      accessor: 'readinessScore',
      sortable: true,
      render: (val) => {
        if (val == null) {
          return (
            <Badge status="warning">
              Pending Assessment
            </Badge>
          );
        }
        const num = Number(val);
        const color = num >= 70 ? 'var(--color-primary)' : num >= 50 ? 'var(--color-warning)' : 'var(--status-at-risk-bar)';
        return (
          <span style={{ fontWeight: 800, color, fontSize: '0.9375rem' }}>
            {num}%
          </span>
        );
      }
    },
    {
      header: 'Deficit Area / Skill Gap',
      accessor: 'deficitArea',
      sortable: true,
      render: (val) => {
        const text = val || 'None Identified';
        const isNone = text === 'None Identified' || text === 'None';
        return (
          <span
            style={{
              display: 'inline-block',
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.8125rem',
              color: isNone ? 'var(--color-text-secondary)' : 'var(--status-at-risk-bar)',
              fontWeight: isNone ? 400 : 600
            }}
            title={text}
          >
            {text}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (val) => <Badge status={val === 'ACTIVE' ? 'active' : 'inactive'}>{val || 'ACTIVE'}</Badge>
    },
    {
      header: 'Assigned Staff',
      accessor: 'assignedStaff',
      sortable: true,
      render: (val) => (
        <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>
          {val || 'You'}
        </span>
      )
    },
    {
      header: 'Action',
      accessor: 'id',
      render: (_, row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedStudent(row)}
        >
          View Profile
        </Button>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Assigned Students Monitoring"
        subtitle="Monitor performance, placement readiness, and skill deficits for students assigned directly to you by the HOD."
      />

      {/* Cohort Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Assigned Students
          </span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-navy-950)' }}>
            {stats.total}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Allocated by Department HOD
          </span>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Average Readiness Score
          </span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {stats.avgScore != null ? `${stats.avgScore}%` : 'Pending'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Based on {stats.validCount} assessed student{stats.validCount === 1 ? '' : 's'}
          </span>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Assessments Completed
          </span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-accent-teal)' }}>
            {stats.validCount} / {stats.total}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Students with evaluated readiness
          </span>
        </div>

        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            At-Risk Students
          </span>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: stats.atRiskCount > 0 ? 'var(--status-at-risk-bar)' : 'var(--color-text-primary)' }}>
            {stats.atRiskCount}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            Requiring immediate mentoring intervention
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: '280px', maxWidth: '450px' }}>
          <SearchBar
            placeholder="Search by student name, register number, deficit area..."
            onSearch={setSearch}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Filter
            label="Classification"
            options={[
              { label: 'All Classifications', value: 'All' },
              { label: 'Highly Ready', value: 'Highly Ready' },
              { label: 'Ready', value: 'Ready' },
              { label: 'Needs Improvement', value: 'Needs Improvement' },
              { label: 'At Risk', value: 'At Risk' }
            ]}
            value={category}
            onChange={setCategory}
          />

          <Button variant="outline" size="sm" onClick={fetchAssignedStudents}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Data Table */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          title={assignedStudents.length === 0 ? "No Students Assigned Yet" : "No Matching Students"}
          description={
            assignedStudents.length === 0
              ? "The Department HOD has not assigned any students to your supervision yet. Once assigned, your cohort will appear here automatically."
              : "No assigned students match your search or classification filter."
          }
        />
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <DataTable
            columns={columns}
            data={filteredStudents}
            pageSize={10}
            searchPlaceholder="Filter table results..."
          />
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStudent(null)}
          title={`Candidate Dossier: ${selectedStudent.name}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <div>
                <span className="form-hint">Register Number</span>
                <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{selectedStudent.regNo}</div>
              </div>
              <Badge status={selectedStudent.classification}>{selectedStudent.classificationDisplay || selectedStudent.classification}</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span className="form-hint">Aptitude Score</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-navy-950)' }}>
                  {selectedStudent.aptitudeScore != null ? `${selectedStudent.aptitudeScore}%` : 'Pending'}
                </div>
              </div>
              <div>
                <span className="form-hint">Technical Score</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-navy-950)' }}>
                  {selectedStudent.technicalScore != null ? `${selectedStudent.technicalScore}%` : 'Pending'}
                </div>
              </div>
              <div>
                <span className="form-hint">Readiness Score</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {selectedStudent.readinessScore != null ? `${selectedStudent.readinessScore}%` : 'Pending'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span className="form-hint">Department</span>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedStudent.department}</div>
              </div>
              <div>
                <span className="form-hint">Academic Standing</span>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>
                  {selectedStudent.year} • CGPA: {selectedStudent.cgpa != null ? Number(selectedStudent.cgpa).toFixed(2) : 'N/A'}
                </div>
              </div>
            </div>

            <div>
              <span className="form-hint">Deficit Area / Skill Gaps</span>
              <div style={{ marginTop: '6px' }}>
                {selectedStudent.skillGaps && selectedStudent.skillGaps.length > 0 ? (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedStudent.skillGaps.map((gap, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#FEE2E2',
                          color: '#DC2626',
                          fontWeight: 600
                        }}
                      >
                        {gap}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    {selectedStudent.deficitArea || 'No significant deficit area identified.'}
                  </span>
                )}
              </div>
            </div>

            <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <span className="form-hint">Assigned Staff Coordinator</span>
              <div style={{ fontWeight: 600, marginTop: '2px', color: 'var(--color-primary)' }}>
                {selectedStudent.assignedStaff}
              </div>
              {selectedStudent.assignedStaffEmail && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  {selectedStudent.assignedStaffEmail}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button variant="outline" onClick={() => setSelectedStudent(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
