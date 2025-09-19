import React from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';

interface Project {
  id?: string | number;
  name?: string;
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: string;
  estimatedHours?: number;
  status?: string;
}

interface KanbanProjectContainerProps {
  project: Project;
  onProjectClick?: (project: Project) => void;
  onSprintReviewClick?: (project: Project) => void;
}

const KanbanProjectContainer: React.FC<KanbanProjectContainerProps> = ({ 
  project, 
  onProjectClick,
  onSprintReviewClick 
}) => {
  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return brandTheme.status.error;
      case 'high':
        return brandTheme.status.warning;
      case 'medium':
        return brandTheme.status.info;
      case 'low':
        return brandTheme.status.success;
      default:
        return brandTheme.text.muted;
    }
  };

  const getPriorityBgColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return brandTheme.status.errorLight;
      case 'high':
        return brandTheme.status.warningLight;
      case 'medium':
        return brandTheme.status.infoLight;
      case 'low':
        return brandTheme.status.successLight;
      default:
        return brandTheme.background.secondary;
    }
  };

  return (
    <div
      className="p-4 rounded-lg border shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md"
      style={{
        backgroundColor: brandTheme.background.primary,
        borderColor: brandTheme.border.light,
      }}
      onClick={() => onSprintReviewClick?.(project)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = brandTheme.border.brand;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = brandTheme.border.light;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Project Title - Clickable for Project Details */}
      <h4 
        className="font-semibold text-sm mb-2 line-clamp-2 cursor-pointer hover:underline transition-all"
        style={{ color: brandTheme.text.primary }}
        onClick={(e) => {
          e.stopPropagation();
          onProjectClick?.(project);
        }}
        title="Click to view project details"
      >
        {project.name || project.title || 'Untitled Project'}
      </h4>

      {/* Project Description */}
      {project.description && (
        <p 
          className="text-xs mb-3 line-clamp-2"
          style={{ color: brandTheme.text.secondary }}
        >
          {project.description}
        </p>
      )}

      {/* Priority Badge */}
      {project.priority && (
        <div 
          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-3"
          style={{
            backgroundColor: getPriorityBgColor(project.priority),
            color: getPriorityColor(project.priority),
          }}
        >
          <AlertCircle className="w-3 h-3 mr-1" />
          {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)} Priority
        </div>
      )}

      {/* Project Metadata */}
      <div className="space-y-2">
        {/* Assignee */}
        {project.assignee && (
          <div className="flex items-center text-xs">
            <User className="w-3 h-3 mr-2" style={{ color: brandTheme.text.muted }} />
            <span style={{ color: brandTheme.text.secondary }}>{project.assignee}</span>
          </div>
        )}

        {/* Due Date */}
        {project.dueDate && (
          <div className="flex items-center text-xs">
            <Calendar className="w-3 h-3 mr-2" style={{ color: brandTheme.text.muted }} />
            <span style={{ color: brandTheme.text.secondary }}>
              {new Date(project.dueDate).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Estimated Hours */}
        {project.estimatedHours && (
          <div className="flex items-center text-xs">
            <Clock className="w-3 h-3 mr-2" style={{ color: brandTheme.text.muted }} />
            <span style={{ color: brandTheme.text.secondary }}>
              {project.estimatedHours}h estimated
            </span>
          </div>
        )}
      </div>

      {/* Status Footer */}
      {project.status && (
        <div className="flex justify-end mt-3 pt-2 border-t">
          <span 
            className="text-xs px-2 py-1 rounded-full"
            style={{
              backgroundColor: brandTheme.background.secondary,
              color: brandTheme.text.muted,
            }}
          >
            {project.status}
          </span>
        </div>
      )}
    </div>
  );
};

export default KanbanProjectContainer;
