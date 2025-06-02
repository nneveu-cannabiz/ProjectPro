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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h2 className="text-xl font-semibold">All Projects</h2>
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
      
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            
            <select
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={projectTypeFilter}
              onChange={(e) => setProjectTypeFilter(e.target.value)}
            >
              <option value="">All Project Types</option>
              <option value="Active">Active</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Future">Future</option>
              <option value="On Hold">On Hold</option>
            </select>
            
            <div className="border border-gray-300 rounded-md flex overflow-hidden">
              <button 
                className={`p-2 ${viewMode === 'card' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600'}`}
                onClick={() => setViewMode('card')}
                title="Card View"
              >
                <LayoutGrid size={20} />
              </button>
              <button 
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600'}`}
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
        <div className="flex items-center justify-center py-12 bg-white rounded-lg border border-gray-200">
          <Loader2 size={30} className="animate-spin text-blue-500 mr-2" />
          <p className="text-gray-600">Loading projects...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <CollapsibleProjectItem key={project.id} project={project} />
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-2">No projects found.</p>
          <p className="text-gray-400 text-sm mb-4">
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