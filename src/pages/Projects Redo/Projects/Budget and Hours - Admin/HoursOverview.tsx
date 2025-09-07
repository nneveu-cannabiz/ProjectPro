import React, { useState, useEffect, useMemo } from 'react';
import { fetchAllUsersHours } from '../../../../data/supabase-store';
import { Hour, User, Task, Project } from '../../../../types';
import { Calendar, Clock, Users, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import Button from '../../../../components/ui/Button';

interface HoursOverviewProps {
  // Props can be added later if needed
}

type ViewType = 'weekly' | 'monthly';
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
  const [viewType, setViewType] = useState<ViewType>('weekly');
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

  const weeklyData = useMemo((): WeekData[] => {
    const weekMap = new Map<string, WeekData>();

    hoursData.forEach(entry => {
      const entryDate = new Date(entry.date);
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
      const entryDate = new Date(entry.date);
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

  const totalHours = hoursData.reduce((sum, entry) => sum + entry.hours, 0);
  const uniqueUsers = new Set(hoursData.map(entry => entry.user.id)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Total Hours</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">{totalHours.toFixed(2)}</p>
          <p className="text-sm text-gray-500">All time logged</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Active Users</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">{uniqueUsers}</p>
          <p className="text-sm text-gray-500">Users logging hours</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Average per User</h3>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {uniqueUsers > 0 ? (totalHours / uniqueUsers).toFixed(2) : '0.00'}
          </p>
          <p className="text-sm text-gray-500">Hours per user</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={viewType === 'weekly' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setViewType('weekly')}
        >
          Weekly View
        </Button>
        <Button
          variant={viewType === 'monthly' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setViewType('monthly')}
        >
          Monthly View
        </Button>
      </div>

      {/* Hours Breakdown */}
      <div className="space-y-4">
        {viewType === 'weekly' ? (
          weeklyData.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hours logged yet.</p>
            </div>
          ) : (
            weeklyData.map((week) => {
              const weekKey = `week-${week.weekStart.toISOString().split('T')[0]}`;
              const isExpanded = expandedItems.has(weekKey);

              return (
                <div key={weekKey} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div
                    className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleExpanded(weekKey)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{week.weekLabel}</h3>
                          <p className="text-sm text-gray-600">
                            {Object.keys(week.userHours).length} user{Object.keys(week.userHours).length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-blue-600">{week.totalHours.toFixed(2)}h</p>
                        <p className="text-sm text-gray-500">Total</p>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {Object.values(week.userHours)
                        .sort((a, b) => b.totalHours - a.totalHours)
                        .map((userHour) => (
                          <div key={userHour.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                                style={{ backgroundColor: userHour.user.profileColor || '#2563eb' }}
                              >
                                {userHour.user.firstName?.charAt(0) || userHour.user.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{getUserDisplayName(userHour.user)}</p>
                                <p className="text-sm text-gray-600">{userHour.entries.length} entr{userHour.entries.length !== 1 ? 'ies' : 'y'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{userHour.totalHours.toFixed(2)}h</p>
                              <p className="text-xs text-gray-500">
                                {((userHour.totalHours / week.totalHours) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          monthlyData.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hours logged yet.</p>
            </div>
          ) : (
            monthlyData.map((month) => {
              const monthKey = `month-${month.year}-${month.month}`;
              const isExpanded = expandedItems.has(monthKey);

              return (
                <div key={monthKey} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div
                    className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleExpanded(monthKey)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{month.monthLabel}</h3>
                          <p className="text-sm text-gray-600">
                            {Object.keys(month.userHours).length} user{Object.keys(month.userHours).length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-blue-600">{month.totalHours.toFixed(2)}h</p>
                        <p className="text-sm text-gray-500">Total</p>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {Object.values(month.userHours)
                        .sort((a, b) => b.totalHours - a.totalHours)
                        .map((userHour) => (
                          <div key={userHour.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                                style={{ backgroundColor: userHour.user.profileColor || '#2563eb' }}
                              >
                                {userHour.user.firstName?.charAt(0) || userHour.user.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{getUserDisplayName(userHour.user)}</p>
                                <p className="text-sm text-gray-600">{userHour.entries.length} entr{userHour.entries.length !== 1 ? 'ies' : 'y'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{userHour.totalHours.toFixed(2)}h</p>
                              <p className="text-xs text-gray-500">
                                {((userHour.totalHours / month.totalHours) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
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
