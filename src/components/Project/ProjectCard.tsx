import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, CheckCircle, MessageSquare } from 'lucide-react';
import Badge from '../ui/Badge';
import { Project } from '../../types';
import { useAppContext } from '../../context/AppContext';
import UpdatesModal from '../Update/UpdatesModal';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const navigate = useNavigate();
  const { tasks, getUpdatesForEntity, getRelatedUpdates } = useAppContext();
  const [isUpdatesModalOpen, setIsUpdatesModalOpen] = useState(false);
  
  // Get tasks for this project
  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const completedTasks = projectTasks.filter((task) => task.status === 'done').length;
  const totalTasks = projectTasks.length;
  
  // Get updates for this project
  const directUpdates = getUpdatesForEntity('project', project.id);
  const allRelatedUpdates = getRelatedUpdates('project', project.id);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'todo':
        return 'default';
      case 'in-progress':
        return 'warning';
      case 'done':
        return 'success';
      default:
        return 'default';
    }
  };
  
  // Get project type badge variant
  const getProjectTypeVariant = (type: string) => {
    switch (type) {
      case 'Active':
        return 'success';
      case 'Upcoming':
        return 'primary';
      case 'Future':
        return 'secondary';
      case 'On Hold':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // Get priority badge variant
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'critical';
      case 'High':
        return 'high';
      case 'Medium':
        return 'medium';
      case 'Low':
        return 'low';
      default:
        return 'medium';
    }
  };
  
  // Format status text for display
  const getStatusText = (status: string) => {
    switch (status) {
      case 'todo':
        return 'To Do';
      case 'in-progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  const handleClick = () => {
    navigate(`/projects/${project.id}`);
  };
  
  const handleUpdatesClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUpdatesModalOpen(true);
  };

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer" 
        onClick={handleClick}
      >
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
              <div className="flex mt-1 space-x-2">
                <Badge variant={getProjectTypeVariant(project.projectType)}>
                  {project.projectType}
                </Badge>
                <Badge variant={getPriorityVariant(project.priority)}>
                  {project.priority}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">{project.description}</p>
            </div>
            <div className="flex space-x-2">
              <Badge variant="primary">{project.category}</Badge>
              <Badge variant={getStatusVariant(project.status)}>
                {getStatusText(project.status)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar size={16} />
              <span>Created: {formatDate(project.createdAt)}</span>
            </div>
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <CheckCircle size={16} className="text-green-500 mr-1" />
                <span className="text-sm">
                  {completedTasks}/{totalTasks} tasks
                </span>
              </div>
              {directUpdates.length > 0 && (
                <button 
                  className="flex items-center mr-4 text-blue-500 hover:text-blue-700"
                  onClick={handleUpdatesClick}
                >
                  <MessageSquare size={16} className="mr-1" />
                  <span className="text-sm">
                    {directUpdates.length}
                  </span>
                </button>
              )}
              <ArrowRight size={18} className="text-blue-500" />
            </div>
          </div>
        </div>
      </div>
      
      <UpdatesModal
        isOpen={isUpdatesModalOpen}
        onClose={() => setIsUpdatesModalOpen(false)}
        entityType="project"
        entityId={project.id}
        entityName={project.name}
        directUpdates={directUpdates}
        relatedUpdates={allRelatedUpdates}
      />
    </>
  );
};

export default ProjectCard;