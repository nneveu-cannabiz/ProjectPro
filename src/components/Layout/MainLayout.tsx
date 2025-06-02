import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLocation } from 'react-router-dom';

const getPageTitle = (pathname: string): string => {
  switch (true) {
    case pathname === '/dashboard':
      return 'Dashboard';
    case pathname === '/projects':
      return 'Projects';
    case pathname.startsWith('/projects/') && pathname.includes('/tasks/') && pathname.includes('/subtasks/'):
      return 'Subtask Details';
    case pathname.startsWith('/projects/') && pathname.includes('/tasks/'):
      return 'Task Details';
    case pathname.startsWith('/projects/'):
      return 'Project Details';
    case pathname === '/settings':
      return 'Settings';
    case pathname === '/todo':
      return 'My To Do List';
    case pathname === '/updates':
      return 'Updates';
    default:
      return 'ProjectPro';
  }
};

const MainLayout: React.FC = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-blue-25">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;