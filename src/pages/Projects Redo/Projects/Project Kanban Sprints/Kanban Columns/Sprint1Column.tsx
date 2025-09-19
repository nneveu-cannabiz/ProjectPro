import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { supabase } from '../../../../../lib/supabase';
import SprintGroupContainer from '../Kanban Project Container/SprintGroupContainer';
import SprintColumnHeader from './SprintColumnHeader';

interface Sprint1ColumnProps {
  onProjectClick?: (project: any) => void;
  onSprintReviewClick?: (project: any) => void;
  refreshTrigger?: number; // Used to trigger refresh from parent
}

const Sprint1Column: React.FC<Sprint1ColumnProps> = ({ onProjectClick, onSprintReviewClick, refreshTrigger }) => {
  const [sprintGroupCount, setSprintGroupCount] = useState(0);

  useEffect(() => {
    fetchSprintGroupCount();
  }, [refreshTrigger]); // Refetch when refreshTrigger changes

  const fetchSprintGroupCount = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('PMA_Sprints')
        .select('id')
        .eq('sprint_type', 'Sprint 1')
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching Sprint 1 group count:', error);
        return;
      }

      setSprintGroupCount(data?.length || 0);
    } catch (error) {
      console.error('Error fetching Sprint 1 group count:', error);
    }
  };
  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className="rounded-t-lg border-t-8" style={{ borderTopColor: brandTheme.status.info }}>
        {/* Header Title */}
        <div 
          className="p-4 border-b-2"
          style={{ 
            backgroundColor: brandTheme.primary.navy,
            borderBottomColor: brandTheme.border.brand,
            color: brandTheme.background.primary
          }}
        >
          <h3 className="text-lg font-bold text-white">Sprint 1</h3>
        </div>
      </div>

      {/* Sprint Summary Header */}
      <SprintColumnHeader 
        sprintType="Sprint 1"
        refreshTrigger={refreshTrigger}
        sprintGroupCount={sprintGroupCount}
      />

      {/* Sprint Group Count - Moved below summary */}
      <div 
        className="px-4 py-2"
        style={{ 
          backgroundColor: brandTheme.gray[100],
          color: brandTheme.text.secondary
        }}
      >
        <span className="text-sm">{sprintGroupCount} sprint groups</span>
      </div>
      
      {/* Column Content */}
      <div 
        className="flex-1 p-4 space-y-3 overflow-y-auto"
        style={{ 
          backgroundColor: brandTheme.background.brandLight,
          minHeight: '400px'
        }}
      >
        <SprintGroupContainer 
          sprintType="Sprint 1"
          onProjectClick={onProjectClick}
          onSprintReviewClick={onSprintReviewClick}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
};

export default Sprint1Column;
