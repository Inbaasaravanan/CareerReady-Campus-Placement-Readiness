import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';

export const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', code: '', status: 'ACTIVE' });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getDepartments();
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

  const handleAddDept = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminService.createDepartment(newDept);
      setIsAddModalOpen(false);
      setNewDept({ name: '', code: '', status: 'ACTIVE' });
      await load();
    } catch (err) {
      alert(`Failed to create department: ${err?.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDept = async (id, name) => {
    if (!window.confirm(`Delete department ${name} from MySQL database?`)) return;
    try {
      await adminService.deleteDepartment(id);
      await load();
    } catch (err) {
      alert(`Delete failed: ${err?.message || err}`);
    }
  };

  if (loading) return <LoadingState message="Loading departments from MySQL database..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Departments"
        description={error}
        onRetry={load}
      />
    );
  }

  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      sortable: true,
      render: (val) => <span>#{val}</span>
    },
    {
      header: 'Code',
      accessor: 'code',
      render: (val) => <span className="table-cell-mono" style={{ fontWeight: 700 }}>{val}</span>
    },
    {
      header: 'Department Name',
      accessor: 'name',
      render: (val) => <span className="table-cell-bold">{val}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (val) => <Badge status={val === 'ACTIVE' ? 'Ready' : 'Needs Improvement'}>{val}</Badge>
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (val, row) => (
        <Button
          variant="danger"
          size="sm"
          onClick={() => handleDeleteDept(val, row.name)}
        >
          Delete
        </Button>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Academic Department Management"
        subtitle="Manage institution academic divisions, departmental placement branches, and codes."
        actions={
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            Add Department
          </Button>
        }
      />

      {departments.length === 0 ? (
        <EmptyState
          title="No departments found."
          description="There are currently no departments configured in MySQL."
          actionLabel="Add Department"
          onAction={() => setIsAddModalOpen(true)}
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

      {/* Add Department Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Academic Department"
      >
        <form onSubmit={handleAddDept}>
          <div className="form-group">
            <label className="form-label" htmlFor="dept-name">Department Name</label>
            <input
              id="dept-name"
              type="text"
              className="input-control"
              placeholder="e.g. Artificial Intelligence & Data Science"
              value={newDept.name}
              onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dept-code">Department Code</label>
            <input
              id="dept-code"
              type="text"
              className="input-control"
              placeholder="e.g. AIDS"
              value={newDept.code}
              onChange={(e) => setNewDept({ ...newDept, code: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving to MySQL...' : 'Save Department'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
