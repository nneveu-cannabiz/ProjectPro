import React from 'react';
import { MoreVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { brandTheme } from '../../../../styles/brandTheme';
import { 
  fetchUsers, 
  updateUserDepartment,
  fetchProjectsForFlowChart,
  updateProjectFlowChart
} from '../../../../data/supabase-store';
import { User } from '../../../../types';
import FlowChartContainer from './FlowChartContainer';
import OutstandingList from './Outstanding Projects/outstandinglist';
import OKRPriorities from './OKRs/OKRPriorities';
import IDSSection from './IDS/IDSSection';
import { createMenuItems, getMenuButtonStyle, getMenuDropdownStyle, getMenuItemStyle } from './utils/menu';

const ProjectsFlowChart: React.FC = () => {
  const [allUsers, setAllUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [showUserSelect, setShowUserSelect] = React.useState(false);
  const [showProjectSelect, setShowProjectSelect] = React.useState(false);
  const [assigningUser, setAssigningUser] = React.useState(false);
  const [assigningProject, setAssigningProject] = React.useState(false);
  const [availableProjects, setAvailableProjects] = React.useState<any[]>([]);
  const [projectSearchTerm, setProjectSearchTerm] = React.useState('');
  const [isOutstandingExpanded, setIsOutstandingExpanded] = React.useState(false);

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load all users for the assignment dropdown
        const allUsersData = await fetchUsers();
        setAllUsers(allUsersData);
        
        // Load available projects for flow chart
        const projectsData = await fetchProjectsForFlowChart();
        setAvailableProjects(projectsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAssignUser = async (userId: string) => {
    setAssigningUser(true);
    try {
      await updateUserDepartment(userId, 'Product Development');
      
      // Update the allUsers list to reflect the change
      const allUsersData = await fetchUsers();
      setAllUsers(allUsersData);
      
      setShowUserSelect(false);
    } catch (error) {
      console.error('Error assigning user:', error);
    } finally {
      setAssigningUser(false);
    }
  };

  const handlePullInProject = async (projectId: string) => {
    setAssigningProject(true);
    try {
      await updateProjectFlowChart(projectId, 'Product Development');
      
      // Refresh the available projects list
      const projectsData = await fetchProjectsForFlowChart();
      setAvailableProjects(projectsData);
      
      setShowProjectSelect(false);
      setProjectSearchTerm(''); // Clear search when closing modal
    } catch (error) {
      console.error('Error pulling in project:', error);
    } finally {
      setAssigningProject(false);
    }
  };

  // Filter projects based on search term
  const filteredAvailableProjects = React.useMemo(() => {
    if (!projectSearchTerm.trim()) {
      return availableProjects;
    }
    
    const searchLower = projectSearchTerm.toLowerCase().trim();
    return availableProjects.filter(project => 
      project.name.toLowerCase().includes(searchLower) ||
      project.description?.toLowerCase().includes(searchLower) ||
      project.status?.toLowerCase().includes(searchLower) ||
      project.priority?.toLowerCase().includes(searchLower) ||
      project.category?.toLowerCase().includes(searchLower)
    );
  }, [availableProjects, projectSearchTerm]);

  // Helper function to highlight search matches in text
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background-color: yellow; padding: 0;">$1</mark>');
  };

  const handleMenuAction = (action: string) => {
    setShowDropdown(false);
    if (action === 'assign-user') {
      setShowUserSelect(true);
    } else if (action === 'pull-project') {
      setShowProjectSelect(true);
    }
  };



  const getAvailableUsers = () => {
    return allUsers.filter(user => user.department !== 'Product Development');
  };

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: brandTheme.background.secondary }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
               style={{ borderColor: brandTheme.primary.navy }}></div>
          <p style={{ color: brandTheme.text.secondary }}>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: brandTheme.background.secondary }}
    >
             {/* Top Controls */}
       <div className="p-6 border-b" style={{ borderColor: brandTheme.border.light }}>
         <div className="flex items-center justify-between">
           <div>
             <h1 
               className="text-3xl font-bold mb-2"
               style={{ color: brandTheme.primary.navy }}
             >
               Product Development Team
             </h1>
             <p style={{ color: brandTheme.text.muted }}>
               Manage your Product Development team members
             </p>
           </div>
           
           {/* Dropdown Menu */}
           <div className="relative">
             <button
               onClick={() => setShowDropdown(!showDropdown)}
               className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
               style={getMenuButtonStyle()}
             >
               <MoreVertical size={20} />
             </button>
             
             {showDropdown && (
               <div 
                 className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg border z-10"
                 style={getMenuDropdownStyle()}
               >
                 <div className="py-1">
                   {createMenuItems(
                     () => handleMenuAction('assign-user'),
                     () => handleMenuAction('pull-project')
                   ).map((item) => {
                     const Icon = item.icon;
                     return (
                       <button
                         key={item.id}
                         onClick={item.action}
                         className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center"
                         style={getMenuItemStyle()}
                       >
                         <Icon size={16} className="mr-2" />
                         {item.label}
                       </button>
                       );
                     })}
                 </div>
               </div>
             )}
           </div>
         </div>

        {/* Outstanding Projects Section - Expandable */}
        <div className="mt-2">
          <div 
            className="p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50"
            style={{ 
              backgroundColor: brandTheme.background.primary,
              borderColor: brandTheme.border.light 
            }}
            onClick={() => setIsOutstandingExpanded(!isOutstandingExpanded)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {isOutstandingExpanded ? (
                  <ChevronDown size={20} style={{ color: brandTheme.text.primary }} />
                ) : (
                  <ChevronRight size={20} style={{ color: brandTheme.text.primary }} />
                )}
                <h3 
                  className="text-lg font-semibold ml-2"
                  style={{ color: brandTheme.primary.navy }}
                >
                  Outstanding Projects
                </h3>
              </div>
              <span 
                className="text-sm"
                style={{ color: brandTheme.text.muted }}
              >
                {isOutstandingExpanded ? 'Click to collapse' : 'Click to expand'}
              </span>
            </div>
          </div>
          
          {isOutstandingExpanded && (
            <div className="mt-2">
              <OutstandingList />
            </div>
          )}
        </div>

        {/* OKR Priorities Section */}
        <div className="mt-4">
          <OKRPriorities />
        </div>
       </div>

      {/* User Assignment Modal */}
      {showUserSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            style={{ borderColor: brandTheme.border.light }}
          >
            <h3 
              className="text-lg font-semibold mb-4"
              style={{ color: brandTheme.text.primary }}
            >
              Assign User to Product Development
            </h3>
            
            <div className="max-h-60 overflow-y-auto space-y-2">
              {getAvailableUsers().length === 0 ? (
                <p style={{ color: brandTheme.text.muted }}>
                  All users are already assigned to Product Development.
                </p>
              ) : (
                getAvailableUsers().map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAssignUser(user.id)}
                    disabled={assigningUser}
                    className="w-full p-3 text-left rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50"
                    style={{
                      borderColor: brandTheme.border.light,
                      color: brandTheme.text.primary
                    }}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold mr-3"
                        style={{ backgroundColor: user.profileColor || brandTheme.primary.navy }}
                      >
                        {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{getUserDisplayName(user)}</div>
                        <div 
                          className="text-sm"
                          style={{ color: brandTheme.text.muted }}
                        >
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowUserSelect(false)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                style={{
                  borderColor: brandTheme.border.light,
                  color: brandTheme.text.primary
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Selection Modal */}
      {showProjectSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4"
            style={{ borderColor: brandTheme.border.light }}
          >
            <h3 
              className="text-lg font-semibold mb-4"
              style={{ color: brandTheme.text.primary }}
            >
              Pull in Project to Product Development
            </h3>
            
            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search projects by name, description, status, priority, or category..."
                value={projectSearchTerm}
                onChange={(e) => setProjectSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{
                  borderColor: brandTheme.border.light,
                  backgroundColor: brandTheme.background.secondary,
                  color: brandTheme.text.primary
                }}
              />
              {projectSearchTerm.trim() && (
                <div className="mt-2 text-sm" style={{ color: brandTheme.text.muted }}>
                  Showing {filteredAvailableProjects.length} of {availableProjects.length} projects
                </div>
              )}
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-2">
              {availableProjects.length === 0 ? (
                <p style={{ color: brandTheme.text.muted }}>
                  All projects are already assigned to Product Development.
                </p>
              ) : filteredAvailableProjects.length === 0 ? (
                <p style={{ color: brandTheme.text.muted }}>
                  No projects found matching "{projectSearchTerm}".
                </p>
              ) : (
                filteredAvailableProjects.map((project: any) => (
                  <button
                    key={project.id}
                    onClick={() => handlePullInProject(project.id)}
                    disabled={assigningProject}
                    className="w-full p-4 text-left rounded-lg border hover:bg-gray-50 transition-colors disabled:opacity-50"
                    style={{
                      borderColor: brandTheme.border.light,
                      color: brandTheme.text.primary
                    }}
                  >
                    <div>
                      <div 
                        className="font-medium text-lg mb-1"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerm(project.name, projectSearchTerm) 
                        }}
                      />
                      {project.description && (
                        <div 
                          className="text-sm mb-2"
                          style={{ color: brandTheme.text.muted }}
                          dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(project.description, projectSearchTerm) 
                          }}
                        />
                      )}
                      <div className="flex items-center space-x-4 text-sm">
                        <span 
                          className="px-2 py-1 rounded"
                          style={{ 
                            backgroundColor: brandTheme.status.info + '20',
                            color: brandTheme.status.info
                          }}
                          dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(project.status, projectSearchTerm) 
                          }}
                        />
                        <span 
                          style={{ color: brandTheme.text.muted }}
                          dangerouslySetInnerHTML={{ 
                            __html: `Priority: ${highlightSearchTerm(project.priority, projectSearchTerm)}` 
                          }}
                        />
                        <span 
                          style={{ color: brandTheme.text.muted }}
                          dangerouslySetInnerHTML={{ 
                            __html: `Category: ${highlightSearchTerm(project.category, projectSearchTerm)}` 
                          }}
                        />
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowProjectSelect(false);
                  setProjectSearchTerm(''); // Clear search when closing modal
                }}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                style={{
                  borderColor: brandTheme.border.light,
                  color: brandTheme.text.primary
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
             )}



       {/* Flow Chart Container - Takes remaining height */}
       <div className="flex-1 overflow-hidden">
         <FlowChartContainer />
       </div>

       {/* IDS Section */}
       <div className="p-6">
         <IDSSection />
       </div>
     </div>
   );
 };

export default ProjectsFlowChart;
