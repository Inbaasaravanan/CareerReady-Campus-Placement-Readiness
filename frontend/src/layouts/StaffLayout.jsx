import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';

export const StaffLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-main-wrapper">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          title="Placement Staff Workspace"
        />
        <main className="dashboard-content-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
