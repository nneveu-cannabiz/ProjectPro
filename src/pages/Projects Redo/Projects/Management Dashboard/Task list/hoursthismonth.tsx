import React, { useState, useEffect, useMemo } from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { X, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { fetchAllUsersHours } from '../../../../../data/supabase-store';
import { Hour, User, Task, Project } from '../../../../../types';

interface HoursThisMonthProps {
  isOpen: boolean;
  onClose: () => void;
}

type UserHourData = Hour & { user: User; task: Task; project: Project };

interface DayHours {
  date: Date;
  dateLabel: string;
  users: Array<{
    user: User;
    totalHours: number;
    tasks: Array<{
      taskName: string;
      hours: number;
    }>;
  }>;
  totalHours: number;
}

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  days: DayHours[]; // Monday through Friday
  totalHours: number;
}

const HoursThisMonth: React.FC<HoursThisMonthProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [allHoursData, setAllHoursData] = useState<UserHourData[]>([]);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  // Get current month date range
  const { startDate, endDate, monthLabel } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const label = now.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    return {
      startDate: start,
      endDate: end,
      monthLabel: label,
    };
  }, []);

  // Parse ISO date string as local date to avoid timezone offset issues
  const parseISODate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  useEffect(() => {
    if (isOpen) {
      fetchMonthlyHours();
    }
  }, [isOpen]);

  const fetchMonthlyHours = async () => {
    setLoading(true);
    try {
      // Fetch all hours data using the same method as HoursOverview
      const data = await fetchAllUsersHours();
      setAllHoursData(data);
    } catch (error) {
      console.error('Error fetching monthly hours:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get Monday of a week
  const getMonday = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Process data into weeks with Monday-Friday days
  const weeklyData = useMemo((): WeekData[] => {
    // Filter hours for current month only
    const monthlyHours = allHoursData.filter(entry => {
      const entryDate = parseISODate(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });

    // Group by weeks
    const weekMap = new Map<string, WeekData>();

    monthlyHours.forEach((entry) => {
      const entryDate = parseISODate(entry.date);
      const dayOfWeek = entryDate.getDay();
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek === 0 || dayOfWeek === 6) return;

      const monday = getMonday(entryDate);
      const weekKey = monday.toISOString().split('T')[0];

      // Initialize week if doesn't exist
      if (!weekMap.has(weekKey)) {
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);

        weekMap.set(weekKey, {
          weekStart: monday,
          weekEnd: friday,
          weekLabel: `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${friday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          days: [],
          totalHours: 0,
        });

        // Initialize all 5 days (Monday-Friday)
        const week = weekMap.get(weekKey)!;
        for (let i = 0; i < 5; i++) {
          const day = new Date(monday);
          day.setDate(monday.getDate() + i);
          
          week.days.push({
            date: day,
            dateLabel: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            users: [],
            totalHours: 0,
          });
        }
      }

      const week = weekMap.get(weekKey)!;
      
      // Find the correct day
      const dayIndex = dayOfWeek - 1; // Convert to 0-4 (Mon-Fri)
      const day = week.days[dayIndex];

      // Add hours to this day
      const userId = entry.user.id;
      let userEntry = day.users.find(u => u.user.id === userId);
      
      if (!userEntry) {
        userEntry = {
          user: entry.user,
          totalHours: 0,
          tasks: [],
        };
        day.users.push(userEntry);
      }

      userEntry.totalHours += entry.hours;
      
      // Add task
      const existingTask = userEntry.tasks.find(t => t.taskName === entry.task.name);
      if (existingTask) {
        existingTask.hours += entry.hours;
      } else {
        userEntry.tasks.push({
          taskName: entry.task.name,
          hours: entry.hours,
        });
      }

      day.totalHours += entry.hours;
      week.totalHours += entry.hours;
    });

    // Sort weeks chronologically and sort users within each day
    const weeks = Array.from(weekMap.values()).sort((a, b) => 
      a.weekStart.getTime() - b.weekStart.getTime()
    );

    weeks.forEach(week => {
      week.days.forEach(day => {
        day.users.sort((a, b) => b.totalHours - a.totalHours);
        day.users.forEach(user => {
          user.tasks.sort((a, b) => b.hours - a.hours);
        });
      });
    });

    return weeks;
  }, [allHoursData, startDate, endDate]);

  // Calculate total hours across all weeks
  const totalHoursAllUsers = useMemo(() => {
    return weeklyData.reduce((sum, week) => sum + week.totalHours, 0);
  }, [weeklyData]);

  const toggleWeek = (weekKey: string) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekKey)) {
      newExpanded.delete(weekKey);
    } else {
      newExpanded.add(weekKey);
    }
    setExpandedWeeks(newExpanded);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ 
          backgroundColor: brandTheme.background.primary,
          maxWidth: '95vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ backgroundColor: brandTheme.primary.navy }}
        >
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Hours This Month</h2>
              <p className="text-sm text-white opacity-90">{monthLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-medium text-white opacity-90">Total Hours</div>
              <div className="text-2xl font-bold text-white">{totalHoursAllUsers.toFixed(1)}h</div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Clock className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: brandTheme.primary.navy }} />
                <p style={{ color: brandTheme.text.muted }}>Loading hours data...</p>
              </div>
            </div>
          ) : weeklyData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: brandTheme.text.muted }} />
                <p style={{ color: brandTheme.text.muted }}>No hours logged this month</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {weeklyData.map((week) => {
                const weekKey = week.weekStart.toISOString().split('T')[0];
                const isExpanded = expandedWeeks.has(weekKey);

                return (
                  <div
                    key={weekKey}
                    className="rounded-lg shadow-sm overflow-hidden"
                    style={{ 
                      backgroundColor: brandTheme.background.secondary,
                      border: `1px solid ${brandTheme.border.light}`,
                    }}
                  >
                    {/* Week Header - Collapsible */}
                    <div
                      className="px-4 py-3 cursor-pointer hover:bg-opacity-90 transition-all flex items-center gap-4"
                      style={{ 
                        backgroundColor: brandTheme.primary.paleBlue,
                      }}
                      onClick={() => toggleWeek(weekKey)}
                    >
                      {/* Left: Chevron and Week Label */}
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" style={{ color: brandTheme.primary.navy }} />
                        ) : (
                          <ChevronRight className="w-5 h-5" style={{ color: brandTheme.primary.navy }} />
                        )}
                        <div>
                          <div className="font-bold text-lg" style={{ color: brandTheme.text.primary }}>
                            {week.weekLabel}
                          </div>
                          <div className="text-xs" style={{ color: brandTheme.text.muted }}>
                            Click to {isExpanded ? 'collapse' : 'expand'}
                          </div>
                        </div>
                      </div>

                      {/* Center: User Breakdown (always visible) */}
                      {(() => {
                        // Calculate user totals for the week
                        const userTotalsMap = new Map<string, { user: User; totalHours: number }>();
                        
                        week.days.forEach(day => {
                          day.users.forEach(userEntry => {
                            const existing = userTotalsMap.get(userEntry.user.id);
                            if (existing) {
                              existing.totalHours += userEntry.totalHours;
                            } else {
                              userTotalsMap.set(userEntry.user.id, {
                                user: userEntry.user,
                                totalHours: userEntry.totalHours,
                              });
                            }
                          });
                        });

                        const userTotals = Array.from(userTotalsMap.values()).sort((a, b) => b.totalHours - a.totalHours);

                        return userTotals.length > 0 ? (
                          <div 
                            className="flex-1 flex items-center gap-2 flex-wrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {userTotals.map((userTotal) => {
                              const userName = `${userTotal.user.firstName} ${userTotal.user.lastName}`.trim() || userTotal.user.email;
                              const userInitial = userTotal.user.firstName?.charAt(0) || userTotal.user.email.charAt(0).toUpperCase();

                              return (
                                <div
                                  key={userTotal.user.id}
                                  className="flex items-center gap-2 px-2 py-1 rounded-lg"
                                  style={{
                                    backgroundColor: brandTheme.background.primary,
                                    border: `1px solid ${brandTheme.border.light}`,
                                  }}
                                >
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: userTotal.user.profileColor || brandTheme.primary.navy }}
                                  >
                                    {userInitial}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium" style={{ color: brandTheme.text.primary }}>
                                      {userName.split(' ')[0]}
                                    </span>
                                    <span className="text-xs font-bold" style={{ color: brandTheme.primary.navy }}>
                                      {userTotal.totalHours.toFixed(1)}h
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : <div className="flex-1" />;
                      })()}

                      {/* Right: Weekly Total */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-medium" style={{ color: brandTheme.text.secondary }}>
                          Weekly Total
                        </div>
                        <div className="text-2xl font-bold" style={{ color: brandTheme.primary.navy }}>
                          {week.totalHours.toFixed(1)}h
                        </div>
                      </div>
                    </div>

                    {/* Expanded Week Content - Days Grid */}
                    {isExpanded && (
                      <div className="p-4">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse table-fixed" style={{ minWidth: '1000px' }}>
                            <thead>
                              <tr>
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((dayName, index) => (
                                  <th
                                    key={dayName}
                                    className="p-3 text-center font-semibold"
                                    style={{
                                      backgroundColor: brandTheme.primary.navy,
                                      color: '#FFFFFF',
                                      borderRight: index < 4 ? `1px solid ${brandTheme.border.light}` : 'none',
                                    }}
                                  >
                                    <div>{dayName}</div>
                                    <div className="text-xs font-normal opacity-90">
                                      {week.days[index]?.dateLabel}
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {week.days.map((day, dayIndex) => {
                                  // Check if this day is in a different month than the current month
                                  const isDifferentMonth = day.date.getMonth() !== startDate.getMonth();
                                  
                                  return (
                                  <td
                                    key={dayIndex}
                                    className="p-2 align-top"
                                    style={{
                                      backgroundColor: brandTheme.background.primary,
                                      borderRight: dayIndex < 4 ? `1px solid ${brandTheme.border.light}` : 'none',
                                      borderTop: `1px solid ${brandTheme.border.light}`,
                                      verticalAlign: 'top',
                                    }}
                                  >
                                    {day.users.length === 0 ? (
                                      <div className="text-center text-xs py-4" style={{ color: brandTheme.text.muted }}>
                                        {isDifferentMonth ? 'Last Month' : 'No hours'}
                                      </div>
                                    ) : (
                                      <div className="space-y-1.5">
                                        {day.users.map((userEntry) => {
                                          const userName = `${userEntry.user.firstName} ${userEntry.user.lastName}`.trim() || userEntry.user.email;
                                          const userInitial = userEntry.user.firstName?.charAt(0) || userEntry.user.email.charAt(0).toUpperCase();

                                          return (
                                            <div key={userEntry.user.id} className="space-y-0.5">
                                              {/* User Header - Compact with hours always visible */}
                                              <div 
                                                className="flex items-center gap-1.5 p-1 rounded"
                                                style={{ 
                                                  backgroundColor: brandTheme.primary.paleBlue,
                                                }}
                                              >
                                                <div
                                                  className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                                                  style={{ backgroundColor: userEntry.user.profileColor || brandTheme.primary.navy }}
                                                >
                                                  {userInitial}
                                                </div>
                                                <span className="text-xs font-semibold flex-shrink-0" style={{ color: brandTheme.text.primary }}>
                                                  {userName.split(' ')[0]}
                                                </span>
                                                <span className="text-xs font-bold flex-shrink-0" style={{ color: brandTheme.primary.navy }}>
                                                  {userEntry.totalHours.toFixed(1)}h
                                                </span>
                                              </div>
                                              
                                              {/* Tasks List */}
                                              <div className="pl-1 space-y-0.5">
                                                {userEntry.tasks.map((task, taskIndex) => (
                                                  <div
                                                    key={taskIndex}
                                                    className="py-0.5 px-1.5 rounded text-[10px]"
                                                    style={{ 
                                                      backgroundColor: brandTheme.background.secondary,
                                                      borderLeft: `2px solid ${brandTheme.primary.lightBlue}`,
                                                      color: brandTheme.text.secondary,
                                                    }}
                                                  >
                                                    <div className="truncate" title={task.taskName}>
                                                      • {task.taskName}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </td>
                                  );
                                })}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HoursThisMonth;

