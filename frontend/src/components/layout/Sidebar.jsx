import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  DashboardIcon,
  UserIcon,
  FileTextIcon,
  TargetIcon,
  BriefcaseIcon,
  LayersIcon,
  BarChartIcon,
  UsersIcon,
  AlertTriangleIcon,
  BuildingIcon,
  SettingsIcon,
  LogOutIcon,
  XIcon,
  EditIcon,
  CheckIcon
} from '../common/Icons';

/**
 * Reusable role-based navigation configuration
 */
const navigationConfig = {
  student: [
    { to: '/student/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { to: '/student/profile', label: 'My Profile', icon: UserIcon },
    { to: '/student/assessment', label: 'Assessment', icon: FileTextIcon },
    { to: '/student/readiness', label: 'Readiness', icon: TargetIcon },
    { to: '/student/company-matching', label: 'Company Matches', icon: BriefcaseIcon },
    { to: '/student/skill-gap', label: 'Skill Gap Analysis', icon: LayersIcon }
  ],
  staff: [
    { to: '/staff/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { to: '/staff/students', label: 'My Students', icon: UsersIcon },
    { to: '/staff/at-risk', label: 'At-Risk Students', icon: AlertTriangleIcon },
    { to: '/staff/skill-gaps', label: 'Skill Gaps', icon: LayersIcon },
    { to: '/staff/company-matching', label: 'Company Matching', icon: BriefcaseIcon },
    { to: '/staff/profile', label: 'Profile', icon: UserIcon }
  ],
  hod: [
    { to: '/hod/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { to: '/hod/analytics', label: 'Readiness Analytics', icon: BarChartIcon },
    { to: '/hod/departments', label: 'Department Analytics', icon: BuildingIcon },
    { to: '/hod/at-risk', label: 'At-Risk Overview', icon: AlertTriangleIcon },
    { to: '/hod/companies', label: 'Company Analytics', icon: BriefcaseIcon },
    { to: '/hod/staff-monitoring', label: 'Staff Assignment & Monitoring', icon: UsersIcon },
    { to: '/hod/profile', label: 'Profile', icon: UserIcon }
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { to: '/admin/students', label: 'Students', icon: UserIcon },
    { to: '/admin/staff', label: 'Staff', icon: UsersIcon },
    { to: '/admin/hod', label: 'HOD', icon: BuildingIcon },
    { to: '/admin/approvals', label: 'Account Approvals', icon: CheckIcon },
    { to: '/admin/departments', label: 'Departments', icon: LayersIcon },
    { to: '/admin/companies', label: 'Companies', icon: BriefcaseIcon },
    { to: '/admin/skills', label: 'Skills', icon: TargetIcon },
    { to: '/admin/questions', label: 'Questions', icon: FileTextIcon },
    { to: '/admin/cms', label: 'CMS Studio', icon: EditIcon },
    { to: '/admin/settings', label: 'Settings', icon: SettingsIcon }
  ]
};

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/login', { replace: true });
  };

  const navItems = navigationConfig[role] || navigationConfig.student;

  const getDashboardHome = () => {
    switch (role) {
      case 'staff': return '/staff/dashboard';
      case 'hod': return '/hod/dashboard';
      case 'admin': return '/admin/dashboard';
      default: return '/student/dashboard';
    }
  };

  if (role === 'admin') {
    return (
      <>
        <aside
          className={`admin-rail-sidebar ${isOpen ? 'open' : ''}`}
          aria-label="System Administration Console"
        >
          {/* Mobile close button */}
          <button
            type="button"
            className="admin-rail-mobile-close"
            onClick={onClose}
            aria-label="Close Navigation"
          >
            <XIcon width={16} height={16} />
          </button>

          {/* Top Logo / Brand Zone */}
          <div className="admin-rail-top">
            <Link
              to="/admin/dashboard"
              className="admin-rail-logo-btn"
              title="CareerReady AI Admin Dashboard"
              aria-label="Admin Dashboard"
              onClick={onClose}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 17l6-6 4 4 8-8" />
                <path d="M14 7h7v7" />
                <circle cx="21" cy="7" r="1.5" fill="#FFFFFF" />
                <path d="M3 21h18" strokeWidth="1.5" strokeOpacity="0.7" />
              </svg>
            </Link>
            <div className="admin-rail-tooltip" role="tooltip">
              CareerReady AI Admin
            </div>
          </div>

          {/* Centered Navigation Icons (Middle Rail) */}
          <nav className="admin-rail-nav" aria-label="Admin Navigation Links">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.to} className="admin-rail-item-wrapper">
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `admin-rail-btn ${isActive ? 'active' : ''}`
                    }
                    title={item.label}
                    aria-label={item.label}
                  >
                    <Icon width={20} height={20} />
                  </NavLink>
                  <div className="admin-rail-tooltip" role="tooltip">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Bottom Section (Admin Avatar & Logout) */}
          <div className="admin-rail-bottom">
            {/* Admin Avatar Circle */}
            <div className="admin-rail-item-wrapper">
              <button
                type="button"
                className="admin-rail-avatar-btn"
                title={user?.name || 'Administrator'}
                aria-label="Admin Profile"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                A
              </button>
              {!profileMenuOpen && (
                <div className="admin-rail-tooltip" role="tooltip">
                  {user?.name || 'Administrator'} (Admin)
                </div>
              )}
            </div>

            {/* Profile Menu Popover if toggled */}
            {profileMenuOpen && (
              <div className="profile-menu-popover admin-rail-popover" role="dialog" aria-label="Admin Details">
                <div className="profile-menu-header">
                  <div className="profile-menu-name">{user?.name || 'Administrator'}</div>
                  <div className="profile-menu-email">{user?.email || 'inbaasara@gmail.com'}</div>
                  <div className="profile-menu-role">SYSTEM ADMIN</div>
                </div>
                <button
                  type="button"
                  className="profile-signout-btn"
                  onClick={handleLogout}
                >
                  <LogOutIcon width={16} height={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}

            {/* Logout Icon Button */}
            <div className="admin-rail-item-wrapper">
              <button
                type="button"
                className="admin-rail-btn admin-rail-logout-btn"
                onClick={handleLogout}
                title="Sign Out from Administration Console"
                aria-label="Sign Out"
              >
                <LogOutIcon width={20} height={20} />
              </button>
              <div className="admin-rail-tooltip admin-rail-logout-tooltip" role="tooltip">
                Logout
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Drawer Overlay */}
        <div
          className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
          onClick={onClose}
          aria-hidden="true"
        />
      </>
    );
  }

  return (
    <>
      <aside className={`curved-sidebar ${isOpen ? 'open' : ''}`} aria-label="Main Navigation Rail">

        {/* Mobile close button */}
        <button
          type="button"
          className="sidebar-mobile-close"
          onClick={onClose}
          aria-label="Close Navigation"
        >
          <XIcon width={16} height={16} />
        </button>

        {/* Top Logo Zone */}
        <div className="sidebar-logo-zone sidebar-item-wrapper">
          <Link
            to={getDashboardHome()}
            className="sidebar-logo-link"
            title="CareerReady AI Dashboard"
            aria-label="CareerReady AI Home"
            onClick={onClose}
          >
            {/* Custom Minimal White Monogram Mark */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 17l6-6 4 4 8-8" />
              <path d="M14 7h7v7" />
              <circle cx="21" cy="7" r="1.5" fill="#FFFFFF" />
              <path d="M3 21h18" strokeWidth="1.5" strokeOpacity="0.7" />
            </svg>
          </Link>
          <div className="sidebar-tooltip" role="tooltip">
            CareerReady AI
          </div>
        </div>

        {/* Navigation Rail (Icon-Only by default with clean hover tooltips) */}
        <nav className="sidebar-nav-rail" aria-label="Portal Modules">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.to} className="sidebar-item-wrapper">
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `sidebar-icon-btn ${isActive ? 'active' : ''}`
                  }
                  aria-label={item.label}
                  title={item.label}
                >
                  <Icon width={20} height={20} />
                </NavLink>

                {/* Subtle Hover Tooltip */}
                <div className="sidebar-tooltip" role="tooltip">
                  {item.label}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom Profile & Actions Zone */}
        <div className="sidebar-footer-zone">
          {/* User Profile Avatar with Popover */}
          <div className="sidebar-item-wrapper">
            <button
              type="button"
              className="sidebar-avatar-btn"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              title={user?.name || 'User Profile'}
              aria-label="User Account Menu"
              aria-expanded={profileMenuOpen}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </button>

            {/* Tooltip for avatar */}
            {!profileMenuOpen && (
              <div className="sidebar-tooltip">
                {user?.name || 'Account'} ({role?.toUpperCase()})
              </div>
            )}

            {/* Structured Profile Popover Menu */}
            {profileMenuOpen && (
              <div
                className="profile-menu-popover"
                onMouseLeave={() => setProfileMenuOpen(false)}
              >
                <div className="profile-menu-header">
                  <div className="profile-menu-name">{user?.name || 'Authorized User'}</div>
                  <div className="profile-menu-email">{user?.email || 'user@university.edu'}</div>
                  <span className="profile-menu-role">{role?.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
                  {user?.department || 'University Division'}
                </div>
                <button
                  type="button"
                  className="profile-signout-btn"
                  onClick={handleLogout}
                >
                  <LogOutIcon width={14} height={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Sign Out Action */}
          <div className="sidebar-item-wrapper">
            <button
              type="button"
              className="sidebar-icon-btn"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOutIcon width={18} height={18} />
            </button>
            <div className="sidebar-tooltip">
              Sign Out
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
    </>
  );
};
