import React from 'react';
import { brandTheme } from '../../../../../../styles/brandTheme';
import { ChevronDown, ChevronUp, ListTodo, GripVertical, Award } from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { HistoricalSprint } from './types';
import { getSprintTypeColor } from './sprintHelpers';

interface DraggableEpicGroupProps {
  group: any;
  sprint: HistoricalSprint;
  colors: any;
  isExpanded: boolean;
  counts: any;
  subtaskCount: number;
  storyPoints?: number;
  onToggleExpansion: () => void;
  onSprintGroupClick: () => void;
  enableDragDrop: boolean;
  children: React.ReactNode;
  isOverTarget?: boolean;
}

const DraggableEpicGroup: React.FC<DraggableEpicGroupProps> = ({
  group,
  sprint,
  colors,
  isExpanded,
  counts,
  subtaskCount,
  storyPoints = 0,
  onToggleExpansion,
  onSprintGroupClick,
  enableDragDrop,
  children,
  isOverTarget = false,
}) => {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging, transform } = useDraggable({
    id: group.id,
    data: {
      type: 'epic',
      epic: group,
      sprint,
      name: group.name,
      project: group.project,
    },
    disabled: !enableDragDrop,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: group.id,
    data: {
      type: 'epic',
      epic: group,
      sprint,
    },
    disabled: !enableDragDrop,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  // Combine refs
  const setRefs = (element: HTMLDivElement | null) => {
    setDragRef(element);
    setDropRef(element);
  };

  const combinedStyle = {
    ...style,
    backgroundColor: isOverTarget || isOver ? `${colors.bg}dd` : colors.bg,
    borderLeftColor: isOverTarget || isOver ? brandTheme.primary.navy : colors.border,
    borderLeftWidth: isOverTarget || isOver ? '6px' : '4px',
    boxShadow: isOverTarget ? `0 4px 12px ${brandTheme.primary.navy}40` : undefined,
    transform: isOverTarget && !transform ? 'scale(1.02)' : (transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined),
    transition: 'all 0.2s ease',
  };

  return (
    <div
      ref={setRefs}
      style={combinedStyle}
      className="rounded-lg border-l-4 transition-all"
    >
      {/* Group Header */}
      <div className="flex items-center justify-between p-3 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Drag Handle (only shown when drag/drop is enabled) */}
            {enableDragDrop && (
              <button
                {...attributes}
                {...listeners}
                className="p-1 hover:bg-white hover:bg-opacity-30 rounded transition-colors flex-shrink-0 cursor-grab active:cursor-grabbing"
                style={{ color: colors.text }}
                title="Drag to move to another sprint"
              >
                <GripVertical className="w-4 h-4" />
              </button>
            )}
            
            {/* Expand/Collapse Button */}
            <button
              onClick={onToggleExpansion}
              className="p-1 hover:bg-white hover:bg-opacity-30 rounded transition-colors flex-shrink-0"
              style={{ color: colors.text }}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {/* Ranking Badge */}
            {group.sprint_id && group.ranking?.[`Sprint ${group.sprint_id}`] && (
              <div
                className="px-2 py-1 rounded-full text-xs font-bold flex-shrink-0"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  color: colors.text,
                }}
              >
                {group.ranking[`Sprint ${group.sprint_id}`]}
              </div>
            )}
            
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                onClick={onSprintGroupClick}
                className="font-semibold text-sm truncate hover:underline cursor-pointer text-left"
                style={{ color: colors.text }}
                title="Click to view sprint group details"
              >
                {group.name || 'Unnamed Epic'}
              </button>
              {counts.total > 0 ? (
                <span
                  className="text-xs font-medium whitespace-nowrap"
                  style={{ color: colors.text, opacity: 0.7 }}
                >
                  ({counts.total} {counts.total === 1 ? 'task' : 'tasks'}, {subtaskCount} {subtaskCount === 1 ? 'subtask' : 'subtasks'})
                </span>
              ) : (
                <span
                  className="text-xs font-medium whitespace-nowrap italic"
                  style={{ color: colors.text, opacity: 0.5 }}
                >
                  (no tasks yet)
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className="relative rounded-full overflow-hidden"
                style={{
                  width: '60px',
                  height: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                  border: '1px solid rgba(0, 0, 0, 0.15)',
                }}
              >
                <div
                  className="absolute top-0 left-0 h-full transition-all"
                  style={{
                    width: `${Math.round(((counts.done * 100) + (counts.inProgress * 50)) / (counts.total || 1))}%`,
                    backgroundColor: colors.text,
                  }}
                />
              </div>
              <span
                className="text-xs font-bold whitespace-nowrap"
                style={{ color: colors.text, minWidth: '32px' }}
              >
                {Math.round(((counts.done * 100) + (counts.inProgress * 50)) / (counts.total || 1))}%
              </span>
            </div>
            
            {/* Story Points */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Award className="w-3.5 h-3.5" style={{ color: colors.text, opacity: 0.7 }} />
              <span
                className="text-xs font-bold whitespace-nowrap"
                style={{ color: colors.text }}
                title="Story Points"
              >
                {typeof storyPoints === 'number' ? storyPoints.toFixed(1) : '0.0'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1">
              <ListTodo className="w-3.5 h-3.5" style={{ color: colors.text, opacity: 0.7 }} />
              <span
                className="text-xs font-bold whitespace-nowrap"
                style={{ color: colors.text }}
              >
                {counts.total}
              </span>
            </div>
            <span className="text-xs" style={{ color: colors.text, opacity: 0.5 }}>|</span>
            <span
              className="text-xs font-medium whitespace-nowrap"
              style={{ color: colors.text, opacity: 0.9 }}
            >
              {counts.todo} • {counts.inProgress} • {counts.done}
            </span>
          </div>
        </div>

        {children}
    </div>
  );
};

export default DraggableEpicGroup;

