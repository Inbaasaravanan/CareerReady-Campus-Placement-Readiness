import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { checkBackendHealth } from '../../services/api';
import {
  MenuIcon,
  SearchIcon,
  BellIcon,
  SparklesIcon,
  CheckIcon,
  BuildingIcon,
  AlertTriangleIcon
} from '../common/Icons';
import { Badge } from '../common/Badge';

export const Topbar = ({ onToggleSidebar, title = 'Analytics Workspace' }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking'); // 'connected' | 'disconnected' | 'checking'

  // Live health check against GET /api/health
  useEffect(() => {
    let isMounted = true;
    const verifyHealth = async () => {
      const isHealthy = await checkBackendHealth();
      if (isMounted) {
        setBackendStatus(isHealthy ? 'connected' : 'disconnected');
      }
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const notifications = [
    {
      id: 1,
      type: 'drive',
      title: 'Placement Drives Active',
      description: 'Dynamic company matching connected to MySQL Company database.',
      time: 'Just now',
      icon: BuildingIcon
    },
    {
      id: 2,
      type: 'assessment',
      title: 'MCQ Assessment Pipeline',
      description: 'Questions served directly from MySQL Question bank.',
      time: 'Live',
      icon: CheckIcon
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getRoleDisplayName = (r) => {
    switch (r) {
      case 'student': return 'Student';
      case 'staff': return 'Placement Staff';
      case 'hod': return 'Placement HOD';
      case 'admin': return 'Administrator';
      default: return 'User';
    }
  };

  const getRoleBadgeVariant = (r) => {
    switch (r) {
      case 'student': return 'primary';
      case 'staff': return 'success';
      case 'hod': return 'warning';
      case 'admin': return 'danger';
      default: return 'primary';
    }
  };

  return (
    <header className="dashboard-topbar">
      {/* Left: Mobile Toggle, Breadcrumb, and Live Session Indicator */}
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Menu"
        >
          <MenuIcon width={20} height={20} />
        </button>

        <div className="topbar-breadcrumb">
          {/* Live Backend Connection Indicator */}
          <div
            className={`topbar-pulse-indicator ${backendStatus === 'disconnected' ? 'indicator-offline' : ''}`}
            title={backendStatus === 'connected' ? 'Spring Boot REST API & MySQL Connected' : 'Cannot reach backend server at http://localhost:8080/api'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: backendStatus === 'connected' ? '#ECFDF5' : '#FEF2F2',
              color: backendStatus === 'connected' ? '#047857' : '#B91C1C',
              border: `1px solid ${backendStatus === 'connected' ? '#A7F3D0' : '#FECACA'}`
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: backendStatus === 'connected' ? '#10B981' : '#EF4444'
              }}
            ></span>
            <span>
              {backendStatus === 'connected'
                ? 'Backend Connected'
                : backendStatus === 'disconnected'
                ? 'Backend Disconnected'
                : 'Connecting...'}
            </span>
          </div>

          <span className="topbar-separator">/</span>
          <span className="topbar-portal-name">CareerReady AI</span>
          <span className="topbar-separator">/</span>
          <span className="current">{title}</span>
        </div>
      </div>

      {/* Right: Notifications, User Identity, Role Badge, Logout */}
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Interactive Notification Bell */}
        <div className="topbar-action-item">
          <button
            type="button"
            className={`topbar-icon-button ${showNotifications ? 'active' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View System Notifications"
            title="System Placement Notifications"
          >
            <BellIcon width={18} height={18} />
            <span className="notification-ping-dot" />
          </button>

          {showNotifications && (
            <div
              className="topbar-notifications-dropdown"
              onMouseLeave={() => setShowNotifications(false)}
            >
              <div className="notifications-header">
                <div className="notifications-title">System Status</div>
                <span className="notifications-badge">Live DB</span>
              </div>
              <div className="notifications-list">
                {notifications.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <div key={item.id} className="notification-card-item">
                      <div className={`notification-item-icon ${item.type}`}>
                        <ItemIcon width={14} height={14} />
                      </div>
                      <div className="notification-item-content">
                        <div className="notification-item-title">{item.title}</div>
                        <div className="notification-item-desc">{item.description}</div>
                        <div className="notification-item-time">{item.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Identity and Role Badge */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right', display: 'none', md: 'block' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-navy-900)' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                {user.email}
              </div>
            </div>
            <Badge variant={getRoleBadgeVariant(role)}>
              {getRoleDisplayName(role)}
            </Badge>
          </div>
        )}

        {/* Clean Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Sign out of your session"
        >
          Logout
        </button>
      </div>
    </header>
  );
};
