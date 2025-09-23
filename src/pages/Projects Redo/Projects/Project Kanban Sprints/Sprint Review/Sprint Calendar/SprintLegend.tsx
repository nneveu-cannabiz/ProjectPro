import React from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Calendar, Target, Clock, AlertCircle } from 'lucide-react';

const SprintLegend: React.FC = () => {
  const legendItems = [
    {
      icon: Calendar,
      label: 'Sprint 1',
      color: brandTheme.primary.lightBlue,
      bgColor: brandTheme.primary.paleBlue
    },
    {
      icon: Target,
      label: 'Sprint 2',
      color: brandTheme.secondary.slate,
      bgColor: brandTheme.background.brandLight
    },
    {
      icon: Clock,
      label: 'In Progress',
      color: brandTheme.status.inProgress,
      bgColor: brandTheme.status.inProgressLight
    },
    {
      icon: AlertCircle,
      label: 'Overdue',
      color: brandTheme.status.error,
      bgColor: brandTheme.status.errorLight
    }
  ];

  return (
    <div className="flex items-center justify-between">
      <h3 
        className="text-lg font-semibold"
        style={{ color: brandTheme.text.primary }}
      >
        Calendar Legend
      </h3>
      
      <div className="flex items-center space-x-6">
        {legendItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <div key={item.label} className="flex items-center space-x-2">
              <div 
                className="p-2 rounded-md"
                style={{ backgroundColor: item.bgColor }}
              >
                <IconComponent 
                  className="w-4 h-4" 
                  style={{ color: item.color }}
                />
              </div>
              <span 
                className="text-sm font-medium"
                style={{ color: brandTheme.text.secondary }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SprintLegend;

