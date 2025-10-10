import { SprintProgress, HistoricalSprint, TaskWithSprintInfo } from './types';
import { brandTheme } from '../../../../../../styles/brandTheme';

export const calculateBusinessDays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

export const getSprintProgress = (startDate: string | null, endDate: string | null): SprintProgress | null => {
  if (!startDate || !endDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [startYear, startMonth, startDay] = startDate.split('T')[0].split('-');
  const start = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay));
  
  const [endYear, endMonth, endDay] = endDate.split('T')[0].split('-');
  const end = new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay));

  // Calculate business days
  const totalBusinessDays = calculateBusinessDays(start, end);
  
  // If sprint hasn't started
  if (today < start) {
    return {
      daysCompleted: 0,
      daysRemaining: totalBusinessDays,
      totalDays: totalBusinessDays,
    };
  }
  
  // If sprint has ended
  if (today > end) {
    return {
      daysCompleted: totalBusinessDays,
      daysRemaining: 0,
      totalDays: totalBusinessDays,
    };
  }
  
  // Sprint is in progress
  const daysCompleted = calculateBusinessDays(start, today);
  
  // Don't include today in days remaining
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const daysRemaining = calculateBusinessDays(tomorrow, end);

  return {
    daysCompleted,
    daysRemaining,
    totalDays: totalBusinessDays,
  };
};

export const getSprintStatus = (startDate: string | null, endDate: string | null) => {
  if (!startDate || !endDate) return { label: 'Not Scheduled', color: brandTheme.text.muted };
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  if (now < start) {
    return { label: 'Upcoming', color: brandTheme.primary.lightBlue };
  } else if (now > end) {
    return { label: 'Completed', color: brandTheme.status.success };
  } else {
    return { label: 'Active', color: '#f59e0b' }; // Orange for active
  }
};

export const getSprintStoryPoints = (
  sprint: HistoricalSprint,
  allTasks: TaskWithSprintInfo[],
  storyPointsMap: Map<string, number>
) => {
  let totalStoryPoints = 0;
  let completedStoryPoints = 0;

  // Get all tasks for this sprint's groups
  sprint.groups.forEach((group) => {
    const groupTasks = allTasks.filter(task => task.sprintGroupId === group.id);
    
    groupTasks.forEach((task) => {
      const storyPoints = storyPointsMap.get(task.id) || 0;
      totalStoryPoints += storyPoints;
      
      if (task.status === 'done') {
        completedStoryPoints += storyPoints;
      }
    });
  });

  return {
    total: totalStoryPoints,
    completed: completedStoryPoints,
  };
};

export const getSprintTypeColor = (sprintType?: string) => {
  switch (sprintType) {
    case 'sprint-1':
      return { bg: '#dbeafe', text: brandTheme.primary.lightBlue, border: brandTheme.primary.lightBlue };
    case 'sprint-2':
      return { bg: '#fef3c7', text: '#f59e0b', border: '#f59e0b' };
    default:
      return { bg: brandTheme.primary.paleBlue, text: brandTheme.primary.navy, border: brandTheme.primary.navy };
  }
};

export const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  
  // Parse ISO date string to avoid timezone shift
  const [year, month, day] = dateString.split('T')[0].split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateForInput = (dateString: string | null) => {
  if (!dateString) return '';
  return dateString.split('T')[0];
};

