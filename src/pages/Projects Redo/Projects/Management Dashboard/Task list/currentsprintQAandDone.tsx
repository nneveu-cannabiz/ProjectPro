import React from 'react';
import { brandTheme } from '../../../../../styles/brandTheme';
import { CheckCircle, ListChecks } from 'lucide-react';
import UserAvatar from '../../../../../components/UserAvatar';
import { Task, Project, User } from '../../../../../types';

interface TaskWithSprintInfo extends Task {
  project: Project;
  assignee?: User;
  sprintGroupName: string;
  sprintGroupId: string;
  sprintRank?: number;
  sprintType?: string;
  hoursSpent?: number;
  totalSubtasks?: number;
  completedSubtasks?: number;
  isSubtask?: boolean;
  parentTaskName?: string;
  parentTaskId?: string;
}

interface CurrentSprintQAandDoneProps {
  tasks: TaskWithSprintInfo[];
  onTaskClick: (task: TaskWithSprintInfo) => void;
  qaColumnWidths: {
    taskName: number;
    assignee: number;
    hoursSpent: number;
    subtasks: number;
    priority: number;
    sprint: number;
  };
  doneColumnWidths: {
    taskName: number;
    assignee: number;
    hoursSpent: number;
    subtasks: number;
    priority: number;
    sprint: number;
  };
  onStartResize: (table: 'todo' | 'inprogress' | 'qa' | 'done', column: string, startX: number, startWidth: number) => void;
  hoveredColumn: { table: 'todo' | 'inprogress' | 'qa' | 'done'; column: string } | null;
  setHoveredColumn: (value: { table: 'todo' | 'inprogress' | 'qa' | 'done'; column: string } | null) => void;
  resizing: { table: 'todo' | 'inprogress' | 'qa' | 'done'; column: string; startX: number; startWidth: number } | null;
}

const CurrentSprintQAandDone: React.FC<CurrentSprintQAandDoneProps> = ({
  tasks,
  onTaskClick,
  qaColumnWidths,
  doneColumnWidths,
  onStartResize,
  hoveredColumn,
  setHoveredColumn,
  resizing,
}) => {
  const getPriorityColor = (priority?: string): { bg: string; text: string } => {
    switch (priority) {
      case 'Critical':
        return { bg: '#fee2e2', text: '#dc2626' };
      case 'High':
        return { bg: '#fef3c7', text: '#f59e0b' };
      case 'Medium':
        return { bg: brandTheme.primary.paleBlue, text: brandTheme.primary.navy };
      case 'Low':
        return { bg: brandTheme.gray[200], text: brandTheme.text.muted };
      default:
        return { bg: brandTheme.primary.paleBlue, text: brandTheme.primary.navy };
    }
  };

  // Filter tasks/subtasks that have a "QA" tag
  const qaTasks = tasks.filter((t) => {
    if (!t.tags || !Array.isArray(t.tags)) return false;
    return t.tags.some(tag => 
      typeof tag === 'string' && tag.toLowerCase() === 'qa'
    );
  });
  
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* QA Section */}
      <div
        className="rounded-lg shadow-sm overflow-hidden"
        style={{ backgroundColor: brandTheme.background.secondary }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ backgroundColor: '#f59e0b' }}
        >
          <div className="flex items-center gap-3">
            <ListChecks className="w-5 h-5 text-white" />
            <h2 className="text-xl font-bold text-white">QA</h2>
          </div>
          <span
            className="px-3 py-1 rounded-full text-sm font-bold"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
            }}
          >
            {qaTasks.length}
          </span>
        </div>
        <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
          {qaTasks.length === 0 ? (
            <div className="text-center py-12">
              <ListChecks
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: brandTheme.text.muted }}
              />
              <p style={{ color: brandTheme.text.muted }}>No QA tasks</p>
            </div>
          ) : (
            <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
              <thead className="sticky top-0" style={{ backgroundColor: brandTheme.gray[100] }}>
                <tr className="border-b" style={{ borderColor: brandTheme.border.light }}>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                    style={{ 
                      color: brandTheme.text.secondary, 
                      width: `${qaColumnWidths.taskName}px`,
                      backgroundColor: hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'taskName' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                    }}
                  >
                    Task Name
                    <div
                      className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                      onMouseDown={(e) => onStartResize('qa', 'taskName', e.clientX, qaColumnWidths.taskName)}
                      onMouseEnter={() => setHoveredColumn({ table: 'qa', column: 'taskName' })}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{ 
                        backgroundColor: (resizing?.table === 'qa' && resizing?.column === 'taskName') || (hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'taskName')
                          ? brandTheme.primary.lightBlue 
                          : 'transparent' 
                      }}
                    />
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                    style={{ 
                      color: brandTheme.text.secondary, 
                      width: `${qaColumnWidths.assignee}px`,
                      backgroundColor: hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'assignee' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                    }}
                  >
                    Assignee
                    <div
                      className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                      onMouseDown={(e) => onStartResize('qa', 'assignee', e.clientX, qaColumnWidths.assignee)}
                      onMouseEnter={() => setHoveredColumn({ table: 'qa', column: 'assignee' })}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{ 
                        backgroundColor: (resizing?.table === 'qa' && resizing?.column === 'assignee') || (hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'assignee')
                          ? brandTheme.primary.lightBlue 
                          : 'transparent' 
                      }}
                    />
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                    style={{ 
                      color: brandTheme.text.secondary, 
                      width: `${qaColumnWidths.hoursSpent}px`,
                      backgroundColor: hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'hoursSpent' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                    }}
                  >
                    Hours Spent
                    <div
                      className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                      onMouseDown={(e) => onStartResize('qa', 'hoursSpent', e.clientX, qaColumnWidths.hoursSpent)}
                      onMouseEnter={() => setHoveredColumn({ table: 'qa', column: 'hoursSpent' })}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{ 
                        backgroundColor: (resizing?.table === 'qa' && resizing?.column === 'hoursSpent') || (hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'hoursSpent')
                          ? brandTheme.primary.lightBlue 
                          : 'transparent' 
                      }}
                    />
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                    style={{ 
                      color: brandTheme.text.secondary, 
                      width: `${qaColumnWidths.subtasks}px`,
                      backgroundColor: hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'subtasks' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                    }}
                  >
                    Subtasks
                    <div
                      className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                      onMouseDown={(e) => onStartResize('qa', 'subtasks', e.clientX, qaColumnWidths.subtasks)}
                      onMouseEnter={() => setHoveredColumn({ table: 'qa', column: 'subtasks' })}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{ 
                        backgroundColor: (resizing?.table === 'qa' && resizing?.column === 'subtasks') || (hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'subtasks')
                          ? brandTheme.primary.lightBlue 
                          : 'transparent' 
                      }}
                    />
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                    style={{ 
                      color: brandTheme.text.secondary, 
                      width: `${qaColumnWidths.priority}px`,
                      backgroundColor: hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'priority' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                    }}
                  >
                    Priority
                    <div
                      className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                      onMouseDown={(e) => onStartResize('qa', 'priority', e.clientX, qaColumnWidths.priority)}
                      onMouseEnter={() => setHoveredColumn({ table: 'qa', column: 'priority' })}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{ 
                        backgroundColor: (resizing?.table === 'qa' && resizing?.column === 'priority') || (hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'priority')
                          ? brandTheme.primary.lightBlue 
                          : 'transparent' 
                      }}
                    />
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                    style={{ 
                      color: brandTheme.text.secondary, 
                      width: `${qaColumnWidths.sprint}px`,
                      backgroundColor: hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'sprint' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                    }}
                  >
                    Sprint
                    <div
                      className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                      onMouseDown={(e) => onStartResize('qa', 'sprint', e.clientX, qaColumnWidths.sprint)}
                      onMouseEnter={() => setHoveredColumn({ table: 'qa', column: 'sprint' })}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{ 
                        backgroundColor: (resizing?.table === 'qa' && resizing?.column === 'sprint') || (hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'sprint')
                          ? brandTheme.primary.lightBlue 
                          : 'transparent' 
                      }}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {qaTasks.map((task) => {
                  const priorityColors = getPriorityColor(task.priority);
                  return (
                    <tr
                      key={task.id}
                      className="border-b cursor-pointer transition-all hover:bg-gray-50"
                      style={{
                        borderColor: brandTheme.border.light,
                        borderLeftWidth: '3px',
                        borderLeftStyle: 'solid',
                        borderLeftColor: priorityColors.text,
                      }}
                      onClick={() => onTaskClick(task)}
                    >
                      {/* Task Name */}
                      <td 
                        className="px-3 py-2 relative"
                        style={{
                          backgroundColor: hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'taskName' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {task.isSubtask && (
                            <span className="text-xs" style={{ color: brandTheme.text.muted }}>
                              ↳
                            </span>
                          )}
                          <span
                            className="font-medium hover:underline text-sm line-clamp-1"
                            style={{ color: task.isSubtask ? brandTheme.text.secondary : brandTheme.primary.navy }}
                            title={task.isSubtask ? `Subtask of: ${task.parentTaskName}` : task.name}
                          >
                            {task.name}
                          </span>
                        </div>
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onStartResize('qa', 'taskName', e.clientX, qaColumnWidths.taskName);
                          }}
                          onMouseEnter={() => setHoveredColumn({ table: 'qa', column: 'taskName' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'qa' && resizing?.column === 'taskName') || (hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'taskName')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </td>

                      {/* Assignee */}
                      <td 
                        className="px-3 py-2 whitespace-nowrap relative"
                        style={{
                          backgroundColor: hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'assignee' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                        }}
                      >
                        {task.assignee ? (
                          <div className="flex items-center justify-center">
                            <UserAvatar user={task.assignee} size="sm" />
                          </div>
                        ) : (
                          <span style={{ color: brandTheme.text.muted, fontSize: '0.65rem' }}>
                            -
                          </span>
                        )}
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onStartResize('qa', 'assignee', e.clientX, qaColumnWidths.assignee);
                          }}
                          onMouseEnter={() => setHoveredColumn({ table: 'qa', column: 'assignee' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'qa' && resizing?.column === 'assignee') || (hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'assignee')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </td>

                      {/* Hours Spent */}
                      <td 
                        className="px-3 py-2 whitespace-nowrap relative"
                        style={{
                          backgroundColor: hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'hoursSpent' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                        }}
                      >
                        <span
                          className="text-xs font-semibold"
                          style={{ color: brandTheme.text.primary }}
                        >
                          {task.hoursSpent ? `${task.hoursSpent.toFixed(1)}h` : '0h'}
                        </span>
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onStartResize('qa', 'hoursSpent', e.clientX, qaColumnWidths.hoursSpent);
                          }}
                          onMouseEnter={() => setHoveredColumn({ table: 'qa', column: 'hoursSpent' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'qa' && resizing?.column === 'hoursSpent') || (hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'hoursSpent')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </td>

                      {/* Subtasks */}
                      <td 
                        className="px-3 py-2 whitespace-nowrap relative"
                        style={{
                          backgroundColor: hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'subtasks' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                        }}
                      >
                        {!task.isSubtask && task.totalSubtasks ? (
                          <span
                            className="text-xs font-semibold"
                            style={{ color: brandTheme.text.primary }}
                          >
                            {task.completedSubtasks}/{task.totalSubtasks}
                          </span>
                        ) : (
                          <span
                            className="text-xs"
                            style={{ color: brandTheme.text.muted }}
                          >
                            -
                          </span>
                        )}
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onStartResize('qa', 'subtasks', e.clientX, qaColumnWidths.subtasks);
                          }}
                          onMouseEnter={() => setHoveredColumn({ table: 'qa', column: 'subtasks' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'qa' && resizing?.column === 'subtasks') || (hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'subtasks')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </td>

                      {/* Priority */}
                      <td 
                        className="px-3 py-2 whitespace-nowrap relative"
                        style={{
                          backgroundColor: hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'priority' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                        }}
                      >
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: priorityColors.bg,
                            color: priorityColors.text,
                          }}
                        >
                          {task.priority || 'Medium'}
                        </span>
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onStartResize('qa', 'priority', e.clientX, qaColumnWidths.priority);
                          }}
                          onMouseEnter={() => setHoveredColumn({ table: 'qa', column: 'priority' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'qa' && resizing?.column === 'priority') || (hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'priority')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </td>

                      {/* Sprint */}
                      <td 
                        className="px-3 py-2 whitespace-nowrap relative"
                        style={{
                          backgroundColor: hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'sprint' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                        }}
                      >
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: brandTheme.primary.paleBlue,
                            color: brandTheme.primary.navy,
                          }}
                        >
                          {task.sprintGroupName}
                        </span>
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onStartResize('qa', 'sprint', e.clientX, qaColumnWidths.sprint);
                          }}
                          onMouseEnter={() => setHoveredColumn({ table: 'qa', column: 'sprint' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'qa' && resizing?.column === 'sprint') || (hoveredColumn?.table === 'qa' && hoveredColumn?.column === 'sprint')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Done Section */}
      <div
        className="rounded-lg shadow-sm overflow-hidden"
        style={{ backgroundColor: brandTheme.background.secondary }}
      >
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ backgroundColor: brandTheme.status.success }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-white" />
            <h2 className="text-xl font-bold text-white">Done</h2>
          </div>
          <span
            className="px-3 py-1 rounded-full text-sm font-bold"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
            }}
          >
            {doneTasks.length}
          </span>
        </div>
        <div className="overflow-x-auto max-h-[800px] overflow-y-auto">
          {doneTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle
                className="w-12 h-12 mx-auto mb-3"
                style={{ color: brandTheme.text.muted }}
              />
              <p style={{ color: brandTheme.text.muted }}>No Done tasks</p>
            </div>
          ) : (
            <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
              <thead className="sticky top-0" style={{ backgroundColor: brandTheme.gray[100] }}>
                <tr className="border-b" style={{ borderColor: brandTheme.border.light }}>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                    style={{ 
                      color: brandTheme.text.secondary, 
                      width: `${doneColumnWidths.taskName}px`,
                      backgroundColor: hoveredColumn?.table === 'done' && hoveredColumn?.column === 'taskName' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                    }}
                  >
                    Task Name
                    <div
                      className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                      onMouseDown={(e) => onStartResize('done', 'taskName', e.clientX, doneColumnWidths.taskName)}
                      onMouseEnter={() => setHoveredColumn({ table: 'done', column: 'taskName' })}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{ 
                        backgroundColor: (resizing?.table === 'done' && resizing?.column === 'taskName') || (hoveredColumn?.table === 'done' && hoveredColumn?.column === 'taskName')
                          ? brandTheme.primary.lightBlue 
                          : 'transparent' 
                      }}
                    />
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                    style={{ 
                      color: brandTheme.text.secondary, 
                      width: `${doneColumnWidths.assignee}px`,
                      backgroundColor: hoveredColumn?.table === 'done' && hoveredColumn?.column === 'assignee' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                    }}
                  >
                    Assignee
                    <div
                      className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                      onMouseDown={(e) => onStartResize('done', 'assignee', e.clientX, doneColumnWidths.assignee)}
                      onMouseEnter={() => setHoveredColumn({ table: 'done', column: 'assignee' })}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{ 
                        backgroundColor: (resizing?.table === 'done' && resizing?.column === 'assignee') || (hoveredColumn?.table === 'done' && hoveredColumn?.column === 'assignee')
                          ? brandTheme.primary.lightBlue 
                          : 'transparent' 
                      }}
                    />
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                    style={{ 
                      color: brandTheme.text.secondary, 
                      width: `${doneColumnWidths.hoursSpent}px`,
                      backgroundColor: hoveredColumn?.table === 'done' && hoveredColumn?.column === 'hoursSpent' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                    }}
                  >
                    Hours Spent
                    <div
                      className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                      onMouseDown={(e) => onStartResize('done', 'hoursSpent', e.clientX, doneColumnWidths.hoursSpent)}
                      onMouseEnter={() => setHoveredColumn({ table: 'done', column: 'hoursSpent' })}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{ 
                        backgroundColor: (resizing?.table === 'done' && resizing?.column === 'hoursSpent') || (hoveredColumn?.table === 'done' && hoveredColumn?.column === 'hoursSpent')
                          ? brandTheme.primary.lightBlue 
                          : 'transparent' 
                      }}
                    />
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                    style={{ 
                      color: brandTheme.text.secondary, 
                      width: `${doneColumnWidths.subtasks}px`,
                      backgroundColor: hoveredColumn?.table === 'done' && hoveredColumn?.column === 'subtasks' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                    }}
                  >
                    Subtasks
                    <div
                      className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                      onMouseDown={(e) => onStartResize('done', 'subtasks', e.clientX, doneColumnWidths.subtasks)}
                      onMouseEnter={() => setHoveredColumn({ table: 'done', column: 'subtasks' })}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{ 
                        backgroundColor: (resizing?.table === 'done' && resizing?.column === 'subtasks') || (hoveredColumn?.table === 'done' && hoveredColumn?.column === 'subtasks')
                          ? brandTheme.primary.lightBlue 
                          : 'transparent' 
                      }}
                    />
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                    style={{ 
                      color: brandTheme.text.secondary, 
                      width: `${doneColumnWidths.priority}px`,
                      backgroundColor: hoveredColumn?.table === 'done' && hoveredColumn?.column === 'priority' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                    }}
                  >
                    Priority
                    <div
                      className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                      onMouseDown={(e) => onStartResize('done', 'priority', e.clientX, doneColumnWidths.priority)}
                      onMouseEnter={() => setHoveredColumn({ table: 'done', column: 'priority' })}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{ 
                        backgroundColor: (resizing?.table === 'done' && resizing?.column === 'priority') || (hoveredColumn?.table === 'done' && hoveredColumn?.column === 'priority')
                          ? brandTheme.primary.lightBlue 
                          : 'transparent' 
                      }}
                    />
                  </th>
                  <th 
                    className="px-3 py-2 text-left text-xs font-bold whitespace-nowrap relative group" 
                    style={{ 
                      color: brandTheme.text.secondary, 
                      width: `${doneColumnWidths.sprint}px`,
                      backgroundColor: hoveredColumn?.table === 'done' && hoveredColumn?.column === 'sprint' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                    }}
                  >
                    Sprint
                    <div
                      className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                      onMouseDown={(e) => onStartResize('done', 'sprint', e.clientX, doneColumnWidths.sprint)}
                      onMouseEnter={() => setHoveredColumn({ table: 'done', column: 'sprint' })}
                      onMouseLeave={() => setHoveredColumn(null)}
                      style={{ 
                        backgroundColor: (resizing?.table === 'done' && resizing?.column === 'sprint') || (hoveredColumn?.table === 'done' && hoveredColumn?.column === 'sprint')
                          ? brandTheme.primary.lightBlue 
                          : 'transparent' 
                      }}
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {doneTasks.map((task) => {
                  const priorityColors = getPriorityColor(task.priority);
                  return (
                    <tr
                      key={task.id}
                      className="border-b cursor-pointer transition-all hover:bg-gray-50"
                      style={{
                        borderColor: brandTheme.border.light,
                        borderLeftWidth: '3px',
                        borderLeftStyle: 'solid',
                        borderLeftColor: priorityColors.text,
                      }}
                      onClick={() => onTaskClick(task)}
                    >
                      {/* Task Name */}
                      <td 
                        className="px-3 py-2 relative"
                        style={{
                          backgroundColor: hoveredColumn?.table === 'done' && hoveredColumn?.column === 'taskName' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {task.isSubtask && (
                            <span className="text-xs" style={{ color: brandTheme.text.muted }}>
                              ↳
                            </span>
                          )}
                          <span
                            className="font-medium hover:underline text-sm line-clamp-1"
                            style={{ color: task.isSubtask ? brandTheme.text.secondary : brandTheme.primary.navy }}
                            title={task.isSubtask ? `Subtask of: ${task.parentTaskName}` : task.name}
                          >
                            {task.name}
                          </span>
                        </div>
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onStartResize('done', 'taskName', e.clientX, doneColumnWidths.taskName);
                          }}
                          onMouseEnter={() => setHoveredColumn({ table: 'done', column: 'taskName' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'done' && resizing?.column === 'taskName') || (hoveredColumn?.table === 'done' && hoveredColumn?.column === 'taskName')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </td>

                      {/* Assignee */}
                      <td 
                        className="px-3 py-2 whitespace-nowrap relative"
                        style={{
                          backgroundColor: hoveredColumn?.table === 'done' && hoveredColumn?.column === 'assignee' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                        }}
                      >
                        {task.assignee ? (
                          <div className="flex items-center justify-center">
                            <UserAvatar user={task.assignee} size="sm" />
                          </div>
                        ) : (
                          <span style={{ color: brandTheme.text.muted, fontSize: '0.65rem' }}>
                            -
                          </span>
                        )}
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onStartResize('done', 'assignee', e.clientX, doneColumnWidths.assignee);
                          }}
                          onMouseEnter={() => setHoveredColumn({ table: 'done', column: 'assignee' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'done' && resizing?.column === 'assignee') || (hoveredColumn?.table === 'done' && hoveredColumn?.column === 'assignee')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </td>

                      {/* Hours Spent */}
                      <td 
                        className="px-3 py-2 whitespace-nowrap relative"
                        style={{
                          backgroundColor: hoveredColumn?.table === 'done' && hoveredColumn?.column === 'hoursSpent' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                        }}
                      >
                        <span
                          className="text-xs font-semibold"
                          style={{ color: brandTheme.text.primary }}
                        >
                          {task.hoursSpent ? `${task.hoursSpent.toFixed(1)}h` : '0h'}
                        </span>
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onStartResize('done', 'hoursSpent', e.clientX, doneColumnWidths.hoursSpent);
                          }}
                          onMouseEnter={() => setHoveredColumn({ table: 'done', column: 'hoursSpent' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'done' && resizing?.column === 'hoursSpent') || (hoveredColumn?.table === 'done' && hoveredColumn?.column === 'hoursSpent')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </td>

                      {/* Subtasks */}
                      <td 
                        className="px-3 py-2 whitespace-nowrap relative"
                        style={{
                          backgroundColor: hoveredColumn?.table === 'done' && hoveredColumn?.column === 'subtasks' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                        }}
                      >
                        {!task.isSubtask && task.totalSubtasks ? (
                          <span
                            className="text-xs font-semibold"
                            style={{ color: brandTheme.text.primary }}
                          >
                            {task.completedSubtasks}/{task.totalSubtasks}
                          </span>
                        ) : (
                          <span
                            className="text-xs"
                            style={{ color: brandTheme.text.muted }}
                          >
                            -
                          </span>
                        )}
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onStartResize('done', 'subtasks', e.clientX, doneColumnWidths.subtasks);
                          }}
                          onMouseEnter={() => setHoveredColumn({ table: 'done', column: 'subtasks' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'done' && resizing?.column === 'subtasks') || (hoveredColumn?.table === 'done' && hoveredColumn?.column === 'subtasks')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </td>

                      {/* Priority */}
                      <td 
                        className="px-3 py-2 whitespace-nowrap relative"
                        style={{
                          backgroundColor: hoveredColumn?.table === 'done' && hoveredColumn?.column === 'priority' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                        }}
                      >
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: priorityColors.bg,
                            color: priorityColors.text,
                          }}
                        >
                          {task.priority || 'Medium'}
                        </span>
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onStartResize('done', 'priority', e.clientX, doneColumnWidths.priority);
                          }}
                          onMouseEnter={() => setHoveredColumn({ table: 'done', column: 'priority' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'done' && resizing?.column === 'priority') || (hoveredColumn?.table === 'done' && hoveredColumn?.column === 'priority')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </td>

                      {/* Sprint */}
                      <td 
                        className="px-3 py-2 whitespace-nowrap relative"
                        style={{
                          backgroundColor: hoveredColumn?.table === 'done' && hoveredColumn?.column === 'sprint' ? 'rgba(59, 130, 246, 0.03)' : 'transparent'
                        }}
                      >
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: brandTheme.primary.paleBlue,
                            color: brandTheme.primary.navy,
                          }}
                        >
                          {task.sprintGroupName}
                        </span>
                        <div
                          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize transition-all z-10"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            onStartResize('done', 'sprint', e.clientX, doneColumnWidths.sprint);
                          }}
                          onMouseEnter={() => setHoveredColumn({ table: 'done', column: 'sprint' })}
                          onMouseLeave={() => setHoveredColumn(null)}
                          style={{ 
                            backgroundColor: (resizing?.table === 'done' && resizing?.column === 'sprint') || (hoveredColumn?.table === 'done' && hoveredColumn?.column === 'sprint')
                              ? brandTheme.primary.lightBlue 
                              : 'transparent' 
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentSprintQAandDone;

