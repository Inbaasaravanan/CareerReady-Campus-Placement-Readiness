import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState, EmptyState, ErrorState } from '../../components/common/StateViews';

export const AdminApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getPendingApprovals();
      setPendingUsers(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to fetch pending account approvals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const handleApprove = async (user) => {
    const targetId = user.userId || user.id;
    if (!window.confirm(`Are you sure you want to APPROVE ${user.name} (${user.role === 'PLACEMENT_STAFF' ? 'Placement Staff' : 'Placement HOD'})?`)) {
      return;
    }
    setProcessingId(targetId);
    setActionMessage(null);
    try {
      const res = await adminService.approveUser(targetId);
      setActionMessage({ type: 'success', text: res?.message || `Successfully approved ${user.name}. Account is now active.` });
      await fetchPendingApprovals();
    } catch (err) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to approve account.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (user) => {
    const targetId = user.userId || user.id;
    if (!window.confirm(`Are you sure you want to REJECT registration for ${user.name}? This will block login access.`)) {
      return;
    }
    setProcessingId(targetId);
    setActionMessage(null);
    try {
      const res = await adminService.rejectUser(targetId);
      setActionMessage({ type: 'success', text: res?.message || `Registration for ${user.name} has been rejected.` });
      await fetchPendingApprovals();
    } catch (err) {
      setActionMessage({ type: 'error', text: err?.message || 'Failed to reject account.' });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <LoadingState message="Loading Pending Account Approvals..." />;
  if (error) return <ErrorState message={error} onRetry={fetchPendingApprovals} />;

  const formatRegistrationDate = (dateVal) => {
    if (!dateVal) return 'Not Available';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'Not Available';

    const datePart = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const timePart = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${datePart}, ${timePart}`;
  };

  const columns = [
    {
      header: 'Full Name',
      accessor: 'name',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="table-cell-bold">{val}</span>
          {(row.identifier || row.employeeId || row.institutionalId) && (
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
              {row.role === 'PLACEMENT_HOD' ? 'INST ID: ' : 'EMP ID: '}
              {row.identifier || row.employeeId || row.institutionalId}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Official Email',
      accessor: 'email',
      sortable: true
    },
    {
      header: 'Role',
      accessor: 'role',
      sortable: true,
      render: (val, row) => (
        <div>
          <Badge variant={val === 'PLACEMENT_STAFF' ? 'info' : 'warning'}>
            {val === 'PLACEMENT_STAFF' ? 'Placement Staff' : val === 'PLACEMENT_HOD' ? 'Placement HOD' : val}
          </Badge>
          {row.departmentAuthority && (
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-navy-900)', marginTop: '2px', fontWeight: 600 }}>
              {row.departmentAuthority}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Department',
      accessor: 'departmentName',
      sortable: true,
      render: (val, row) => val || row.department || 'Not Provided'
    },
    {
      header: 'Registration Date',
      accessor: 'createdAt',
      sortable: true,
      render: (val, row) => {
        const formatted = formatRegistrationDate(val || row?.registeredAt);
        if (formatted === 'Not Available') {
          return <span style={{ color: 'var(--color-text-muted)' }}>Not Available</span>;
        }
        return <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{formatted}</span>;
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => (
        <Badge variant="warning">
          {val || 'PENDING_APPROVAL'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (id, row) => {
        const isBusy = processingId === id;
        return (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUser(row)}
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Details
            </Button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleApprove(row)}
              style={{
                backgroundColor: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: isBusy ? 'not-allowed' : 'pointer',
                opacity: isBusy ? 0.6 : 1
              }}
            >
              {isBusy ? 'Processing...' : 'Approve'}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleReject(row)}
              style={{
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '5px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: isBusy ? 'not-allowed' : 'pointer',
                opacity: isBusy ? 0.6 : 1
              }}
            >
              Reject
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div>
      <PageHeader
        title="Account Approvals"
        subtitle="Review, approve, or reject pending Placement Staff and Placement HOD account registrations."
      />

      {actionMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            backgroundColor: actionMessage.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${actionMessage.type === 'success' ? '#6EE7B7' : '#FCA5A5'}`,
            color: actionMessage.type === 'success' ? '#047857' : '#B91C1C',
            fontSize: '0.875rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            &times;
          </button>
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <EmptyState
          title="No Pending Approvals"
          message="All staff and HOD registration requests have been reviewed. There are no pending accounts requiring administrator action."
        />
      ) : (
        <DataTable columns={columns} data={pendingUsers} pageSize={10} />
      )}

      {/* Details Modal */}
      {selectedUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="card"
            style={{ width: '100%', maxWidth: '480px', padding: '28px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px', color: 'var(--color-navy-950)' }}>
              Registration Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', rowGap: '12px', fontSize: '0.875rem' }}>
              <div style={{ color: 'var(--color-text-muted)' }}>Name:</div>
              <div style={{ fontWeight: 600 }}>{selectedUser.name}</div>

              <div style={{ color: 'var(--color-text-muted)' }}>Email:</div>
              <div style={{ wordBreak: 'break-all' }}>{selectedUser.email}</div>

              <div style={{ color: 'var(--color-text-muted)' }}>Role:</div>
              <div>
                <Badge variant={selectedUser.role === 'PLACEMENT_STAFF' ? 'info' : 'warning'}>
                  {selectedUser.role === 'PLACEMENT_STAFF' ? 'Placement Staff' : 'Placement HOD'}
                </Badge>
              </div>

              <div style={{ color: 'var(--color-text-muted)' }}>Department:</div>
              <div>{selectedUser.departmentName || 'Not assigned'}</div>

              <div style={{ color: 'var(--color-text-muted)' }}>Employee ID:</div>
              <div>{selectedUser.employeeId || 'Not provided'}</div>

              <div style={{ color: 'var(--color-text-muted)' }}>Phone:</div>
              <div>{selectedUser.phone || 'Not provided'}</div>

              <div style={{ color: 'var(--color-text-muted)' }}>Registered:</div>
              <div>{formatRegistrationDate(selectedUser.createdAt || selectedUser.registeredAt)}</div>

              <div style={{ color: 'var(--color-text-muted)' }}>Status:</div>
              <div>
                <Badge variant="warning">{selectedUser.status}</Badge>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
              <button
                type="button"
                onClick={() => {
                  const u = selectedUser;
                  setSelectedUser(null);
                  handleReject(u);
                }}
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 14px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => {
                  const u = selectedUser;
                  setSelectedUser(null);
                  handleApprove(u);
                }}
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 14px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
