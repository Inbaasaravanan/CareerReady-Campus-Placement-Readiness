import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/StateViews';
import {
  UsersIcon,
  BuildingIcon,
  BriefcaseIcon,
  LayersIcon,
  SettingsIcon
} from '../../components/common/Icons';

const formatLastLogin = (dateVal) => {
  if (!dateVal || dateVal === 'Never') return 'Never';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return 'Never';

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

export const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [u, pending] = await Promise.allSettled([
          adminService.getUsers(),
          adminService.getPendingApprovals()
        ]);
        if (u.status === 'fulfilled') setUsers(u.value || []);
        if (pending.status === 'fulfilled') setPendingCount((pending.value || []).length);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="System Administration Console"
        subtitle="Manage user authorizations, academic department taxonomy, corporate registries, and analytical cutoffs."
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/admin/approvals">
              <Button variant={pendingCount > 0 ? "primary" : "outline"}>
                Approvals {pendingCount > 0 ? `(${pendingCount})` : ''}
              </Button>
            </Link>
            <Link to="/admin/settings">
              <Button variant="outline" icon={SettingsIcon}>
                System Configuration
              </Button>
            </Link>
          </div>
        }
      />

      {pendingCount > 0 && (
        <div style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: 'var(--radius-md)',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <strong style={{ color: '#92400E', fontSize: '0.9375rem' }}>
              Action Required: {pendingCount} Pending Account Registration{pendingCount > 1 ? 's' : ''}
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: '#B45309' }}>
              New Staff or Administrator registration requests are awaiting designated administrator review and approval.
            </p>
          </div>
          <Link to="/admin/approvals">
            <Button variant="primary" size="sm">
              Review Approvals ({pendingCount})
            </Button>
          </Link>
        </div>
      )}

      <div className="dashboard-grid-4">
        <StatCard label="Registered Users" value={users.length} subtext="Across 4 System Roles" icon={UsersIcon} />
        <StatCard label="Departments" value="4" subtext="CSE, IT, ECE, MECH" icon={BuildingIcon} />
        <StatCard label="Recruiter Profiles" value="8" subtext="Tier-1 to Super Dream" icon={BriefcaseIcon} />
        <StatCard label="Skill Catalog" value="10" subtext="Hiring Taxonomies" icon={LayersIcon} />
      </div>

      <div className="card">
        <div className="section-title-bar">
          <div>
            <h3 className="section-heading-sm">Active System Users</h3>
            <p className="form-hint">Authorized accounts across Student, Staff, HOD, and Administrator levels</p>
          </div>
          <Link to="/admin/users">
            <Button variant="primary" size="sm">
              Manage Users
            </Button>
          </Link>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Last Login</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 5).map((u) => (
                <tr key={u.id}>
                  <td className="table-cell-bold">{u.name}</td>
                  <td>{u.email}</td>
                  <td><Badge variant="primary">{u.role.toUpperCase()}</Badge></td>
                  <td>{u.department || '-'}</td>
                  <td><Badge status={u.status}>{u.status}</Badge></td>
                  <td className="table-cell-mono">{formatLastLogin(u.lastLogin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
