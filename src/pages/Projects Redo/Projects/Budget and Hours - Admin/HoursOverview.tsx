import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllUsersHours } from '../../../../data/supabase-store';
import { Hour, User, Task, Project } from '../../../../types';
import { Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import LineChart from './linechart';
import { brandTheme } from '../../../../styles/brandTheme';

interface HoursOverviewProps {
  // Props can be added later if needed
}

type ViewType = 'chart' | 'weekly' | 'monthly';
type UserHourData = Hour & { user: User; task: Task; project: Project };

interface WeekData {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  userHours: Record<string, { user: User; totalHours: number; entries: UserHourData[] }>;
  totalHours: number;
}

interface MonthData {
  month: string;
  year: number;
  monthLabel: string;
  userHours: Record<string, { user: User; totalHours: number; entries: UserHourData[] }>;
  totalHours: number;
}

const HoursOverview: React.FC<HoursOverviewProps> = () => {
  const [hoursData, setHoursData] = useState<UserHourData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<ViewType>('chart');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadHoursData = async () => {
      setLoading(true);
      try {
        const data = await fetchAllUsersHours();
        setHoursData(data);
      } catch (error) {
        console.error('Failed to load hours data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHoursData();
  }, []);

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  };

  const getWeekEnd = (weekStart: Date): Date => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd;
  };

  const formatWeekLabel = (weekStart: Date, weekEnd: Date): string => {
    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
    const startDay = weekStart.getDate();
    const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
    const endDay = weekEnd.getDate();
    const year = weekStart.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  };

  // Parse ISO date string as local date to avoid timezone offset issues
  const parseISODate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const weeklyData = useMemo((): WeekData[] => {
    const weekMap = new Map<string, WeekData>();

    hoursData.forEach(entry => {
      const entryDate = parseISODate(entry.date);
      const weekStart = getWeekStart(entryDate);
      const weekEnd = getWeekEnd(weekStart);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, {
          weekStart,
          weekEnd,
          weekLabel: formatWeekLabel(weekStart, weekEnd),
          userHours: {},
          totalHours: 0
        });
      }

      const week = weekMap.get(weekKey)!;
      const userId = entry.user.id;

      if (!week.userHours[userId]) {
        week.userHours[userId] = {
          user: entry.user,
          totalHours: 0,
          entries: []
        };
      }

      week.userHours[userId].totalHours += entry.hours;
      week.userHours[userId].entries.push(entry);
      week.totalHours += entry.hours;
    });

    return Array.from(weekMap.values())
      .sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
  }, [hoursData]);

  const monthlyData = useMemo((): MonthData[] => {
    const monthMap = new Map<string, MonthData>();

    hoursData.forEach(entry => {
      const entryDate = parseISODate(entry.date);
      const month = entryDate.toLocaleDateString('en-US', { month: 'long' });
      const year = entryDate.getFullYear();
      const monthKey = `${year}-${entryDate.getMonth()}`;

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          month,
          year,
          monthLabel: `${month} ${year}`,
          userHours: {},
          totalHours: 0
        });
      }

      const monthData = monthMap.get(monthKey)!;
      const userId = entry.user.id;

      if (!monthData.userHours[userId]) {
        monthData.userHours[userId] = {
          user: entry.user,
          totalHours: 0,
          entries: []
        };
      }

      monthData.userHours[userId].totalHours += entry.hours;
      monthData.userHours[userId].entries.push(entry);
      monthData.totalHours += entry.hours;
    });

    return Array.from(monthMap.values())
      .sort((a, b) => (b.year - a.year) || (new Date(`${b.month} 1`).getMonth() - new Date(`${a.month} 1`).getMonth()));
  }, [hoursData]);

  const toggleExpanded = (key: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedItems(newExpanded);
  };

  const getUserDisplayName = (user: User): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: brandTheme.primary.navy }}
        ></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          className="px-4 py-2 rounded-lg font-medium transition-all"
          style={{
            backgroundColor: viewType === 'chart' ? brandTheme.primary.navy : brandTheme.background.primary,
            color: viewType === 'chart' ? '#FFFFFF' : brandTheme.text.primary,
            border: `1px solid ${viewType === 'chart' ? brandTheme.primary.navy : brandTheme.border.medium}`,
          }}
          onClick={() => setViewType('chart')}
        >
          Chart View
        </button>
        <button
          className="px-4 py-2 rounded-lg font-medium transition-all"
          style={{
            backgroundColor: viewType === 'weekly' ? brandTheme.primary.navy : brandTheme.background.primary,
            color: viewType === 'weekly' ? '#FFFFFF' : brandTheme.text.primary,
            border: `1px solid ${viewType === 'weekly' ? brandTheme.primary.navy : brandTheme.border.medium}`,
          }}
          onClick={() => setViewType('weekly')}
        >
          Weekly View
        </button>
        <button
          className="px-4 py-2 rounded-lg font-medium transition-all"
          style={{
            backgroundColor: viewType === 'monthly' ? brandTheme.primary.navy : brandTheme.background.primary,
            color: viewType === 'monthly' ? '#FFFFFF' : brandTheme.text.primary,
            border: `1px solid ${viewType === 'monthly' ? brandTheme.primary.navy : brandTheme.border.medium}`,
          }}
          onClick={() => setViewType('monthly')}
        >
          Monthly View
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {viewType === 'chart' ? (
          <LineChart hoursData={hoursData} />
        ) : viewType === 'weekly' ? (
          weeklyData.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: brandTheme.text.muted }} />
              <p style={{ color: brandTheme.text.secondary }}>No hours logged yet.</p>
            </div>
          ) : (
            weeklyData.map((week) => {
              const weekKey = `week-${week.weekStart.toISOString().split('T')[0]}`;
              const isExpanded = expandedItems.has(weekKey);

              return (
                <div 
                  key={weekKey} 
                  className="rounded-lg border overflow-hidden"
                  style={{
                    backgroundColor: brandTheme.background.primary,
                    borderColor: brandTheme.border.light,
                  }}
                >
                  <div
                    className="p-4 cursor-pointer transition-colors"
                    style={{ backgroundColor: brandTheme.background.secondary }}
                    onClick={() => toggleExpanded(weekKey)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandTheme.primary.paleBlue}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = brandTheme.background.secondary}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" style={{ color: brandTheme.text.secondary }} />
                        ) : (
                          <ChevronRight className="w-5 h-5" style={{ color: brandTheme.text.secondary }} />
                        )}
                        <div>
                          <h3 className="font-semibold" style={{ color: brandTheme.text.primary }}>{week.weekLabel}</h3>
                          <p className="text-sm" style={{ color: brandTheme.text.secondary }}>
                            {Object.keys(week.userHours).length} user{Object.keys(week.userHours).length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg" style={{ color: brandTheme.primary.navy }}>{week.totalHours.toFixed(2)}h</p>
                        <p className="text-sm" style={{ color: brandTheme.text.muted }}>Total</p>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {Object.values(week.userHours)
                        .sort((a, b) => b.totalHours - a.totalHours)
                        .map((userHour) => {
                          const userKey = `${weekKey}-user-${userHour.user.id}`;
                          const isUserExpanded = expandedItems.has(userKey);
                          
                          return (
                            <div 
                              key={userHour.user.id} 
                              className="border rounded-md overflow-hidden"
                              style={{ borderColor: brandTheme.border.medium }}
                            >
                              <div 
                                className="flex items-center justify-between p-3 cursor-pointer transition-colors"
                                style={{ backgroundColor: brandTheme.background.secondary }}
                                onClick={() => toggleExpanded(userKey)}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandTheme.primary.paleBlue}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = brandTheme.background.secondary}
                              >
                                <div className="flex items-center gap-3">
                                  {isUserExpanded ? (
                                    <ChevronDown className="w-4 h-4" style={{ color: brandTheme.text.secondary }} />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" style={{ color: brandTheme.text.secondary }} />
                                  )}
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                                    style={{ backgroundColor: userHour.user.profileColor || brandTheme.primary.navy }}
                                  >
                                    {userHour.user.firstName?.charAt(0) || userHour.user.email.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium" style={{ color: brandTheme.text.primary }}>{getUserDisplayName(userHour.user)}</p>
                                    <p className="text-sm" style={{ color: brandTheme.text.secondary }}>{userHour.entries.length} entr{userHour.entries.length !== 1 ? 'ies' : 'y'}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold" style={{ color: brandTheme.text.primary }}>{userHour.totalHours.toFixed(2)}h</p>
                                  <p className="text-xs" style={{ color: brandTheme.text.muted }}>
                                    {((userHour.totalHours / week.totalHours) * 100).toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                              
                              {isUserExpanded && (
                                <div 
                                  className="p-3 space-y-2"
                                  style={{ backgroundColor: brandTheme.background.primary }}
                                >
                                  {userHour.entries
                                    .sort((a, b) => parseISODate(b.date).getTime() - parseISODate(a.date).getTime())
                                    .map((entry, idx) => (
                                      <div 
                                        key={idx} 
                                        className="p-3 rounded border"
                                        style={{
                                          backgroundColor: brandTheme.background.secondary,
                                          borderColor: brandTheme.border.light,
                                        }}
                                      >
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" style={{ color: brandTheme.text.secondary }} />
                                            <span className="text-sm font-medium" style={{ color: brandTheme.text.primary }}>
                                              {parseISODate(entry.date).toLocaleDateString('en-US', { 
                                                weekday: 'short',
                                                month: 'short', 
                                                day: 'numeric',
                                                year: 'numeric'
                                              })}
                                            </span>
                                          </div>
                                          <span className="text-sm font-semibold" style={{ color: brandTheme.primary.navy }}>
                                            {entry.hours.toFixed(2)}h
                                          </span>
                                        </div>
                                        <div className="ml-6 space-y-1">
                                          <p className="text-sm" style={{ color: brandTheme.text.secondary }}>
                                            <span className="font-medium">Project:</span> {entry.project.name}
                                          </p>
                                          <p className="text-sm" style={{ color: brandTheme.text.secondary }}>
                                            <span className="font-medium">Task:</span> {entry.task.name}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          monthlyData.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: brandTheme.text.muted }} />
              <p style={{ color: brandTheme.text.secondary }}>No hours logged yet.</p>
            </div>
          ) : (
            monthlyData.map((month) => {
              const monthKey = `month-${month.year}-${month.month}`;
              const isExpanded = expandedItems.has(monthKey);

              return (
                <div 
                  key={monthKey} 
                  className="rounded-lg border overflow-hidden"
                  style={{
                    backgroundColor: brandTheme.background.primary,
                    borderColor: brandTheme.border.light,
                  }}
                >
                  <div
                    className="p-4 cursor-pointer transition-colors"
                    style={{ backgroundColor: brandTheme.background.secondary }}
                    onClick={() => toggleExpanded(monthKey)}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandTheme.primary.paleBlue}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = brandTheme.background.secondary}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" style={{ color: brandTheme.text.secondary }} />
                        ) : (
                          <ChevronRight className="w-5 h-5" style={{ color: brandTheme.text.secondary }} />
                        )}
                        <div>
                          <h3 className="font-semibold" style={{ color: brandTheme.text.primary }}>{month.monthLabel}</h3>
                          <p className="text-sm" style={{ color: brandTheme.text.secondary }}>
                            {Object.keys(month.userHours).length} user{Object.keys(month.userHours).length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg" style={{ color: brandTheme.primary.navy }}>{month.totalHours.toFixed(2)}h</p>
                        <p className="text-sm" style={{ color: brandTheme.text.muted }}>Total</p>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {Object.values(month.userHours)
                        .sort((a, b) => b.totalHours - a.totalHours)
                        .map((userHour) => {
                          const userKey = `${monthKey}-user-${userHour.user.id}`;
                          const isUserExpanded = expandedItems.has(userKey);
                          
                          return (
                            <div 
                              key={userHour.user.id} 
                              className="border rounded-md overflow-hidden"
                              style={{ borderColor: brandTheme.border.medium }}
                            >
                              <div 
                                className="flex items-center justify-between p-3 cursor-pointer transition-colors"
                                style={{ backgroundColor: brandTheme.background.secondary }}
                                onClick={() => toggleExpanded(userKey)}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandTheme.primary.paleBlue}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = brandTheme.background.secondary}
                              >
                                <div className="flex items-center gap-3">
                                  {isUserExpanded ? (
                                    <ChevronDown className="w-4 h-4" style={{ color: brandTheme.text.secondary }} />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" style={{ color: brandTheme.text.secondary }} />
                                  )}
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                                    style={{ backgroundColor: userHour.user.profileColor || brandTheme.primary.navy }}
                                  >
                                    {userHour.user.firstName?.charAt(0) || userHour.user.email.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium" style={{ color: brandTheme.text.primary }}>{getUserDisplayName(userHour.user)}</p>
                                    <p className="text-sm" style={{ color: brandTheme.text.secondary }}>{userHour.entries.length} entr{userHour.entries.length !== 1 ? 'ies' : 'y'}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold" style={{ color: brandTheme.text.primary }}>{userHour.totalHours.toFixed(2)}h</p>
                                  <p className="text-xs" style={{ color: brandTheme.text.muted }}>
                                    {((userHour.totalHours / month.totalHours) * 100).toFixed(1)}%
                                  </p>
                                </div>
                              </div>
                              
                              {isUserExpanded && (
                                <div 
                                  className="p-3 space-y-2"
                                  style={{ backgroundColor: brandTheme.background.primary }}
                                >
                                  {userHour.entries
                                    .sort((a, b) => parseISODate(b.date).getTime() - parseISODate(a.date).getTime())
                                    .map((entry, idx) => (
                                      <div 
                                        key={idx} 
                                        className="p-3 rounded border"
                                        style={{
                                          backgroundColor: brandTheme.background.secondary,
                                          borderColor: brandTheme.border.light,
                                        }}
                                      >
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" style={{ color: brandTheme.text.secondary }} />
                                            <span className="text-sm font-medium" style={{ color: brandTheme.text.primary }}>
                                              {parseISODate(entry.date).toLocaleDateString('en-US', { 
                                                weekday: 'short',
                                                month: 'short', 
                                                day: 'numeric',
                                                year: 'numeric'
                                              })}
                                            </span>
                                          </div>
                                          <span className="text-sm font-semibold" style={{ color: brandTheme.primary.navy }}>
                                            {entry.hours.toFixed(2)}h
                                          </span>
                                        </div>
                                        <div className="ml-6 space-y-1">
                                          <p className="text-sm" style={{ color: brandTheme.text.secondary }}>
                                            <span className="font-medium">Project:</span> {entry.project.name}
                                          </p>
                                          <p className="text-sm" style={{ color: brandTheme.text.secondary }}>
                                            <span className="font-medium">Task:</span> {entry.task.name}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
};

export default HoursOverview;
