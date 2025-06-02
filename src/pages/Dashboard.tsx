import React, { useState, useEffect } from 'react';
import { PlusCircle, ListTodo, CheckCircle, Clock, RefreshCw, Loader2, WifiOff, AlertTriangle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import ProjectCard from '../components/Project/ProjectCard';
import useErrorHandling from '../hooks/useErrorHandling';
import PageErrorView from './PageErrorView';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { projects, tasks, isLoading: contextLoading, error: contextError, refreshData } = useAppContext();
  const { error, isLoading, clearError, handleError } = useErrorHandling();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Load data with error handling
  useEffect(() => {
    const loadData = async () => {
      if (!contextLoading) {
        try {
          await handleError(async () => {
            await refreshData();
            return true;
          });
        } catch (err) {
          console.error('Error loading dashboard data:', err);
        }
      }
    };
    
    loadData();
  }, []);
  
  // Calculate statistics
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const inProgressTasks = tasks.filter((task) => task.status === 'in-progress').length;
  
  // Project status counts
  const inProgressProjects = projects.filter((project) => project.status === 'in-progress').length;
  const completedProjects = projects.filter((project) => project.status === 'done').length;
  const todoProjects = projects.filter((project) => project.status === 'todo').length;
  
  // Get recent projects (up to 3)
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);
  
  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    clearError();
    
    try {
      await handleError(async () => {
        await refreshData();
        return true;
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Display error if there is one
  if (error || contextError) {
    return (
      <PageErrorView
        error={error || (contextError ? new Error(contextError) : null)}
        retryFn={handleRefresh}
      >
        {/* This won't render because there's an error */}
        <div></div>
      </PageErrorView>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Project Overview</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading || contextLoading || isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 size={16} className="mr-1 animate-spin" />
            ) : (
              <RefreshCw size={16} className="mr-1" />
            )}
            Refresh
          </Button>
          <Button onClick={() => navigate('/projects/new')} size="sm">
            <PlusCircle size={16} className="mr-1" />
            New Project
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ListTodo size={24} className="text-blue-500 mr-3" />
              <span className="text-2xl font-bold">{totalProjects}</span>
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>To Do: {todoProjects}</span>
              <span>In Progress: {inProgressProjects}</span>
              <span>Done: {completedProjects}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ListTodo size={24} className="text-gray-500 mr-3" />
              <span className="text-2xl font-bold">{totalTasks}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle size={24} className="text-green-500 mr-3" />
              <span className="text-2xl font-bold">{completedTasks}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock size={24} className="text-yellow-500 mr-3" />
              <span className="text-2xl font-bold">{inProgressTasks}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Projects</h2>
          <Button variant="outline" onClick={() => navigate('/projects')} size="sm">
            View All
          </Button>
        </div>
        
        {isLoading || contextLoading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
            <Loader2 size={30} className="animate-spin text-blue-500 mr-2" />
            <p className="text-gray-600">Loading projects...</p>
          </div>
        ) : recentProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No projects created yet.</p>
            <Button className="mt-4" onClick={() => navigate('/projects/new')} size="sm">
              Create Your First Project
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;