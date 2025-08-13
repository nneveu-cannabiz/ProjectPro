import React, { useEffect, useState } from 'react';
import { Target } from 'lucide-react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { fetchOKRProjects } from '../../../../../data/supabase-store';

interface OKRProject {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  tags: string[] | null;
  start_date: string | null;
  end_date: string | null;
}

const OKRPriorities: React.FC = () => {
  const [okrProjects, setOkrProjects] = useState<OKRProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOKRProjects();
  }, []);

  const loadOKRProjects = async () => {
    setLoading(true);
    try {
      const okrProjects = await fetchOKRProjects('Product Development');
      setOkrProjects(okrProjects);
    } catch (error) {
      console.error('Error loading OKR projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return brandTheme.status.warning;
      case 'in-progress':
        return brandTheme.status.info;
      case 'done':
        return brandTheme.status.success;
      default:
        return brandTheme.text.muted;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'text-red-600';
      case 'High':
        return 'text-orange-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'Low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div 
        className="p-4"
        style={{ backgroundColor: brandTheme.background.primary, borderRadius: '8px', border: `1px solid ${brandTheme.border.light}` }}
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mr-3" 
               style={{ borderColor: brandTheme.primary.navy }}></div>
          <p style={{ color: brandTheme.text.secondary }}>Loading OKR projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-4"
      style={{ backgroundColor: brandTheme.background.primary, borderRadius: '8px', border: `1px solid ${brandTheme.border.light}` }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Target size={20} className="mr-2" style={{ color: brandTheme.primary.navy }} />
            <h2 
              className="text-xl font-bold"
              style={{ color: brandTheme.primary.navy }}
            >
              OKRs
            </h2>
          </div>
          <p className="text-sm" style={{ color: brandTheme.text.muted }}>
            Objective and Key Results projects for Product Development
          </p>
        </div>

        {/* OKR Projects List */}
        {okrProjects.length === 0 ? (
          <div 
            className="text-center py-6 rounded-lg border-2 border-dashed"
            style={{ 
              backgroundColor: brandTheme.background.secondary,
              borderColor: brandTheme.border.light
            }}
          >
            <Target size={32} className="mx-auto mb-2 opacity-50" style={{ color: brandTheme.text.muted }} />
            <p className="text-sm" style={{ color: brandTheme.text.muted }}>
              No OKR projects found for Product Development.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {okrProjects.map((project) => (
              <OKRProjectCard
                key={project.id}
                project={project}
                getStatusColor={getStatusColor}
                getPriorityColor={getPriorityColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface OKRProjectCardProps {
  project: OKRProject;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

const OKRProjectCard: React.FC<OKRProjectCardProps> = ({
  project,
  getStatusColor,
  getPriorityColor
}) => {
  return (
    <div 
      className="p-4 rounded-lg border"
      style={{ 
        backgroundColor: brandTheme.background.secondary,
        borderColor: brandTheme.border.light
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 
            className="text-lg font-semibold mb-2"
            style={{ color: brandTheme.primary.navy }}
          >
            {project.name}
          </h3>
          {project.description && (
            <p 
              className="mb-2 text-sm"
              style={{ color: brandTheme.text.secondary }}
            >
              {project.description}
            </p>
          )}
          <div className="flex items-center space-x-4">
            <span 
              className="px-2 py-1 rounded text-sm font-medium"
              style={{ 
                backgroundColor: getStatusColor(project.status) + '20',
                color: getStatusColor(project.status)
              }}
            >
              {project.status}
            </span>
            <span className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
              {project.priority} Priority
            </span>
            <span 
              className="text-sm"
              style={{ color: brandTheme.text.muted }}
            >
              Category: {project.category}
            </span>
          </div>
          {project.start_date && project.end_date && (
            <div className="mt-2 text-sm" style={{ color: brandTheme.text.muted }}>
              <span>Duration: {new Date(project.start_date).toLocaleDateString()} - {new Date(project.end_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center">
          <Target size={16} className="text-blue-600" />
          <span className="ml-1 text-xs font-medium text-blue-600">OKR</span>
        </div>
      </div>
    </div>
  );
};

export default OKRPriorities;
