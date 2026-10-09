import React from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { PageHeader } from '../../../components/common/PageHeader';
import {
  DashboardIcon,
  LayersIcon,
  UserIcon,
  UsersIcon,
  BuildingIcon,
  BriefcaseIcon,
  FileTextIcon,
  TargetIcon,
  SparklesIcon,
  SettingsIcon,
  CheckIcon
} from '../../../components/common/Icons';

const CMS_NAV_ITEMS = [
  { to: '/admin/cms/landing', label: 'Landing Page', icon: SparklesIcon },
  { to: '/admin/cms/auth', label: 'Authentication', icon: UserIcon },
  { to: '/admin/cms/student', label: 'Student', icon: UserIcon },
  { to: '/admin/cms/staff', label: 'Placement Staff', icon: UsersIcon },
  { to: '/admin/cms/hod', label: 'Placement HOD', icon: BuildingIcon },
  { to: '/admin/cms/companies', label: 'Companies', icon: BriefcaseIcon },
  { to: '/admin/cms/assessments', label: 'Assessments', icon: FileTextIcon },
  { to: '/admin/cms/readiness', label: 'Readiness', icon: TargetIcon },
  { to: '/admin/cms/company-matching', label: 'Company Matching', icon: BriefcaseIcon },
  { to: '/admin/cms/media', label: 'Media', icon: SparklesIcon },
  { to: '/admin/cms/settings', label: 'Settings', icon: SettingsIcon }
];

export const AdminCmsLayout = () => {
  const location = useLocation();

  return (
    <div>
      <PageHeader
        title="Content Management System (CMS)"
        subtitle="Customize application presentation text, media, banners, labels, and global branding live without modifying source code."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left Sub-Sidebar for CMS Sections */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-primary)', marginBottom: '12px', paddingLeft: '8px' }}>
            CMS Sections
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {CMS_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              if (item.external) {
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'var(--color-text-secondary)',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)';
                      e.currentTarget.style.color = 'var(--color-navy-950)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--color-text-secondary)';
                    }}
                  >
                    <Icon width={16} height={16} />
                    <span>{item.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>&rarr;</span>
                  </Link>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    backgroundColor: isActive ? 'var(--color-primary-subtle, #EEF2FF)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)';
                      e.currentTarget.style.color = 'var(--color-navy-950)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--color-text-secondary)';
                    }
                  }}
                >
                  <Icon width={16} height={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Right Content Editor Area */}
        <div style={{ minWidth: 0 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
