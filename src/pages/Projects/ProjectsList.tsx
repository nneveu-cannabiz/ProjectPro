import React, { useState } from 'react';
import { PlusCircle, Search, LayoutGrid, List, RefreshCw, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import ProjectCard from '../../components/Project/ProjectCard';
import Modal from '../../components/ui/Modal';
import ProjectForm from '../../components/Project/ProjectForm';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import CollapsibleProjectItem from '../../components/Project/CollapsibleProjectItem';
import { brandTheme } from '../../styles/brandTheme';

const ProjectsList: React.FC = () => {
  const { projects, categories, tasks, subTasks, getUsers, isLoading, refreshData } = useAppContext();
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectTypeFilter, setProjectTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter projects based on search term, category, status, and project type
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === '' || project.category === categoryFilter;
    const matchesStatus = statusFilter === '' || project.status === statusFilter;
    const matchesProjectType = projectTypeFilter === '' || project.projectType === projectTypeFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesProjectType;
  });
  
  const handleCreateProject = () => {
    navigate('/projects/new');
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'card' ? 'list' : 'card');
  };
  
  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <div className="space-y-6" style={{ backgroundColor: brandTheme.background.primary }}>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h2 className="text-xl font-semibold" style={{ color: brandTheme.text.primary }}>All Projects</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 size={16} className="mr-1 animate-spin" />
            ) : (
              <RefreshCw size={16} className="mr-1" />
            )}
            Refresh
          </Button>
          <Button onClick={handleCreateProject} size="sm">
            <PlusCircle size={16} className="mr-1" />
            New Project
          </Button>
        </div>
      </div>
      
      <div style={{ 
        backgroundColor: brandTheme.background.primary,
        borderColor: brandTheme.border.light
      }} className="p-4 rounded-lg border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5" size={18} style={{ color: brandTheme.text.muted }} />
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2"
              style={{
                borderColor: brandTheme.border.medium,
                backgroundColor: brandTheme.background.primary,
                color: brandTheme.text.primary,
                '--tw-ring-color': brandTheme.primary.navy
              } as React.CSSProperties}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              className="p-2 border rounded-md focus:outline-none focus:ring-2"
              style={{
                borderColor: brandTheme.border.medium,
                backgroundColor: brandTheme.background.primary,
                color: brandTheme.text.primary,
                '--tw-ring-color': brandTheme.primary.navy
              } as React.CSSProperties}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            
            <select
              className="p-2 border rounded-md focus:outline-none focus:ring-2"
              style={{
                borderColor: brandTheme.border.medium,
                backgroundColor: brandTheme.background.primary,
                color: brandTheme.text.primary,
                '--tw-ring-color': brandTheme.primary.navy
              } as React.CSSProperties}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            
            <select
              className="p-2 border rounded-md focus:outline-none focus:ring-2"
              style={{
                borderColor: brandTheme.border.medium,
                backgroundColor: brandTheme.background.primary,
                color: brandTheme.text.primary,
                '--tw-ring-color': brandTheme.primary.navy
              } as React.CSSProperties}
              value={projectTypeFilter}
              onChange={(e) => setProjectTypeFilter(e.target.value)}
            >
              <option value="">All Project Types</option>
              <option value="Active">Active</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Future">Future</option>
              <option value="On Hold">On Hold</option>
            </select>
            
            <div style={{ borderColor: brandTheme.border.medium }} className="border rounded-md flex overflow-hidden">
              <button 
                className="p-2"
                style={{
                  backgroundColor: viewMode === 'card' ? brandTheme.primary.paleBlue : brandTheme.background.primary,
                  color: viewMode === 'card' ? brandTheme.primary.navy : brandTheme.text.secondary
                }}
                onClick={() => setViewMode('card')}
                title="Card View"
              >
                <LayoutGrid size={20} />
              </button>
              <button 
                className="p-2"
                style={{
                  backgroundColor: viewMode === 'list' ? brandTheme.primary.paleBlue : brandTheme.background.primary,
                  color: viewMode === 'list' ? brandTheme.primary.navy : brandTheme.text.secondary
                }}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div style={{ 
          backgroundColor: brandTheme.background.primary,
          borderColor: brandTheme.border.light
        }} className="flex items-center justify-center py-12 rounded-lg border">
          <Loader2 size={30} className="animate-spin mr-2" style={{ color: brandTheme.primary.navy }} />
          <p style={{ color: brandTheme.text.secondary }}>Loading projects...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div style={{ 
            backgroundColor: brandTheme.background.primary,
            borderColor: brandTheme.border.light
          }} className="rounded-lg border overflow-hidden">
            <div style={{ borderColor: brandTheme.border.light }} className="divide-y">
              {filteredProjects.map((project) => (
                <CollapsibleProjectItem key={project.id} project={project} />
              ))}
            </div>
          </div>
        )
      ) : (
        <div style={{ 
          backgroundColor: brandTheme.background.primary,
          borderColor: brandTheme.border.light
        }} className="text-center py-12 rounded-lg border">
          <p style={{ color: brandTheme.text.secondary }} className="mb-2">No projects found.</p>
          <p style={{ color: brandTheme.text.muted }} className="text-sm mb-4">
            {searchTerm || categoryFilter || statusFilter || projectTypeFilter ? 'Try adjusting your filters.' : 'Create your first project to get started.'}
          </p>
          {!searchTerm && !categoryFilter && !statusFilter && !projectTypeFilter && (
            <Button onClick={handleCreateProject} size="sm">
              Create Your First Project
            </Button>
          )}
        </div>
      )}
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
      >
        <ProjectForm onSubmit={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default ProjectsList;