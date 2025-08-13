import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { brandTheme } from '../../styles/brandTheme';

const ViewSelect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const department = location.state?.department;

  const views = [
    {
      id: 'list',
      name: 'List',
      description: 'View projects in a traditional list format',
      icon: '📋'
    },
    {
      id: 'flow-chart',
      name: 'Flow Chart',
      description: 'View projects in a visual flow chart format',
      icon: '📊'
    }
  ];

  const handleViewSelect = (viewId: string) => {
    if (viewId === 'list') {
      navigate('/projects-redo/projects-list', { 
        state: { department } 
      });
    } else if (viewId === 'flow-chart') {
      navigate('/projects-redo/projects-flow-chart', { 
        state: { department } 
      });
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: brandTheme.background.secondary }}
    >
      <div className="w-full max-w-4xl">
        <h1 
          className="text-3xl font-bold text-center mb-8"
          style={{ color: brandTheme.primary.navy }}
        >
          Select View Type
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {views.map((view) => (
            <div
              key={view.id}
              className="aspect-square border-2 cursor-pointer transition-all duration-200 hover:shadow-lg flex flex-col items-center justify-center p-4 rounded-xl hover:shadow-md"
              style={{
                backgroundColor: brandTheme.background.primary,
                borderColor: brandTheme.primary.navy,
                borderWidth: '2px'
              }}
              onClick={() => handleViewSelect(view.id)}
            >
              <div className="text-3xl mb-3">{view.icon}</div>
              <h3 
                className="text-lg font-semibold text-center"
                style={{ color: brandTheme.primary.navy }}
              >
                {view.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewSelect;
