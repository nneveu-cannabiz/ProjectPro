import React, { useState, useEffect, useMemo } from 'react';
import { fetchPMASpending, fetchAllUsersHours } from '../../../../data/supabase-store';
import { PMASpending, Hour, User, Task, Project } from '../../../../types';
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  ChevronDown,
  ChevronRight
} from 'lucide-react';


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


  const getCurrentMonthData = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get first day of current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // Filter spending for current month
    const monthSpending = spendingData.filter(spending => {
      const spendingDate = new Date(spending.created_at);
      return spendingDate >= firstDay && spendingDate <= lastDay;
    });
    
    // Filter hours for current month (excluding planning hours)
    const monthHours = hoursData.filter(hour => {
      const hourDate = new Date(hour.date);
      return hourDate >= firstDay && hourDate <= lastDay && !hour.is_planning_hours;
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

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getUserDisplayName = (user: User): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const getGroupedHoursByUser = () => {
    const monthData = getCurrentMonthData();
    const userHoursMap = new Map<string, { user: User; totalHours: number; entries: (Hour & { user: User; task: Task; project: Project })[] }>();

    monthData.hours.forEach(hour => {
      const userId = hour.user.id;
      if (!userHoursMap.has(userId)) {
        userHoursMap.set(userId, {
          user: hour.user,
          totalHours: 0,
          entries: []
        });
      }

      const userHours = userHoursMap.get(userId)!;
      userHours.totalHours += hour.hours;
      userHours.entries.push(hour);
    });

    return Array.from(userHoursMap.values())
      .sort((a, b) => b.totalHours - a.totalHours);
  };

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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">This Month Overview - {currentMonth}</h2>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Total Cost</h3>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(monthSummary.totalCombinedSpending)}
          </p>
          <p className="text-xs text-gray-600 mt-1">Expenses + Labor</p>
        </div>

        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Expenses</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(monthSummary.totalSpending)}
          </p>
        </div>

        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Labor Costs</h3>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(monthSummary.laborCosts)}
          </p>
          <p className="text-xs text-gray-600 mt-1">{monthSummary.totalHours.toFixed(1)}h logged</p>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            {getTrendIcon(monthSummary.spendingTrend)}
            <h3 className="font-semibold text-gray-900">Avg Weekly Cost</h3>
          </div>
          <p className={`text-2xl font-bold ${getTrendColor(monthSummary.spendingTrend)}`}>
            {formatCurrency(monthSummary.averageWeeklySpending)}
          </p>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            {getTrendIcon(monthSummary.hoursTrend)}
            <h3 className="font-semibold text-gray-900">Avg Weekly Hours</h3>
          </div>
          <p className={`text-2xl font-bold ${getTrendColor(monthSummary.hoursTrend)}`}>
            {monthSummary.averageWeeklyHours.toFixed(1)}h
          </p>
        </div>
      </div>

      {/* Monthly Data Tables */}
      <div className="space-y-6">
        {/* Spending Table */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month's Expenses</h3>
          {monthData.spending.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No spending entries for this month.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Item</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Vendor</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {monthData.spending.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{item.name}</td>
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
                      <td className="py-3 px-4 text-gray-600">{item.vendor || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-green-600">
                        {formatCurrency(item.amount, item.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Hours by User */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month's Hours by User (Labor Costs)</h3>
          {monthData.hours.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hours logged for this month.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getGroupedHoursByUser().map((userHours) => {
                const isExpanded = expandedUsers.has(userHours.user.id);
                return (
                  <div key={userHours.user.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div
                      className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleUserExpanded(userHours.user.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                          )}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                            style={{ backgroundColor: userHours.user.profileColor || '#2563eb' }}
                          >
                            {userHours.user.firstName?.charAt(0) || userHours.user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{getUserDisplayName(userHours.user)}</h4>
                            <p className="text-sm text-gray-600">{userHours.entries.length} entr{userHours.entries.length !== 1 ? 'ies' : 'y'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-600">{userHours.totalHours.toFixed(1)}h</p>
                          <p className="text-sm text-gray-500">Total</p>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 border-t border-gray-200">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="text-left py-2 px-3 font-semibold text-gray-900">Task</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-900">Project</th>
                                <th className="text-left py-2 px-3 font-semibold text-gray-900">Date</th>
                                <th className="text-right py-2 px-3 font-semibold text-gray-900">Hours</th>
                              </tr>
                            </thead>
                            <tbody>
                              {userHours.entries
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((hour) => (
                                <tr key={hour.id} className="border-b border-gray-100 hover:bg-gray-50">
                                  <td className="py-2 px-3 text-gray-600">{hour.task.name}</td>
                                  <td className="py-2 px-3 text-gray-600">{hour.project.name}</td>
                                  <td className="py-2 px-3 text-gray-600">
                                    {new Date(hour.date).toLocaleDateString()}
                                  </td>
                                  <td className="py-2 px-3 text-right font-semibold text-blue-600">
                                    {hour.hours.toFixed(1)}h
                                  </td>
                                </tr>
                              ))}
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

export default ThisMonthSpending;
