import React, { useEffect, useState } from 'react';
import { hodService } from '../../services/hodService';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';

export const HodStaffMonitoring = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assignment'); // 'assignment' | 'workload'
  const [students, setStudents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [monitoringList, setMonitoringList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [staffFilter, setStaffFilter] = useState('All'); // 'All' | 'UNASSIGNED' | staffId

  // Bulk Selection
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [targetStaffId, setTargetStaffId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Single Reassign Modal
  const [reassignModalStudent, setReassignModalStudent] = useState(null);
  const [reassignStaffId, setReassignStaffId] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsData, availableStaff, monitoringData] = await Promise.all([
        hodService.getStaffAssignmentStudents().catch(() => []),
        hodService.getAvailableStaff().catch(() => []),
        hodService.getStaffMonitoring().catch(() => [])
      ]);

      setStudents(studentsData || []);
      setStaffList(availableStaff || []);
      setMonitoringList(monitoringData || []);
    } catch (err) {
      setError(err?.message || 'Failed to load staff assignment data. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Distinct departments for filter
  const departments = ['All', ...new Set(students.map((s) => s.department || s.departmentName).filter(Boolean))];

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    // Search query
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = (s.studentName || '').toLowerCase().includes(q);
      const matchReg = (s.registerNumber || '').toLowerCase().includes(q);
      const matchStaff = (s.assignedStaffName || '').toLowerCase().includes(q);
      if (!matchName && !matchReg && !matchStaff) return false;
    }

    // Department filter
    if (departmentFilter !== 'All') {
      const dept = s.department || s.departmentName;
      if (dept !== departmentFilter) return false;
    }

    // Staff filter
    if (staffFilter === 'UNASSIGNED') {
      if (s.assignedStaffId != null) return false;
    } else if (staffFilter !== 'All') {
      if (String(s.assignedStaffId) !== String(staffFilter)) return false;
    }

    return true;
  });

  // Checkbox toggle
  const toggleSelectStudent = (id) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    if (selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.studentId)));
    }
  };

  const clearSelection = () => {
    setSelectedStudentIds(new Set());
    setTargetStaffId('');
  };

  // Bulk Assign Handler
  const handleBulkAssign = async () => {
    if (selectedStudentIds.size === 0) {
      alert('Please select at least one student to assign.');
      return;
    }
    if (!targetStaffId) {
      alert('Please select a placement staff coordinator to assign the students to.');
      return;
    }

    const chosenStaff = staffList.find((st) => String(st.staffId || st.id) === String(targetStaffId));
    const staffName = chosenStaff ? chosenStaff.name : 'Placement Staff';

    setAssigning(true);
    setNotice(null);
    try {
      await hodService.bulkAssignStudents(Array.from(selectedStudentIds), Number(targetStaffId));
      setNotice({
        type: 'success',
        text: `Successfully assigned ${selectedStudentIds.size} student(s) to ${staffName}. Stored permanently in MySQL.`
      });
      clearSelection();
      await loadData();
    } catch (err) {
      alert(err?.message || 'Failed to assign students to staff.');
    } finally {
      setAssigning(false);
    }
  };

  // Single Reassign Handler
  const handleSingleReassign = async () => {
    if (!reassignModalStudent || !reassignStaffId) return;

    setReassigning(true);
    try {
      const chosenStaff = staffList.find((st) => String(st.staffId) === String(reassignStaffId));
      await hodService.reassignStudent(reassignModalStudent.studentId, Number(reassignStaffId));
      setNotice({
        type: 'success',
        text: `Reassigned ${reassignModalStudent.studentName} to ${chosenStaff?.name || 'Staff'}. Stored in database.`
      });
      setReassignModalStudent(null);
      setReassignStaffId('');
      await loadData();
    } catch (err) {
      alert(err?.message || 'Failed to reassign student.');
    } finally {
      setReassigning(false);
    }
  };

  // Quick Unassign Handler
  const handleUnassign = async (student) => {
    if (!window.confirm(`Are you sure you want to unassign ${student.studentName}?`)) return;

    try {
      await hodService.unassignStudent(student.studentId);
      setNotice({
        type: 'info',
        text: `Removed staff assignment for ${student.studentName}.`
      });
      await loadData();
    } catch (err) {
      alert(err?.message || 'Failed to unassign student.');
    }
  };

  if (loading) return <LoadingState message="Loading staff assignment & department rosters from MySQL database..." />;
  if (error) return <ErrorState title="Failed to Load Staff Monitoring" description={error} onRetry={loadData} />;

  // Student table columns
  const studentColumns = [
    {
      header: (
        <input
          type="checkbox"
          checked={filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length}
          onChange={selectAllFiltered}
          aria-label="Select all students"
          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
        />
      ),
      accessor: 'studentId',
      sortable: false,
      render: (val) => (
        <input
          type="checkbox"
          checked={selectedStudentIds.has(val)}
          onChange={() => toggleSelectStudent(val)}
          aria-label={`Select student ${val}`}
          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
        />
      )
    },
    {
      header: 'Register Number',
      accessor: 'registerNumber',
      sortable: true,
      render: (val) => <span className="table-cell-mono">{val || '—'}</span>
    },
    {
      header: 'Student Name',
      accessor: 'studentName',
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
      render: (val) => {
        if (val === null || val === undefined) {
          return (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', backgroundColor: 'var(--color-bg-subtle)', padding: '3px 8px', borderRadius: '4px' }}>
              Pending Assessment
            </span>
          );
        }
        const numericVal = Number(val);
        const isReady = numericVal >= 70;
        return (
          <span style={{ fontWeight: 800, color: isReady ? 'var(--color-primary)' : 'var(--status-at-risk-bar)' }}>
            {numericVal}%
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (val) => <Badge status={val || 'ACTIVE'}>{val || 'Active'}</Badge>
    },
    {
      header: 'Assigned Staff',
      accessor: 'assignedStaffName',
      sortable: true,
      render: (val, row) => {
        if (!val) {
          return (
            <Badge variant="warning">
              Unassigned
            </Badge>
          );
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-navy-950)' }}>{val}</span>
            {row.assignedStaffEmail && (
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                {row.assignedStaffEmail}
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Actions',
      accessor: 'assignedStaffId',
      sortable: false,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setReassignModalStudent(row);
              setReassignStaffId(row.assignedStaffId ? String(row.assignedStaffId) : (staffList[0]?.staffId ? String(staffList[0].staffId) : ''));
            }}
          >
            {row.assignedStaffId ? 'Reassign' : 'Assign'}
          </Button>
          {row.assignedStaffId && (
            <button
              type="button"
              onClick={() => handleUnassign(row)}
              title="Remove staff assignment"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#EF4444',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '4px 6px'
              }}
            >
              Unassign
            </button>
          )}
        </div>
      )
    }
  ];

  // Workload table columns
  const workloadColumns = [
    {
      header: 'Staff Name',
      accessor: 'name',
      sortable: true,
      render: (val) => <span className="table-cell-bold">{val}</span>
    },
    {
      header: 'Official Email',
      accessor: 'email',
      sortable: true
    },
    {
      header: 'Employee ID',
      accessor: 'employeeId',
      sortable: true,
      render: (val) => <span className="table-cell-mono">{val || '—'}</span>
    },
    {
      header: 'Department',
      accessor: 'department',
      sortable: true
    },
    {
      header: 'Assigned Students',
      accessor: 'assignedCount',
      sortable: true,
      render: (val) => (
        <span style={{ fontWeight: 700, color: val > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
          {val} Candidates
        </span>
      )
    }
  ];

  // Summary counts
  const totalStudents = students.length;
  const assignedCount = students.filter((s) => s.assignedStaffId != null).length;
  const unassignedCount = totalStudents - assignedCount;

  return (
    <div>
      <PageHeader
        title="Staff Assignment & Student Supervision"
        subtitle="HOD assigns verified department students to placement staff coordinators for dedicated tracking and coaching."
      />

      {notice && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: notice.type === 'success' ? '#ECFDF5' : '#EFF6FF',
            border: `1px solid ${notice.type === 'success' ? '#6EE7B7' : '#93C5FD'}`,
            color: notice.type === 'success' ? '#047857' : '#1E40AF',
            fontSize: '0.875rem',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            ×
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '22px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Total Candidates
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-navy-950)', marginTop: '4px' }}>
            {totalStudents}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Registered in HOD Department
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Assigned to Staff
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
            {assignedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Actively Monitored
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Pending Assignment
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: unassignedCount > 0 ? 'var(--status-at-risk-bar)' : 'var(--color-text-muted)', marginTop: '4px' }}>
            {unassignedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Require Coordinator Allocation
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Placement Staff
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-navy-950)', marginTop: '4px' }}>
            {staffList.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            Available Coordinators
          </div>
        </div>
      </div>

      {/* View Switcher: Staff Assignment vs Staff Coordinator Workload */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('assignment')}
          style={{
            padding: '8px 18px',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            border: activeTab === 'assignment' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeTab === 'assignment' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: activeTab === 'assignment' ? '#FFFFFF' : 'var(--color-text-primary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Staff Assignment ({students.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('workload')}
          style={{
            padding: '8px 18px',
            fontSize: '0.875rem',
            fontWeight: 600,
            borderRadius: 'var(--radius-md)',
            border: activeTab === 'workload' ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
            backgroundColor: activeTab === 'workload' ? 'var(--color-primary)' : 'var(--color-surface)',
            color: activeTab === 'workload' ? '#FFFFFF' : 'var(--color-text-primary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Staff Coordinator Caseloads ({staffList.length})
        </button>
      </div>

      {activeTab === 'assignment' && (
        <>
          {/* Controls: Search, Department Filter, Staff Filter */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                className="input-control"
                placeholder="Search candidate name, register number, or assigned staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {departments.length > 2 && (
              <div style={{ minWidth: '180px' }}>
                <select
                  className="select-control"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d === 'All' ? 'All Departments' : d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ minWidth: '180px' }}>
              <select
                className="select-control"
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
              >
                <option value="All">All Staff Filters</option>
                <option value="UNASSIGNED">Unassigned Students ({unassignedCount})</option>
                {staffList.map((st) => (
                  <option key={st.staffId} value={st.staffId}>
                    Assigned to: {st.name} ({st.assignedCount})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bulk Assignment Bar */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: selectedStudentIds.size > 0 ? '#EFF6FF' : 'var(--color-bg-subtle)',
              border: `1px solid ${selectedStudentIds.size > 0 ? '#93C5FD' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              marginBottom: '16px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: selectedStudentIds.size > 0 ? '#1E40AF' : 'var(--color-text-secondary)' }}>
                {selectedStudentIds.size} student(s) selected
              </span>
              {selectedStudentIds.size > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                className="select-control"
                style={{ width: '260px' }}
                value={targetStaffId}
                onChange={(e) => setTargetStaffId(e.target.value)}
              >
                <option value="">Select Staff Coordinator...</option>
                {staffList.map((st) => (
                  <option key={st.staffId || st.id} value={st.staffId || st.id}>
                    {st.name} ({st.assignedCount} assigned) — {st.department}
                  </option>
                ))}
              </select>

              <Button
                variant="primary"
                onClick={handleBulkAssign}
                disabled={assigning || selectedStudentIds.size === 0 || !targetStaffId}
              >
                {assigning ? 'Assigning...' : `Assign ${selectedStudentIds.size > 0 ? `(${selectedStudentIds.size})` : ''} to Staff`}
              </Button>
            </div>
          </div>

          {/* Student Table */}
          {filteredStudents.length === 0 ? (
            <EmptyState
              title="No students match the criteria."
              description="No registered students match the active department, staff, or search filter."
            />
          ) : (
            <div className="card">
              <DataTable
                columns={studentColumns}
                data={filteredStudents}
                pageSize={15}
                searchPlaceholder="Filter listed students..."
              />
            </div>
          )}
        </>
      )}

      {activeTab === 'workload' && (
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
              Placement Staff Coordinators & Caseload Coverage
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Coordinators designated to monitor candidate readiness, deficit remediation, and corporate match eligibility.
            </p>
          </div>
          <DataTable
            columns={workloadColumns}
            data={staffList}
            pageSize={10}
            searchPlaceholder="Search coordinator by name, email, or dept..."
          />
        </div>
      )}

      {/* Single Reassign Modal */}
      {reassignModalStudent && (
        <Modal
          isOpen={true}
          onClose={() => setReassignModalStudent(null)}
          title={`Assign Staff: ${reassignModalStudent.studentName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Candidate Details</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '2px' }}>
                {reassignModalStudent.studentName} ({reassignModalStudent.registerNumber || 'No Reg'})
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Department: <strong>{reassignModalStudent.department || reassignModalStudent.departmentName || 'Not Provided'}</strong> &bull; Readiness: <strong>{reassignModalStudent.readinessScore !== null ? `${reassignModalStudent.readinessScore}%` : 'Pending'}</strong>
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Current Staff: <strong>{reassignModalStudent.assignedStaffName || 'None (Unassigned)'}</strong>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reassign-select-staff">
                Select Placement Staff Coordinator <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                id="reassign-select-staff"
                className="select-control"
                value={reassignStaffId}
                onChange={(e) => setReassignStaffId(e.target.value)}
              >
                <option value="">Choose Staff...</option>
                {staffList.map((st) => (
                  <option key={st.staffId || st.id} value={st.staffId || st.id}>
                    {st.name} ({st.assignedCount} candidates) &bull; {st.department}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button variant="outline" onClick={() => setReassignModalStudent(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSingleReassign}
                disabled={reassigning || !reassignStaffId}
              >
                {reassigning ? 'Saving Assignment...' : 'Confirm Assignment'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
