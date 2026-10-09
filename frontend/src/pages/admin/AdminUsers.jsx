import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchBar } from '../../components/common/SearchBar';
import { Filter } from '../../components/common/Filter';
import { DataTable } from '../../components/tables/DataTable';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { LoadingState, ErrorState, EmptyState } from '../../components/common/StateViews';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'STUDENT',
    status: 'ACTIVE'
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getUsers(roleFilter, search);
      setUsers(data || []);
    } catch (err) {
      setError(err?.message || 'Unable to connect to server. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'Active' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminService.updateUser(user.id, { status: nextStatus });
      await fetchUsers();
    } catch (err) {
      alert(`Update status failed: ${err?.message || err}`);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (editUser) {
      try {
        await adminService.updateUser(editUser.id, {
          name: editUser.name,
          email: editUser.email,
          role: editUser.role ? editUser.role.toUpperCase() : 'STUDENT',
          status: editUser.status ? editUser.status.toUpperCase() : 'ACTIVE'
        });
        setEditUser(null);
        await fetchUsers();
      } catch (err) {
        alert(`Update user failed: ${err?.message || err}`);
      }
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await adminService.createUser(newUser);
      setIsAddModalOpen(false);
      setNewUser({ name: '', email: '', password: 'password123', role: 'STUDENT', status: 'ACTIVE' });
      await fetchUsers();
    } catch (err) {
      alert(`Create user failed: ${err?.message || err}`);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete user ${name} from MySQL User table?`)) return;
    try {
      await adminService.deleteUser(id);
      await fetchUsers();
    } catch (err) {
      alert(`Delete user failed: ${err?.message || err}`);
    }
  };

  if (loading) return <LoadingState message="Loading users from MySQL database..." />;

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Users"
        description={error}
        onRetry={fetchUsers}
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
      header: 'Name',
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
      header: 'Role',
      accessor: 'role',
      sortable: true,
      render: (val) => (
        <Badge variant={val === 'admin' ? 'danger' : val === 'staff' ? 'primary' : val === 'hod' ? 'warning' : 'neutral'}>
          {val ? val.toUpperCase() : 'STUDENT'}
        </Badge>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (val) => <Badge status={val}>{val}</Badge>
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleStatus(row)}
          >
            {row.status === 'Active' ? 'Disable' : 'Enable'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditUser({ ...row })}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => handleDeleteUser(row.id, row.name)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="User & Access Management"
        subtitle="Manage authentication credentials, institution roles, and authorization statuses directly in MySQL."
        actions={
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            Add New User
          </Button>
        }
      />

      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div style={{ flex: 1 }}>
          <SearchBar
            placeholder="Search users by name or email..."
            onSearch={setSearch}
          />
        </div>
        <Filter
          label="Filter by Role"
          options={[
            { label: 'All Roles', value: 'all' },
            { label: 'Students', value: 'student' },
            { label: 'Placement Staff', value: 'staff' },
            { label: 'Placement HOD', value: 'hod' },
            { label: 'Administrators', value: 'admin' }
          ]}
          value={roleFilter}
          onChange={setRoleFilter}
        />
      </div>

      {users.length === 0 ? (
        <EmptyState
          title="No users found."
          description="No user records match your query in MySQL User table."
        />
      ) : (
        <div className="card">
          <DataTable
            columns={columns}
            data={users}
            pageSize={10}
            searchPlaceholder="Search users in page..."
          />
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New User Account"
      >
        <form onSubmit={handleCreateUser}>
          <div className="form-group">
            <label className="form-label" htmlFor="new-name">Full Name</label>
            <input
              id="new-name"
              type="text"
              className="input-control"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="new-email">Email Address</label>
            <input
              id="new-email"
              type="email"
              className="input-control"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="new-pw">Password</label>
            <input
              id="new-pw"
              type="password"
              className="input-control"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="new-role">Role</label>
            <select
              id="new-role"
              className="input-control"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="STUDENT">Student</option>
              <option value="PLACEMENT_STAFF">Placement Staff</option>
              <option value="PLACEMENT_HOD">Placement HOD</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create User in MySQL</Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      {editUser && (
        <Modal
          isOpen={true}
          onClose={() => setEditUser(null)}
          title={`Edit User: ${editUser.name}`}
        >
          <form onSubmit={handleSaveEdit}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-name">Name</label>
              <input
                id="edit-name"
                type="text"
                className="input-control"
                value={editUser.name}
                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-email">Email</label>
              <input
                id="edit-email"
                type="email"
                className="input-control"
                value={editUser.email}
                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
              <Button variant="primary" type="submit">Update User in MySQL</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
