import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Auth/Login';
import ErrorBoundary from './components/ErrorBoundary';
import PageErrorFallback from './components/PageErrorFallback';
import './index.css';

// Lazy-load pages to reduce initial load time and isolate errors
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectsList = lazy(() => import('./pages/Projects/ProjectsList'));
const NewProject = lazy(() => import('./pages/Projects/NewProject'));
const ProjectDetails = lazy(() => import('./pages/Projects/ProjectDetails'));
const TaskDetails = lazy(() => import('./pages/Tasks/TaskDetails'));
const SubTaskDetails = lazy(() => import('./pages/Tasks/SubTaskDetails'));
const Settings = lazy(() => import('./pages/Settings'));
const MyToDoList = lazy(() => import('./pages/MyToDoList'));
const Updates = lazy(() => import('./pages/Updates'));

// Loading fallback for lazy-loaded components
const PageLoader = () => (
  <div className="flex items-center justify-center h-[70vh]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading page...</p>
    </div>
  </div>
);

// Wrap page with error handling
const ErrorBoundaryWrapper = ({ children, pageName }: { children: React.ReactNode, pageName: string }) => {
  return (
    <ErrorBoundary
      pageName={pageName}
      fallback={<PageErrorFallback error={new Error(`Failed to load ${pageName}`)} pageName={pageName} />}
    >
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/projects\" replace />} />
                <Route path="dashboard" element={
                  <ErrorBoundaryWrapper pageName="Dashboard">
                    <Dashboard />
                  </ErrorBoundaryWrapper>
                } />
                <Route path="projects" element={
                  <ErrorBoundaryWrapper pageName="Projects List">
                    <ProjectsList />
                  </ErrorBoundaryWrapper>
                } />
                <Route path="projects/new" element={
                  <ErrorBoundaryWrapper pageName="New Project">
                    <NewProject />
                  </ErrorBoundaryWrapper>
                } />
                <Route path="projects/:projectId" element={
                  <ErrorBoundaryWrapper pageName="Project Details">
                    <ProjectDetails />
                  </ErrorBoundaryWrapper>
                } />
                <Route path="projects/:projectId/tasks/:taskId" element={
                  <ErrorBoundaryWrapper pageName="Task Details">
                    <TaskDetails />
                  </ErrorBoundaryWrapper>
                } />
                <Route path="projects/:projectId/tasks/:taskId/subtasks/:subTaskId" element={
                  <ErrorBoundaryWrapper pageName="Subtask Details">
                    <SubTaskDetails />
                  </ErrorBoundaryWrapper>
                } />
                <Route path="settings" element={
                  <ErrorBoundaryWrapper pageName="Settings">
                    <Settings />
                  </ErrorBoundaryWrapper>
                } />
                <Route path="todo" element={
                  <ErrorBoundaryWrapper pageName="My To Do List">
                    <MyToDoList />
                  </ErrorBoundaryWrapper>
                } />
                <Route path="updates" element={
                  <ErrorBoundaryWrapper pageName="Updates">
                    <Updates />
                  </ErrorBoundaryWrapper>
                } />
              </Route>
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/projects\" replace />} />
            </Routes>
          </Router>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;