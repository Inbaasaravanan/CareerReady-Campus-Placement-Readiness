import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState, EmptyState } from '../../components/common/StateViews';

export const AdminHod = () => {
  const [hodList, setHodList] = useState([]);
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

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    institutionalId: '',
    email: '',
    departmentAuthority: '',
    departmentId: '',
    phone: '',
    status: 'ACTIVE'
  });

  // Create Form State
  const [createForm, setCreateForm] = useState({
    name: '',
    institutionalId: '',
    email: '',
    departmentAuthority: '',
    departmentId: '',
    phone: '',
    password: '',
    status: 'ACTIVE'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [hodData, deptsData] = await Promise.all([
        adminService.getHod(),
        adminService.getDepartments()
      ]);
      setHodList(hodData || []);
      setDepartments(deptsData || []);
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to load Placement HOD accounts.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Edit / Complete Details Modal
  const handleOpenEdit = (user) => {
    setEditModalUser(user);
    setEditForm({
      name: user.name || '',
      institutionalId: user.institutionalId || '',
      email: user.email || '',
      departmentAuthority: user.departmentAuthority || '',
      departmentId: user.departmentId ? String(user.departmentId) : (departments[0]?.id ? String(departments[0].id) : ''),
      phone: user.phone || '',
      status: user.status === 'PENDING_APPROVAL' ? 'PENDING' : (user.status || 'ACTIVE')
    });
  };

  // Submit Edit / Complete Details
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (
      !editForm.name.trim() ||
      !editForm.email.trim() ||
      !editForm.institutionalId.trim() ||
      !editForm.departmentAuthority.trim() ||
      !editForm.departmentId
    ) {
      setFeedback({
        type: 'error',
        text: 'All required fields (Officer Name, Email, Institutional ID, Department Authority, Department) must be completed.'
      });
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      await adminService.updateHod(editModalUser.id, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        institutionalId: editForm.institutionalId.trim().toUpperCase(),
        departmentAuthority: editForm.departmentAuthority.trim(),
        departmentId: Number(editForm.departmentId),
        phone: editForm.phone.trim(),
        status: editForm.status
      });
      setFeedback({ type: 'success', text: `Placement HOD details for ${editForm.name} updated successfully.` });
      setEditModalUser(null);
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to update Placement HOD record.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Create New HOD
  const handleCreateHod = async (e) => {
    e.preventDefault();
    if (
      !createForm.name.trim() ||
      !createForm.email.trim() ||
      !createForm.institutionalId.trim() ||
      !createForm.departmentAuthority.trim() ||
      !createForm.departmentId
    ) {
      setFeedback({ type: 'error', text: 'Please fill in all mandatory fields.' });
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      await adminService.createHod({
        name: createForm.name.trim(),
        email: createForm.email.trim(),
        institutionalId: createForm.institutionalId.trim().toUpperCase(),
        departmentAuthority: createForm.departmentAuthority.trim(),
        departmentId: Number(createForm.departmentId),
        phone: createForm.phone.trim(),
        password: createForm.password || 'Hod@123',
        status: createForm.status
      });
      setFeedback({ type: 'success', text: `Placement HOD account for ${createForm.name} created successfully.` });
      setCreateModalOpen(false);
      setCreateForm({
        name: '',
        institutionalId: '',
        email: '',
        departmentAuthority: '',
        departmentId: departments[0]?.id ? String(departments[0].id) : '',
        phone: '',
        password: '',
        status: 'ACTIVE'
      });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to create Placement HOD account.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Quick Approve
  const handleApprove = async (user) => {
    if (!user.isComplete || !user.institutionalId || !user.departmentAuthority) {
      setFeedback({
        type: 'error',
        text: `Cannot approve account: Institutional ID and Department Authority must be completed first. Please click "Complete Details".`
      });
      handleOpenEdit(user);
      return;
    }

    if (!window.confirm(`Approve Placement HOD account for ${user.name}? This will activate login and send an approval notification email.`)) {
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await adminService.approveUser(user.userId);
      setFeedback({ type: 'success', text: res?.message || `Approved ${user.name} successfully.` });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to approve HOD account.' });
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
      setFeedback({ type: 'error', text: err?.message || 'Failed to reject HOD account.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete HOD
  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete HOD account: ${user.name} (${user.email})?`)) {
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      await adminService.deleteHod(user.id);
      setFeedback({ type: 'success', text: `HOD account for ${user.name} deleted successfully.` });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: err?.message || 'Failed to delete HOD account.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered HOD records
  const filteredHod = hodList.filter((h) => {
    const matchesSearch =
      (h.name && h.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (h.email && h.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (h.institutionalId && h.institutionalId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (h.departmentAuthority && h.departmentAuthority.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (h.department && h.department.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'INCOMPLETE') return !h.isComplete;
    if (statusFilter === 'PENDING') return h.status === 'PENDING' || h.status === 'PENDING_APPROVAL';
    return h.status === statusFilter;
  });

  const columns = [
    {
      header: 'Officer Name',
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
      header: 'Institutional ID',
      accessor: 'institutionalId',
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
      header: 'Department Authority',
      accessor: 'departmentAuthority',
      sortable: true,
      render: (val, row) =>
        val && val.trim() ? (
          <div>
            <span style={{ fontWeight: 600, color: 'var(--color-navy-900)' }}>{val}</span>
            {row.department && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {row.department}
              </div>
            )}
          </div>
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
            ⚠️ Requires Authority Title
          </span>
        )
    },
    {
      header: 'Status',
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
              title={!row.isComplete ? 'Complete missing database details' : 'Edit HOD profile'}
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
                  title={!row.isComplete ? 'Complete Institutional ID and Authority before approving' : 'Approve account'}
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

  if (loading) return <LoadingState message="Loading Placement HOD records..." />;

  const incompleteCount = hodList.filter((h) => !h.isComplete).length;
  const pendingCount = hodList.filter((h) => h.status === 'PENDING' || h.status === 'PENDING_APPROVAL').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <PageHeader
          title="Placement HOD Accounts"
          subtitle="Executive institutional heads authorized to oversee college-wide placement readiness, partner companies, and department analytics."
        />
        <Button
          variant="primary"
          onClick={() => {
            setCreateForm({
              name: '',
              institutionalId: '',
              email: '',
              departmentAuthority: '',
              departmentId: departments[0]?.id ? String(departments[0].id) : '',
              phone: '',
              password: '',
              status: 'ACTIVE'
            });
            setCreateModalOpen(true);
          }}
        >
          + Add HOD Account
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
            { id: 'ALL', label: `All (${hodList.length})` },
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
            placeholder="Search by name, ID, authority, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
          />
        </div>
      </div>

      {filteredHod.length === 0 ? (
        <EmptyState
          title="No Placement HOD Accounts Found"
          message={searchTerm ? `No HOD records matching "${searchTerm}".` : 'No HOD accounts exist matching the selected filter.'}
        />
      ) : (
        <DataTable columns={columns} data={filteredHod} pageSize={10} />
      )}

      {/* View Details Modal */}
      {detailsModalUser && (
        <Modal
          isOpen={Boolean(detailsModalUser)}
          onClose={() => setDetailsModalUser(null)}
          title="Placement HOD Profile Details"
          footer={
            <Button variant="outline" onClick={() => setDetailsModalUser(null)}>
              Close
            </Button>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', rowGap: '12px', fontSize: '0.875rem' }}>
            <div style={{ color: 'var(--color-text-muted)' }}>Officer Name:</div>
            <div style={{ fontWeight: 600 }}>{detailsModalUser.name}</div>

            <div style={{ color: 'var(--color-text-muted)' }}>Institutional ID:</div>
            <div>
              {detailsModalUser.institutionalId ? (
                <span className="table-cell-mono">{detailsModalUser.institutionalId}</span>
              ) : (
                <Badge variant="warning">Requires Completion</Badge>
              )}
            </div>

            <div style={{ color: 'var(--color-text-muted)' }}>Official Email:</div>
            <div style={{ wordBreak: 'break-all' }}>{detailsModalUser.email}</div>

            <div style={{ color: 'var(--color-text-muted)' }}>Department Authority:</div>
            <div style={{ fontWeight: 600 }}>{detailsModalUser.departmentAuthority || 'Not Assigned'}</div>

            <div style={{ color: 'var(--color-text-muted)' }}>Assigned Department:</div>
            <div>{detailsModalUser.department || 'All / Central'}</div>

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
          title={`Edit HOD Details — ${editModalUser.name}`}
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
              <label className="form-label" htmlFor="edit-hod-name">
                Officer Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                id="edit-hod-name"
                type="text"
                className="input-control"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-hod-instid">
                  Institutional ID <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="edit-hod-instid"
                  type="text"
                  className="input-control"
                  placeholder="e.g. INST-HOD-001"
                  value={editForm.institutionalId}
                  onChange={(e) => setEditForm({ ...editForm, institutionalId: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-hod-email">
                  Official Email <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="edit-hod-email"
                  type="email"
                  className="input-control"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-hod-auth">
                Department Authority Title <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                id="edit-hod-auth"
                type="text"
                className="input-control"
                placeholder="e.g. Head of Placement & Training / Dean of Industry Relations"
                value={editForm.departmentAuthority}
                onChange={(e) => setEditForm({ ...editForm, departmentAuthority: e.target.value })}
                required
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-hod-dept">
                  Department Authority Scope <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  id="edit-hod-dept"
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
                <label className="form-label" htmlFor="edit-hod-phone">
                  Contact Phone
                </label>
                <input
                  id="edit-hod-phone"
                  type="text"
                  className="input-control"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-hod-status">
                Account Status
              </label>
              <select
                id="edit-hod-status"
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

      {/* Add New HOD Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create New Placement HOD Account"
          footer={
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateHod} disabled={actionLoading}>
                {actionLoading ? 'Creating...' : 'Create HOD Account'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateHod}>
            <div className="form-group">
              <label className="form-label" htmlFor="create-hod-name">
                Officer Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                id="create-hod-name"
                type="text"
                className="input-control"
                placeholder="e.g. Prof. Sundar Rajan"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="create-hod-instid">
                  Institutional ID <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="create-hod-instid"
                  type="text"
                  className="input-control"
                  placeholder="e.g. INST-HOD-005"
                  value={createForm.institutionalId}
                  onChange={(e) => setCreateForm({ ...createForm, institutionalId: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="create-hod-email">
                  Official Email <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="create-hod-email"
                  type="email"
                  className="input-control"
                  placeholder="e.g. sundar@careerready.ai"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="create-hod-auth">
                Department Authority Title <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                id="create-hod-auth"
                type="text"
                className="input-control"
                placeholder="e.g. Head of Placement & Training / Dean of Placements"
                value={createForm.departmentAuthority}
                onChange={(e) => setCreateForm({ ...createForm, departmentAuthority: e.target.value })}
                required
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="create-hod-dept">
                  Department Authority Scope <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <select
                  id="create-hod-dept"
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
                <label className="form-label" htmlFor="create-hod-phone">
                  Contact Phone
                </label>
                <input
                  id="create-hod-phone"
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
                <label className="form-label" htmlFor="create-hod-pass">
                  Password <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  id="create-hod-pass"
                  type="password"
                  className="input-control"
                  placeholder="Min. 6 chars (default: Hod@123)"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="create-hod-status">
                  Initial Status
                </label>
                <select
                  id="create-hod-status"
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
