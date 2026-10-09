import React, { useEffect, useState, useMemo } from 'react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { LoadingState, EmptyState, ErrorState } from '../../components/common/StateViews';
import { SearchIcon } from '../../components/common/Icons';

export const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getStudents();
      const mapped = data.map((s) => ({
        id: s.studentId || s.id,
        regNo: s.registerNumber || s.regNo || 'Not Provided',
        name: s.studentName || s.name || 'Not available',
        email: s.email || 'Not available',
        department: s.department || s.departmentName || 'Not Provided',
        status: s.status === 'ACTIVE' || s.status === 'APPROVED' ? 'Active' : s.status === 'PENDING_APPROVAL' ? 'Pending' : 'Inactive',
        rawStatus: s.status,
        lastLogin: s.lastLoginAt
          ? new Date(s.lastLoginAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Never',
        cgpa: s.cgpa != null ? Number(s.cgpa).toFixed(2) : '—',
        mentorName: s.assignedStaffName || s.mentorName || 'Unassigned'
      }));
      setStudents(mapped);
    } catch (err) {
      setError(err?.message || 'Failed to load students from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const departments = useMemo(() => {
    const set = new Set(students.map((s) => s.department).filter((d) => d && d !== 'Not Provided'));
    return ['All', ...Array.from(set)];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.regNo.toLowerCase().includes(q);
      const matchesDept = selectedDept === 'All' || s.department === selectedDept;
      return matchesSearch && matchesDept;
    });
  }, [students, search, selectedDept]);

  if (loading) return <LoadingState message="Loading Student Master Registry..." />;
  if (error) return <ErrorState message={error} onRetry={fetchStudents} />;

  const columns = [
    {
      header: 'Register No',
      accessor: 'regNo',
      sortable: true,
      render: (val) => (
        <span className="table-cell-mono" style={{ fontWeight: 600 }}>
          {val}
        </span>
      )
    },
    {
      header: 'Student Name',
      accessor: 'name',
      sortable: true,
      render: (val) => <span className="table-cell-bold">{val}</span>
    },
    {
      header: 'Email',
      accessor: 'email',
      sortable: true
    },
    {
      header: 'Department',
      accessor: 'department',
      sortable: true
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => (
        <Badge variant={val === 'Active' ? 'success' : val === 'Pending' ? 'warning' : 'danger'}>
          {val}
        </Badge>
      )
    },
    {
      header: 'Last Login',
      accessor: 'lastLogin',
      sortable: true,
      render: (val) => (
        <span
          className="table-cell-mono"
          style={{ color: val === 'Never' ? 'var(--color-text-muted)' : 'inherit' }}
        >
          {val}
        </span>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Student Master Registry"
        subtitle="Enrolled candidates with verified university authentication credentials and academic records."
      />

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px', maxWidth: '480px' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              width: '100%'
            }}
          >
            <SearchIcon
              width={16}
              height={16}
              style={{
                position: 'absolute',
                left: '12px',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none'
              }}
            />
            <input
              type="text"
              placeholder="Search by name, email, or register no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-control"
              style={{ paddingLeft: '36px', height: '40px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Department:
          </label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="select-control"
            style={{ height: '40px', width: 'auto', minWidth: '180px' }}
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <EmptyState
          title="No Students Found"
          message={
            search || selectedDept !== 'All'
              ? 'No students matched the active search or filter criteria.'
              : 'No enrolled students found in database.'
          }
        />
      ) : (
        <DataTable columns={columns} data={filteredStudents} pageSize={10} />
      )}
    </div>
  );
};
