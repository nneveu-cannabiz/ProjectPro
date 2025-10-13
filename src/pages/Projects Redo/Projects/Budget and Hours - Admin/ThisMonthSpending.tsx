import React, { useState, useEffect, useMemo } from 'react';
import { fetchPMASpending, fetchAllUsersHours } from '../../../../data/supabase-store';
import { PMASpending, Hour, User, Task, Project } from '../../../../types';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { brandTheme } from '../../../../styles/brandTheme';


interface MonthSummary {
  totalSpending: number;
  totalHours: number;
  laborCosts: number;
  totalCombinedSpending: number;
  averageWeeklySpending: number;
  averageWeeklyHours: number;
  spendingTrend: 'up' | 'down' | 'stable';
  hoursTrend: 'up' | 'down' | 'stable';
}

// Hidden hourly rate for labor cost calculations (admin only, not displayed)
const HOURLY_RATE = 16;

const ThisMonthSpending: React.FC = () => {
  const [spendingData, setSpendingData] = useState<PMASpending[]>([]);
  const [hoursData, setHoursData] = useState<(Hour & { user: User; task: Task; project: Project })[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [spending, hours] = await Promise.all([
        fetchPMASpending(),
        fetchAllUsersHours()
      ]);
      setSpendingData(spending);
      setHoursData(hours);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };


  // Parse ISO date string as local date to avoid timezone offset issues
  const parseISODate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getCurrentMonthData = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get first day of current month at midnight
    const firstDay = new Date(currentYear, currentMonth, 1);
    firstDay.setHours(0, 0, 0, 0);
    
    // Get last day of current month at end of day
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    lastDay.setHours(23, 59, 59, 999);
    
    // Filter spending for current month
    const monthSpending = spendingData.filter(spending => {
      const spendingDate = new Date(spending.created_at);
      return spendingDate >= firstDay && spendingDate <= lastDay;
    });
    
    // Filter hours for current month (excluding planning hours)
    const monthHours = hoursData.filter(hour => {
      if (!hour.date || hour.is_planning_hours) return false;
      const hourDate = parseISODate(hour.date);
      hourDate.setHours(0, 0, 0, 0);
      return hourDate >= firstDay && hourDate <= lastDay;
    });
    
    return {
      spending: monthSpending,
      hours: monthHours,
      totalSpending: monthSpending.reduce((sum, item) => sum + item.amount, 0),
      totalHours: monthHours.reduce((sum, hour) => sum + hour.hours, 0)
    };
  };

  const monthSummary = useMemo((): MonthSummary => {
    const monthData = getCurrentMonthData();
    const totalSpending = monthData.totalSpending;
    const totalHours = monthData.totalHours;
    
    // Calculate labor costs based on total hours
    const laborCosts = totalHours * HOURLY_RATE;
    
    // Calculate total combined spending (expenses + labor)
    const totalCombinedSpending = totalSpending + laborCosts;
    
    // Calculate weekly averages (assuming 4 weeks in a month)
    const averageWeeklySpending = totalCombinedSpending / 4;
    const averageWeeklyHours = totalHours / 4;
    
    // Simple trend calculation based on current vs previous month
    const spendingTrend = 'stable'; // Could be enhanced with previous month data
    const hoursTrend = 'stable'; // Could be enhanced with previous month data
    
    return {
      totalSpending,
      totalHours,
      laborCosts,
      totalCombinedSpending,
      averageWeeklySpending,
      averageWeeklyHours,
      spendingTrend,
      hoursTrend
    };
  }, [spendingData, hoursData]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getUserDisplayName = (user: User): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  const toggleUserExpanded = (weekKey: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekKey)) {
        newSet.delete(weekKey);
      } else {
        newSet.add(weekKey);
      }
      return newSet;
    });
  };

  // Helper function to get Monday of a week
  const getMonday = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

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

  // Process data into weeks with Monday-Friday days
  const weeklyData = useMemo((): WeekData[] => {
    const monthData = getCurrentMonthData();

    // Group by weeks
    const weekMap = new Map<string, WeekData>();

    monthData.hours.forEach((entry) => {
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
  }, [hoursData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const monthData = getCurrentMonthData();
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div 
      className="rounded-lg border p-6"
      style={{
        backgroundColor: brandTheme.background.primary,
        borderColor: brandTheme.border.light,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-6 h-6" style={{ color: brandTheme.primary.navy }} />
        <h2 className="text-xl font-semibold" style={{ color: brandTheme.text.primary }}>This Month Overview - {currentMonth}</h2>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div 
          className="text-center p-3 rounded-lg border"
          style={{
            backgroundColor: brandTheme.primary.paleBlue,
            borderColor: brandTheme.primary.lightBlue,
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="w-4 h-4" style={{ color: brandTheme.primary.navy }} />
            <h3 className="text-sm font-semibold" style={{ color: brandTheme.text.primary }}>Total Hours</h3>
          </div>
          <p className="text-xl font-bold" style={{ color: brandTheme.primary.navy }}>
            {monthSummary.totalHours.toFixed(1)}h
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: brandTheme.text.muted }}>All users this month</p>
        </div>

        <div 
          className="p-3 rounded-lg border"
          style={{
            backgroundColor: brandTheme.background.secondary,
            borderColor: brandTheme.border.light,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4" style={{ color: brandTheme.primary.lightBlue }} />
            <h3 className="text-sm font-semibold" style={{ color: brandTheme.text.primary }}>Hours by User</h3>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {(() => {
              // Calculate hours per user
              const userHoursMap = new Map<string, { user: User; totalHours: number }>();
              monthData.hours.forEach(h => {
                const existing = userHoursMap.get(h.user.id);
                if (existing) {
                  existing.totalHours += h.hours;
                } else {
                  userHoursMap.set(h.user.id, {
                    user: h.user,
                    totalHours: h.hours,
                  });
                }
              });
              
              // Sort by hours descending
              const sortedUsers = Array.from(userHoursMap.values()).sort((a, b) => b.totalHours - a.totalHours);
              
              if (sortedUsers.length === 0) {
                return (
                  <p className="text-xs text-center" style={{ color: brandTheme.text.muted }}>
                    No hours logged
                  </p>
                );
              }
              
              return sortedUsers.map((userTotal) => {
                const userName = getUserDisplayName(userTotal.user);
                const userInitial = userTotal.user.firstName?.charAt(0) || userTotal.user.email.charAt(0).toUpperCase();
                
                return (
                  <div
                    key={userTotal.user.id}
                    className="flex items-center justify-between gap-2 px-2 py-1 rounded"
                    style={{
                      backgroundColor: brandTheme.background.primary,
                    }}
                  >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: userTotal.user.profileColor || brandTheme.primary.navy }}
                      >
                        {userInitial}
                      </div>
                      <span className="text-xs font-medium truncate" style={{ color: brandTheme.text.primary }}>
                        {userName}
                      </span>
                    </div>
                    <span className="text-xs font-bold flex-shrink-0" style={{ color: brandTheme.primary.navy }}>
                      {userTotal.totalHours.toFixed(1)}h
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div 
          className="text-center p-3 rounded-lg border"
          style={{
            backgroundColor: brandTheme.status.successLight,
            borderColor: brandTheme.status.success,
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <DollarSign className="w-4 h-4" style={{ color: brandTheme.status.success }} />
            <h3 className="text-sm font-semibold" style={{ color: brandTheme.text.primary }}>Total Spending</h3>
          </div>
          <p className="text-xl font-bold" style={{ color: brandTheme.status.success }}>
            {formatCurrency(monthSummary.totalSpending)}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: brandTheme.text.muted }}>Expenses this month</p>
        </div>
      </div>

      {/* Monthly Data Tables */}
      <div className="space-y-6">
        {/* Hours by Week - Calendar Style */}
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: brandTheme.text.primary }}>This Month's Hours by Week</h3>
          {weeklyData.length === 0 ? (
            <div 
              className="text-center py-4 rounded-lg"
              style={{ backgroundColor: brandTheme.background.secondary }}
            >
              <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: brandTheme.text.muted }} />
              <p className="text-sm" style={{ color: brandTheme.text.muted }}>No hours logged for this month.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {weeklyData.map((week) => {
                const weekKey = week.weekStart.toISOString().split('T')[0];
                const isExpanded = expandedUsers.has(weekKey);
                const now = new Date();
                const currentMonth = now.getMonth();

                return (
                  <div
                    key={weekKey}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                  >
                    {/* Week Header - Collapsible */}
                    <div
                      className="px-4 py-3 cursor-pointer hover:bg-opacity-90 transition-all flex items-center gap-4"
                      style={{ 
                        backgroundColor: brandTheme.primary.paleBlue,
                      }}
                      onClick={() => toggleUserExpanded(weekKey)}
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

                      {/* Center: User Breakdown (when collapsed) */}
                      {!isExpanded && (() => {
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
                              const userName = getUserDisplayName(userTotal.user);
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
                                    className="p-3 text-center font-semibold text-white"
                                    style={{
                                      backgroundColor: brandTheme.primary.navy,
                                      borderRight: index < 4 ? '1px solid rgba(255,255,255,0.2)' : 'none',
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
                                  const isDifferentMonth = day.date.getMonth() !== currentMonth;
                                  
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
                                          const userName = getUserDisplayName(userEntry.user);
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

        {/* Spending Table */}
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: brandTheme.text.primary }}>This Month's Expenses</h3>
          {monthData.spending.length === 0 ? (
            <div 
              className="text-center py-4 rounded-lg"
              style={{ backgroundColor: brandTheme.background.secondary }}
            >
              <DollarSign className="w-8 h-8 mx-auto mb-2" style={{ color: brandTheme.text.muted }} />
              <p className="text-sm" style={{ color: brandTheme.text.muted }}>No spending entries for this month.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr 
                    className="border-b"
                    style={{
                      backgroundColor: brandTheme.background.secondary,
                      borderColor: brandTheme.border.medium,
                    }}
                  >
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: brandTheme.text.primary }}>Item</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: brandTheme.text.primary }}>Category</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: brandTheme.text.primary }}>Type</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: brandTheme.text.primary }}>Vendor</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: brandTheme.text.primary }}>Date</th>
                    <th className="text-right py-3 px-4 font-semibold" style={{ color: brandTheme.text.primary }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {monthData.spending.map((item) => (
                    <tr 
                      key={item.id} 
                      className="border-b transition-colors"
                      style={{ borderColor: brandTheme.border.light }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = brandTheme.background.secondary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td className="py-3 px-4 font-medium" style={{ color: brandTheme.text.primary }}>{item.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.category === 'software' ? 'bg-blue-100 text-blue-800' :
                          item.category === 'hardware' ? 'bg-purple-100 text-purple-800' :
                          item.category === 'services' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.purchase_type === 'recurring' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.purchase_type}
                        </span>
                      </td>
                      <td className="py-3 px-4" style={{ color: brandTheme.text.secondary }}>{item.vendor || '-'}</td>
                      <td className="py-3 px-4" style={{ color: brandTheme.text.secondary }}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold" style={{ color: brandTheme.status.success }}>
                        {formatCurrency(item.amount, item.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThisMonthSpending;
