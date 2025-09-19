import React, { useState, useEffect } from 'react';
import { brandTheme } from '../../../../styles/brandTheme';
import { Filter, Search, RefreshCw } from 'lucide-react';

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

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: brandTheme.background.secondary }}>
      {/* Header */}
      <div 
        className="p-6 border-b"
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

      {/* Kanban Board */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="h-full overflow-x-auto">
          <div className="flex space-x-6 h-full min-w-max">
            {/* All Columns */}
            <div className={`${isOngoingExpanded ? 'w-64' : 'w-32'} flex-shrink-0 transition-all duration-300`}>
              <OngoingColumn 
                projects={getProjectsByColumn('ongoing')} 
                onProjectAdded={handleProjectAdded}
                onProjectClick={handleProjectClick}
                onSprintReviewClick={handleSprintReviewClick}
                onExpandedChange={setIsOngoingExpanded}
              />
            </div>
            
            <div className={`${isParkingLotExpanded ? 'w-64' : 'w-32'} flex-shrink-0 transition-all duration-300`}>
              <ParkingLotColumn 
                projects={getProjectsByColumn('parkinglot')} 
                onProjectAdded={handleProjectAdded}
                onProjectClick={handleProjectClick}
                onSprintReviewClick={handleSprintReviewClick}
                onExpandedChange={setIsParkingLotExpanded}
              />
            </div>
            
            <div className="w-96 flex-shrink-0">
              <Sprint1Column 
                onProjectClick={handleProjectClick}
                onSprintReviewClick={handleSprintGroupClick}
                refreshTrigger={refreshTrigger}
              />
            </div>
            
            <div className="w-96 flex-shrink-0">
              <Sprint2Column 
                onProjectClick={handleProjectClick}
                onSprintReviewClick={handleSprintGroupClick}
                refreshTrigger={refreshTrigger}
              />
            </div>
            
            <div className="w-80 flex-shrink-0">
              <InProgressColumn 
                projects={getProjectsByColumn('inprogress')} 
                onProjectClick={handleProjectClick}
                onSprintReviewClick={handleSprintReviewClick}
                refreshTrigger={refreshTrigger}
              />
            </div>
            
            <div className="w-80 flex-shrink-0">
              <StuckColumn 
                projects={getProjectsByColumn('stuck')} 
                onProjectClick={handleProjectClick}
                onSprintReviewClick={handleSprintReviewClick}
              />
            </div>
            
            <div className="w-80 flex-shrink-0">
              <ReadyForQAColumn 
                projects={getProjectsByColumn('readyforqa')} 
                onProjectClick={handleProjectClick}
                onSprintReviewClick={handleSprintReviewClick}
              />
            </div>
            
            <div className="w-80 flex-shrink-0">
              <ReadyForReleaseColumn 
                projects={getProjectsByColumn('readyforrelease')} 
                onProjectClick={handleProjectClick}
                onSprintReviewClick={handleSprintReviewClick}
              />
            </div>
            
            <div className="w-80 flex-shrink-0">
              <DoneColumn 
                projects={getProjectsByColumn('done')} 
                onProjectClick={handleProjectClick}
                onSprintReviewClick={handleSprintReviewClick}
              />
            </div>
          </div>
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
