import React from 'react';
import { X, Tag } from 'lucide-react';
import Badge from '../../../../../../components/ui/Badge';
import DropdownMenu from '../../../../../../components/ui/DropdownMenu';
import { brandTheme } from '../../../../../../styles/brandTheme';

interface ProjectDetailsHeaderProps {
  project: any;
  projectMenuItems: any[];
  onClose: () => void;
  onRemoveTag: (tagToRemove: string) => void;
}

const ProjectDetailsHeader: React.FC<ProjectDetailsHeaderProps> = ({
  project,
  projectMenuItems,
  onClose,
  onRemoveTag
}) => {
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

  return (
    <div 
      className="flex items-center justify-between p-6"
      style={{ backgroundColor: brandTheme.primary.navy }}
    >
      <div className="flex-1">
        <h1 
          className="text-2xl font-bold"
          style={{ color: brandTheme.background.primary }}
        >
          {project.name} - Project
        </h1>
        <div className="flex items-center mt-2">
          <Badge variant={getProjectTypeVariant(project.projectType)} className="mr-2">
            {project.projectType}
          </Badge>
          <Badge variant="primary" className="mr-2">{project.category}</Badge>
          <Badge variant={getStatusVariant(project.status)} className="mr-2">
            {getStatusText(project.status)}
          </Badge>
          <span 
            className="text-sm mr-4"
            style={{ color: brandTheme.background.primary }}
          >
            Created: {new Date(project.createdAt).toLocaleDateString()}
          </span>
          {project.deadline && (
            <span 
              className="text-sm font-medium"
              style={{ color: '#FEF3C7' }}
            >
              Deadline: {new Date(project.deadline).toLocaleDateString()}
            </span>
          )}
          {typeof project.progress === 'number' && (
            <span 
              className="text-sm font-medium ml-4"
              style={{ color: brandTheme.background.primary }}
            >
              Progress: {project.progress}%
            </span>
          )}
        </div>
        
        {/* Tags Section */}
        {(project.tags && project.tags.length > 0) && (
          <div className="flex items-center mt-2 flex-wrap">
            <Tag size={16} className="mr-2" style={{ color: brandTheme.background.primary }} />
            {project.tags.map((tag: string, index: number) => (
              <div
                key={index}
                className="cursor-pointer hover:opacity-80 mr-2 mb-1"
                onClick={() => onRemoveTag(tag)}
                title="Click to remove tag"
              >
                <Badge 
                  variant="secondary" 
                >
                  {tag} ×
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <DropdownMenu items={projectMenuItems} />
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-blue-800 transition-colors"
          style={{
            color: brandTheme.background.primary
          }}
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};

export default ProjectDetailsHeader;
