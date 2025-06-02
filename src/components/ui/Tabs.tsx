import React from 'react';

interface TabsProps {
  children: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ 
  children, 
  value, 
  onChange,
  className = ''
}) => {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <div className="flex space-x-1">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<TabProps>, {
              isActive: child.props.value === value,
              onClick: () => onChange(child.props.value),
            });
          }
          return child;
        })}
      </div>
    </div>
  );
};

interface TabProps {
  value: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export const Tab: React.FC<TabProps> = ({ 
  label, 
  isActive = false, 
  onClick 
}) => {
  return (
    <button
      className={`px-4 py-2 border-b-2 text-sm font-medium ${
        isActive
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};