import React, { useMemo, useState } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { Calendar, CheckCircle, PlayCircle } from 'lucide-react';
import HoursByDay from './hoursbyday';
import CompletedStoryPoints from './completedstorypoints';

interface CompletedItem {
  id: string;
  name: string;
  type: 'task' | 'subtask';
  completedDate: Date;
  assigneeName?: string;
  sprintGroupName?: string;
  hoursSpent?: number;
  taskName?: string;
  isCompleted: boolean; // True if done, false if just has hours logged
}

interface SprintCompleteGanttProps {
  completedItems: CompletedItem[];
  startDate: Date;
  endDate: Date;
  scrollRef?: React.RefObject<HTMLDivElement>;
  onScroll?: () => void;
  allTaskIds?: string[];
  hoursData?: any[]; // Hours data from HoursByDay component
  onHoursDataProcessed?: (data: any[]) => void; // Callback to pass to HoursByDay
  allTasks?: any[]; // All tasks in the sprint for in-progress view
}

const SprintCompleteGantt: React.FC<SprintCompleteGanttProps> = ({ 
  completedItems, 
  startDate, 
  endDate, 
  scrollRef, 
  onScroll,
  allTaskIds = [],
  hoursData = [],
  onHoursDataProcessed,
  allTasks = []
}) => {
  const [showInProgress, setShowInProgress] = useState(false);
  const { totalDays, itemsWithPositions, dayMarkers, timelineStart } = useMemo(() => {
    if (completedItems.length === 0) {
      return {
        totalDays: 0,
        itemsWithPositions: [],
        dayMarkers: [],
        timelineStart: new Date(),
      };
    }

    // Use passed-in date range to ensure alignment with HoursByDay
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Helper function to parse ISO date as local date
    const parseISODate = (dateString: string): Date => {
      const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    // Helper function to format date as YYYY-MM-DD
    const formatDateKey = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Create a set of completed task dates to avoid showing duplicate markers
    const completedTaskDates = new Set<string>();
    completedItems.forEach(item => {
      if (item.isCompleted && item.type === 'task') {
        const dateKey = formatDateKey(item.completedDate);
        // For completed tasks, item.id is the actual task ID (not composite)
        // No need to split, just use it directly
        completedTaskDates.add(`${item.id}-${dateKey}`);
        console.log('Adding to skip set:', `${item.id}-${dateKey}`);
      }
    });
    
    console.log('=== Completed task dates (to skip) ===', Array.from(completedTaskDates));

    // Add items from hours data that aren't already shown as completed
    const allItems: CompletedItem[] = [...completedItems];
    
    if (hoursData && hoursData.length > 0) {
      console.log('=== Processing hours data for Gantt chart ===', hoursData.length, 'entries');
      
      hoursData.forEach((hourEntry: any) => {
        const dateKey = `${hourEntry.taskId}-${hourEntry.date}`;
        
        // Skip if this task is already shown as completed on this date
        if (completedTaskDates.has(dateKey)) {
          console.log('Skipping hour entry (already completed):', dateKey);
          return;
        }
        
        console.log('Adding hour entry to Gantt:', {
          taskId: hourEntry.taskId,
          taskName: hourEntry.taskName,
          date: hourEntry.date,
          user: hourEntry.userName,
          hours: hourEntry.hours
        });

        allItems.push({
          id: `${hourEntry.taskId}-${hourEntry.date}-${hourEntry.userId}`,
          name: hourEntry.taskName,
          type: 'task',
          completedDate: parseISODate(hourEntry.date),
          assigneeName: hourEntry.userName,
          hoursSpent: hourEntry.hours,
          isCompleted: false,
        });
      });
      
      console.log('=== Total items after adding hours ===', allItems.length);
    }

    // Add in-progress tasks if toggle is enabled
    if (showInProgress && allTasks && allTasks.length > 0) {
      console.log('=== Processing in-progress tasks ===');
      
      // Filter to only in-progress and todo tasks that have a start date
      const inProgressTasks = allTasks.filter((task: any) => 
        (task.status === 'in-progress' || task.status === 'todo') && task.startDate
      );
      
      console.log('Found in-progress tasks:', inProgressTasks.length);
      
      inProgressTasks.forEach((task: any) => {
        // Skip if this task is already shown as completed
        const isAlreadyCompleted = completedItems.some(item => 
          item.id === task.id && item.type === 'task'
        );
        
        if (isAlreadyCompleted) {
          console.log('Skipping task (already completed):', task.name);
          return;
        }
        
        console.log('Adding in-progress task:', {
          id: task.id,
          name: task.name,
          startDate: task.startDate,
          status: task.status
        });

        allItems.push({
          id: `inprogress-${task.id}`,
          name: task.name,
          type: 'task',
          completedDate: parseISODate(task.startDate), // Use start date for positioning
          assigneeName: task.assignee 
            ? `${task.assignee.firstName} ${task.assignee.lastName}`.trim()
            : undefined,
          sprintGroupName: task.sprintGroupName,
          isCompleted: false, // Mark as in-progress (will show with different styling)
        });
      });
      
      console.log('=== Total items after adding in-progress ===', allItems.length);
    }

    // Sort all items by completion date (most recent first)
    // But prioritize in-progress items (those with inprogress- prefix) above completed items on same date
    const sortedItems = [...allItems].sort((a, b) => {
      const dateCompare = b.completedDate.getTime() - a.completedDate.getTime();
      
      // If dates are the same, sort by type (in-progress first)
      if (dateCompare === 0) {
        const aIsInProgress = a.id.toString().startsWith('inprogress-');
        const bIsInProgress = b.id.toString().startsWith('inprogress-');
        
        if (aIsInProgress && !bIsInProgress) return -1; // a comes first
        if (!aIsInProgress && bIsInProgress) return 1; // b comes first
      }
      
      return dateCompare;
    });

    // Calculate positions for each item
    const itemsWithPos = sortedItems.map((item) => {
      const itemDate = new Date(item.completedDate);
      itemDate.setHours(0, 0, 0, 0);

      // Use the same calculation as day markers to ensure exact alignment
      const position = ((itemDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) / diffDays) * 100;

      return {
        ...item,
        position,
      };
    });

    // Generate day markers
    const markers: { date: Date; position: number; label: string }[] = [];
    const current = new Date(start);

    while (current <= end) {
      const position = ((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) / diffDays) * 100;
      
      markers.push({
        date: new Date(current),
        position,
        label: current.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      });

      current.setDate(current.getDate() + 1);
    }

    return {
      totalDays: diffDays,
      itemsWithPositions: itemsWithPos,
      dayMarkers: markers,
      timelineStart: start,
    };
  }, [completedItems, startDate, endDate, hoursData, showInProgress, allTasks]);

  if (completedItems.length === 0) {
    return (
      <div
        className="rounded-lg shadow-sm p-6 mb-6"
        style={{ backgroundColor: brandTheme.background.secondary }}
      >
        <div className="text-center py-8">
          <CheckCircle
            className="w-12 h-12 mx-auto mb-3 opacity-30"
            style={{ color: brandTheme.status.success }}
          />
          <p style={{ color: brandTheme.text.muted }}>
            No completion data available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg shadow-sm p-6 mb-6"
      style={{ backgroundColor: brandTheme.background.secondary }}
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" style={{ color: brandTheme.status.success }} />
          <h3 className="text-lg font-bold" style={{ color: brandTheme.text.primary }}>
            Completion Timeline
          </h3>
          <span
            className="ml-2 px-2 py-1 rounded-full text-xs font-bold"
            style={{
              backgroundColor: brandTheme.status.success + '20',
              color: brandTheme.status.success,
            }}
          >
            {completedItems.length} items
          </span>
          
          {/* Toggle for In-Progress Tasks */}
          <button
            onClick={() => setShowInProgress(!showInProgress)}
            className="ml-4 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 hover:shadow-md"
            style={{
              backgroundColor: showInProgress 
                ? brandTheme.primary.navy 
                : brandTheme.background.secondary,
              color: showInProgress 
                ? '#FFFFFF' 
                : brandTheme.text.primary,
              border: `1px solid ${showInProgress ? brandTheme.primary.navy : brandTheme.border.medium}`,
            }}
          >
            <PlayCircle className="w-4 h-4" />
            {showInProgress ? 'Hide' : 'Show'} In-Progress
          </button>
        </div>
        
        {/* Completed Story Points */}
        {allTaskIds.length > 0 && (
          <CompletedStoryPoints 
            allTaskIds={allTaskIds}
            completedTaskIds={completedItems
              .filter(item => item.type === 'task' && item.isCompleted)
              .map(item => item.id) // For completed tasks, id is already the task ID
            }
          />
        )}
      </div>

      {/* Timeline - Horizontally scrollable */}
      <div 
        ref={scrollRef}
        onScroll={onScroll}
        className="relative overflow-x-auto"
      >
        <div
          className="relative"
          style={{
            width: `${Math.max(1200, totalDays * 150)}px`, // Explicit width: 150px per day
          }}
        >
          {/* Hours Logged by Day - Integrated Header */}
          <HoursByDay 
            startDate={startDate} 
            endDate={endDate}
            isIntegrated={true}
            onHoursDataProcessed={onHoursDataProcessed}
          />

          {/* Day markers header */}
          <div className="relative mb-2 h-8 flex items-end" style={{ paddingLeft: '16px', paddingRight: '16px' }}>
            {dayMarkers.map((marker, index) => (
              <div
                key={index}
                className="absolute flex flex-col items-center"
                style={{ left: `${marker.position}%` }}
              >
                {/* Date marker line */}
                <div
                  className="h-2 w-px mb-1"
                  style={{ backgroundColor: brandTheme.border.medium }}
                />
                
                {/* Date label */}
                <span
                  className="text-xs font-medium whitespace-nowrap"
                  style={{ color: brandTheme.text.secondary }}
                >
                  {marker.label}
                </span>
              </div>
            ))}
          </div>

          {/* Timeline grid */}
          <div
            className="relative rounded-lg border"
            style={{
              backgroundColor: brandTheme.background.primary,
              borderColor: brandTheme.border.light,
              minHeight: `${Math.max(300, (itemsWithPositions.length * 28) + 40)}px`,
              padding: '16px',
            }}
          >
          {/* Day grid lines */}
          {dayMarkers.map((marker, index) => (
            <div
              key={index}
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: `${marker.position}%`,
                backgroundColor: brandTheme.border.light,
                opacity: 0.5,
              }}
            />
          ))}

          {/* Today marker */}
          {(() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayPosition = ((today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
            const showToday = todayPosition >= 0 && todayPosition <= 100;
            
            return showToday ? (
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
            ) : null;
          })()}

          {/* Completed items */}
          <div className="relative space-y-0.5">
            {itemsWithPositions.map((item, itemIndex) => {
              const isNearBottom = itemIndex >= itemsWithPositions.length - 3;
              const isInProgressStart = item.id.toString().startsWith('inprogress-');
              
              // Calculate today's position for in-progress items
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const todayPosition = ((today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
              const showTodayBar = isInProgressStart && todayPosition >= item.position && todayPosition <= 100;
              
              return (
              <div
                key={`${item.type}-${item.id}`}
                className="relative group"
                style={{ 
                  height: isInProgressStart ? '26px' : '34px', 
                  minHeight: isInProgressStart ? '26px' : '34px' 
                }}
              >
                {/* Completion/Start marker */}
                <div
                  className="absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{ 
                    left: `${item.position}%`
                  }}
                >
                  <div
                    className={`w-3 h-3 ${isInProgressStart ? 'rounded' : 'rounded-full'} border-2 transition-all group-hover:w-4 group-hover:h-4`}
                    style={{
                      backgroundColor: item.isCompleted 
                        ? brandTheme.status.success // All completed items (tasks and subtasks) are green
                        : isInProgressStart
                        ? '#F59E0B' // In-progress start dates are amber/yellow
                        : brandTheme.status.warning, // Hours logged are orange
                      borderColor: 'white',
                    }}
                  />
                </div>

                {/* Item name - left for completed, extended to today for in-progress */}
                {isInProgressStart ? (
                  // In-progress: Extend from start to today marker
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 flex items-center z-10"
                    style={{
                      left: `${item.position}%`,
                      width: showTodayBar ? `${todayPosition - item.position}%` : 'auto',
                      minWidth: '120px',
                    }}
                  >
                    <div
                      className="px-2 py-0.5 rounded font-medium transition-all group-hover:shadow-lg flex items-center justify-between w-full"
                      style={{
                        backgroundColor: '#FEF3C7', // Light yellow background
                        color: '#92400E', // Dark yellow/brown text
                        border: '1px solid #F59E0B', // Amber border
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        fontSize: '10px',
                      }}
                    >
                      <span className="truncate">
                        {item.type === 'subtask' && '↳ '}
                        {item.name}
                        {item.assigneeName && ` - ${item.assigneeName}`}
                      </span>
                      <span className="opacity-70 ml-2 flex-shrink-0" style={{ fontSize: '9px' }}>→</span>
                    </div>
                  </div>
                ) : (
                  // Completed: Show to the LEFT of marker
                  <div
                    className="absolute top-1/2 transform -translate-y-1/2 mr-4 flex justify-end"
                    style={{
                      right: `${100 - item.position}%`,
                      maxWidth: `${item.position - 2}%`,
                    }}
                  >
                    <div
                      className="px-2 py-1 rounded text-xs font-medium truncate transition-all group-hover:shadow-md"
                      style={{
                        backgroundColor: item.isCompleted
                          ? brandTheme.status.success + '20' // All completed items have green background
                          : brandTheme.status.warning + '20', // In-progress items have orange background
                        color: item.isCompleted
                          ? brandTheme.status.success // All completed items have green text
                          : brandTheme.status.warning, // In-progress items have orange text
                      }}
                    >
                      {item.type === 'subtask' && '↳ '}
                      {item.name}
                      {item.assigneeName && ` - ${item.assigneeName}`}
                    </div>
                  </div>
                )}

                {/* Hover tooltip with dynamic positioning */}
                <div
                  className={`absolute hidden group-hover:block z-30 p-2 rounded-lg shadow-lg border min-w-[200px] max-w-[300px] ${
                    item.position > 50 ? 'right-0' : 'left-0'
                  } ${isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'}`}
                  style={{
                    backgroundColor: brandTheme.background.primary,
                    borderColor: brandTheme.border.medium,
                    ...(item.position > 50 
                      ? { right: `${100 - item.position}%` }
                      : { left: `${item.position}%` }
                    ),
                  }}
                >
                  <p className="font-semibold text-sm mb-1" style={{ color: brandTheme.text.primary }}>
                    {item.name}
                  </p>
                  <div className="space-y-1 text-xs" style={{ color: brandTheme.text.secondary }}>
                    <p>Type: <span className="font-medium">{item.type === 'task' ? 'Task' : 'Subtask'}</span></p>
                    <p>Status: <span className="font-medium" style={{ 
                      color: item.isCompleted 
                        ? brandTheme.status.success 
                        : isInProgressStart 
                        ? '#F59E0B' // Amber for in-progress
                        : brandTheme.status.warning 
                    }}>
                      {item.isCompleted ? 'Completed' : isInProgressStart ? 'In Progress' : 'In Progress (Hours Logged)'}
                    </span></p>
                    <p>{isInProgressStart ? 'Started' : item.isCompleted ? 'Completed' : 'Last Hour Logged'}: <span className="font-medium">
                      {item.completedDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span></p>
                    {isInProgressStart && (
                      <p>Duration: <span className="font-medium" style={{ color: '#F59E0B' }}>
                        {(() => {
                          const start = item.completedDate;
                          const today = new Date();
                          const diffTime = Math.abs(today.getTime() - start.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return diffDays === 0 ? 'Started today' : diffDays === 1 ? '1 day' : `${diffDays} days`;
                        })()}
                      </span></p>
                    )}
                    {item.assigneeName && (
                      <p>Assignee: <span className="font-medium">{item.assigneeName}</span></p>
                    )}
                    {item.sprintGroupName && (
                      <p>Group: <span className="font-medium">{item.sprintGroupName}</span></p>
                    )}
                    {item.hoursSpent && (
                      <p>Hours Spent: <span className="font-medium">{item.hoursSpent.toFixed(1)}h</span></p>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: brandTheme.status.success }}
          />
          <span className="text-xs" style={{ color: brandTheme.text.secondary }}>
            Completed (Tasks & Subtasks)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: brandTheme.status.warning }}
          />
          <span className="text-xs" style={{ color: brandTheme.text.secondary }}>
            In Progress (with hours logged)
          </span>
        </div>
        {showInProgress && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: '#F59E0B' }}
              />
              <div
                className="h-4 px-2 rounded flex items-center"
                style={{ 
                  backgroundColor: '#FEF3C7',
                  border: '1px solid #F59E0B',
                  fontSize: '10px',
                  color: '#92400E'
                }}
              >
                →
              </div>
            </div>
            <span className="text-xs" style={{ color: brandTheme.text.secondary }}>
              In Progress (extends to today) →
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SprintCompleteGantt;

