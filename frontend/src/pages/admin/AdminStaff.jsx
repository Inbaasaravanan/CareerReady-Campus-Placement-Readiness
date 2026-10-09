import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState, EmptyState } from '../../components/common/StateViews';

export const AdminStaff = () => {
  const [staffList, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [feedback, setFeedback] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [detailsModalUser, setDetailsModalUser] = useState(null);
  const [editModalUser, setEditModalUser] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Edit / Complete Form State
  const [editForm, setEditForm] = useState({
    name: '',
    employeeId: '',
    email: '',
    departmentId: '',
    phone: '',
    status: 'ACTIVE'
  });

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    employeeId: '',
    email: '',
    departmentId: '',
    phone: '',
    password: '',
    status: 'ACTIVE'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffData, deptsData] = await Promise.all([
        adminService.getStaff(),
        adminService.getDepartments()
      ]);
      setStaffList(staffData || []);
      setDepartments(deptsData || []);
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to load staff accounts.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Edit / Complete Modal
  const handleOpenEdit = (user) => {
    setEditModalUser(user);
    setEditForm({
      name: user.name || '',
      employeeId: user.employeeId || '',
      email: user.email || '',
      departmentId: user.departmentId ? String(user.departmentId) : (departments[0]?.id ? String(departments[0].id) : ''),
      phone: user.phone || '',
      status: user.status === 'PENDING_APPROVAL' ? 'PENDING' : (user.status || 'ACTIVE')
    });
  };

  // Submit Edit / Complete Details
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.employeeId.trim() || !editForm.departmentId) {
      setFeedback({ type: 'error', text: 'All required fields (Name, Email, Employee ID, Department) must be completed.' });
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      await adminService.updateStaff(editModalUser.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        employeeId: editForm.employeeId.trim().toUpperCase(),
        departmentId: Number(editForm.departmentId),
        phone: editForm.phone.trim(),
        status: editForm.status
      });
      setFeedback({ type: 'success', text: `Staff details for ${editForm.name} updated successfully.` });
      setEditModalUser(null);
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to update staff record.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Create New Staff
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.employeeId.trim() || !createForm.departmentId) {
      setFeedback({ type: 'error', text: 'Please fill in all mandatory fields.' });
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      await adminService.createStaff({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        employeeId: createForm.employeeId.trim().toUpperCase(),
        departmentId: Number(createForm.departmentId),
        phone: createForm.phone.trim(),
        password: createForm.password || 'Staff@123',
        status: createForm.status
      });
      setFeedback({ type: 'success', text: `Placement Staff account for ${createForm.name} created successfully.` });
      setCreateModalOpen(false);
      setCreateForm({
        name: '',
        employeeId: '',
        email: '',
        departmentId: departments[0]?.id ? String(departments[0].id) : '',
        phone: '',
        password: '',
        status: 'ACTIVE'
      });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to create staff account.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Approve
  const handleApprove = async (user) => {
    if (!user.isComplete || !user.employeeId || !user.department) {
      setFeedback({
        type: 'error',
        text: `Cannot approve account: Employee ID and Department must be completed first. Please click "Edit / Complete Details".`
      });
      handleOpenEdit(user);
      return;
    }

    if (!window.confirm(`Approve Placement Staff account for ${user.name}? This will activate login and send an approval notification email.`)) {
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await adminService.approveUser(user.userId);
      setFeedback({ type: 'success', text: res?.message || `Approved ${user.name} successfully.` });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to approve staff account.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Reject
  const handleReject = async (user) => {
    if (!window.confirm(`Reject registration for ${user.name}? This will block login and send a rejection notification email.`)) {
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await adminService.rejectUser(user.userId);
      setFeedback({ type: 'success', text: res?.message || `Account for ${user.name} rejected.` });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to reject staff account.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Staff
  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete staff account: ${user.name} (${user.email})?`)) {
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      await adminService.deleteStaff(user.id);
      setFeedback({ type: 'success', text: `Staff account for ${user.name} deleted successfully.` });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to delete staff account.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered staff records
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.employeeId && s.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.department && s.department.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'INCOMPLETE') return !s.isComplete;
    if (statusFilter === 'PENDING') return s.status === 'PENDING' || s.status === 'PENDING_APPROVAL';
    return s.status === statusFilter;
  });

  const columns = [
    {
      header: 'Staff Name',
      accessor: 'name',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="table-cell-bold">{val || '—'}</span>
          {row.phone && (
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
              📞 {row.phone}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Employee ID',
      accessor: 'employeeId',
      sortable: true,
      render: (val) =>
        val && val.trim() ? (
          <span className="table-cell-mono" style={{ fontWeight: 600, color: 'var(--color-navy-950)' }}>
            {val}
          </span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #FCD34D'
            }}
          >
            ⚠️ Requires Completion
          </span>
        )
    },
    {
      header: 'Email',
      accessor: 'email',
      sortable: true,
      render: (val) => <span style={{ wordBreak: 'break-all' }}>{val || '—'}</span>
    },
    {
      header: 'Department',
      accessor: 'department',
      sortable: true,
      render: (val) =>
        val && val.trim() ? (
          <span>{val}</span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              backgroundColor: '#FEF3C7',
              color: '#92400E',
              border: '1px solid #FCD34D'
            }}
          >
            ⚠️ Needs Assignment
          </span>
        )
    },
    {
      header: 'Account Status',
      accessor: 'status',
      sortable: true,
      render: (val) => {
        const s = (val || '').toUpperCase();
        if (s === 'PENDING' || s === 'PENDING_APPROVAL') {
          return <Badge variant="warning">PENDING</Badge>;
        }
        if (s === 'ACTIVE') {
          return <Badge variant="success">ACTIVE</Badge>;
        }
        if (s === 'REJECTED') {
          return <Badge variant="danger">REJECTED</Badge>;
        }
        return <Badge variant="neutral">{val || 'INACTIVE'}</Badge>;
      }
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (id, row) => {
        const isPending = row.status === 'PENDING' || row.status === 'PENDING_APPROVAL';
        return (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailsModalUser(row)}
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Details
            </Button>

            <button
              type="button"
              onClick={() => handleOpenEdit(row)}
              style={{
                backgroundColor: !row.isComplete ? '#F59E0B' : '#3B82F6',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title={!row.isComplete ? 'Complete missing database details' : 'Edit staff profile'}
            >
              {!row.isComplete ? 'Complete Details' : 'Edit'}
            </button>

            {isPending && (
              <>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleApprove(row)}
                  style={{
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1
                  }}
                  title={!row.isComplete ? 'Complete Employee ID and Department before approving' : 'Approve account'}
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleReject(row)}
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1
                  }}
                  title="Reject registration"
                >
                  Reject
                </button>
              </>
            )}

            {row.status === 'ACTIVE' && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleApprove(row)}
                style={{
                  backgroundColor: '#059669',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.6 : 1
                }}
                title="Resend account approval notification email"
              >
                ✉ Resend Email
              </button>
            )}

            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleDelete(row)}
              style={{
                background: 'none',
                border: 'none',
                color: '#9CA3AF',
                cursor: 'pointer',
                fontSize: '0.875rem',
                padding: '2px 4px'
              }}
              title="Delete record"
            >
              🗑️
            </button>
          </div>
        );
      }
    }
  ];

  if (loading) return <LoadingState message="Loading Placement Staff records..." />;

  const incompleteCount = staffList.filter((s) => !s.isComplete).length;
  const pendingCount = staffList.filter((s) => s.status === 'PENDING' || s.status === 'PENDING_APPROVAL').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <PageHeader
          title="Placement Staff Accounts"
          subtitle="Department coordinators authorized to monitor cohorts, track readiness, and manage student training."
        />
        <Button
          variant="primary"
          onClick={() => {
            setCreateForm({
              name: '',
              employeeId: '',
              email: '',
              departmentId: departments[0]?.id ? String(departments[0].id) : '',
              phone: '',
              password: '',
              status: 'ACTIVE'
            });
            setCreateModalOpen(true);
          }}
        >
          + Add Staff Account
        </Button>
      </div>

      {feedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            backgroundColor: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${feedback.type === 'success' ? '#6EE7B7' : '#FCA5A5'}`,
            color: feedback.type === 'success' ? '#047857' : '#B91C1C',
            fontSize: '0.875rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { id: 'ALL', label: `All (${staffList.length})` },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'PENDING', label: `Pending (${pendingCount})` },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'INCOMPLETE', label: `Requires Completion (${incompleteCount})` }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: statusFilter === f.id ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: statusFilter === f.id ? 'var(--color-primary)' : '#FFFFFF',
                color: statusFilter === f.id ? '#FFFFFF' : 'var(--color-text-secondary)',
                cursor: 'pointer'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ minWidth: '240px' }}>
          <input
            type="text"
            className="input-control"
            placeholder="Search by name, ID, email, dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
          />
        </div>
      </div>

      {filteredStaff.length === 0 ? (
        <EmptyState
          title="No Staff Accounts Found"
          message={searchTerm ? `No staff records matching "${searchTerm}".` : 'No staff accounts exist matching the selected filter.'}
        />
      ) : (
        <DataTable columns={columns} data={filteredStaff} pageSize={10} />
      )}

      {/* View Details Modal */}
      {detailsModalUser && (
        <Modal
          isOpen={Boolean(detailsModalUser)}
          onClose={() => setDetailsModalUser(null)}
          title="Placement Staff Details"
          footer={
            <Button variant="outline" onClick={() => setDetailsModalUser(null)}>
              Close
            </Button>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', rowGap: '12px', fontSize: '0.875rem' }}>
            <div style={{ color: 'var(--color-text-muted)' }}>Staff Name:</div>
            <div style={{ fontWeight: 600 }}>{detailsModalUser.name}</div>

            <div style={{ color: 'var(--color-text-muted)' }}>Employee ID:</div>
            <div>
              {detailsModalUser.employeeId ? (
                <span className="table-cell-mono">{detailsModalUser.employeeId}</span>
              ) : (
                <Badge variant="warning">Requires Completion</Badge>
              )}
            </div>

            <div style={{ color: 'var(--color-text-muted)' }}>Email:</div>
            <div style={{ wordBreak: 'break-all' }}>{detailsModalUser.email}</div>

            <div style={{ color: 'var(--color-text-muted)' }}>Department:</div>
            <div>{detailsModalUser.department || 'Not Assigned'}</div>

            <div style={{ color: 'var(--color-text-muted)' }}>Contact Phone:</div>
            <div>{detailsModalUser.phone || 'Not provided'}</div>

            <div style={{ color: 'var(--color-text-muted)' }}>Account Status:</div>
            <div>
              <Badge status={detailsModalUser.status}>{detailsModalUser.status}</Badge>
            </div>

            <div style={{ color: 'var(--color-text-muted)' }}>Profile Complete:</div>
            <div>
              {detailsModalUser.isComplete ? (
                <span style={{ color: '#10B981', fontWeight: 600 }}>✓ Complete</span>
              ) : (
                <span style={{ color: '#F59E0B', fontWeight: 600 }}>⚠️ Incomplete Record</span>
              )}
            </div>

            <div style={{ color: 'var(--color-text-muted)' }}>Registered At:</div>
            <div>{detailsModalUser.createdAt ? new Date(detailsModalUser.createdAt).toLocaleString() : '—'}</div>

            <div style={{ color: 'var(--color-text-muted)' }}>Approved At:</div>
            <div>{detailsModalUser.approvedAt ? new Date(detailsModalUser.approvedAt).toLocaleString() : 'Not approved yet'}</div>

            <div style={{ color: 'var(--color-text-muted)' }}>Approved By:</div>
            <div>{detailsModalUser.approvedBy || '—'}</div>
          </div>
        </Modal>
      )}

      {/* Edit / Complete Details Modal */}
      {editModalUser && (
        <Modal
          isOpen={Boolean(editModalUser)}
          onClose={() => setEditModalUser(null)}
          title={`Edit Staff Details — ${editModalUser.name}`}
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setEditModalUser(null)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveEdit} disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleSaveEdit}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-staff-name">
                Full Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                id="edit-staff-name"
                type="text"
                className="input-control"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-staff-empid">
                  Employee ID <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="edit-staff-empid"
                  type="text"
                  className="input-control"
                  placeholder="e.g. EMP-STF-001"
                  value={editForm.employeeId}
                  onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-staff-email">
                  Official Email <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="edit-staff-email"
                  type="email"
                  className="input-control"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-staff-dept">
                  Department <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  id="edit-staff-dept"
                  className="select-control"
                  value={editForm.departmentId}
                  onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-staff-phone">
                  Contact Phone
                </label>
                <input
                  id="edit-staff-phone"
                  type="text"
                  className="input-control"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-staff-status">
                Account Status
              </label>
              <select
                id="edit-staff-status"
                className="select-control"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE (Authorized to log in)</option>
                <option value="PENDING">PENDING (Awaiting Approval)</option>
                <option value="REJECTED">REJECTED (Login Blocked)</option>
                <option value="INACTIVE">INACTIVE (Temporarily Disabled)</option>
              </select>
            </div>
          </form>
        </Modal>
      )}

      {/* Add New Staff Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create New Placement Staff Account"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateStaff} disabled={actionLoading}>
                {actionLoading ? 'Creating...' : 'Create Staff Account'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateStaff}>
            <div className="form-group">
              <label className="form-label" htmlFor="create-staff-name">
                Full Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                id="create-staff-name"
                type="text"
                className="input-control"
                placeholder="e.g. Dr. Ramesh Kumar"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="create-staff-empid">
                  Employee ID <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="create-staff-empid"
                  type="text"
                  className="input-control"
                  placeholder="e.g. EMP-STF-105"
                  value={createForm.employeeId}
                  onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="create-staff-email">
                  Official Email <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="create-staff-email"
                  type="email"
                  className="input-control"
                  placeholder="e.g. ramesh@careerready.ai"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="create-staff-dept">
                  Department <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  id="create-staff-dept"
                  className="select-control"
                  value={createForm.departmentId}
                  onChange={(e) => setCreateForm({ ...createForm, departmentId: e.target.value })}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="create-staff-phone">
                  Contact Phone
                </label>
                <input
                  id="create-staff-phone"
                  type="text"
                  className="input-control"
                  placeholder="e.g. +91 9876543210"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="create-staff-pass">
                  Password <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="create-staff-pass"
                  type="password"
                  className="input-control"
                  placeholder="Min. 6 chars (default: Staff@123)"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="create-staff-status">
                  Initial Status
                </label>
                <select
                  id="create-staff-status"
                  className="select-control"
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                >
                  <option value="ACTIVE">ACTIVE (Instantly Approved)</option>
                  <option value="PENDING">PENDING (Awaiting Approval)</option>
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
