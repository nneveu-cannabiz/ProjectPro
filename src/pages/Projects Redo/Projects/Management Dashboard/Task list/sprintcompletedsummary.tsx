import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { CheckCircle, Clock, X, Loader, Target } from 'lucide-react';
import { Task, User } from '../../../../../types';
import { supabase } from '../../../../../lib/supabase';
import SprintCompleteGantt from './sprintcompletegant';

interface TaskWithSprintInfo extends Task {
  assignee?: User;
  sprintGroupName: string;
  sprintGroupId: string;
  sprintRank?: number;
  sprintType?: string;
  hoursSpent?: number;
}

interface CompletedItem {
  id: string;
  name: string;
  type: 'task' | 'subtask';
  completedDate: Date;
  assigneeName?: string;
  sprintGroupName?: string;
  hoursSpent?: number;
  storyPoints?: number;
  parentTaskName?: string; // For subtasks, the name of the parent task
  isCompleted: boolean; // True if done, false if just has hours logged
}

interface SprintCompletedSummaryProps {
  tasks: TaskWithSprintInfo[];
  onClose: () => void;
}

const SprintCompletedSummary: React.FC<SprintCompletedSummaryProps> = ({ tasks, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [completedItems, setCompletedItems] = useState<CompletedItem[]>([]);
  const [tasksWithHours, setTasksWithHours] = useState<TaskWithSprintInfo[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingItemType, setEditingItemType] = useState<'task' | 'subtask' | null>(null);
  const [editingDate, setEditingDate] = useState<string>('');
  const [hoursData, setHoursData] = useState<any[]>([]);
  const [hoursDetailsByTask, setHoursDetailsByTask] = useState<Map<string, Array<{ date: string; hours: number }>>>(new Map());

  const doneTasks = tasksWithHours.filter((t) => t.status === 'done');

  const handleHoursDataProcessed = (data: any[]) => {
    console.log('=== Received hours data from HoursByDay ===', data.length);
    setHoursData(data);
  };

  // Parse ISO date string as local date to avoid timezone offset issues
  const parseISODate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Format date as YYYY-MM-DD for input and database
  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleEditDate = (itemId: string, itemType: 'task' | 'subtask', currentDate: Date) => {
    setEditingTaskId(itemId);
    setEditingItemType(itemType);
    const dateStr = formatDateKey(currentDate);
    setEditingDate(dateStr);
  };

  const handleSaveDate = async (itemId: string, itemType: 'task' | 'subtask') => {
    try {
      console.log('=== Saving completion date ===');
      console.log('Item ID:', itemId);
      console.log('Item Type:', itemType);
      console.log('New date:', editingDate);

      // Update the appropriate table based on type
      const tableName = itemType === 'task' ? 'PMA_Tasks' : 'PMA_SubTasks';
      const { data, error } = await (supabase as any)
        .from(tableName)
        .update({ end_date: editingDate })
        .eq('id', itemId)
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Database update response:', data);

      // Parse the edited date properly as local date
      const parsedDate = parseISODate(editingDate);
      console.log('Parsed date:', parsedDate);

      // Update local state for tasks if it's a task
      if (itemType === 'task') {
        setTasksWithHours(prev => {
          const updated = prev.map(task => 
            task.id === itemId ? { ...task, endDate: editingDate } : task
          );
          console.log('Updated tasksWithHours:', updated.find(t => t.id === itemId));
          return updated;
        });
      }

      // Update completedItems with new date (as local Date object)
      setCompletedItems(prev => {
        const updated = prev.map(item => 
          item.id === itemId ? { ...item, completedDate: parsedDate } : item
        );
        console.log('Updated completedItems:', updated.find(i => i.id === itemId));
        return updated;
      });

      setEditingTaskId(null);
      setEditingItemType(null);
      setEditingDate('');
      
      console.log('=== Save complete ===');
    } catch (error) {
      console.error('Error updating completion date:', error);
      alert('Failed to update completion date. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setEditingItemType(null);
    setEditingDate('');
  };

  useEffect(() => {
    const fetchCompletionData = async () => {
      setLoading(true);

      try {
        const taskIds = tasks.map((t) => t.id);
        
        // Fetch complete task data including end_date from database
        const { data: tasksFromDb } = await (supabase as any)
          .from('PMA_Tasks')
          .select('id, end_date')
          .in('id', taskIds);

        console.log('=== Fetched tasks from DB ===', tasksFromDb);

        // Create a map of end_dates
        const endDateMap: Record<string, string> = {};
        if (tasksFromDb) {
          tasksFromDb.forEach((task: any) => {
            if (task.end_date) {
              endDateMap[task.id] = task.end_date;
              console.log(`Task ${task.id} has end_date:`, task.end_date);
            }
          });
        }
        
        // Fetch hours spent for tasks
        const { data: hoursData } = await (supabase as any)
          .from('PMA_Hours')
          .select('task_id, hours, is_planning_hours, date')
          .in('task_id', taskIds);

        // Calculate hours spent per task and story points, and track hours by date
        const hoursMap: Record<string, number> = {};
        const storyPointsMap: Record<string, number> = {};
        const hoursDetailsMap = new Map<string, Array<{ date: string; hours: number }>>();
        
        if (hoursData) {
          hoursData.forEach((hour: any) => {
            if (hour.is_planning_hours) {
              // Story points (planning hours)
              if (!storyPointsMap[hour.task_id]) {
                storyPointsMap[hour.task_id] = 0;
              }
              storyPointsMap[hour.task_id] += hour.hours || 0;
            } else {
              // Actual hours spent
              if (!hoursMap[hour.task_id]) {
                hoursMap[hour.task_id] = 0;
              }
              hoursMap[hour.task_id] += hour.hours || 0;
              
              // Track hours by date for tooltip
              if (!hoursDetailsMap.has(hour.task_id)) {
                hoursDetailsMap.set(hour.task_id, []);
              }
              hoursDetailsMap.get(hour.task_id)!.push({
                date: hour.date,
                hours: hour.hours || 0,
              });
            }
          });
        }
        
        setHoursDetailsByTask(hoursDetailsMap);

        // Enrich tasks with hours and end_date
        const enrichedTasks = tasks.map((task) => ({
          ...task,
          hoursSpent: hoursMap[task.id] || 0,
          endDate: endDateMap[task.id] || task.endDate, // Use fetched end_date or original
        }));
        
        console.log('=== Enriched tasks ===', enrichedTasks.filter(t => t.status === 'done').map(t => ({ id: t.id, name: t.name, endDate: t.endDate })));
        
        setTasksWithHours(enrichedTasks);

        // Get completed tasks
        const completedTasks = enrichedTasks.filter((t) => t.status === 'done');

        // Fetch subtasks for ALL tasks in the sprint (not just completed tasks)
        // This ensures we show completed subtasks even if parent task isn't done
        const { data: subtasksData, error: subtasksError } = await supabase
          .from('PMA_SubTasks')
          .select('id, name, description, status, task_id, end_date, updated_at, created_at')
          .in('task_id', taskIds);

        if (subtasksError) {
          console.error('Error fetching subtasks:', subtasksError);
        }

        console.log('=== Fetched subtasks ===', subtasksData?.length || 0);
        console.log('=== Sample subtask ===', subtasksData?.[0]);

        // Filter to only completed subtasks
        const completedSubtasks = (subtasksData || []).filter((st: any) => st.status === 'done');

        console.log('=== Completed subtasks ===', completedSubtasks.length);
        console.log('=== Completed subtasks data ===', completedSubtasks.map(st => ({ 
          id: st.id, 
          name: st.name, 
          description: st.description,
          status: st.status 
        })));
        
        // Fetch hours for subtasks as well
        const subtaskIds = (subtasksData || []).map((st: any) => st.id);
        if (subtaskIds.length > 0) {
          const { data: subtaskHoursData } = await (supabase as any)
            .from('PMA_Hours')
            .select('task_id, hours, is_planning_hours, date')
            .in('task_id', subtaskIds);
            
          if (subtaskHoursData) {
            subtaskHoursData.forEach((hour: any) => {
              if (!hour.is_planning_hours) {
                // Track hours by date for subtasks
                if (!hoursDetailsMap.has(hour.task_id)) {
                  hoursDetailsMap.set(hour.task_id, []);
                }
                hoursDetailsMap.get(hour.task_id)!.push({
                  date: hour.date,
                  hours: hour.hours || 0,
                });
              }
            });
          }
        }
        
        // Update the state with both task and subtask hours
        setHoursDetailsByTask(hoursDetailsMap);

        if (completedTasks.length === 0 && completedSubtasks.length === 0) {
          setCompletedItems([]);
          setLoading(false);
          return;
        }

        // Build completion items array
        const items: CompletedItem[] = [];

        // Process tasks - Always use end_date from PMA_Tasks
        completedTasks.forEach((task) => {
          let completedDate: Date;

          // Use end_date from PMA_Tasks (this is the completion date set when marking as done)
          if (task.endDate) {
            // Parse the end_date as a local date (YYYY-MM-DD format)
            console.log(`Task ${task.name}:`);
            console.log('  - Has endDate:', task.endDate);
            console.log('  - Parsing with parseISODate...');
            completedDate = parseISODate(task.endDate);
            console.log('  - Parsed to:', completedDate);
          } else {
            // Fallback to updatedAt if no end_date is set
            console.log(`Task ${task.name}: No end_date found, using updatedAt:`, task.updatedAt);
            completedDate = new Date(task.updatedAt || task.createdAt);
          }

          items.push({
            id: task.id,
            name: task.name,
            type: 'task',
            completedDate,
            assigneeName: task.assignee 
              ? `${task.assignee.firstName} ${task.assignee.lastName}`.trim()
              : undefined,
            sprintGroupName: task.sprintGroupName,
            hoursSpent: task.hoursSpent || 0,
            storyPoints: storyPointsMap[task.id] || 0,
            isCompleted: true,
          });
        });

        // Process subtasks - Use end_date if available
        completedSubtasks.forEach((subtask: any) => {
          // Find parent task from ALL enriched tasks (not just completed ones)
          const parentTask = enrichedTasks.find((t) => t.id === subtask.task_id);
          
          let completedDate: Date;
          
          // Use end_date from subtask if available
          if (subtask.end_date) {
            console.log(`Subtask ${subtask.name}: Using end_date:`, subtask.end_date);
            completedDate = parseISODate(subtask.end_date);
          } else {
            // Fallback to updated_at
            console.log(`Subtask ${subtask.name}: No end_date, using updated_at:`, subtask.updated_at);
            completedDate = new Date(subtask.updated_at || subtask.created_at);
          }

          items.push({
            id: subtask.id,
            name: subtask.name || 'Untitled Subtask',
            type: 'subtask',
            completedDate,
            assigneeName: parentTask?.assignee
              ? `${parentTask.assignee.firstName} ${parentTask.assignee.lastName}`.trim()
              : undefined,
            sprintGroupName: parentTask?.sprintGroupName,
            storyPoints: parentTask ? storyPointsMap[parentTask.id] || 0 : 0,
            parentTaskName: parentTask?.name,
            isCompleted: true,
          });
        });

        console.log('=== Final completed items ===');
        console.log('Total items:', items.length);
        console.log('Tasks:', items.filter(i => i.type === 'task').length);
        console.log('Subtasks:', items.filter(i => i.type === 'subtask').length);
        console.log('Items:', items.map(i => ({ type: i.type, name: i.name, date: i.completedDate })));

        setCompletedItems(items);
      } catch (error) {
        console.error('Error fetching completion data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletionData();
  }, [tasks]);

  // Calculate shared date range for both HoursByDay and SprintCompleteGantt
  const { timelineStartDate, timelineEndDate } = React.useMemo(() => {
    if (completedItems.length === 0) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return {
        timelineStartDate: now,
        timelineEndDate: now,
      };
    }

    const dates = completedItems.map(item => item.completedDate);
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
    const latest = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Normalize to midnight
    earliest.setHours(0, 0, 0, 0);
    latest.setHours(0, 0, 0, 0);
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add 1 day padding before the earliest
    earliest.setDate(earliest.getDate() - 1);
    
    // For the end date, use the latest completion or today (whichever is later)
    // Add small padding for visual breathing room (18 hours = 0.75 days)
    const endDate = latest > today ? latest : today;
    const endDateWithPadding = new Date(endDate.getTime() + (18 * 60 * 60 * 1000)); // Add 18 hours

    return {
      timelineStartDate: earliest,
      timelineEndDate: endDateWithPadding,
    };
  }, [completedItems]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-lg shadow-xl max-h-[95vh] overflow-hidden w-full max-w-[90vw]"
        style={{ backgroundColor: brandTheme.background.primary }}
      >
        {/* Modal Header */}
        <div
          className="p-6 border-b flex items-center justify-between"
          style={{
            backgroundColor: brandTheme.status.success,
            borderColor: brandTheme.border.light,
          }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Completed Tasks Summary</h2>
            <span
              className="px-3 py-1 rounded-full text-sm font-bold"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                color: '#FFFFFF',
              }}
            >
              {doneTasks.length} tasks
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(95vh - 100px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin" style={{ color: brandTheme.primary.navy }} />
              <span className="ml-3" style={{ color: brandTheme.text.secondary }}>
                Loading completion data...
              </span>
            </div>
          ) : (
            <div className="p-6">
              {/* Gantt Chart with Integrated Hours */}
              <SprintCompleteGantt 
                completedItems={completedItems}
                startDate={timelineStartDate}
                endDate={timelineEndDate}
                allTaskIds={tasks.map(t => t.id)}
                hoursData={hoursData}
                onHoursDataProcessed={handleHoursDataProcessed}
                allTasks={tasksWithHours}
              />

              {/* Completed Tasks and Subtasks Table */}
              {completedItems.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle
                    className="w-16 h-16 mx-auto mb-4 opacity-30"
                    style={{ color: brandTheme.status.success }}
                  />
                  <p className="text-lg font-medium" style={{ color: brandTheme.text.muted }}>
                    No completed items yet
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold mb-4" style={{ color: brandTheme.text.primary }}>
                    Completed Tasks & Subtasks
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: `2px solid ${brandTheme.border.medium}` }}>
                          <th className="text-left px-4 py-3 text-sm font-bold" style={{ color: brandTheme.text.primary }}>
                            Type
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-bold" style={{ color: brandTheme.text.primary }}>
                            Name
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-bold" style={{ color: brandTheme.text.primary }}>
                            Sprint Group
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-bold" style={{ color: brandTheme.text.primary }}>
                            Assignee
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-bold" style={{ color: brandTheme.text.primary }}>
                            Hours
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-bold" style={{ color: brandTheme.text.primary }}>
                            Story Points
                          </th>
                          <th className="text-left px-4 py-3 text-sm font-bold" style={{ color: brandTheme.text.primary }}>
                            Completion Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedItems.map((item) => {
                          const isEditing = editingTaskId === item.id && editingItemType === item.type;
                          
                          return (
                            <tr 
                              key={`${item.type}-${item.id}`}
                              className="hover:bg-opacity-50 transition-colors"
                              style={{ 
                                backgroundColor: item.type === 'subtask' 
                                  ? brandTheme.primary.paleBlue + '30'
                                  : brandTheme.background.secondary,
                                borderBottom: `1px solid ${brandTheme.border.light}`,
                              }}
                            >
                              {/* Type */}
                              <td className="px-4 py-3">
                                <span
                                  className="px-2 py-1 rounded text-xs font-medium inline-block cursor-default"
                                  style={{
                                    backgroundColor: item.type === 'task' 
                                      ? brandTheme.status.success + '20' 
                                      : brandTheme.primary.lightBlue + '20',
                                    color: item.type === 'task' 
                                      ? brandTheme.status.success 
                                      : brandTheme.primary.navy,
                                  }}
                                  title={item.type === 'subtask' && item.parentTaskName 
                                    ? `Subtask of: ${item.parentTaskName}`
                                    : undefined}
                                >
                                  {item.type === 'task' ? 'Task' : 'Subtask'}
                                </span>
                              </td>

                              {/* Name */}
                              <td className="px-4 py-3">
                                <div className="font-semibold text-sm" style={{ color: brandTheme.text.primary }}>
                                  {item.type === 'subtask' && '↳ '}
                                  {item.name}
                                </div>
                              </td>

                              {/* Sprint Group */}
                              <td className="px-4 py-3">
                                <span className="text-sm" style={{ color: brandTheme.text.secondary }}>
                                  {item.sprintGroupName || '-'}
                                </span>
                              </td>

                              {/* Assignee */}
                              <td className="px-4 py-3">
                                {item.assigneeName ? (
                                  <span className="text-sm" style={{ color: brandTheme.text.primary }}>
                                    {item.assigneeName}
                                  </span>
                                ) : (
                                  <span className="text-sm" style={{ color: brandTheme.text.muted }}>
                                    Unassigned
                                  </span>
                                )}
                              </td>

                              {/* Hours Spent */}
                              <td className="px-4 py-3">
                                {(() => {
                                  const realTaskId = item.type === 'subtask' ? item.id : item.id.toString().replace(/^inprogress-/, '');
                                  const details = hoursDetailsByTask.get(realTaskId);
                                  
                                  if (!details || details.length === 0) {
                                    return (
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" style={{ color: brandTheme.primary.lightBlue }} />
                                        <span className="text-sm font-semibold" style={{ color: brandTheme.text.secondary }}>
                                          {item.hoursSpent ? `${item.hoursSpent.toFixed(1)}h` : '0h'}
                                        </span>
                                      </div>
                                    );
                                  }
                                  
                                  // Sort by date descending
                                  const sortedDetails = [...details].sort((a, b) => 
                                    new Date(b.date).getTime() - new Date(a.date).getTime()
                                  );
                                  
                                  const tooltipContent = sortedDetails
                                    .map(d => {
                                      const date = new Date(d.date + 'T00:00:00');
                                      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}: ${d.hours.toFixed(1)}h`;
                                    })
                                    .join('\n');
                                  
                                  return (
                                    <div 
                                      className="flex items-center gap-1 cursor-help group relative"
                                      title={tooltipContent}
                                    >
                                      <Clock className="w-4 h-4" style={{ color: brandTheme.primary.lightBlue }} />
                                      <span className="text-sm font-semibold" style={{ color: brandTheme.text.secondary }}>
                                        {item.hoursSpent ? `${item.hoursSpent.toFixed(1)}h` : '0h'}
                                      </span>
                                      
                                      {/* Custom tooltip */}
                                      <div 
                                        className="absolute hidden group-hover:block z-50 p-2 rounded-lg shadow-lg border whitespace-nowrap"
                                        style={{
                                          backgroundColor: brandTheme.background.primary,
                                          borderColor: brandTheme.border.medium,
                                          left: '100%',
                                          top: '50%',
                                          transform: 'translateY(-50%)',
                                          marginLeft: '8px',
                                          minWidth: '150px',
                                        }}
                                      >
                                        <div className="text-xs font-bold mb-1" style={{ color: brandTheme.text.primary }}>
                                          Hours by Date
                                        </div>
                                        <div className="space-y-1">
                                          {sortedDetails.map((d, idx) => {
                                            const date = new Date(d.date + 'T00:00:00');
                                            return (
                                              <div key={idx} className="flex justify-between gap-3 text-xs">
                                                <span style={{ color: brandTheme.text.secondary }}>
                                                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <span className="font-semibold" style={{ color: brandTheme.primary.lightBlue }}>
                                                  {d.hours.toFixed(1)}h
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </td>

                              {/* Story Points */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <Target className="w-4 h-4" style={{ color: brandTheme.primary.lightBlue }} />
                                  <span className="text-sm font-semibold" style={{ color: brandTheme.primary.navy }}>
                                    {item.storyPoints ? item.storyPoints.toFixed(1) : '0'}
                                  </span>
                                </div>
                              </td>

                              {/* Completion Date */}
                              <td className="px-4 py-3">
                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="date"
                                      value={editingDate}
                                      onChange={(e) => setEditingDate(e.target.value)}
                                      className="px-2 py-1 text-sm border rounded"
                                      style={{
                                        borderColor: brandTheme.border.medium,
                                        color: brandTheme.text.primary,
                                      }}
                                    />
                                    <button
                                      onClick={() => handleSaveDate(item.id, item.type)}
                                      className="px-2 py-1 text-xs rounded font-medium transition-colors"
                                      style={{
                                        backgroundColor: brandTheme.status.success,
                                        color: '#FFFFFF',
                                      }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="px-2 py-1 text-xs rounded font-medium transition-colors"
                                      style={{
                                        backgroundColor: brandTheme.gray?.[200] || '#e5e7eb',
                                        color: brandTheme.text.secondary,
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleEditDate(item.id, item.type, item.completedDate)}
                                    className="text-sm hover:underline cursor-pointer"
                                    style={{ color: brandTheme.primary.navy }}
                                  >
                                    {item.completedDate.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t flex justify-end" style={{ borderColor: brandTheme.border.light }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: brandTheme.primary.navy,
              color: '#FFFFFF',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SprintCompletedSummary;

