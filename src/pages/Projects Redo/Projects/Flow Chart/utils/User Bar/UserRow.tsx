import React from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { User } from '../../../../../../types';
import { ProjectBar } from '../New Project Bar';
import { calculateProjectStacking, debugProjectStacking, FlowProject } from '../New Project Bar/utils/projectStacking';

// FlowProject and StackedProject interfaces are now imported from projectStacking.ts

export interface UserRowProps {
  user: User;
  projects: FlowProject[];
  today: Date;
  weekStart: Date;
  weekEnd: Date;
  onProjectNameClick?: (projectId: string) => void;
  onTaskClick?: (taskId: string) => void;
  onUpdatesClick?: (projectId: string) => void;
  onTaskUpdatesClick?: (taskId: string) => void;
  getTaskUpdatesCount?: (taskId: string) => { unreadCount: number; totalCount: number };
  getUpdatesCountsForProject?: (projectId: string) => { totalCount: number; unreadCount: number };
  users: User[];
}

// Project stacking is now handled by the dedicated projectStacking.ts utility

const UserRow: React.FC<UserRowProps> = ({
  user,
  projects,
  today,
  weekStart,
  weekEnd,
  onProjectNameClick,
  onTaskClick,
  onUpdatesClick,
  onTaskUpdatesClick,
  getTaskUpdatesCount,
  getUpdatesCountsForProject,
  users
}) => {
  // Calculate project stacking with precise positioning
  // Projects should start from the top of UserRow (0px), not from DateWeekHeaderRow height
  const stackingResult = calculateProjectStacking(projects, weekStart, weekEnd, 0);
  
  // Debug logging
  debugProjectStacking(stackingResult, projects.length);
  
  // Extract values from result - positions are already calculated in stackedProjects
  const { stackedProjects, totalRowHeight } = stackingResult;

  return (
    <div 
      className="relative border-b"
      style={{
        height: `${totalRowHeight}px`,
        minHeight: `${totalRowHeight}px`,
        borderBottomColor: brandTheme.border.light,
        backgroundColor: brandTheme.background.primary
      }}
    >
      {/* Project Bars Container */}
      <div className="absolute inset-0" style={{ overflow: 'visible', zIndex: 10 }}>
        {stackedProjects.map((stackedProject) => {
          const { totalCount, unreadCount } = getUpdatesCountsForProject 
            ? getUpdatesCountsForProject(stackedProject.project.id)
            : { totalCount: 0, unreadCount: 0 };
          
          return (
            <ProjectBar
              key={stackedProject.project.id}
              projectId={stackedProject.project.id}
              projectName={stackedProject.project.name}
              weekStart={weekStart}
              weekEnd={weekEnd}
              projectStart={stackedProject.project.startDate}
              projectEnd={stackedProject.project.endDate}
              projectDeadline={stackedProject.project.deadline}
              projectProgress={stackedProject.project.progress}
              projectTasks={stackedProject.project.tasks}
              today={today}
              stackLevel={stackedProject.stackLevel}
              topPosition={stackedProject.topPosition}
              onProjectNameClick={onProjectNameClick}
              onTaskClick={onTaskClick}
              onUpdatesClick={onUpdatesClick}
              onTaskUpdatesClick={onTaskUpdatesClick}
              getTaskUpdatesCount={getTaskUpdatesCount}
              unreadUpdatesCount={unreadCount}
              totalUpdatesCount={totalCount}
              users={users}
              projectAssigneeId={stackedProject.project.assigneeId || undefined}
              currentUserId={user.id}
              projectMultiAssigneeIds={stackedProject.project.multiAssigneeIds || []}
            />
          );
        })}
      </div>
      
      {/* Empty State */}
      {projects.length === 0 && (
        <div 
          className="flex items-center justify-center h-full"
          style={{ 
            color: brandTheme.text.muted,
            fontSize: '14px'
          }}
        >
          No projects assigned
        </div>
      )}
    </div>
  );
};

export default UserRow;
