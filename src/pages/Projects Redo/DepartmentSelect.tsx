import React from 'react';
import { useNavigate } from 'react-router-dom';
import { brandTheme } from '../../styles/brandTheme';

const DepartmentSelect: React.FC = () => {
  const navigate = useNavigate();

  const departments = [
    {
      id: 'product-development',
      name: 'Product Development',
      description: 'Build and enhance our product features and capabilities',
      icon: '🚀'
    },
    {
      id: 'community-management',
      name: 'Community Management',
      description: 'Engage with and grow our user community',
      icon: '👥'
    }
  ];

  const handleDepartmentSelect = (departmentId: string) => {
    // Navigate to ViewSelect with department as a parameter
    navigate('/projects-redo/view-select', { 
      state: { department: departmentId } 
    });
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
          Select your Department
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {departments.map((department) => (
            <div
              key={department.id}
              className="aspect-square border-2 cursor-pointer transition-all duration-200 hover:shadow-lg flex flex-col items-center justify-center p-4 rounded-xl hover:shadow-md"
              style={{
                backgroundColor: brandTheme.background.primary,
                borderColor: brandTheme.primary.navy,
                borderWidth: '2px'
              }}
              onClick={() => handleDepartmentSelect(department.id)}
            >
              <div className="text-3xl mb-3">{department.icon}</div>
              <h3 
                className="text-lg font-semibold text-center"
                style={{ color: brandTheme.primary.navy }}
              >
                {department.name}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DepartmentSelect;
