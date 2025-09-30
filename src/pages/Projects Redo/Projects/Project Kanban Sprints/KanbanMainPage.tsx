import React, { useState, useEffect, useRef } from 'react';
import { brandTheme } from '../../../../styles/brandTheme';
import { Filter, Search, RefreshCw, GripVertical } from 'lucide-react';

// Import all column components
import OngoingColumn from './Kanban Columns/OngoingColumn';
import ParkingLotColumn from './Kanban Columns/ParkingLotColumn';
import Sprint1Column from './Kanban Columns/Sprint1Column';
import Sprint2Column from './Kanban Columns/Sprint2Column';
import InProgressColumn from './Kanban Columns/InProgressColumn';
import StuckColumn from './Kanban Columns/StuckColumn';
import ReadyForQAColumn from './Kanban Columns/ReadyForQAColumn';
import ReadyForReleaseColumn from './Kanban Columns/ReadyForReleaseColumn';
import DoneColumn from './Kanban Columns/DoneColumn';

// Import database utilities
import { fetchAllSprintProjects } from './utils/sprintColumnUtils';

// Import ProjectDetailsModal
import ProjectDetailsModal from '../Flow Chart/utils/Profiles/ProjectDetailsModal';

// Import SprintReviewModal
import SprintReviewModal from './Sprint Review/SprintReviewModal';

// Import Help Tips
import TwoWeekSprintPlanHelpTips from './Help Information/2WeekSprintPlanHelpTips';

// Import Main Sprint Section
import MainSprintSection from './Sprint Review/Sprint Sections/MainSprintSection';

// Import Sprint Calendar
import SprintCalendarMain from './Sprint Review/Sprint Calendar/SprintCalendarMain';

const KanbanMainPage: React.FC = () => {
  const [projectsByColumn, setProjectsByColumn] = useState<Record<string, any[]>>({
    ongoing: [],
    parkinglot: [],
    sprint1: [],
    sprint2: [],
    inprogress: [],
    stuck: [],
    readyforqa: [],
    readyforrelease: [],
    done: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Modal state for project details
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  
  // Modal state for sprint review
  const [selectedSprintProject, setSelectedSprintProject] = useState<any>(null);
  const [isSprintReviewModalOpen, setIsSprintReviewModalOpen] = useState(false);
  const [isFromSprintGroup, setIsFromSprintGroup] = useState(false);

  // Column expansion state
  const [isOngoingExpanded, setIsOngoingExpanded] = useState(false);
  const [isParkingLotExpanded, setIsParkingLotExpanded] = useState(false);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    ongoing: true,
    parkinglot: true,
    sprint1: true,
    sprint2: true,
    inprogress: true,
    stuck: true,
    readyforqa: true,
    readyforrelease: true,
    done: true
  });

  // Column widths state (in pixels)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    ongoing: 256,
    parkinglot: 384,
    sprint1: 350,
    sprint2: 350,
    inprogress: 300,
    stuck: 300,
    readyforqa: 300,
    readyforrelease: 300,
    done: 300
  });

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const resizeStartX = useRef<number>(0);
  const resizeStartWidth = useRef<number>(0);

  // Column definitions
  const columnDefinitions = [
    { key: 'ongoing', label: 'Ongoing' },
    { key: 'parkinglot', label: 'Parking Lot' },
    { key: 'sprint1', label: 'Sprint 1' },
    { key: 'sprint2', label: 'Sprint 2' },
    { key: 'inprogress', label: 'In Progress' },
    { key: 'stuck', label: 'Stuck' },
    { key: 'readyforqa', label: 'Ready for QA' },
    { key: 'readyforrelease', label: 'Ready for Release' },
    { key: 'done', label: 'Done' }
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const allProjects = await fetchAllSprintProjects();
      setProjectsByColumn(allProjects);
    } catch (error) {
      console.error('Error loading sprint projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProjectsByColumn = (columnKey: string) => {
    return projectsByColumn[columnKey] || [];
  };

  const handleRefresh = () => {
    loadProjects();
    // Also trigger refresh for sprint columns and containers
    setRefreshTrigger(prev => prev + 1);
  };

  const handleProjectAdded = () => {
    // Refresh the kanban board when a project is added to a column
    loadProjects();
    // Also trigger refresh for sprint columns in case the project affects sprint data
    setRefreshTrigger(prev => prev + 1);
  };

  const handleProjectClick = (project: any) => {
    if (project.id) {
      setSelectedProjectId(project.id);
      setIsProjectModalOpen(true);
    }
  };

  const handleCloseProjectModal = () => {
    setIsProjectModalOpen(false);
    setSelectedProjectId(null);
  };

  const handleSprintReviewClick = (project: any) => {
    setSelectedSprintProject(project);
    setIsFromSprintGroup(false);
    setIsSprintReviewModalOpen(true);
  };

  const handleSprintGroupClick = (project: any) => {
    setSelectedSprintProject(project);
    setIsFromSprintGroup(true);
    setIsSprintReviewModalOpen(true);
  };

  const handleCloseSprintReviewModal = () => {
    setIsSprintReviewModalOpen(false);
    setSelectedSprintProject(null);
    setIsFromSprintGroup(false);
  };

  const handleSprintGroupCreated = () => {
    // Refresh the kanban board and close the modal
    loadProjects();
    setRefreshTrigger(prev => prev + 1); // Trigger refresh for sprint columns
    handleCloseSprintReviewModal();
  };

  const toggleColumnVisibility = (columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const showAllColumns = () => {
    const allVisible: Record<string, boolean> = {};
    columnDefinitions.forEach(col => {
      allVisible[col.key] = true;
    });
    setVisibleColumns(allVisible);
  };

  const hideAllColumns = () => {
    const allHidden: Record<string, boolean> = {};
    columnDefinitions.forEach(col => {
      allHidden[col.key] = false;
    });
    setVisibleColumns(allHidden);
  };

  // Show only Group 1: Parking Lot, Sprint 1, Sprint 2
  const showGroup1Only = () => {
    setVisibleColumns({
      ongoing: false,
      parkinglot: true,
      sprint1: true,
      sprint2: true,
      inprogress: false,
      stuck: false,
      readyforqa: false,
      readyforrelease: false,
      done: false
    });
  };

  // Show only Group 2: In Progress, Stuck, Ready for QA, Ready for Release, Done
  const showGroup2Only = () => {
    setVisibleColumns({
      ongoing: false,
      parkinglot: false,
      sprint1: false,
      sprint2: false,
      inprogress: true,
      stuck: true,
      readyforqa: true,
      readyforrelease: true,
      done: true
    });
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingColumn(columnKey);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = columnWidths[columnKey] || 300;
  };

  // Handle resize move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizingColumn) return;

      const deltaX = e.clientX - resizeStartX.current;
      const newWidth = Math.max(150, Math.min(800, resizeStartWidth.current + deltaX)); // Min 150px, max 800px

      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn]: newWidth
      }));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizingColumn(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resizingColumn]);

  // Resize handle component
  const ResizeHandle: React.FC<{ columnKey: string }> = ({ columnKey }) => (
    <div
      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize group hover:bg-blue-500 hover:bg-opacity-30 transition-colors z-10"
      onMouseDown={(e) => handleResizeStart(e, columnKey)}
      style={{
        cursor: 'col-resize',
      }}
    >
      <div
        className="absolute right-0 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          color: brandTheme.primary.navy,
        }}
      >
        <GripVertical size={16} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: brandTheme.background.secondary }}>
      {/* Header */}
      <div 
        className="p-6 border-b flex-shrink-0"
        style={{ 
          backgroundColor: brandTheme.background.primary,
          borderColor: brandTheme.border.light 
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 
                className="text-2xl font-bold"
                style={{ color: brandTheme.text.primary }}
              >
                2 Week Sprint Plan
              </h1>
              <TwoWeekSprintPlanHelpTips />
            </div>
            <p 
              className="text-sm mt-1"
              style={{ color: brandTheme.text.secondary }}
            >
              Manage your product development projects across sprint cycles
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center px-4 py-2 rounded-lg border transition-colors"
              style={{
                backgroundColor: brandTheme.background.primary,
                borderColor: brandTheme.border.medium,
                color: brandTheme.text.secondary,
              }}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Column Visibility Checkboxes - Horizontal Row */}
        <div className="mb-4 pb-4 border-b" style={{ borderColor: brandTheme.border.light }}>
          <div className="flex items-start gap-4">
            <span 
              className="text-sm font-semibold mt-3"
              style={{ color: brandTheme.text.secondary }}
            >
              Visible Columns:
            </span>

            {/* Ongoing (standalone) */}
            <label
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity mt-3"
            >
              <input
                type="checkbox"
                checked={visibleColumns.ongoing}
                onChange={() => toggleColumnVisibility('ongoing')}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span 
                className="text-sm font-medium"
                style={{ 
                  color: visibleColumns.ongoing 
                    ? brandTheme.text.primary 
                    : brandTheme.text.muted 
                }}
              >
                Ongoing
              </span>
            </label>

            {/* Group 1: Sprint Planning */}
            <div className="flex flex-col">
              <div 
                className="flex items-center gap-4 p-3 rounded-lg border-2"
                style={{ 
                  borderColor: brandTheme.primary.navy,
                  backgroundColor: brandTheme.primary.paleBlue 
                }}
              >
                <label className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <input
                    type="checkbox"
                    checked={visibleColumns.parkinglot}
                    onChange={() => toggleColumnVisibility('parkinglot')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ 
                      color: visibleColumns.parkinglot 
                        ? brandTheme.text.primary 
                        : brandTheme.text.muted 
                    }}
                  >
                    Parking Lot
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <input
                    type="checkbox"
                    checked={visibleColumns.sprint1}
                    onChange={() => toggleColumnVisibility('sprint1')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ 
                      color: visibleColumns.sprint1 
                        ? brandTheme.text.primary 
                        : brandTheme.text.muted 
                    }}
                  >
                    Sprint 1
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <input
                    type="checkbox"
                    checked={visibleColumns.sprint2}
                    onChange={() => toggleColumnVisibility('sprint2')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ 
                      color: visibleColumns.sprint2 
                        ? brandTheme.text.primary 
                        : brandTheme.text.muted 
                    }}
                  >
                    Sprint 2
                  </span>
                </label>
              </div>
              
              <button
                onClick={showGroup1Only}
                className="text-xs px-3 py-1.5 mt-2 rounded border-2 transition-all hover:shadow-md"
                style={{ 
                  backgroundColor: brandTheme.primary.paleBlue,
                  borderColor: brandTheme.primary.navy,
                  color: brandTheme.primary.navy,
                  fontWeight: 600
                }}
              >
                📋 Show Sprint Planning Only
              </button>
            </div>

            {/* Group 2: Execution */}
            <div className="flex flex-col">
              <div 
                className="flex items-center gap-4 p-3 rounded-lg border-2"
                style={{ 
                  borderColor: brandTheme.primary.navy,
                  backgroundColor: brandTheme.status.infoLight 
                }}
              >
                <label className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <input
                    type="checkbox"
                    checked={visibleColumns.inprogress}
                    onChange={() => toggleColumnVisibility('inprogress')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ 
                      color: visibleColumns.inprogress 
                        ? brandTheme.text.primary 
                        : brandTheme.text.muted 
                    }}
                  >
                    In Progress
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <input
                    type="checkbox"
                    checked={visibleColumns.stuck}
                    onChange={() => toggleColumnVisibility('stuck')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ 
                      color: visibleColumns.stuck 
                        ? brandTheme.text.primary 
                        : brandTheme.text.muted 
                    }}
                  >
                    Stuck
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <input
                    type="checkbox"
                    checked={visibleColumns.readyforqa}
                    onChange={() => toggleColumnVisibility('readyforqa')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ 
                      color: visibleColumns.readyforqa 
                        ? brandTheme.text.primary 
                        : brandTheme.text.muted 
                    }}
                  >
                    Ready for QA
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <input
                    type="checkbox"
                    checked={visibleColumns.readyforrelease}
                    onChange={() => toggleColumnVisibility('readyforrelease')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ 
                      color: visibleColumns.readyforrelease 
                        ? brandTheme.text.primary 
                        : brandTheme.text.muted 
                    }}
                  >
                    Ready for Release
                  </span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <input
                    type="checkbox"
                    checked={visibleColumns.done}
                    onChange={() => toggleColumnVisibility('done')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span 
                    className="text-sm font-medium"
                    style={{ 
                      color: visibleColumns.done 
                        ? brandTheme.text.primary 
                        : brandTheme.text.muted 
                    }}
                  >
                    Done
                  </span>
                </label>
              </div>
              
              <button
                onClick={showGroup2Only}
                className="text-xs px-3 py-1.5 mt-2 rounded border-2 transition-all hover:shadow-md"
                style={{ 
                  backgroundColor: brandTheme.status.infoLight,
                  borderColor: brandTheme.primary.navy,
                  color: brandTheme.primary.navy,
                  fontWeight: 600
                }}
              >
                🚀 Show Execution Only
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2 mt-3 ml-auto">
              <button
                onClick={showAllColumns}
                className="text-xs px-3 py-1 rounded border transition-colors hover:bg-gray-50"
                style={{ 
                  color: brandTheme.primary.navy,
                  borderColor: brandTheme.border.medium
                }}
              >
                Show All
              </button>
              <button
                onClick={hideAllColumns}
                className="text-xs px-3 py-1 rounded border transition-colors hover:bg-gray-50"
                style={{ 
                  color: brandTheme.text.secondary,
                  borderColor: brandTheme.border.medium
                }}
              >
                Hide All
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: brandTheme.text.muted }}
            />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{
                backgroundColor: brandTheme.background.primary,
                borderColor: brandTheme.border.medium,
                color: brandTheme.text.primary,
              }}
            />
          </div>
          
          <button
            className="flex items-center px-4 py-2 border rounded-lg transition-colors"
            style={{
              backgroundColor: brandTheme.background.primary,
              borderColor: brandTheme.border.medium,
              color: brandTheme.text.secondary,
            }}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Kanban Board */}
        <div className="p-6 flex-shrink-0">
          <div className="h-[600px] overflow-x-auto">
            <div className="flex space-x-6 h-full">
              {/* Ongoing Column */}
              {visibleColumns.ongoing && (
                <div 
                  className="flex-shrink-0 relative"
                  style={{ 
                    width: isOngoingExpanded ? `${columnWidths.ongoing}px` : `${columnWidths.ongoing}px`,
                    transition: 'none'
                  }}
                >
                  <OngoingColumn 
                    projects={getProjectsByColumn('ongoing')} 
                    onProjectAdded={handleProjectAdded}
                    onProjectClick={handleProjectClick}
                    onSprintReviewClick={handleSprintReviewClick}
                    onExpandedChange={setIsOngoingExpanded}
                  />
                  <ResizeHandle columnKey="ongoing" />
                </div>
              )}
              
              {/* Parking Lot Column */}
              {visibleColumns.parkinglot && (
                <div 
                  className="flex-shrink-0 relative"
                  style={{ 
                    width: isParkingLotExpanded ? `${columnWidths.parkinglot}px` : `${columnWidths.parkinglot}px`,
                    transition: 'none'
                  }}
                >
                  <ParkingLotColumn 
                    projects={getProjectsByColumn('parkinglot')} 
                    onProjectAdded={handleProjectAdded}
                    onProjectClick={handleProjectClick}
                    onSprintReviewClick={handleSprintReviewClick}
                    onExpandedChange={setIsParkingLotExpanded}
                  />
                  <ResizeHandle columnKey="parkinglot" />
                </div>
              )}
              
              {/* Sprint 1 Column */}
              {visibleColumns.sprint1 && (
                <div className="flex-shrink-0 relative" style={{ width: `${columnWidths.sprint1}px` }}>
                  <Sprint1Column 
                    onProjectClick={handleProjectClick}
                    onSprintReviewClick={handleSprintGroupClick}
                    refreshTrigger={refreshTrigger}
                  />
                  <ResizeHandle columnKey="sprint1" />
                </div>
              )}
              
              {/* Sprint 2 Column */}
              {visibleColumns.sprint2 && (
                <div className="flex-shrink-0 relative" style={{ width: `${columnWidths.sprint2}px` }}>
                  <Sprint2Column 
                    onProjectClick={handleProjectClick}
                    onSprintReviewClick={handleSprintGroupClick}
                    refreshTrigger={refreshTrigger}
                  />
                  <ResizeHandle columnKey="sprint2" />
                </div>
              )}
              
              {/* In Progress Column */}
              {visibleColumns.inprogress && (
                <div className="flex-shrink-0 relative" style={{ width: `${columnWidths.inprogress}px` }}>
                  <InProgressColumn 
                    projects={getProjectsByColumn('inprogress')} 
                    onProjectClick={handleProjectClick}
                    onSprintReviewClick={handleSprintReviewClick}
                    refreshTrigger={refreshTrigger}
                  />
                  <ResizeHandle columnKey="inprogress" />
                </div>
              )}
              
              {/* Stuck Column */}
              {visibleColumns.stuck && (
                <div className="flex-shrink-0 relative" style={{ width: `${columnWidths.stuck}px` }}>
                  <StuckColumn 
                    projects={getProjectsByColumn('stuck')} 
                    onProjectClick={handleProjectClick}
                    onSprintReviewClick={handleSprintReviewClick}
                  />
                  <ResizeHandle columnKey="stuck" />
                </div>
              )}
              
              {/* Ready for QA Column */}
              {visibleColumns.readyforqa && (
                <div className="flex-shrink-0 relative" style={{ width: `${columnWidths.readyforqa}px` }}>
                  <ReadyForQAColumn 
                    projects={getProjectsByColumn('readyforqa')} 
                    onProjectClick={handleProjectClick}
                    onSprintReviewClick={handleSprintReviewClick}
                  />
                  <ResizeHandle columnKey="readyforqa" />
                </div>
              )}
              
              {/* Ready for Release Column */}
              {visibleColumns.readyforrelease && (
                <div className="flex-shrink-0 relative" style={{ width: `${columnWidths.readyforrelease}px` }}>
                  <ReadyForReleaseColumn 
                    projects={getProjectsByColumn('readyforrelease')} 
                    onProjectClick={handleProjectClick}
                    onSprintReviewClick={handleSprintReviewClick}
                  />
                  <ResizeHandle columnKey="readyforrelease" />
                </div>
              )}
              
              {/* Done Column */}
              {visibleColumns.done && (
                <div className="flex-shrink-0 relative" style={{ width: `${columnWidths.done}px` }}>
                  <DoneColumn 
                    projects={getProjectsByColumn('done')} 
                    onProjectClick={handleProjectClick}
                    onSprintReviewClick={handleSprintReviewClick}
                  />
                  <ResizeHandle columnKey="done" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sprint Groups Overview Section */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <MainSprintSection
            refreshTrigger={refreshTrigger}
            onProjectClick={handleProjectClick}
            onSprintReviewClick={handleSprintReviewClick}
          />

          {/* Sprint Calendar Section */}
          <SprintCalendarMain
            refreshTrigger={refreshTrigger}
            onProjectClick={handleProjectClick}
            onSprintReviewClick={handleSprintReviewClick}
          />
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-lg p-6 flex items-center space-x-3"
            style={{ backgroundColor: brandTheme.background.primary }}
          >
            <RefreshCw className="w-6 h-6 animate-spin" style={{ color: brandTheme.primary.navy }} />
            <span style={{ color: brandTheme.text.primary }}>Loading projects...</span>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProjectId && (
        <ProjectDetailsModal
          isOpen={isProjectModalOpen}
          onClose={handleCloseProjectModal}
          projectId={selectedProjectId}
        />
      )}

      {/* Sprint Review Modal */}
      <SprintReviewModal
        isOpen={isSprintReviewModalOpen}
        onClose={handleCloseSprintReviewModal}
        project={selectedSprintProject}
        onSprintGroupCreated={handleSprintGroupCreated}
        fromSprintGroup={isFromSprintGroup}
      />
    </div>
  );
};

export default KanbanMainPage;
