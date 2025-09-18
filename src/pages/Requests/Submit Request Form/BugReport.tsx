import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, AlertCircle, ArrowLeft, Bug } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { brandTheme } from '../../../styles/brandTheme';
import ImageUpload from '../../../components/ui/ImageUpload';

interface BugReportFormData {
  title: string;
  description: string;
  bug_location: string;
  bug_location_other: string;
  steps_to_reproduce: string;
  expected_behavior: string;
  actual_behavior: string;
  priority: string;
  submitter_name: string;
  submitter_email: string;
  // Priority assessment fields
  is_public_facing: string;
  is_member_specific: string;
  affected_members: string;
  is_ar_customer_data: string;
  // Image attachment
  image_attachment_url: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface BugReportProps {
  onBack: () => void;
}

const BugReport: React.FC<BugReportProps> = ({ onBack }) => {
  const [formData, setFormData] = useState<BugReportFormData>({
    title: '',
    description: '',
    bug_location: '',
    bug_location_other: '',
    steps_to_reproduce: '',
    expected_behavior: '',
    actual_behavior: '',
    priority: 'medium',
    submitter_name: '',
    submitter_email: '',
    // Priority assessment fields
    is_public_facing: '',
    is_member_specific: '',
    affected_members: '',
    is_ar_customer_data: '',
    // Image attachment
    image_attachment_url: ''
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const priorities = [
    { value: 'low', label: 'Low - Cosmetic issue that doesn\'t affect functionality' },
    { value: 'medium', label: 'Medium - Issue affects functionality but has workaround' },
    { value: 'high', label: 'High - Issue significantly impacts user experience' },
    { value: 'urgent', label: 'Urgent - Critical issue that blocks key functionality' }
  ];

  const bugLocations = [
    { value: 'Zoho', label: 'Zoho CRM' },
    { value: 'Our Website', label: 'Company Website (Cannabizcredit.com)' },
    { value: 'CCA Data Portal', label: 'CCA Data Portal' },
    { value: 'PMA System', label: 'Project Management System' },
    { value: 'other', label: 'Other (please specify)' }
  ];

  // Load users and previous choices on component mount
  useEffect(() => {
    fetchUsers();
    loadPreviousChoices();
  }, []);

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

    // Auto-fill name when email is selected
    if (name === 'submitter_email' && value) {
      const selectedUser = users.find(user => user.email === value);
      if (selectedUser) {
        setFormData(prev => ({
          ...prev,
          submitter_email: value,
          submitter_name: `${selectedUser.first_name} ${selectedUser.last_name}`
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Build enhanced description with bug-specific information
      let enhancedDescription = `**Bug Description:**\n${formData.description}\n\n`;
      
      // Add bug location
      enhancedDescription += `**Location:**\n`;
      if (formData.bug_location === 'other' && formData.bug_location_other) {
        enhancedDescription += `${formData.bug_location_other}\n\n`;
      } else if (formData.bug_location) {
        enhancedDescription += `${formData.bug_location}\n\n`;
      }
      
      // Add steps to reproduce
      if (formData.steps_to_reproduce) {
        enhancedDescription += `**Steps to Reproduce:**\n${formData.steps_to_reproduce}\n\n`;
      }
      
      // Add expected vs actual behavior
      if (formData.expected_behavior) {
        enhancedDescription += `**Expected Behavior:**\n${formData.expected_behavior}\n\n`;
      }
      
      if (formData.actual_behavior) {
        enhancedDescription += `**Actual Behavior:**\n${formData.actual_behavior}\n\n`;
      }
      
      // Add priority assessment if high/urgent
      if (formData.priority === 'high' || formData.priority === 'urgent') {
        enhancedDescription += `**Priority Assessment:**\n`;
        enhancedDescription += `- Public facing issue: ${formData.is_public_facing}\n`;
        enhancedDescription += `- Member specific issue: ${formData.is_member_specific}\n`;
        if (formData.is_member_specific === 'yes' && formData.affected_members) {
          enhancedDescription += `- Affected member(s): ${formData.affected_members}\n`;
        }
        enhancedDescription += `- Related to AR or Customer Data: ${formData.is_ar_customer_data}\n`;
      }

      // Prepare submission request info for JSONB column
      const submissionRequestInfo = {
        request_form_type: 'bug_report',
        bug_location: formData.bug_location,
        bug_location_other: formData.bug_location_other,
        steps_to_reproduce: formData.steps_to_reproduce,
        expected_behavior: formData.expected_behavior,
        actual_behavior: formData.actual_behavior,
        // Priority assessment fields
        is_public_facing: formData.is_public_facing,
        is_member_specific: formData.is_member_specific,
        affected_members: formData.affected_members,
        is_ar_customer_data: formData.is_ar_customer_data,
        submitted_at: new Date().toISOString()
      };

      const { error } = await (supabase as any)
        .from('PMA_Requests')
        .insert([{
          title: formData.title,
          description: formData.description, // Use original description, not enhanced
          request_type: 'bug',
          priority: formData.priority,
          submitter_name: formData.submitter_name,
          submitter_email: formData.submitter_email,
          submitter_department: null,
          status: 'submitted',
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
        title: '',
        description: '',
        bug_location: '',
        bug_location_other: '',
        steps_to_reproduce: '',
        expected_behavior: '',
        actual_behavior: '',
        priority: 'medium',
        submitter_name: formData.submitter_name,
        submitter_email: formData.submitter_email,
        // Reset priority questions
        is_public_facing: '',
        is_member_specific: '',
        affected_members: '',
        is_ar_customer_data: '',
        // Reset image attachment
        image_attachment_url: ''
      });
    } catch (error: any) {
      console.error('Error submitting bug report:', error);
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Failed to submit bug report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitStatus('idle');
    setErrorMessage('');
    onBack();
  };

  // Show success step
  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${brandTheme.primary.paleBlue} 0%, ${brandTheme.background.brandLight} 100%)` }}>
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center" style={{ boxShadow: brandTheme.shadow.xl }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: brandTheme.status.successLight }}>
            <CheckCircle className="w-8 h-8" style={{ color: brandTheme.status.success }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: brandTheme.text.primary }}>Bug Report Submitted!</h2>
          <p className="mb-6" style={{ color: brandTheme.text.secondary }}>
            Your bug report has been successfully submitted to the Product Development team. 
            We'll investigate and keep you updated on the progress.
          </p>
          <button
            onClick={resetForm}
            className="w-full py-2 px-4 rounded-md transition-colors text-white"
            style={{ backgroundColor: brandTheme.primary.navy }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandTheme.interactive.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = brandTheme.primary.navy}
          >
            Submit Another Report
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
                    <Bug className="w-6 h-6 text-white" />
                    <div>
                      <h1 className="text-2xl font-bold text-white">Submit Bug Report</h1>
                      <p className="mt-1" style={{ color: brandTheme.primary.lightBlue }}>
                        Report technical issues, errors, or broken functionality
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
                  <h3 className="font-medium" style={{ color: brandTheme.status.error }}>Error submitting bug report</h3>
                  <p className="text-sm mt-1" style={{ color: brandTheme.status.error }}>{errorMessage}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                  Bug Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: brandTheme.border.light,
                    color: brandTheme.text.primary
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                  onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                  placeholder="Brief summary of the bug (e.g., 'Login button not responding')"
                />
              </div>

              <div>
                <label htmlFor="bug_location" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                  Where did you encounter this bug? *
                </label>
                <select
                  id="bug_location"
                  name="bug_location"
                  required
                  value={formData.bug_location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: brandTheme.border.light,
                    color: brandTheme.text.primary
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                  onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                >
                  <option value="">Select location...</option>
                  {bugLocations.map(location => (
                    <option key={location.value} value={location.value}>
                      {location.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.bug_location === 'other' && (
                <div>
                  <label htmlFor="bug_location_other" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                    Please specify the location *
                  </label>
                  <input
                    type="text"
                    id="bug_location_other"
                    name="bug_location_other"
                    required
                    value={formData.bug_location_other}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                    style={{ 
                      borderColor: brandTheme.border.light,
                      color: brandTheme.text.primary
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                    onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                    placeholder="Enter the specific location or system"
                  />
                </div>
              )}

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                  Bug Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: brandTheme.border.light,
                    color: brandTheme.text.primary
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                  onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                  placeholder="Describe what went wrong, what you were trying to do, and any error messages you saw..."
                />
              </div>

              <div>
                <label htmlFor="steps_to_reproduce" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                  Steps to Reproduce
                </label>
                <textarea
                  id="steps_to_reproduce"
                  name="steps_to_reproduce"
                  rows={4}
                  value={formData.steps_to_reproduce}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: brandTheme.border.light,
                    color: brandTheme.text.primary
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                  onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                  placeholder="1. Go to...&#10;2. Click on...&#10;3. Enter...&#10;4. See error"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expected_behavior" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                    Expected Behavior
                  </label>
                  <textarea
                    id="expected_behavior"
                    name="expected_behavior"
                    rows={3}
                    value={formData.expected_behavior}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                    style={{ 
                      borderColor: brandTheme.border.light,
                      color: brandTheme.text.primary
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                    onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                    placeholder="What should have happened?"
                  />
                </div>

                <div>
                  <label htmlFor="actual_behavior" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                    Actual Behavior
                  </label>
                  <textarea
                    id="actual_behavior"
                    name="actual_behavior"
                    rows={3}
                    value={formData.actual_behavior}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                    style={{ 
                      borderColor: brandTheme.border.light,
                      color: brandTheme.text.primary
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                    onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                    placeholder="What actually happened instead?"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                  Bug Severity *
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

              {/* Priority-specific questions for High/Urgent */}
              {(formData.priority === 'high' || formData.priority === 'urgent') && (
                <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                  <h3 className="text-sm font-medium mb-3" style={{ color: brandTheme.status.warning }}>
                    Additional Information Required for {formData.priority === 'urgent' ? 'Urgent' : 'High'} Severity
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                        Is this a public facing issue? *
                      </label>
                      <select
                        name="is_public_facing"
                        required
                        value={formData.is_public_facing}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                        style={{ 
                          borderColor: brandTheme.border.light,
                          color: brandTheme.text.primary
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                        onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                      >
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                        Is this a member specific issue? *
                      </label>
                      <select
                        name="is_member_specific"
                        required
                        value={formData.is_member_specific}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                        style={{ 
                          borderColor: brandTheme.border.light,
                          color: brandTheme.text.primary
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                        onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                      >
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                    {formData.is_member_specific === 'yes' && (
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                          Which member(s)? *
                        </label>
                        <input
                          type="text"
                          name="affected_members"
                          required
                          value={formData.affected_members}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                          style={{ 
                            borderColor: brandTheme.border.light,
                            color: brandTheme.text.primary
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                          onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                          placeholder="Enter member name(s) or ID(s)"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                        Is it related to AR or Customer Data? *
                      </label>
                      <select
                        name="is_ar_customer_data"
                        required
                        value={formData.is_ar_customer_data}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                        style={{ 
                          borderColor: brandTheme.border.light,
                          color: brandTheme.text.primary
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                        onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                      >
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

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
                disabled={isSubmitting}
                className="text-white px-6 py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                style={{ 
                  backgroundColor: isSubmitting ? brandTheme.interactive.disabled : brandTheme.status.error
                }}
                onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#dc2626')}
                onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = brandTheme.status.error)}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Bug Report
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

export default BugReport;
