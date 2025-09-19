import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../styles/brandTheme';
import { X, Search } from 'lucide-react';
import { fetchProductDevelopmentProjects, updateProjectSprintColumn, SPRINT_COLUMN_TYPES } from './utils/sprintColumnUtils';

interface Project {
  id: string;
  name: string;
  description?: string;
  priority?: string;
  assignee_id?: string;
  created_at?: string;
}

interface ProjectSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: Project, columnType: string) => void;
  columnType: 'ongoing' | 'parkinglot';
  columnTitle: string;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  isOpen,
  onClose,
  onSelectProject,
  columnType,
  columnTitle
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const productDevProjects = await fetchProductDevelopmentProjects();
      setProjects(productDevProjects);
      setFilteredProjects(productDevProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
      setFilteredProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [searchTerm, projects]);

  const handleSelectProject = async (project: Project) => {
    try {
      setIsLoading(true);
      const dbColumnType = SPRINT_COLUMN_TYPES[columnType as keyof typeof SPRINT_COLUMN_TYPES];
      const success = await updateProjectSprintColumn(project.id, dbColumnType);
      
      if (success) {
        onSelectProject(project, columnType);
        onClose();
        setSearchTerm('');
      } else {
        console.error('Failed to update project sprint column');
        // You could show an error message to the user here
      }
    } catch (error) {
      console.error('Error selecting project:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        style={{ backgroundColor: brandTheme.background.primary }}
      >
        {/* Header */}
        <div 
          className="p-6 border-b flex items-center justify-between"
          style={{ borderColor: brandTheme.border.light }}
        >
          <div>
            <h2 
              className="text-xl font-bold"
              style={{ color: brandTheme.text.primary }}
            >
              Add Project to {columnTitle}
            </h2>
            <p 
              className="text-sm mt-1"
              style={{ color: brandTheme.text.secondary }}
            >
              Select a Product Development project to add to this column
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" style={{ color: brandTheme.text.muted }} />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b" style={{ borderColor: brandTheme.border.light }}>
          <div className="relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: brandTheme.text.muted }}
            />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                backgroundColor: brandTheme.background.primary,
                borderColor: brandTheme.border.medium,
                color: brandTheme.text.primary,
              }}
            />
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div 
                className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                style={{ borderColor: brandTheme.primary.navy }}
              />
              <p style={{ color: brandTheme.text.secondary }}>Loading projects...</p>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="space-y-3">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className="p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md"
                  style={{
                    backgroundColor: brandTheme.background.primary,
                    borderColor: brandTheme.border.light,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = brandTheme.border.brand;
                    e.currentTarget.style.backgroundColor = brandTheme.background.brandLight;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = brandTheme.border.light;
                    e.currentTarget.style.backgroundColor = brandTheme.background.primary;
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 
                        className="font-semibold text-base mb-2"
                        style={{ color: brandTheme.text.primary }}
                      >
                        {project.name}
                      </h3>
                      {project.description && (
                        <p 
                          className="text-sm mb-2"
                          style={{ color: brandTheme.text.secondary }}
                        >
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-3">
                        {project.priority && (
                          <span 
                            className="text-xs px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: `${getPriorityColor(project.priority)}20`,
                              color: getPriorityColor(project.priority),
                            }}
                          >
                            {project.priority} Priority
                          </span>
                        )}
                        <span 
                          className="text-xs"
                          style={{ color: brandTheme.text.muted }}
                        >
                          ID: {project.id}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p style={{ color: brandTheme.text.muted }}>
                {searchTerm ? 'No projects found matching your search.' : 'No Product Development projects available.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div 
          className="p-6 border-t flex justify-end space-x-3"
          style={{ borderColor: brandTheme.border.light }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg transition-colors"
            style={{
              backgroundColor: brandTheme.background.primary,
              borderColor: brandTheme.border.medium,
              color: brandTheme.text.secondary,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSelector;
