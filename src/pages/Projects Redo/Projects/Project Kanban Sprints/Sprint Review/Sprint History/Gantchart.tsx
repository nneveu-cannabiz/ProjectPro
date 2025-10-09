import React, { useMemo } from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Calendar } from 'lucide-react';

interface SprintGroup {
  id: string;
  name: string;
  sprint_type: string;
  created_at: string;
  sprint_id: string | null;
  start_date: string | null;
  end_date: string | null;
  selected_task_ids: string[];
}

interface HistoricalSprint {
  sprint_id: string;
  groups: SprintGroup[];
  start_date: string | null;
  end_date: string | null;
}

interface GanttChartProps {
  sprints: HistoricalSprint[];
}

const GanttChart: React.FC<GanttChartProps> = ({ sprints }) => {

  const { timelineStart, timelineEnd, totalDays, sprintsWithPositions } = useMemo(() => {
    if (sprints.length === 0) {
      return { timelineStart: new Date(), timelineEnd: new Date(), totalDays: 0, sprintsWithPositions: [] };
    }

    // Helper to determine sprint status
    const getSprintStatus = (sprint: HistoricalSprint): 'active' | 'upcoming' | 'completed' => {
      if (!sprint.start_date || !sprint.end_date) return 'upcoming';
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const start = new Date(sprint.start_date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(sprint.end_date);
      end.setHours(0, 0, 0, 0);

      if (now < start) return 'upcoming';
      if (now > end) return 'completed';
      return 'active';
    };

    // Sort sprints: Active first, then Upcoming (soonest first), then Completed (most recent first)
    const sortedSprints = [...sprints].sort((a, b) => {
      const statusA = getSprintStatus(a);
      const statusB = getSprintStatus(b);

      // Priority order: active > upcoming > completed
      const statusPriority = { active: 0, upcoming: 1, completed: 2 };
      
      if (statusPriority[statusA] !== statusPriority[statusB]) {
        return statusPriority[statusA] - statusPriority[statusB];
      }

      // Within same status, sort by date
      if (!a.start_date || !b.start_date) return 0;
      
      if (statusA === 'upcoming') {
        // Upcoming: soonest first (ascending)
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      } else {
        // Active or Completed: most recent first (descending)
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
      }
    });

    // Set timeline to start 1 week before today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Find the latest end date from sprints
    let latestEnd: Date = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // Default to 2 weeks from now
    
    sortedSprints.forEach((sprint) => {
      if (sprint.end_date) {
        const endDate = new Date(sprint.end_date);
        if (endDate > latestEnd) {
          latestEnd = endDate;
        }
      }
    });

    // Timeline starts 1 week ago, ends 2 weeks after the latest sprint (or 2 weeks from now if no future sprints)
    const start = oneWeekAgo;
    const paddingDays = 14;
    const end = new Date(latestEnd.getTime() + paddingDays * 24 * 60 * 60 * 1000);
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Calculate positions for each sprint (already sorted by date)
    const sprintsWithPos = sortedSprints
      .filter((sprint) => sprint.start_date && sprint.end_date)
      .map((sprint) => {
        const sprintStart = new Date(sprint.start_date!);
        const sprintEnd = new Date(sprint.end_date!);
        
        const startOffset = Math.floor((sprintStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const duration = Math.ceil((sprintEnd.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24));
        
        const leftPercent = (startOffset / diffDays) * 100;
        const widthPercent = (duration / diffDays) * 100;

        // Determine status
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        let status: 'upcoming' | 'active' | 'completed';
        
        if (now < sprintStart) {
          status = 'upcoming';
        } else if (now > sprintEnd) {
          status = 'completed';
        } else {
          status = 'active';
        }

        // Calculate positions for sprint groups within this sprint
        const groupsWithPositions = sprint.groups.map((group) => {
          const groupStartOffset = Math.floor((sprintStart.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          const groupDuration = Math.ceil((sprintEnd.getTime() - sprintStart.getTime()) / (1000 * 60 * 60 * 24));
          
          const groupLeftPercent = (groupStartOffset / diffDays) * 100;
          const groupWidthPercent = (groupDuration / diffDays) * 100;

          return {
            ...group,
            leftPercent: groupLeftPercent,
            widthPercent: groupWidthPercent,
          };
        });

        return {
          ...sprint,
          leftPercent,
          widthPercent,
          status,
          startDate: sprintStart,
          endDate: sprintEnd,
          groupsWithPositions,
        };
      });

    return {
      timelineStart: start,
      timelineEnd: end,
      totalDays: diffDays,
      sprintsWithPositions: sprintsWithPos,
    };
  }, [sprints]);

  // Note: Sprint groups are shown when sprint is expanded via the chevron button

  const calculateTotalHeight = () => {
    let totalHeight = 0;
    sprintsWithPositions.forEach((sprint) => {
      // Sprint header + all its groups (always shown)
      const groupHeight = Math.max(sprint.groups.length * 32, 40); // Minimum 40px for sprint bar
      totalHeight += groupHeight + 20; // 20px margin between sprints
    });
    return totalHeight + 40;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: 'upcoming' | 'active' | 'completed') => {
    switch (status) {
      case 'upcoming':
        return brandTheme.primary.lightBlue;
      case 'active':
        return '#f59e0b'; // Orange
      case 'completed':
        return brandTheme.status.success;
    }
  };

  const generateWeekMarkers = () => {
    const markers: { date: Date; position: number; label: string; isMonthStart: boolean; dayType: 'monday' | 'friday' }[] = [];
    const current = new Date(timelineStart);
    
    // Start at the beginning of the week (Sunday)
    current.setDate(current.getDate() - current.getDay());
    
    while (current <= timelineEnd) {
      // Add Monday marker (day 1 of week)
      const monday = new Date(current);
      monday.setDate(monday.getDate() + 1); // Monday is day 1
      
      if (monday <= timelineEnd) {
        const mondayPosition = ((monday.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
        const isMonthStart = monday.getDate() <= 7;
        
        markers.push({
          date: new Date(monday),
          position: mondayPosition,
          label: monday.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
          }),
          isMonthStart,
          dayType: 'monday',
        });
      }
      
      // Add Friday marker (day 5 of week)
      const friday = new Date(current);
      friday.setDate(friday.getDate() + 5); // Friday is day 5
      
      if (friday <= timelineEnd) {
        const fridayPosition = ((friday.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
        const isMonthStart = friday.getDate() <= 7;
        
        markers.push({
          date: new Date(friday),
          position: fridayPosition,
          label: friday.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
          }),
          isMonthStart,
          dayType: 'friday',
        });
      }
      
      // Move to next week
      current.setDate(current.getDate() + 7);
    }
    
    return markers;
  };

  const weekMarkers = generateWeekMarkers();

  // Calculate today's position
  const today = new Date();
  const todayPosition = ((today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
  const showTodayMarker = todayPosition >= 0 && todayPosition <= 100;

  if (sprints.length === 0 || sprintsWithPositions.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-lg shadow-sm p-6"
      style={{ backgroundColor: brandTheme.background.secondary }}
    >
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5" style={{ color: brandTheme.primary.navy }} />
        <h2 className="text-xl font-bold" style={{ color: brandTheme.text.primary }}>
          Sprint Timeline
        </h2>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: brandTheme.primary.lightBlue }}
          />
          <span className="text-sm" style={{ color: brandTheme.text.secondary }}>
            Upcoming
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: '#f59e0b' }}
          />
          <span className="text-sm" style={{ color: brandTheme.text.secondary }}>
            Active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: brandTheme.status.success }}
          />
          <span className="text-sm" style={{ color: brandTheme.text.secondary }}>
            Completed
          </span>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="relative">
        {/* Timeline header with week markers */}
        <div className="relative h-10 mb-2">
          <div className="absolute inset-0 flex">
            {weekMarkers.map((marker, index) => (
              <div
                key={index}
                className="absolute"
                style={{
                  left: `${marker.position}%`,
                }}
              >
                <div className="flex flex-col items-start">
                  <div
                    className="h-3 w-px"
                    style={{ 
                      backgroundColor: marker.isMonthStart 
                        ? brandTheme.primary.navy 
                        : (marker.dayType === 'monday' ? brandTheme.border.medium : brandTheme.border.light)
                    }}
                  />
                  <span
                    className={`text-xs mt-1 whitespace-nowrap ${marker.isMonthStart ? 'font-bold' : 'font-medium'}`}
                    style={{ 
                      color: marker.isMonthStart 
                        ? brandTheme.primary.navy 
                        : (marker.dayType === 'monday' ? brandTheme.text.primary : brandTheme.text.secondary)
                    }}
                  >
                    {marker.dayType === 'monday' ? 'Mon ' : 'Fri '}
                    {marker.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline grid */}
        <div
          className="relative rounded-lg border overflow-hidden"
          style={{
            backgroundColor: brandTheme.background.primary,
            borderColor: brandTheme.border.light,
            minHeight: `${calculateTotalHeight()}px`,
            paddingTop: '32px', // Add padding at top for sprint labels
          }}
        >
          {/* Week grid lines */}
          {weekMarkers.map((marker, index) => (
            <div
              key={index}
              className="absolute top-0 bottom-0"
              style={{
                left: `${marker.position}%`,
                width: marker.isMonthStart ? '2px' : (marker.dayType === 'monday' ? '1px' : '1px'),
                backgroundColor: marker.isMonthStart 
                  ? brandTheme.border.medium 
                  : (marker.dayType === 'monday' ? brandTheme.border.medium : brandTheme.border.light),
                opacity: marker.isMonthStart ? 1 : (marker.dayType === 'monday' ? 0.6 : 0.3),
              }}
            />
          ))}

          {/* Today marker */}
          {showTodayMarker && (
            <div
              className="absolute top-0 bottom-0 w-0.5 z-20"
              style={{
                left: `${todayPosition}%`,
                backgroundColor: brandTheme.status.error,
              }}
            >
              <div
                className="absolute -top-1 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap"
                style={{
                  backgroundColor: brandTheme.status.error,
                  color: 'white',
                }}
              >
                Today
              </div>
            </div>
          )}

          {/* Sprint bars with groups */}
          <div className="relative p-3">
            {sprintsWithPositions.map((sprint, sprintIndex) => {
              const sprintHeight = Math.max(sprint.groups.length * 32, 40);
              
              return (
                <div
                  key={sprint.sprint_id}
                  className="relative"
                  style={{ 
                    height: `${sprintHeight}px`,
                    marginBottom: sprintIndex < sprintsWithPositions.length - 1 ? '16px' : '0',
                  }}
                >
                  {/* Sprint background bar */}
                  <div
                    className="absolute rounded-lg shadow-md border-2 group"
                    style={{
                      left: `${sprint.leftPercent}%`,
                      width: `${sprint.widthPercent}%`,
                      height: `${sprintHeight}px`,
                      backgroundColor: getStatusColor(sprint.status) + '15',
                      borderColor: getStatusColor(sprint.status),
                      minWidth: '100px',
                    }}
                  >
                    {/* Sprint label (top-left corner) */}
                    <div
                      className="absolute -top-7 left-0 px-3 py-1 rounded-t font-semibold text-sm whitespace-nowrap shadow-sm"
                      style={{
                        backgroundColor: getStatusColor(sprint.status),
                        color: 'white',
                      }}
                    >
                      {sprint.sprint_id}
                    </div>

                    {/* Sprint groups inside */}
                    <div className="relative h-full p-1 flex flex-col justify-around">
                      {sprint.groupsWithPositions.map((group) => (
                        <div
                          key={group.id}
                          className="relative group/item cursor-pointer"
                          style={{ 
                            height: `${Math.max(28, sprintHeight / sprint.groups.length - 4)}px`,
                          }}
                        >
                          <div
                            className="absolute inset-0 rounded shadow-sm transition-all hover:shadow-md"
                            style={{
                              backgroundColor: getStatusColor(sprint.status),
                              opacity: 0.9,
                            }}
                          >
                            <div className="flex items-center justify-between h-full px-2">
                              <span
                                className="text-xs font-medium truncate"
                                style={{ color: 'white' }}
                              >
                                {group.name}
                              </span>
                              <span
                                className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 ml-1"
                                style={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                  color: 'white',
                                }}
                              >
                                {group.selected_task_ids?.length || 0}
                              </span>
                            </div>

                            {/* Hover tooltip for group */}
                            <div
                              className="absolute left-0 top-full mt-1 hidden group-hover/item:block z-40 p-2 rounded-lg shadow-lg border min-w-[200px]"
                              style={{
                                backgroundColor: brandTheme.background.primary,
                                borderColor: brandTheme.border.medium,
                              }}
                            >
                              <p className="font-semibold text-sm mb-1" style={{ color: brandTheme.text.primary }}>
                                {group.name}
                              </p>
                              <div className="space-y-1 text-xs" style={{ color: brandTheme.text.secondary }}>
                                <p>Type: <span className="font-medium">{group.sprint_type}</span></p>
                                <p>Tasks: <span className="font-medium">{group.selected_task_ids?.length || 0}</span></p>
                                <p className="pt-1 border-t" style={{ borderColor: brandTheme.border.light }}>
                                  Sprint: <span className="font-medium">{sprint.sprint_id}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Sprint-level hover tooltip */}
                    <div
                      className="absolute left-0 top-full mt-2 hidden group-hover:block z-30 p-3 rounded-lg shadow-lg border min-w-[220px]"
                      style={{
                        backgroundColor: brandTheme.background.primary,
                        borderColor: brandTheme.border.medium,
                      }}
                    >
                      <p className="font-semibold mb-1" style={{ color: brandTheme.text.primary }}>
                        {sprint.sprint_id}
                      </p>
                      <p className="text-xs mb-2" style={{ color: brandTheme.text.secondary }}>
                        {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                      </p>
                      <div className="text-xs space-y-1" style={{ color: brandTheme.text.muted }}>
                        <p>{sprint.groups.length} sprint groups</p>
                        <p>
                          {sprint.groups.reduce((sum, g) => sum + (g.selected_task_ids?.length || 0), 0)} total tasks
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sprint dates label (left side, outside the timeline) */}
                  <div
                    className="absolute right-full mr-3 flex flex-col justify-center text-right"
                    style={{ 
                      height: `${sprintHeight}px`,
                      top: 0,
                    }}
                  >
                    <div className="text-xs whitespace-nowrap" style={{ color: brandTheme.text.secondary }}>
                      {formatDate(sprint.startDate)}
                    </div>
                    <div className="text-xs whitespace-nowrap" style={{ color: brandTheme.text.muted }}>
                      {formatDate(sprint.endDate)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline footer */}
        <div className="flex items-center justify-between mt-3 px-2">
          <span className="text-xs" style={{ color: brandTheme.text.muted }}>
            {formatDate(timelineStart)}
          </span>
          <span className="text-xs" style={{ color: brandTheme.text.muted }}>
            {formatDate(timelineEnd)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;

