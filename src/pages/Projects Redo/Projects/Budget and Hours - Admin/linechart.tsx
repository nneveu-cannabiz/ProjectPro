import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, TrendingDown, Users, Filter, X } from 'lucide-react';
import { brandTheme } from '../../../../styles/brandTheme';
import { Hour, User, Task, Project } from '../../../../types';

interface LineChartProps {
  hoursData: (Hour & { user: User; task: Task; project: Project })[];
}

type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface DateRange {
  start: Date;
  end: Date;
}

interface UserHourBreakdown {
  user: User;
  hours: number;
}

const LineChart: React.FC<LineChartProps> = ({ hoursData }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [customRange, setCustomRange] = useState<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date(),
  });
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Update container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        setContainerWidth(chartContainerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Parse ISO date string as local date to avoid timezone offset issues
  const parseISODate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Calculate date range based on time range selection
  const dateRange = useMemo((): DateRange => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let start: Date;

    switch (timeRange) {
      case 'week':
        // Show last 8 weeks (56 days) to display multiple week ranges
        start = new Date(now);
        start.setDate(now.getDate() - 56);
        break;
      case 'month':
        start = new Date(now);
        start.setDate(now.getDate() - 30);
        break;
      case 'quarter':
        start = new Date(now);
        start.setDate(now.getDate() - 90);
        break;
      case 'year':
        start = new Date(now);
        start.setFullYear(now.getFullYear() - 1);
        break;
      case 'custom':
        return customRange;
      default:
        start = new Date(now);
        start.setDate(now.getDate() - 30);
    }

    return { start, end: now };
  }, [timeRange, customRange]);

  // Process data by day or week based on timeRange
  const { dailyData, insights } = useMemo(() => {
    // Check if we should group by weeks
    const shouldGroupByWeeks = timeRange === 'week' || timeRange === 'quarter' || timeRange === 'year' || 
      (timeRange === 'custom' && Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) > 60);

    // First, create entries for ALL days in the date range
    const dayMap = new Map<string, { 
      date: Date; 
      hours: number; 
      userCount: Set<string>; 
      taskCount: Set<string>;
      userBreakdown: Map<string, UserHourBreakdown>;
    }>();

    if (shouldGroupByWeeks) {
      // Group by weeks - start from the first Sunday on or before the start date
      const getWeekStart = (date: Date): Date => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day; // Adjust to Sunday
        return new Date(d.setDate(diff));
      };

      let currentWeekStart = getWeekStart(new Date(dateRange.start));
      const rangeEnd = new Date(dateRange.end);

      while (currentWeekStart <= rangeEnd) {
        const dateKey = currentWeekStart.toISOString().split('T')[0];
        dayMap.set(dateKey, {
          date: new Date(currentWeekStart),
          hours: 0,
          userCount: new Set(),
          taskCount: new Set(),
          userBreakdown: new Map(),
        });
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }
    } else {
      // Initialize all days in the range with zero hours
      const currentDate = new Date(dateRange.start);
      while (currentDate <= dateRange.end) {
        const dateKey = currentDate.toISOString().split('T')[0];
        dayMap.set(dateKey, {
          date: new Date(currentDate),
          hours: 0,
          userCount: new Set(),
          taskCount: new Set(),
          userBreakdown: new Map(),
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Filter hours within date range
    const filteredHours = hoursData.filter(hour => {
      if (!hour.date || hour.is_planning_hours) return false;
      const hourDate = parseISODate(hour.date);
      hourDate.setHours(0, 0, 0, 0);
      return hourDate >= dateRange.start && hourDate <= dateRange.end;
    });

    // Add actual hours to the corresponding days or weeks
    filteredHours.forEach(hour => {
      if (shouldGroupByWeeks) {
        // Find the week this hour belongs to
        const hourDate = parseISODate(hour.date);
        const getWeekStart = (date: Date): Date => {
          const d = new Date(date);
          const day = d.getDay();
          const diff = d.getDate() - day;
          return new Date(d.setDate(diff));
        };
        const weekStart = getWeekStart(hourDate);
        const weekKey = weekStart.toISOString().split('T')[0];
        const week = dayMap.get(weekKey);
        
        if (week) {
          week.hours += hour.hours;
          week.userCount.add(hour.user.id);
          week.taskCount.add(hour.task.id);
          
          // Track hours per user
          if (!week.userBreakdown.has(hour.user.id)) {
            week.userBreakdown.set(hour.user.id, {
              user: hour.user,
              hours: 0,
            });
          }
          week.userBreakdown.get(hour.user.id)!.hours += hour.hours;
        }
      } else {
        // Daily grouping
        const dateKey = hour.date.split('T')[0];
        const day = dayMap.get(dateKey);
        if (day) {
          day.hours += hour.hours;
          day.userCount.add(hour.user.id);
          day.taskCount.add(hour.task.id);
          
          // Track hours per user
          if (!day.userBreakdown.has(hour.user.id)) {
            day.userBreakdown.set(hour.user.id, {
              user: hour.user,
              hours: 0,
            });
          }
          day.userBreakdown.get(hour.user.id)!.hours += hour.hours;
        }
      }
    });

    // Convert to array and sort by date
    const dailyArray = Array.from(dayMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate insights
    const totalHours = dailyArray.reduce((sum, day) => sum + day.hours, 0);
    const avgHoursPerDay = dailyArray.length > 0 ? totalHours / dailyArray.length : 0;
    const maxHours = Math.max(...dailyArray.map(d => d.hours), 0);
    const minHours = Math.min(...dailyArray.map(d => d.hours), 0);
    
    const uniqueUsers = new Set<string>();
    const uniqueTasks = new Set<string>();
    filteredHours.forEach(hour => {
      uniqueUsers.add(hour.user.id);
      uniqueTasks.add(hour.task.id);
    });

    // Calculate trend (compare first half vs second half)
    const midPoint = Math.floor(dailyArray.length / 2);
    const firstHalfAvg = dailyArray.slice(0, midPoint).reduce((sum, d) => sum + d.hours, 0) / Math.max(1, midPoint);
    const secondHalfAvg = dailyArray.slice(midPoint).reduce((sum, d) => sum + d.hours, 0) / Math.max(1, dailyArray.length - midPoint);
    const trend = secondHalfAvg > firstHalfAvg ? 'up' : secondHalfAvg < firstHalfAvg ? 'down' : 'stable';
    const trendPercent = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

    return {
      dailyData: dailyArray,
      insights: {
        totalHours,
        avgHoursPerDay,
        maxHours,
        minHours,
        uniqueUsers: uniqueUsers.size,
        uniqueTasks: uniqueTasks.size,
        trend,
        trendPercent,
        daysTracked: dailyArray.length,
      },
    };
  }, [hoursData, dateRange]);

  // Calculate chart dimensions and scaling - memoized to update when data or container width changes
  const { chartWidth, chartHeight, padding, plotWidth, plotHeight, maxValue, yScale, xScale } = useMemo(() => {
    const width = Math.max(containerWidth - 48, 400); // Subtract padding, min 400px
    const height = 300;
    const pad = { top: 20, right: 20, bottom: 40, left: 50 };
    const pWidth = width - pad.left - pad.right;
    const pHeight = height - pad.top - pad.bottom;

    const max = Math.max(...dailyData.map(d => d.hours), 10);
    const yScl = pHeight / max;
    const xScl = dailyData.length > 1 ? pWidth / (dailyData.length - 1) : 0;

    return {
      chartWidth: width,
      chartHeight: height,
      padding: pad,
      plotWidth: pWidth,
      plotHeight: pHeight,
      maxValue: max,
      yScale: yScl,
      xScale: xScl,
    };
  }, [dailyData, containerWidth]);

  // Generate line path
  const linePath = useMemo(() => {
    if (dailyData.length === 0) return '';
    
    let path = '';
    dailyData.forEach((day, index) => {
      const x = padding.left + (index * xScale);
      const y = padding.top + plotHeight - (day.hours * yScale);
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    return path;
  }, [dailyData, xScale, yScale, padding, plotHeight]);

  // Generate area path (for gradient fill)
  const areaPath = useMemo(() => {
    if (dailyData.length === 0) return '';
    
    let path = linePath;
    const lastX = padding.left + ((dailyData.length - 1) * xScale);
    const bottomY = padding.top + plotHeight;
    
    path += ` L ${lastX} ${bottomY}`;
    path += ` L ${padding.left} ${bottomY}`;
    path += ' Z';
    
    return path;
  }, [linePath, dailyData.length, xScale, padding, plotHeight]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatWeekRange = (startDate: Date): string => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const endDay = endDate.getDate();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
    }
  };

  const formatDateInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getUserDisplayName = (user: User): string => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  return (
    <div 
      className="rounded-lg border p-6"
      style={{
        backgroundColor: brandTheme.background.primary,
        borderColor: brandTheme.border.light,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6" style={{ color: brandTheme.primary.navy }} />
          <h2 className="text-xl font-bold" style={{ color: brandTheme.text.primary }}>
            Hours Trend Analysis
          </h2>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 rounded-lg border flex items-center gap-2 transition-all hover:shadow-md"
          style={{
            backgroundColor: showFilters ? brandTheme.primary.navy : brandTheme.background.primary,
            borderColor: brandTheme.primary.navy,
            color: showFilters ? '#FFFFFF' : brandTheme.primary.navy,
          }}
        >
          {showFilters ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
          <span className="font-medium">Filters</span>
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div 
          className="mb-6 p-4 rounded-lg border"
          style={{
            backgroundColor: brandTheme.background.secondary,
            borderColor: brandTheme.border.light,
          }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {(['week', 'month', 'quarter', 'year', 'custom'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className="px-4 py-2 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: timeRange === range ? brandTheme.primary.navy : brandTheme.background.primary,
                  color: timeRange === range ? '#FFFFFF' : brandTheme.text.primary,
                  border: `1px solid ${timeRange === range ? brandTheme.primary.navy : brandTheme.border.medium}`,
                }}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          {timeRange === 'custom' && (
            <div className="flex items-center gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: brandTheme.text.secondary }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={formatDateInput(customRange.start)}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
                  className="px-3 py-2 rounded-lg border"
                  style={{
                    borderColor: brandTheme.border.medium,
                    color: brandTheme.text.primary,
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: brandTheme.text.secondary }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={formatDateInput(customRange.end)}
                  onChange={(e) => setCustomRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
                  className="px-3 py-2 rounded-lg border"
                  style={{
                    borderColor: brandTheme.border.medium,
                    color: brandTheme.text.primary,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Insights Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div 
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: brandTheme.primary.paleBlue,
            borderColor: brandTheme.primary.lightBlue,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4" style={{ color: brandTheme.primary.navy }} />
            <span className="text-xs font-medium" style={{ color: brandTheme.text.secondary }}>
              Total Hours
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: brandTheme.primary.navy }}>
            {insights.totalHours.toFixed(1)}h
          </p>
          <p className="text-xs mt-1" style={{ color: brandTheme.text.muted }}>
            {insights.daysTracked} days tracked
          </p>
        </div>

        <div 
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: brandTheme.background.secondary,
            borderColor: brandTheme.border.light,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4" style={{ color: brandTheme.primary.lightBlue }} />
            <span className="text-xs font-medium" style={{ color: brandTheme.text.secondary }}>
              Daily Average
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: brandTheme.primary.lightBlue }}>
            {insights.avgHoursPerDay.toFixed(1)}h
          </p>
          <p className="text-xs mt-1" style={{ color: brandTheme.text.muted }}>
            Max: {insights.maxHours.toFixed(1)}h
          </p>
        </div>

        <div 
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: brandTheme.background.secondary,
            borderColor: brandTheme.border.light,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4" style={{ color: brandTheme.primary.navy }} />
            <span className="text-xs font-medium" style={{ color: brandTheme.text.secondary }}>
              Active Users
            </span>
          </div>
          <p className="text-2xl font-bold" style={{ color: brandTheme.primary.navy }}>
            {insights.uniqueUsers}
          </p>
          <p className="text-xs mt-1" style={{ color: brandTheme.text.muted }}>
            {insights.uniqueTasks} tasks
          </p>
        </div>

        <div 
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: insights.trend === 'up' 
              ? brandTheme.status.successLight 
              : insights.trend === 'down'
              ? '#FEE2E2'
              : brandTheme.background.secondary,
            borderColor: insights.trend === 'up' 
              ? brandTheme.status.success 
              : insights.trend === 'down'
              ? '#EF4444'
              : brandTheme.border.light,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            {insights.trend === 'up' ? (
              <TrendingUp className="w-4 h-4" style={{ color: brandTheme.status.success }} />
            ) : insights.trend === 'down' ? (
              <TrendingDown className="w-4 h-4 text-red-600" />
            ) : (
              <Calendar className="w-4 h-4" style={{ color: brandTheme.text.muted }} />
            )}
            <span className="text-xs font-medium" style={{ color: brandTheme.text.secondary }}>
              Trend
            </span>
          </div>
          <p 
            className="text-2xl font-bold"
            style={{ 
              color: insights.trend === 'up' 
                ? brandTheme.status.success 
                : insights.trend === 'down'
                ? '#EF4444'
                : brandTheme.text.muted
            }}
          >
            {insights.trend === 'stable' ? 'Stable' : `${Math.abs(insights.trendPercent).toFixed(0)}%`}
          </p>
          <p className="text-xs mt-1" style={{ color: brandTheme.text.muted }}>
            {insights.trend === 'up' ? 'Increasing' : insights.trend === 'down' ? 'Decreasing' : 'No change'}
          </p>
        </div>
      </div>

      {/* Chart */}
      {dailyData.length === 0 ? (
        <div 
          className="flex items-center justify-center rounded-lg border"
          style={{
            backgroundColor: brandTheme.background.secondary,
            borderColor: brandTheme.border.light,
            height: `${chartHeight}px`,
          }}
        >
          <div className="text-center">
            <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: brandTheme.text.muted }} />
            <p className="font-medium" style={{ color: brandTheme.text.secondary }}>
              No hours data for selected period
            </p>
            <p className="text-sm mt-1" style={{ color: brandTheme.text.muted }}>
              Try selecting a different date range
            </p>
          </div>
        </div>
      ) : (
        <div 
          ref={chartContainerRef}
          className="rounded-lg border p-4"
          style={{
            backgroundColor: brandTheme.background.secondary,
            borderColor: brandTheme.border.light,
            width: '100%',
          }}
        >
          <svg width={chartWidth} height={chartHeight} style={{ display: 'block', margin: '0 auto' }}>
            {/* Define gradient */}
            <defs>
              <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={brandTheme.primary.navy} stopOpacity="0.3" />
                <stop offset="100%" stopColor={brandTheme.primary.navy} stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {(() => {
              // Generate appropriate Y-axis intervals based on max value
              const generateYAxisLabels = (max: number): number[] => {
                if (max <= 10) return [0, 2, 4, 6, 8, 10];
                if (max <= 20) return [0, 5, 10, 15, 20];
                if (max <= 50) return [0, 10, 20, 30, 40, 50];
                if (max <= 100) return [0, 25, 50, 75, 100];
                if (max <= 200) return [0, 50, 100, 150, 200];
                
                // For larger values, use dynamic intervals
                const interval = Math.ceil(max / 5 / 10) * 10;
                const labels: number[] = [];
                for (let i = 0; i <= 5; i++) {
                  labels.push(i * interval);
                }
                return labels;
              };

              const yLabels = generateYAxisLabels(maxValue);
              const actualMax = Math.max(...yLabels);

              return yLabels.map((value) => {
                const fraction = value / actualMax;
                const y = padding.top + plotHeight * (1 - fraction);
                
                return (
                  <g key={value}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={padding.left + plotWidth}
                      y2={y}
                      stroke={brandTheme.border.light}
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="12"
                      fill={brandTheme.text.muted}
                    >
                      {value.toFixed(0)}h
                    </text>
                  </g>
                );
              });
            })()}

            {/* Area fill */}
            <path
              d={areaPath}
              fill="url(#areaGradient)"
            />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke={brandTheme.primary.navy}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {dailyData.map((day, index) => {
              const x = padding.left + (index * xScale);
              const y = padding.top + plotHeight - (day.hours * yScale);
              const isHovered = hoveredPoint === index;
              
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? "7" : "5"}
                    fill={brandTheme.primary.navy}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    style={{ cursor: 'pointer', transition: 'r 0.2s' }}
                    onMouseEnter={(e) => {
                      setHoveredPoint(index);
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPosition({ x: rect.left, y: rect.top });
                    }}
                    onMouseLeave={() => {
                      setHoveredPoint(null);
                    }}
                  />
                </g>
              );
            })}

            {/* X-axis labels */}
            {(() => {
              // Intelligently select which labels to show based on data density
              const getXAxisIndices = (dataLength: number): number[] => {
                if (dataLength <= 7) {
                  // Show all labels for 7 or fewer points
                  return Array.from({ length: dataLength }, (_, i) => i);
                } else if (dataLength <= 14) {
                  // Show every other label
                  const indices: number[] = [];
                  for (let i = 0; i < dataLength; i += 2) {
                    indices.push(i);
                  }
                  // Always include the last point if not already included
                  if (indices[indices.length - 1] !== dataLength - 1) {
                    indices.push(dataLength - 1);
                  }
                  return indices;
                } else if (dataLength <= 30) {
                  // Show ~10 labels
                  const step = Math.ceil(dataLength / 10);
                  const indices: number[] = [];
                  for (let i = 0; i < dataLength; i += step) {
                    indices.push(i);
                  }
                  if (indices[indices.length - 1] !== dataLength - 1) {
                    indices.push(dataLength - 1);
                  }
                  return indices;
                } else if (dataLength <= 90) {
                  // Show ~12 labels for quarterly view
                  const step = Math.ceil(dataLength / 12);
                  const indices: number[] = [];
                  for (let i = 0; i < dataLength; i += step) {
                    indices.push(i);
                  }
                  if (indices[indices.length - 1] !== dataLength - 1) {
                    indices.push(dataLength - 1);
                  }
                  return indices;
                } else {
                  // For year view, show ~15 labels
                  const step = Math.ceil(dataLength / 15);
                  const indices: number[] = [];
                  for (let i = 0; i < dataLength; i += step) {
                    indices.push(i);
                  }
                  if (indices[indices.length - 1] !== dataLength - 1) {
                    indices.push(dataLength - 1);
                  }
                  return indices;
                }
              };

              const indicesToShow = getXAxisIndices(dailyData.length);

              const shouldShowWeekRanges = timeRange === 'week' || timeRange === 'quarter' || timeRange === 'year' || 
                (timeRange === 'custom' && dailyData.length > 60);

              return indicesToShow.map((index) => {
                const day = dailyData[index];
                const x = padding.left + (index * xScale);
                const y = padding.top + plotHeight + 20;
                
                return (
                  <text
                    key={index}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    fontSize="11"
                    fill={brandTheme.text.secondary}
                  >
                    {shouldShowWeekRanges ? formatWeekRange(day.date) : formatDate(day.date)}
                  </text>
                );
              });
            })()}
          </svg>

          {/* Hover Tooltip */}
          {hoveredPoint !== null && dailyData[hoveredPoint] && (
            <div
              className="fixed z-50 rounded-lg border shadow-xl p-4 pointer-events-none"
              style={{
                backgroundColor: brandTheme.background.primary,
                borderColor: brandTheme.border.medium,
                left: `${tooltipPosition.x + 20}px`,
                top: `${tooltipPosition.y - 20}px`,
                transform: 'translateY(-100%)',
                minWidth: '250px',
              }}
            >
              <div className="mb-3 pb-2 border-b" style={{ borderColor: brandTheme.border.light }}>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4" style={{ color: brandTheme.primary.navy }} />
                  <span className="font-semibold" style={{ color: brandTheme.text.primary }}>
                    {formatDate(dailyData[hoveredPoint].date)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: brandTheme.text.secondary }}>Total Hours</span>
                  <span className="font-bold text-lg" style={{ color: brandTheme.primary.navy }}>
                    {dailyData[hoveredPoint].hours.toFixed(1)}h
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4" style={{ color: brandTheme.text.secondary }} />
                  <span className="text-sm font-medium" style={{ color: brandTheme.text.secondary }}>
                    Hours by User
                  </span>
                </div>
                {Array.from(dailyData[hoveredPoint].userBreakdown.values())
                  .sort((a, b) => b.hours - a.hours)
                  .map((userHour, idx) => {
                    const userInitial = userHour.user.firstName?.charAt(0) || userHour.user.email.charAt(0).toUpperCase();
                    
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 p-2 rounded"
                        style={{ backgroundColor: brandTheme.background.secondary }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: userHour.user.profileColor || brandTheme.primary.navy }}
                          >
                            {userInitial}
                          </div>
                          <span className="text-sm truncate" style={{ color: brandTheme.text.primary }}>
                            {getUserDisplayName(userHour.user)}
                          </span>
                        </div>
                        <span className="text-sm font-semibold flex-shrink-0" style={{ color: brandTheme.primary.navy }}>
                          {userHour.hours.toFixed(1)}h
                        </span>
                      </div>
                    );
                  })}
              </div>

              <div className="mt-3 pt-2 border-t text-xs" style={{ borderColor: brandTheme.border.light, color: brandTheme.text.muted }}>
                {dailyData[hoveredPoint].userCount.size} user{dailyData[hoveredPoint].userCount.size !== 1 ? 's' : ''} • {dailyData[hoveredPoint].taskCount.size} task{dailyData[hoveredPoint].taskCount.size !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LineChart;

