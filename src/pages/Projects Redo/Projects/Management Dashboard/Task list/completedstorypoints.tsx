import React, { useEffect, useState } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { Target, Loader } from 'lucide-react';
import { supabase } from '../../../../../lib/supabase';

interface CompletedStoryPointsProps {
  allTaskIds: string[]; // All task IDs in the sprint group
  completedTaskIds: string[]; // Completed task IDs shown in the Gantt chart
}

const CompletedStoryPoints: React.FC<CompletedStoryPointsProps> = ({ 
  allTaskIds, 
  completedTaskIds 
}) => {
  const [loading, setLoading] = useState(true);
  const [totalStoryPoints, setTotalStoryPoints] = useState(0);
  const [completedStoryPoints, setCompletedStoryPoints] = useState(0);

  useEffect(() => {
    const fetchStoryPoints = async () => {
      setLoading(true);
      try {
        // Fetch all planning hours (story points) for all tasks in the sprint
        const { data: allHours, error: allError } = await (supabase as any)
          .from('PMA_Hours')
          .select('hours, task_id')
          .in('task_id', allTaskIds)
          .eq('is_planning_hours', true);

        if (allError) {
          console.error('Error fetching all story points:', allError);
          return;
        }

        // Calculate total story points
        const total = (allHours || []).reduce((sum: number, hour: any) => sum + (hour.hours || 0), 0);
        setTotalStoryPoints(total);

        // Calculate completed story points (only for completed tasks)
        const completed = (allHours || [])
          .filter((hour: any) => completedTaskIds.includes(hour.task_id))
          .reduce((sum: number, hour: any) => sum + (hour.hours || 0), 0);
        setCompletedStoryPoints(completed);

      } catch (error) {
        console.error('Error calculating story points:', error);
      } finally {
        setLoading(false);
      }
    };

    if (allTaskIds.length > 0) {
      fetchStoryPoints();
    } else {
      setLoading(false);
    }
  }, [allTaskIds, completedTaskIds]);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader className="w-4 h-4 animate-spin" style={{ color: brandTheme.primary.navy }} />
        <span className="text-sm" style={{ color: brandTheme.text.secondary }}>
          Loading...
        </span>
      </div>
    );
  }

  const percentage = totalStoryPoints > 0 
    ? Math.round((completedStoryPoints / totalStoryPoints) * 100) 
    : 0;

  return (
    <div className="flex items-center gap-2">
      <Target className="w-5 h-5" style={{ color: brandTheme.primary.lightBlue }} />
      <div className="flex items-center gap-1">
        <span className="text-sm font-semibold" style={{ color: brandTheme.primary.navy }}>
          {completedStoryPoints.toFixed(1)}
        </span>
        <span className="text-sm" style={{ color: brandTheme.text.secondary }}>
          /
        </span>
        <span className="text-sm font-semibold" style={{ color: brandTheme.text.secondary }}>
          {totalStoryPoints.toFixed(1)}
        </span>
        <span className="text-sm" style={{ color: brandTheme.text.secondary }}>
          Story Points
        </span>
      </div>
      <span
        className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold"
        style={{
          backgroundColor: brandTheme.primary.lightBlue + '20',
          color: brandTheme.primary.navy,
        }}
      >
        {percentage}%
      </span>
    </div>
  );
};

export default CompletedStoryPoints;

