import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { brandTheme } from '../../../styles/brandTheme';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'pending';
  department: string;
  createdAt: string;
}

const ProjectsList: React.FC = () => {
  const location = useLocation();
  const department = location.state?.department;
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading projects filtered by department
    const loadProjects = async () => {
      setLoading(true);
      // TODO: Replace with actual API call to load projects by department
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'User Authentication System',
          description: 'Implement secure user authentication and authorization',
          status: 'active',
          department: 'product-development',
          createdAt: '2024-01-15'
        },
        {
          id: '2',
          name: 'Community Forum',
          description: 'Build an interactive community forum for user discussions',
          status: 'pending',
          department: 'community-management',
          createdAt: '2024-01-20'
        },
        {
          id: '3',
          name: 'Mobile App Development',
          description: 'Create a mobile application for iOS and Android',
          status: 'active',
          department: 'product-development',
          createdAt: '2024-01-10'
        }
      ];

      // Filter projects by department
      const filteredProjects = mockProjects.filter(project => project.department === department);
      
      setTimeout(() => {
        setProjects(filteredProjects);
        setLoading(false);
      }, 1000);
    };

    loadProjects();
  }, [department]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return brandTheme.status.success;
      case 'pending':
        return brandTheme.status.warning;
      case 'completed':
        return brandTheme.status.info;
      default:
        return brandTheme.text.muted;
    }
  };

  const getStatusBackground = (status: string) => {
    switch (status) {
      case 'active':
        return brandTheme.status.successLight;
      case 'pending':
        return brandTheme.status.warningLight;
      case 'completed':
        return brandTheme.status.infoLight;
      default:
        return brandTheme.background.tertiary;
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: brandTheme.background.secondary }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
               style={{ borderColor: brandTheme.primary.navy }}></div>
          <p style={{ color: brandTheme.text.secondary }}>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-6"
      style={{ backgroundColor: brandTheme.background.secondary }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: brandTheme.primary.navy }}
          >
            Projects - {department === 'product-development' ? 'Product Development' : 'Community Management'}
          </h1>
          <p style={{ color: brandTheme.text.muted }}>
            View and manage your projects in list format
          </p>
        </div>

        {projects.length === 0 ? (
          <div 
            className="text-center py-12 rounded-lg"
            style={{ backgroundColor: brandTheme.background.primary }}
          >
            <p style={{ color: brandTheme.text.muted }}>No projects found for this department.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-6 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md"
                style={{
                  backgroundColor: brandTheme.background.primary,
                  borderColor: brandTheme.border.light
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 
                      className="text-xl font-semibold mb-2"
                      style={{ color: brandTheme.text.primary }}
                    >
                      {project.name}
                    </h3>
                    <p 
                      className="mb-3"
                      style={{ color: brandTheme.text.secondary }}
                    >
                      {project.description}
                    </p>
                    <div className="flex items-center space-x-4">
                      <span 
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: getStatusBackground(project.status),
                          color: getStatusColor(project.status)
                        }}
                      >
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </span>
                      <span 
                        className="text-sm"
                        style={{ color: brandTheme.text.muted }}
                      >
                        Created: {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsList;
