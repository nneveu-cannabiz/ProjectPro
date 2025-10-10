import React from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { Award } from 'lucide-react';

interface SprintGroupExpandedContentProps {
  groupTasks: any[];
  subtasksMap: Map<string, any[]>;
  storyPointsMap: Map<string, number>;
  colors: any;
}

const SprintGroupExpandedContent: React.FC<SprintGroupExpandedContentProps> = ({
  groupTasks,
  subtasksMap,
  storyPointsMap,
  colors,
}) => {
  // Helper function to get all tasks and subtasks for a specific status
  const getItemsForStatus = (status: string) => {
    const items: Array<{ type: 'task' | 'subtask'; data: any; parentTaskName?: string }> = [];
    
    groupTasks.forEach(task => {
      // Add task if it matches the status
      if (task.status === status) {
        items.push({ type: 'task', data: task });
      }
      
      // Add subtasks that match the status (regardless of parent task status)
      const subtasks = subtasksMap.get(task.id);
      if (subtasks) {
        subtasks
          .filter((st: any) => st.status === status)
          .forEach((subtask: any) => {
            items.push({ 
              type: 'subtask', 
              data: subtask,
              parentTaskName: task.name
            });
          });
      }
    });
    
    return items;
  };

  // Count tasks and subtasks for each status
  const getTodoCount = () => {
    let count = 0;
    groupTasks.forEach(task => {
      if (task.status === 'todo') count++;
      const subtasks = subtasksMap.get(task.id);
      if (subtasks) {
        count += subtasks.filter((st: any) => st.status === 'todo').length;
      }
    });
    return count;
  };

  const getInProgressCount = () => {
    let count = 0;
    groupTasks.forEach(task => {
      if (task.status === 'in-progress') count++;
      const subtasks = subtasksMap.get(task.id);
      if (subtasks) {
        count += subtasks.filter((st: any) => st.status === 'in-progress').length;
      }
    });
    return count;
  };

  const getDoneCount = () => {
    let count = 0;
    groupTasks.forEach(task => {
      if (task.status === 'done') count++;
      const subtasks = subtasksMap.get(task.id);
      if (subtasks) {
        count += subtasks.filter((st: any) => st.status === 'done').length;
      }
    });
    return count;
  };

  return (
    <div className="px-3 pb-3">
      <div className="grid grid-cols-3 gap-3 mt-3">
        {/* To Do Column */}
        <div
          className="rounded-lg p-3"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
        >
          <h4
            className="text-xs font-bold mb-2 uppercase"
            style={{ color: colors.text }}
          >
            To Do ({getTodoCount()})
          </h4>
          <div className="space-y-2">
            {getItemsForStatus('todo').map((item, index) => (
              <div key={`${item.type}-${item.data.id}-${index}`}>
                {item.type === 'task' ? (
                  <div
                    className="p-2 rounded text-xs"
                    style={{
                      backgroundColor: brandTheme.background.primary,
                      border: `1px solid ${brandTheme.border.light}`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium flex-1" style={{ color: brandTheme.text.primary }}>
                        {item.data.name}
                      </div>
                      {storyPointsMap.get(item.data.id) && typeof storyPointsMap.get(item.data.id) === 'number' && (
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3" style={{ color: brandTheme.primary.navy }} />
                          <span className="text-xs font-bold" style={{ color: brandTheme.primary.navy }}>
                            {storyPointsMap.get(item.data.id)}
                          </span>
                        </div>
                      )}
                    </div>
                    {item.data.assignee && (
                      <div className="text-xs mt-1" style={{ color: brandTheme.text.secondary }}>
                        {item.data.assignee.first_name} {item.data.assignee.last_name}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="ml-4 p-2 rounded text-xs"
                    style={{
                      backgroundColor: brandTheme.primary.paleBlue + '40',
                      border: `1px solid ${brandTheme.border.light}`,
                    }}
                  >
                    <div className="font-medium" style={{ color: brandTheme.text.primary }}>
                      ↳ {item.data.name}
                    </div>
                    {item.parentTaskName && (
                      <div className="text-xs mt-1" style={{ color: brandTheme.text.secondary, opacity: 0.7 }}>
                        Parent: {item.parentTaskName}
                      </div>
                    )}
                    {item.data.assignee && (
                      <div className="text-xs mt-1" style={{ color: brandTheme.text.secondary }}>
                        {item.data.assignee.first_name} {item.data.assignee.last_name}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* In Progress Column */}
        <div
          className="rounded-lg p-3"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
        >
          <h4
            className="text-xs font-bold mb-2 uppercase"
            style={{ color: colors.text }}
          >
            In Progress ({getInProgressCount()})
          </h4>
          <div className="space-y-2">
            {getItemsForStatus('in-progress').map((item, index) => (
              <div key={`${item.type}-${item.data.id}-${index}`}>
                {item.type === 'task' ? (
                  <div
                    className="p-2 rounded text-xs"
                    style={{
                      backgroundColor: brandTheme.background.primary,
                      border: `1px solid ${brandTheme.border.light}`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium flex-1" style={{ color: brandTheme.text.primary }}>
                        {item.data.name}
                      </div>
                      {storyPointsMap.get(item.data.id) && typeof storyPointsMap.get(item.data.id) === 'number' && (
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3" style={{ color: brandTheme.primary.navy }} />
                          <span className="text-xs font-bold" style={{ color: brandTheme.primary.navy }}>
                            {storyPointsMap.get(item.data.id)}
                          </span>
                        </div>
                      )}
                    </div>
                    {item.data.assignee && (
                      <div className="text-xs mt-1" style={{ color: brandTheme.text.secondary }}>
                        {item.data.assignee.first_name} {item.data.assignee.last_name}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="ml-4 p-2 rounded text-xs"
                    style={{
                      backgroundColor: brandTheme.primary.paleBlue + '40',
                      border: `1px solid ${brandTheme.border.light}`,
                    }}
                  >
                    <div className="font-medium" style={{ color: brandTheme.text.primary }}>
                      ↳ {item.data.name}
                    </div>
                    {item.parentTaskName && (
                      <div className="text-xs mt-1" style={{ color: brandTheme.text.secondary, opacity: 0.7 }}>
                        Parent: {item.parentTaskName}
                      </div>
                    )}
                    {item.data.assignee && (
                      <div className="text-xs mt-1" style={{ color: brandTheme.text.secondary }}>
                        {item.data.assignee.first_name} {item.data.assignee.last_name}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Done Column */}
        <div
          className="rounded-lg p-3"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
        >
          <h4
            className="text-xs font-bold mb-2 uppercase"
            style={{ color: colors.text }}
          >
            Done ({getDoneCount()})
          </h4>
          <div className="space-y-2">
            {getItemsForStatus('done').map((item, index) => (
              <div key={`${item.type}-${item.data.id}-${index}`}>
                {item.type === 'task' ? (
                  <div
                    className="p-2 rounded text-xs"
                    style={{
                      backgroundColor: brandTheme.background.primary,
                      border: `1px solid ${brandTheme.border.light}`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium flex-1" style={{ color: brandTheme.text.primary }}>
                        {item.data.name}
                      </div>
                      {storyPointsMap.get(item.data.id) && typeof storyPointsMap.get(item.data.id) === 'number' && (
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3" style={{ color: brandTheme.primary.navy }} />
                          <span className="text-xs font-bold" style={{ color: brandTheme.primary.navy }}>
                            {storyPointsMap.get(item.data.id)}
                          </span>
                        </div>
                      )}
                    </div>
                    {item.data.assignee && (
                      <div className="text-xs mt-1" style={{ color: brandTheme.text.secondary }}>
                        {item.data.assignee.first_name} {item.data.assignee.last_name}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="ml-4 p-2 rounded text-xs"
                    style={{
                      backgroundColor: brandTheme.primary.paleBlue + '40',
                      border: `1px solid ${brandTheme.border.light}`,
                    }}
                  >
                    <div className="font-medium" style={{ color: brandTheme.text.primary }}>
                      ↳ {item.data.name}
                    </div>
                    {item.parentTaskName && (
                      <div className="text-xs mt-1" style={{ color: brandTheme.text.secondary, opacity: 0.7 }}>
                        Parent: {item.parentTaskName}
                      </div>
                    )}
                    {item.data.assignee && (
                      <div className="text-xs mt-1" style={{ color: brandTheme.text.secondary }}>
                        {item.data.assignee.first_name} {item.data.assignee.last_name}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SprintGroupExpandedContent;

