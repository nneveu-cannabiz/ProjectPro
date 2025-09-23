import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

import CalendarGrid from './CalendarGrid';
import CalendarHeader from './CalendarHeader';
import SprintLegend from './SprintLegend';
import { fetchSprintGroupsForCalendar } from './utils/calendarUtils';

interface SprintCalendarMainProps {
  refreshTrigger?: number;
  onProjectClick?: (project: any) => void;
  onSprintReviewClick?: (project: any) => void;
}

interface SprintGroup {
  id: string;
  name: string;
  sprint_type: 'Sprint 1' | 'Sprint 2';
  project: {
    id: string;
    name: string;
  };
  tasks: Array<{
    id: string;
    name: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    priority?: string;
  }>;
}

const SprintCalendarMain: React.FC<SprintCalendarMainProps> = ({
  refreshTrigger,
  onProjectClick,
  onSprintReviewClick
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sprintGroups, setSprintGroups] = useState<SprintGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSprintGroups();
  }, [currentDate, refreshTrigger]);

  const loadSprintGroups = async () => {
    setIsLoading(true);
    try {
      const groups = await fetchSprintGroupsForCalendar(currentDate);
      setSprintGroups(groups);
    } catch (error) {
      console.error('Error loading sprint groups for calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div 
      className="border-t"
      style={{ 
        backgroundColor: brandTheme.background.primary,
        borderColor: brandTheme.border.light 
      }}
    >
      {/* Section Header */}
      <div 
        className="px-6 py-4 border-b"
        style={{ 
          backgroundColor: brandTheme.primary.navy,
          borderColor: brandTheme.border.brand 
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar 
              className="w-6 h-6" 
              style={{ color: brandTheme.background.primary }}
            />
            <div>
              <h2 
                className="text-xl font-bold"
                style={{ color: brandTheme.background.primary }}
              >
                Sprint Calendar
              </h2>
              <p 
                className="text-sm mt-1 opacity-90"
                style={{ color: brandTheme.background.primary }}
              >
                Timeline view of sprint groups and task schedules
              </p>
            </div>
          </div>

          {/* Calendar Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleToday}
              className="px-3 py-1 rounded-md text-sm font-medium transition-colors"
              style={{
                backgroundColor: brandTheme.background.primary,
                color: brandTheme.primary.navy,
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandTheme.background.secondary}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = brandTheme.background.primary}
            >
              Today
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousMonth}
                className="p-2 rounded-md transition-colors"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${brandTheme.background.primary}20`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <ChevronLeft 
                  className="w-5 h-5" 
                  style={{ color: brandTheme.background.primary }}
                />
              </button>
              
              <h3 
                className="text-lg font-semibold min-w-[160px] text-center"
                style={{ color: brandTheme.background.primary }}
              >
                {currentDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h3>
              
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-md transition-colors"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${brandTheme.background.primary}20`}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <ChevronRight 
                  className="w-5 h-5" 
                  style={{ color: brandTheme.background.primary }}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-6">
        {/* Legend */}
        <div className="mb-6">
          <SprintLegend />
        </div>

        {/* Calendar Header (Days of Week) */}
        <CalendarHeader />

        {/* Calendar Grid */}
        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div 
                className="animate-spin rounded-full h-8 w-8 border-b-2 mr-3"
                style={{ borderColor: brandTheme.primary.navy }}
              />
              <span style={{ color: brandTheme.text.secondary }}>Loading calendar...</span>
            </div>
          ) : (
            <CalendarGrid
              currentDate={currentDate}
              sprintGroups={sprintGroups}
              onProjectClick={onProjectClick}
              onSprintReviewClick={onSprintReviewClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SprintCalendarMain;
