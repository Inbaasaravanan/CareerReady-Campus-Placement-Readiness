import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout admin-dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-main-wrapper admin-main-wrapper">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title="System Administration Console"
        />
        <main className="dashboard-content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
