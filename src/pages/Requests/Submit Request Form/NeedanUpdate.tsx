import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, AlertCircle, ArrowLeft, RefreshCw, Search } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { brandTheme } from '../../../styles/brandTheme';
import ImageUpload from '../../../components/ui/ImageUpload';

interface NeedUpdateFormData {
  title: string;
  selected_project_id: string;
  selected_project_name: string;
  description: string;
  priority: string;
  deadline: string;
  submitter_name: string;
  submitter_email: string;
  image_attachment_url: string;
}

interface Project {
  id: string;
  project_name: string;
  project_description?: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface NeedanUpdateProps {
  onBack: () => void;
}

const NeedanUpdate: React.FC<NeedanUpdateProps> = ({ onBack }) => {
  const [formData, setFormData] = useState<NeedUpdateFormData>({
    title: 'Need an Update',
    selected_project_id: '',
    selected_project_name: '',
    description: '',
    priority: 'medium',
    deadline: '',
    submitter_name: '',
    submitter_email: '',
    image_attachment_url: ''
  });
  
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [projectSearchTerm, setProjectSearchTerm] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const priorities = [
    { value: 'low', label: 'Low - General status update when convenient' },
    { value: 'medium', label: 'Medium - Would like an update within a few days' },
    { value: 'high', label: 'High - Need update soon for planning purposes' },
    { value: 'urgent', label: 'Urgent - Need immediate update for critical decision' }
  ];

  // Load data on component mount
  useEffect(() => {
    fetchUsers();
    loadPreviousChoices();
  }, []);

  // Fetch projects when user is selected
  useEffect(() => {
    if (selectedUserId) {
      fetchUserProjects(selectedUserId);
    } else {
      setProjects([]);
      setFilteredProjects([]);
    }
  }, [selectedUserId]);

  // Filter projects based on search term
  useEffect(() => {
    if (projectSearchTerm.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        project.project_name.toLowerCase().includes(projectSearchTerm.toLowerCase()) ||
        (project.project_description && project.project_description.toLowerCase().includes(projectSearchTerm.toLowerCase()))
      );
      setFilteredProjects(filtered);
    }
  }, [projectSearchTerm, projects]);

  // Initialize filtered projects when projects are loaded
  useEffect(() => {
    setFilteredProjects(projects);
  }, [projects]);

  const fetchUserProjects = async (userId: string) => {
    try {
      // Fetch projects that the user is assigned to or has access to
      const { data, error } = await (supabase as any)
        .from('PMA_Projects')
        .select(`
          id, 
          project_name, 
          project_description,
          PMA_Project_Assignments!inner(user_id)
        `)
        .eq('PMA_Project_Assignments.user_id', userId)
        .order('project_name', { ascending: true });

      if (error) throw error;
      setProjects(data || []);
    } catch (err: any) {
      console.error('Error fetching user projects:', err);
      // Fallback: if the join fails, show all projects (for backwards compatibility)
      try {
        const { data: fallbackData, error: fallbackError } = await (supabase as any)
          .from('PMA_Projects')
          .select('id, project_name, project_description')
          .order('project_name', { ascending: true });
        
        if (!fallbackError) {
          setProjects(fallbackData || []);
        }
      } catch (fallbackErr: any) {
        console.error('Error fetching fallback projects:', fallbackErr);
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('PMA_Users')
        .select('id, email, first_name, last_name')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    }
  };

  const loadPreviousChoices = () => {
    const savedEmail = localStorage.getItem('pma_request_submitter_email');
    const savedName = localStorage.getItem('pma_request_submitter_name');
    
    if (savedEmail) {
      setFormData(prev => ({
        ...prev,
        submitter_email: savedEmail,
        submitter_name: savedName || ''
      }));
    }
  };

  const savePreviousChoices = () => {
    if (formData.submitter_email) {
      localStorage.setItem('pma_request_submitter_email', formData.submitter_email);
    }
    if (formData.submitter_name) {
      localStorage.setItem('pma_request_submitter_name', formData.submitter_name);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-fill name when email is selected and set user ID for project authorization
    if (name === 'submitter_email' && value) {
      const selectedUser = users.find(user => user.email === value);
      if (selectedUser) {
        setFormData(prev => ({
          ...prev,
          submitter_email: value,
          submitter_name: `${selectedUser.first_name} ${selectedUser.last_name}`,
          // Clear project selection when user changes
          selected_project_id: '',
          selected_project_name: ''
        }));
        setSelectedUserId(selectedUser.id);
        setProjectSearchTerm('');
      } else {
        setSelectedUserId('');
        setFormData(prev => ({
          ...prev,
          selected_project_id: '',
          selected_project_name: ''
        }));
        setProjectSearchTerm('');
      }
    }
  };

  const handleProjectSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectSearchTerm(e.target.value);
    setShowProjectDropdown(true);
  };

  const handleProjectSelect = (project: Project) => {
    setFormData(prev => ({
      ...prev,
      selected_project_id: project.id,
      selected_project_name: project.project_name
    }));
    setProjectSearchTerm(project.project_name);
    setShowProjectDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Build enhanced description with update request details
      let enhancedDescription = `**Update Request**\n\n`;
      
      enhancedDescription += `**Project:** ${formData.selected_project_name}\n\n`;
      
      enhancedDescription += `**Update Requested:**\n${formData.description}\n\n`;
      
      if (formData.deadline) {
        const deadlineDate = new Date(formData.deadline);
        const formattedDate = deadlineDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        enhancedDescription += `**Update Needed By:** ${formattedDate}\n\n`;
      }

      // Prepare submission request info for JSONB column
      const submissionRequestInfo = {
        request_form_type: 'need_update',
        selected_project_id: formData.selected_project_id,
        selected_project_name: formData.selected_project_name,
        update_description: formData.description,
        deadline: formData.deadline,
        submitted_at: new Date().toISOString()
      };

      const { error } = await (supabase as any)
        .from('PMA_Requests')
        .insert([{
          title: `${formData.title} - ${formData.selected_project_name}`,
          description: formData.description, // Use the update description
          request_type: 'question',
          priority: formData.priority,
          submitter_name: formData.submitter_name,
          submitter_email: formData.submitter_email,
          submitter_department: null,
          status: 'submitted',
          related_project_id: formData.selected_project_id, // Link to the project
          submission_request_info: submissionRequestInfo,
          image_attachment_url: formData.image_attachment_url || null
        }]);

      if (error) {
        throw error;
      }

      setSubmitStatus('success');
      savePreviousChoices();
      
        // Reset form but keep user info
        setFormData({
          title: 'Need an Update',
          selected_project_id: '',
          selected_project_name: '',
          description: '',
          priority: 'medium',
          deadline: '',
          submitter_name: formData.submitter_name,
          submitter_email: formData.submitter_email,
          image_attachment_url: ''
        });
        setProjectSearchTerm('');
        // Keep the selected user ID to maintain project access
        // setSelectedUserId will remain the same
    } catch (error: any) {
      console.error('Error submitting update request:', error);
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Failed to submit update request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitStatus('idle');
    setErrorMessage('');
    onBack();
  };

  // Get today's date in YYYY-MM-DD format for min date
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Show success step
  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${brandTheme.primary.paleBlue} 0%, ${brandTheme.background.brandLight} 100%)` }}>
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center" style={{ boxShadow: brandTheme.shadow.xl }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: brandTheme.status.successLight }}>
            <CheckCircle className="w-8 h-8" style={{ color: brandTheme.status.success }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: brandTheme.text.primary }}>Update Request Submitted!</h2>
          <p className="mb-6" style={{ color: brandTheme.text.secondary }}>
            Your update request has been successfully submitted to the Product Development team. 
            We'll gather the requested information and get back to you.
          </p>
          <button
            onClick={resetForm}
            className="w-full py-2 px-4 rounded-md transition-colors text-white"
            style={{ backgroundColor: brandTheme.primary.navy }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandTheme.interactive.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = brandTheme.primary.navy}
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: `linear-gradient(135deg, ${brandTheme.primary.paleBlue} 0%, ${brandTheme.background.brandLight} 100%)` }}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: brandTheme.shadow.xl }}>
          <div className="px-6 py-4" style={{ backgroundColor: brandTheme.primary.navy }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onBack}
                    className="text-white hover:text-blue-200 transition-colors"
                    title="Go back to request type selection"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-6 h-6 text-white" />
                    <div>
                      <h1 className="text-2xl font-bold text-white">Need an Update</h1>
                      <p className="mt-1" style={{ color: brandTheme.primary.lightBlue }}>
                        Request status updates on existing projects
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {submitStatus === 'error' && (
              <div className="rounded-md p-4 flex items-start" style={{ backgroundColor: brandTheme.status.errorLight, borderColor: brandTheme.status.error, border: '1px solid' }}>
                <AlertCircle className="w-5 h-5 mr-3 mt-0.5" style={{ color: brandTheme.status.error }} />
                <div>
                  <h3 className="font-medium" style={{ color: brandTheme.status.error }}>Error submitting update request</h3>
                  <p className="text-sm mt-1" style={{ color: brandTheme.status.error }}>{errorMessage}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="submitter_email" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                  Your Email *
                </label>
                <select
                  id="submitter_email"
                  name="submitter_email"
                  required
                  value={formData.submitter_email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: brandTheme.border.light,
                    color: brandTheme.text.primary
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                  onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                >
                  <option value="">Select your email</option>
                  {users.map(user => (
                    <option key={user.id} value={user.email}>
                      {user.first_name} {user.last_name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {formData.submitter_email && (
                <div className="relative">
                  <label htmlFor="project_search" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                    Select Project *
                  </label>
                <div className="relative">
                  <input
                    type="text"
                    id="project_search"
                    name="project_search"
                    required
                    value={projectSearchTerm}
                    onChange={handleProjectSearch}
                    onFocus={() => setShowProjectDropdown(true)}
                    className="w-full px-3 py-2 pl-10 border rounded-md focus:outline-none focus:ring-2"
                    style={{ 
                      borderColor: brandTheme.border.light,
                      color: brandTheme.text.primary
                    }}
                    onFocusCapture={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                    onBlur={(e) => {
                      // Delay hiding dropdown to allow for selection
                      setTimeout(() => {
                        setShowProjectDropdown(false);
                        e.currentTarget.style.borderColor = brandTheme.border.light;
                      }, 150);
                    }}
                    placeholder="Search for a project..."
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: brandTheme.text.muted }} />
                </div>
                
                {showProjectDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto" style={{ borderColor: brandTheme.border.light }}>
                    {filteredProjects.length > 0 ? (
                      filteredProjects.map(project => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => handleProjectSelect(project)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                          style={{ color: brandTheme.text.primary }}
                        >
                          <div className="font-medium">{project.project_name}</div>
                          {project.project_description && (
                            <div className="text-sm" style={{ color: brandTheme.text.secondary }}>
                              {project.project_description.length > 100 
                                ? `${project.project_description.substring(0, 100)}...`
                                : project.project_description
                              }
                            </div>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm" style={{ color: brandTheme.text.muted }}>
                        {projectSearchTerm.trim() === '' ? 'Loading projects...' : 'No projects found matching your search.'}
                      </div>
                    )}
                  </div>
                )}
                </div>
              )}

              {!formData.submitter_email && (
                <div className="p-4 rounded-md" style={{ backgroundColor: brandTheme.background.secondary }}>
                  <p className="text-sm" style={{ color: brandTheme.text.muted }}>
                    Please select your email address first to see the projects you have access to.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                  What update do you need? *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={6}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: brandTheme.border.light,
                    color: brandTheme.text.primary
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                  onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                  placeholder="Please describe what kind of update you're looking for. For example:&#10;&#10;• Current status and progress&#10;• Timeline and next steps&#10;• Budget or resource updates&#10;• Specific deliverables or milestones&#10;• Any blockers or issues&#10;• Expected completion dates"
                />
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                  Priority *
                </label>
                <select
                  id="priority"
                  name="priority"
                  required
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: brandTheme.border.light,
                    color: brandTheme.text.primary
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                  onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="deadline" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                  When do you need this update by?
                </label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  min={getTodayDate()}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: brandTheme.border.light,
                    color: brandTheme.text.primary
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                  onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                />
                <p className="text-xs mt-1" style={{ color: brandTheme.text.muted }}>
                  Optional - Leave blank if there's no specific deadline
                </p>
              </div>

              <div>
                <ImageUpload
                  onImageUploaded={(imageUrl) => setFormData(prev => ({ ...prev, image_attachment_url: imageUrl || '' }))}
                  currentImageUrl={formData.image_attachment_url || undefined}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !formData.selected_project_id}
                className="text-white px-6 py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                style={{ 
                  backgroundColor: (isSubmitting || !formData.selected_project_id) ? brandTheme.interactive.disabled : brandTheme.primary.navy
                }}
                onMouseEnter={(e) => !(isSubmitting || !formData.selected_project_id) && (e.currentTarget.style.backgroundColor = brandTheme.interactive.hover)}
                onMouseLeave={(e) => !(isSubmitting || !formData.selected_project_id) && (e.currentTarget.style.backgroundColor = brandTheme.primary.navy)}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Update Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NeedanUpdate;
