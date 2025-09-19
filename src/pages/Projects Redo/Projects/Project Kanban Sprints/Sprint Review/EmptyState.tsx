import React from 'react';
import { Clock } from 'lucide-react';
import { brandTheme } from '../../../../../styles/brandTheme';

interface EmptyStateProps {
  projectId: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ projectId }) => {
  return (
    <div 
      className="text-center py-12"
      style={{ color: brandTheme.text.muted }}
    >
      <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
      <h3 className="text-lg font-semibold mb-2">No Tasks Found</h3>
      <p>This project doesn't have any tasks yet.</p>
      <p className="text-xs mt-2">Project ID: {projectId}</p>
    </div>
  );
};

export default EmptyState;
