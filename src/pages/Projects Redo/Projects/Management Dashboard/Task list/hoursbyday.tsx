import React, { useState, useEffect, useMemo } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { fetchAllUsersHours } from '../../../../../data/supabase-store';
import { Hour, User, Task, Project } from '../../../../../types';

interface HoursByDayProps {
  startDate: Date;
  endDate: Date;
  scrollRef?: React.RefObject<HTMLDivElement>;
  onScroll?: () => void;
  isIntegrated?: boolean; // When true, renders as part of completion timeline
  onHoursDataProcessed?: (hoursData: any[]) => void; // Callback to pass processed hours data
}

type UserHourData = Hour & { user: User; task: Task; project: Project };

const HoursByDay: React.FC<HoursByDayProps> = ({ startDate, endDate, scrollRef, onScroll, isIntegrated = false, onHoursDataProcessed }) => {
  const [allHoursData, setAllHoursData] = useState<UserHourData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // Parse ISO date string as local date to avoid timezone offset issues
  const parseISODate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  useEffect(() => {
    const fetchAllHours = async () => {
      setLoading(true);
      try {
        console.log('=== DEBUG HoursByDay: Fetching ALL hours using fetchAllUsersHours ===');

        // Use the same fetch function as HoursOverview
        const data = await fetchAllUsersHours();
        
        console.log('=== DEBUG HoursByDay: fetchedHoursData count ===', data.length);
        console.log('=== DEBUG HoursByDay: Sample hour entry ===', data[0]);

        setAllHoursData(data);
      } catch (error) {
        console.error('Error fetching hours data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllHours();
  }, []);

  const { dayMarkers, hoursByDate, maxUsersPerDay, maxTasksPerUser, totalDays, weeklyTotals } = useMemo(() => {
    // Generate day markers for the date range
    const markers: { date: Date; position: number; label: string }[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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

    // Filter hours to only those within the date range
    const filteredHours = allHoursData.filter((entry) => {
      if (!entry.date) return false;
      const entryDate = parseISODate(entry.date);
      return entryDate >= start && entryDate <= end;
    });

    console.log('=== DEBUG HoursByDay: filteredHours count ===', filteredHours.length);
    console.log('=== DEBUG HoursByDay: Sample filtered hour ===', filteredHours[0]);

    // Pass filtered hours data to parent if callback is provided
    if (onHoursDataProcessed && filteredHours.length > 0) {
      // Create array of hours data with task info for Gantt chart
      const hoursForGantt = filteredHours.map(entry => ({
        taskId: entry.task.id,
        taskName: entry.task.name,
        date: entry.date,
        hours: entry.hours,
        userId: entry.user.id,
        userName: entry.user.firstName && entry.user.lastName
          ? `${entry.user.firstName} ${entry.user.lastName}`.trim()
          : entry.user.email,
      }));
      onHoursDataProcessed(hoursForGantt);
    }

    // Aggregate hours by date and user with task details
    const hoursMap: Record<string, Record<string, { totalHours: number; tasks: string[] }>> = {};
    
    filteredHours.forEach((entry) => {
      if (entry.hours && entry.hours > 0 && entry.user) {
        // Parse date correctly using the same method as HoursOverview
        const entryDate = parseISODate(entry.date);
        const dateKey = entryDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        
        const userName = entry.user.firstName && entry.user.lastName
          ? `${entry.user.firstName} ${entry.user.lastName}`.trim()
          : entry.user.email;
        
        if (!hoursMap[dateKey]) {
          hoursMap[dateKey] = {};
        }
        
        if (!hoursMap[dateKey][userName]) {
          hoursMap[dateKey][userName] = { totalHours: 0, tasks: [] };
        }
        
        hoursMap[dateKey][userName].totalHours += entry.hours;
        hoursMap[dateKey][userName].tasks.push(
          `${entry.task.name} (${entry.hours.toFixed(1)}h)`
        );
      }
    });

    console.log('=== DEBUG HoursByDay: hoursMap ===', hoursMap);
    console.log('=== DEBUG HoursByDay: hoursMap keys ===', Object.keys(hoursMap));
    console.log('=== DEBUG HoursByDay: dayMarkers labels ===', markers.map(m => m.label));

    // Calculate maximum number of users on any single day for header sizing
    // Also calculate max tasks per user per day for height calculation
    let maxUsers = 0;
    let maxTasksPerUser = 0;
    
    Object.values(hoursMap).forEach(users => {
      const userCount = Object.keys(users).length;
      if (userCount > maxUsers) maxUsers = userCount;
      
      Object.values(users).forEach(userData => {
        if (userData.tasks.length > maxTasksPerUser) {
          maxTasksPerUser = userData.tasks.length;
        }
      });
    });

    // Calculate weekly hours totals and user breakdown
    interface WeekTotal {
      weekStart: Date;
      weekEnd: Date;
      weekLabel: string;
      totalHours: number;
      weekKey: string;
      userBreakdown: Record<string, { user: User; totalHours: number; tasks: { name: string; hours: number; dates: { date: string; hours: number }[] }[] }>;
    }

    const getWeekStart = (date: Date): Date => {
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const day = d.getDay();
      const diff = d.getDate() - day; // Sunday as start of week
      d.setDate(diff);
      return d;
    };

    const formatDateKey = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const weeklyTotals: WeekTotal[] = [];
    const weekMap = new Map<string, WeekTotal>();

    filteredHours.forEach((entry) => {
      const entryDate = parseISODate(entry.date);
      const weekStart = getWeekStart(entryDate);
      const weekKey = formatDateKey(weekStart);

      if (!weekMap.has(weekKey)) {
        const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
        
        const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        
        weekMap.set(weekKey, {
          weekStart,
          weekEnd,
          weekLabel,
          totalHours: 0,
          weekKey,
          userBreakdown: {}
        });
      }

      const week = weekMap.get(weekKey)!;
      week.totalHours += entry.hours;

      // Add to user breakdown
      const userId = entry.user.id;
      if (!week.userBreakdown[userId]) {
        week.userBreakdown[userId] = {
          user: entry.user,
          totalHours: 0,
          tasks: []
        };
      }
      week.userBreakdown[userId].totalHours += entry.hours;
      
      // Add task details with date tracking
      const dateLabel = parseISODate(entry.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      
      const existingTask = week.userBreakdown[userId].tasks.find(t => t.name === entry.task.name);
      if (existingTask) {
        existingTask.hours += entry.hours;
        
        // Add or update date entry
        const existingDate = existingTask.dates.find(d => d.date === dateLabel);
        if (existingDate) {
          existingDate.hours += entry.hours;
        } else {
          existingTask.dates.push({
            date: dateLabel,
            hours: entry.hours
          });
        }
      } else {
        week.userBreakdown[userId].tasks.push({
          name: entry.task.name,
          hours: entry.hours,
          dates: [{
            date: dateLabel,
            hours: entry.hours
          }]
        });
      }
    });

    weeklyTotals.push(...Array.from(weekMap.values()).sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime()));

    return {
      dayMarkers: markers,
      hoursByDate: hoursMap,
      maxUsersPerDay: maxUsers,
      maxTasksPerUser,
      totalDays: diffDays,
      weeklyTotals,
    };
  }, [allHoursData, startDate, endDate]);

  if (loading) {
    if (isIntegrated) {
      return (
        <div className="flex items-center gap-2 text-sm mb-3" style={{ color: brandTheme.text.muted }}>
          <Clock className="w-4 h-4 animate-spin" />
          <span>Loading hours data...</span>
        </div>
      );
    }
    return (
      <div
        className="rounded-lg shadow-sm p-4 mb-4"
        style={{ backgroundColor: brandTheme.background.secondary }}
      >
        <div className="flex items-center gap-2 text-sm" style={{ color: brandTheme.text.muted }}>
          <Clock className="w-4 h-4 animate-spin" />
          <span>Loading hours data...</span>
        </div>
      </div>
    );
  }

  // When integrated into completion timeline, render simplified version
  if (isIntegrated) {
    return (
      <>
        {/* Weekly Totals Header */}
        {weeklyTotals.length > 0 && (
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" style={{ color: brandTheme.primary.navy }} />
              <span className="text-xs font-semibold" style={{ color: brandTheme.text.primary }}>
                Hours Logged by Day
              </span>
            </div>
            <div className="flex items-center gap-2">
              {weeklyTotals.map((week, index) => {
                const isExpanded = expandedWeek === week.weekKey;
                const userBreakdownArray = Object.values(week.userBreakdown).sort((a, b) => b.totalHours - a.totalHours);
                
                return (
                  <div key={index} className="relative">
                    <button
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedWeek(null);
                          setExpandedUsers(new Set()); // Clear user dropdowns when closing week
                        } else {
                          setExpandedWeek(week.weekKey);
                        }
                      }}
                      className="px-2 py-1 rounded border cursor-pointer hover:shadow-md transition-all flex items-center gap-1.5"
                      style={{
                        backgroundColor: brandTheme.background.primary,
                        borderColor: isExpanded ? brandTheme.primary.navy : brandTheme.border.medium,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '9px', color: brandTheme.text.secondary }}>
                          {week.weekLabel}
                        </div>
                        <div className="font-bold" style={{ fontSize: '11px', color: brandTheme.primary.navy }}>
                          {week.totalHours.toFixed(1)}h
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3" style={{ color: brandTheme.primary.navy }} />
                      ) : (
                        <ChevronRight className="w-3 h-3" style={{ color: brandTheme.text.secondary }} />
                      )}
                    </button>

                    {/* User Breakdown Dropdown */}
                    {isExpanded && (
                      <div
                        className="absolute top-full right-0 mt-2 p-3 rounded-lg border shadow-lg z-50 min-w-[250px] max-w-[500px]"
                        style={{
                          backgroundColor: brandTheme.background.primary,
                          borderColor: brandTheme.border.medium,
                          width: 'max-content',
                        }}
                      >
                        <div className="text-xs font-bold mb-2" style={{ color: brandTheme.text.primary }}>
                          Hours by User
                        </div>
                        <div className="space-y-2">
                          {userBreakdownArray.map((userData, userIndex) => {
                            const userName = userData.user.firstName && userData.user.lastName
                              ? `${userData.user.firstName} ${userData.user.lastName}`
                              : userData.user.email;
                            const percentage = (userData.totalHours / week.totalHours) * 100;
                            const userKey = `${week.weekKey}-${userData.user.id}`;
                            const isUserExpanded = expandedUsers.has(userKey);
                            
                            return (
                              <div key={userIndex}>
                                <button
                                  onClick={() => {
                                    const newSet = new Set(expandedUsers);
                                    if (isUserExpanded) {
                                      newSet.delete(userKey);
                                    } else {
                                      newSet.add(userKey);
                                    }
                                    setExpandedUsers(newSet);
                                  }}
                                  className="w-full flex items-center justify-between gap-3 hover:bg-opacity-50 transition-colors rounded p-1"
                                  style={{ backgroundColor: isUserExpanded ? brandTheme.primary.paleBlue : 'transparent' }}
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div
                                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                                      style={{ backgroundColor: userData.user.profileColor || brandTheme.primary.navy }}
                                    >
                                      {userData.user.firstName?.charAt(0) || userData.user.email.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-xs font-medium truncate" style={{ color: brandTheme.text.primary }}>
                                      {userName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs font-bold" style={{ color: brandTheme.primary.navy }}>
                                      {userData.totalHours.toFixed(1)}h
                                    </span>
                                    <span className="text-xs" style={{ color: brandTheme.text.muted }}>
                                      ({percentage.toFixed(0)}%)
                                    </span>
                                    {isUserExpanded ? (
                                      <ChevronDown className="w-3 h-3" style={{ color: brandTheme.primary.navy }} />
                                    ) : (
                                      <ChevronRight className="w-3 h-3" style={{ color: brandTheme.text.secondary }} />
                                    )}
                                  </div>
                                </button>
                                
                                {/* Tasks breakdown */}
                                {isUserExpanded && (
                                  <div className="ml-8 mt-1 space-y-1 pb-2">
                                    {userData.tasks.map((task, taskIndex) => (
                                      <div key={taskIndex}>
                                        {task.dates.map((dateEntry, dateIndex) => (
                                          <div 
                                            key={dateIndex}
                                            className="text-xs p-1 rounded whitespace-nowrap"
                                            style={{ 
                                              backgroundColor: brandTheme.background.secondary, 
                                              color: brandTheme.text.secondary,
                                              width: 'fit-content',
                                              minWidth: '100%'
                                            }}
                                          >
                                            • {task.name} - <span className="font-semibold" style={{ color: brandTheme.primary.lightBlue }}>{dateEntry.hours.toFixed(1)}h</span> - {dateEntry.date}
                                          </div>
                                        ))}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hours Timeline Content */}
        <div 
          className="relative mb-2" 
          style={{ 
            minHeight: `${Math.max(50, 20 + maxUsersPerDay * 35 + maxTasksPerUser * 10)}px`,
          }}
        >
          <div className="absolute inset-0 flex">
            {dayMarkers.map((marker, index) => {
              const dateKey = marker.label;
              const usersHours = hoursByDate?.[dateKey];
              
              return (
                <div
                  key={index}
                  className="absolute h-full flex justify-end"
                  style={{ 
                    right: `${100 - marker.position}%`,
                    maxWidth: `${marker.position}%`,
                  }}
                >
                  <div className="flex flex-col items-end h-full justify-end pb-0">
                    {/* Hours by user with tasks */}
                    {usersHours && Object.keys(usersHours).length > 0 && (
                      <div 
                        className="mb-0.5 p-1.5 rounded space-y-1 mr-1"
                        style={{
                          backgroundColor: brandTheme.primary.paleBlue,
                          maxWidth: '200px',
                        }}
                      >
                        {Object.entries(usersHours).map(([userName, data], userIndex) => (
                          <div 
                            key={userIndex}
                            className="space-y-0.5"
                            style={{ color: brandTheme.primary.navy }}
                          >
                            {/* User name and total hours */}
                            <div 
                              className="flex items-center justify-between gap-2 pb-0.5 border-b cursor-default" 
                              style={{ borderColor: brandTheme.primary.navy + '30' }}
                              title={`${userName} - ${data.totalHours.toFixed(1)} hours`}
                            >
                              <span className="font-bold truncate" style={{ maxWidth: '120px', fontSize: '11px' }}>
                                {userName.split(' ')[0]}
                              </span>
                              <span className="font-bold" style={{ fontSize: '11px' }}>
                                {data.totalHours.toFixed(1)}h
                              </span>
                            </div>
                            
                            {/* Tasks list */}
                            <div className="space-y-0.5">
                              {data.tasks.slice(0, 2).map((task, taskIndex) => (
                                <p 
                                  key={taskIndex} 
                                  className="truncate"
                                  style={{ 
                                    color: brandTheme.text.secondary,
                                    maxWidth: '180px',
                                    fontSize: '10px',
                                  }}
                                  title={task}
                                >
                                  • {task}
                                </p>
                              ))}
                              {data.tasks.length > 2 && (
                                <p 
                                  className="truncate"
                                  style={{ 
                                    color: brandTheme.text.muted,
                                    fontSize: '10px',
                                  }}
                                >
                                  +{data.tasks.length - 2} more
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // Standalone version with full container
  return (
    <div
      className="rounded-lg shadow-sm p-4 mb-4"
      style={{ backgroundColor: brandTheme.background.secondary }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" style={{ color: brandTheme.primary.navy }} />
          <h4 className="font-bold" style={{ color: brandTheme.text.primary }}>
            Hours Logged by Day
          </h4>
        </div>
        
        {/* Weekly Totals */}
        {weeklyTotals.length > 0 && (
          <div className="flex items-center gap-3">
            {weeklyTotals.map((week, index) => {
              const isExpanded = expandedWeek === week.weekKey;
              const userBreakdownArray = Object.values(week.userBreakdown).sort((a, b) => b.totalHours - a.totalHours);
              
              return (
                <div key={index} className="relative">
                  <button
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedWeek(null);
                        setExpandedUsers(new Set()); // Clear user dropdowns when closing week
                      } else {
                        setExpandedWeek(week.weekKey);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg border cursor-pointer hover:shadow-md transition-all flex items-center gap-2"
                    style={{
                      backgroundColor: brandTheme.background.primary,
                      borderColor: isExpanded ? brandTheme.primary.navy : brandTheme.border.medium,
                    }}
                  >
                    <div>
                      <div className="text-xs font-medium" style={{ color: brandTheme.text.secondary }}>
                        {week.weekLabel}
                      </div>
                      <div className="text-sm font-bold" style={{ color: brandTheme.primary.navy }}>
                        {week.totalHours.toFixed(1)}h
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" style={{ color: brandTheme.primary.navy }} />
                    ) : (
                      <ChevronRight className="w-4 h-4" style={{ color: brandTheme.text.secondary }} />
                    )}
                  </button>

                  {/* User Breakdown Dropdown */}
                  {isExpanded && (
                    <div
                      className="absolute top-full right-0 mt-2 p-3 rounded-lg border shadow-lg z-50 min-w-[250px] max-w-[500px]"
                      style={{
                        backgroundColor: brandTheme.background.primary,
                        borderColor: brandTheme.border.medium,
                        width: 'max-content',
                      }}
                    >
                      <div className="text-xs font-bold mb-2" style={{ color: brandTheme.text.primary }}>
                        Hours by User
                      </div>
                      <div className="space-y-2">
                        {userBreakdownArray.map((userData, userIndex) => {
                          const userName = userData.user.firstName && userData.user.lastName
                            ? `${userData.user.firstName} ${userData.user.lastName}`
                            : userData.user.email;
                          const percentage = (userData.totalHours / week.totalHours) * 100;
                          const userKey = `${week.weekKey}-${userData.user.id}`;
                          const isUserExpanded = expandedUsers.has(userKey);
                          
                          return (
                            <div key={userIndex}>
                              <button
                                onClick={() => {
                                  const newSet = new Set(expandedUsers);
                                  if (isUserExpanded) {
                                    newSet.delete(userKey);
                                  } else {
                                    newSet.add(userKey);
                                  }
                                  setExpandedUsers(newSet);
                                }}
                                className="w-full flex items-center justify-between gap-3 hover:bg-opacity-50 transition-colors rounded p-1"
                                style={{ backgroundColor: isUserExpanded ? brandTheme.primary.paleBlue : 'transparent' }}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                                    style={{ backgroundColor: userData.user.profileColor || brandTheme.primary.navy }}
                                  >
                                    {userData.user.firstName?.charAt(0) || userData.user.email.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-medium truncate" style={{ color: brandTheme.text.primary }}>
                                    {userName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-xs font-bold" style={{ color: brandTheme.primary.navy }}>
                                    {userData.totalHours.toFixed(1)}h
                                  </span>
                                  <span className="text-xs" style={{ color: brandTheme.text.muted }}>
                                    ({percentage.toFixed(0)}%)
                                  </span>
                                  {isUserExpanded ? (
                                    <ChevronDown className="w-3 h-3" style={{ color: brandTheme.primary.navy }} />
                                  ) : (
                                    <ChevronRight className="w-3 h-3" style={{ color: brandTheme.text.secondary }} />
                                  )}
                                </div>
                              </button>
                              
                              {/* Tasks breakdown */}
                              {isUserExpanded && (
                                <div className="ml-8 mt-1 space-y-1 pb-2">
                                  {userData.tasks.map((task, taskIndex) => (
                                    <div key={taskIndex}>
                                      {task.dates.map((dateEntry, dateIndex) => (
                                        <div 
                                          key={dateIndex}
                                          className="text-xs p-1 rounded whitespace-nowrap"
                                          style={{ 
                                            backgroundColor: brandTheme.background.secondary, 
                                            color: brandTheme.text.secondary,
                                            width: 'fit-content',
                                            minWidth: '100%'
                                          }}
                                        >
                                          • {task.name} - <span className="font-semibold" style={{ color: brandTheme.primary.lightBlue }}>{dateEntry.hours.toFixed(1)}h</span> - {dateEntry.date}
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hours Timeline */}
      <div 
        ref={scrollRef}
        onScroll={onScroll}
        className="relative overflow-x-auto"
      >
        <div
          className="relative"
          style={{
            width: `${Math.max(1200, totalDays * 150)}px`,
          }}
        >
          {/* Day markers header with hours */}
          <div 
            className="relative" 
            style={{ 
              minHeight: `${Math.max(80, 30 + maxUsersPerDay * 60 + maxTasksPerUser * 15)}px`,
            }}
          >
            <div className="absolute inset-0 flex">
              {dayMarkers.map((marker, index) => {
                const dateKey = marker.label;
                const usersHours = hoursByDate?.[dateKey];
                
                return (
                  <div
                    key={index}
                    className="absolute h-full"
                    style={{ left: `${marker.position}%` }}
                  >
                    <div className="flex flex-col items-start h-full justify-end pb-0">
                      {/* Hours by user with tasks */}
                      {usersHours && Object.keys(usersHours).length > 0 && (
                        <div 
                          className="mb-1 p-2 rounded text-xs space-y-2"
                          style={{
                            backgroundColor: brandTheme.primary.paleBlue,
                            maxWidth: '200px',
                          }}
                        >
                          {Object.entries(usersHours).map(([userName, data], userIndex) => (
                            <div 
                              key={userIndex}
                              className="space-y-1"
                              style={{ color: brandTheme.primary.navy }}
                            >
                              {/* User name and total hours */}
                              <div className="flex items-center justify-between gap-2 pb-1 border-b" style={{ borderColor: brandTheme.primary.navy + '30' }}>
                                <span className="font-bold truncate" style={{ maxWidth: '120px' }}>
                                  {userName.split(' ')[0]}
                                </span>
                                <span className="font-bold text-sm">
                                  {data.totalHours.toFixed(1)}h
                                </span>
                              </div>
                              
                              {/* Tasks list */}
                              <div className="space-y-0.5 pl-1">
                                {data.tasks.map((task, taskIndex) => (
                                  <p 
                                    key={taskIndex} 
                                    className="text-xs truncate"
                                    style={{ 
                                      color: brandTheme.text.secondary,
                                      maxWidth: '180px'
                                    }}
                                    title={task}
                                  >
                                    • {task}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Date marker line and label - always at bottom */}
                      <div className="flex flex-col items-center mt-auto">
                        <div
                          className="h-2 w-px"
                          style={{ backgroundColor: brandTheme.border.medium }}
                        />
                        
                        {/* Date label */}
                        <span
                          className="text-xs font-medium mt-1 whitespace-nowrap"
                          style={{ color: brandTheme.text.secondary }}
                        >
                          {marker.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoursByDay;

