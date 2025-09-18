import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { brandTheme } from '../../../styles/brandTheme';
import RequestTypeOptions from './RequestTypeOptions';
import BugReport from './BugReport';
import CreditReportIssue from './CreditReportIssue';
import DataIssue from './DataIssue';
import GeneralQuestion from './GeneralQuestion';
import RequestforDataStats from './RequestforDataStats';
import NeedanUpdate from './NeedanUpdate';
import WorkflowIssue from './WorkflowIssue';
import ImageUpload from '../../../components/ui/ImageUpload';

interface RequestFormData {
  title: string;
  description: string;
  request_type: string;
  priority: string;
  submitter_name: string;
  submitter_email: string;
  submitter_department: string;
  // High/Urgent priority additional fields
  is_public_facing: string;
  is_member_specific: string;
  affected_members: string;
  is_ar_customer_data: string;
  // Bug report specific fields
  bug_location: string;
  bug_location_other: string;
  // Image attachment
  image_attachment_url: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface RequestTypeOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'bug' | 'data' | 'question' | 'task' | 'project';
}

const SubmitRequestPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<'select_type' | 'form' | 'success'>('select_type');
  const [selectedRequestType, setSelectedRequestType] = useState<RequestTypeOption | null>(null);
  
  const [formData, setFormData] = useState<RequestFormData>({
    title: '',
    description: '',
    request_type: 'task',
    priority: 'medium',
    submitter_name: '',
    submitter_email: '',
    submitter_department: '',
    // High/Urgent priority additional fields
    is_public_facing: '',
    is_member_specific: '',
    affected_members: '',
    is_ar_customer_data: '',
    // Bug report specific fields
    bug_location: '',
    bug_location_other: '',
    // Image attachment
    image_attachment_url: ''
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const requestTypes = [
    { value: 'bug', label: 'Bug Report' },
    { value: 'task', label: 'Task Request' },
    { value: 'project', label: 'New Project' },
    { value: 'question', label: 'Question' },
    { value: 'support', label: 'Technical Support' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'other', label: 'Other' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  // Load users and previous email choice on component mount
  useEffect(() => {
    fetchUsers();
    loadPreviousEmailChoice();
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

  const loadPreviousEmailChoice = () => {
    const savedEmail = localStorage.getItem('pma_request_submitter_email');
    const savedName = localStorage.getItem('pma_request_submitter_name');
    const savedDepartment = localStorage.getItem('pma_request_submitter_department');
    
    if (savedEmail) {
      setFormData(prev => ({
        ...prev,
        submitter_email: savedEmail,
        submitter_name: savedName || '',
        submitter_department: savedDepartment || ''
      }));
    }
  };

  const handleRequestTypeSelect = (option: RequestTypeOption) => {
    setSelectedRequestType(option);
    setFormData(prev => ({
      ...prev,
      request_type: option.category,
      title: option.label === 'Submit a Bug' ? '' : option.label // Pre-fill title except for bugs
    }));
    setCurrentStep('form');
  };

  const savePreviousChoices = () => {
    if (formData.submitter_email) {
      localStorage.setItem('pma_request_submitter_email', formData.submitter_email);
    }
    if (formData.submitter_name) {
      localStorage.setItem('pma_request_submitter_name', formData.submitter_name);
    }
    if (formData.submitter_department) {
      localStorage.setItem('pma_request_submitter_department', formData.submitter_department);
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
      // Build enhanced description with additional information
      let enhancedDescription = formData.description;
      
      // Add bug location information if bug report
      if (formData.request_type === 'bug') {
        enhancedDescription += '\n\n--- Bug Location ---';
        if (formData.bug_location === 'other' && formData.bug_location_other) {
          enhancedDescription += `\nLocation: ${formData.bug_location_other}`;
        } else if (formData.bug_location) {
          enhancedDescription += `\nLocation: ${formData.bug_location}`;
        }
      }
      
      // Add priority assessment if high/urgent
      if (formData.priority === 'high' || formData.priority === 'urgent') {
        enhancedDescription += '\n\n--- Priority Assessment ---';
        enhancedDescription += `\nIs this a public facing issue? ${formData.is_public_facing}`;
        enhancedDescription += `\nIs this a member specific issue? ${formData.is_member_specific}`;
        if (formData.is_member_specific === 'yes' && formData.affected_members) {
          enhancedDescription += `\nAffected member(s): ${formData.affected_members}`;
        }
        enhancedDescription += `\nIs it related to AR or Customer Data? ${formData.is_ar_customer_data}`;
      }

      const { error } = await (supabase as any)
        .from('PMA_Requests')
        .insert([{
          title: formData.title,
          description: enhancedDescription,
          request_type: formData.request_type,
          priority: formData.priority,
          submitter_name: formData.submitter_name,
          submitter_email: formData.submitter_email,
          submitter_department: formData.submitter_department || null,
          status: 'submitted',
          image_attachment_url: formData.image_attachment_url || null
        }]);

      if (error) {
        throw error;
      }

      setCurrentStep('success');
      // Save user choices to localStorage for next time
      savePreviousChoices();
      
      // Reset form but keep user info
      setFormData({
        title: '',
        description: '',
        request_type: 'task',
        priority: 'medium',
        submitter_name: formData.submitter_name, // Keep name
        submitter_email: formData.submitter_email, // Keep email
        submitter_department: formData.submitter_department, // Keep department
        // Reset priority questions
        is_public_facing: '',
        is_member_specific: '',
        affected_members: '',
        is_ar_customer_data: '',
        // Reset bug report fields
        bug_location: '',
        bug_location_other: '',
        // Reset image attachment
        image_attachment_url: ''
      });
    } catch (error: any) {
      console.error('Error submitting request:', error);
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('select_type');
    setSelectedRequestType(null);
    setSubmitStatus('idle');
    setErrorMessage('');
  };

  const goBackToTypeSelection = () => {
    setCurrentStep('select_type');
    setSelectedRequestType(null);
    setSubmitStatus('idle');
    setErrorMessage('');
  };

  // Show request type selection step
  if (currentStep === 'select_type') {
    return <RequestTypeOptions onSelectType={handleRequestTypeSelect} />;
  }

  // Show bug report form for bug submissions
  if (currentStep === 'form' && selectedRequestType?.id === 'bug_report') {
    return <BugReport onBack={goBackToTypeSelection} />;
  }

  // Show credit report issue form for credit report issues
  if (currentStep === 'form' && selectedRequestType?.id === 'credit_report_issue') {
    return <CreditReportIssue onBack={goBackToTypeSelection} />;
  }

  // Show data issue form for data issues
  if (currentStep === 'form' && selectedRequestType?.id === 'data_issue') {
    return <DataIssue onBack={goBackToTypeSelection} />;
  }

  // Show general question form for general questions
  if (currentStep === 'form' && selectedRequestType?.id === 'general_question') {
    return <GeneralQuestion onBack={goBackToTypeSelection} />;
  }

  // Show data stats request form for data stats requests
  if (currentStep === 'form' && selectedRequestType?.id === 'data_stats_request') {
    return <RequestforDataStats onBack={goBackToTypeSelection} />;
  }

  // Show need update form for update requests
  if (currentStep === 'form' && selectedRequestType?.id === 'need_update') {
    return <NeedanUpdate onBack={goBackToTypeSelection} />;
  }

  // Show workflow issue form for workflow issues
  if (currentStep === 'form' && selectedRequestType?.id === 'workflow_issue') {
    return <WorkflowIssue onBack={goBackToTypeSelection} />;
  }

  // Show success step
  if (currentStep === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${brandTheme.primary.paleBlue} 0%, ${brandTheme.background.brandLight} 100%)` }}>
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center" style={{ boxShadow: brandTheme.shadow.xl }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: brandTheme.status.successLight }}>
            <CheckCircle className="w-8 h-8" style={{ color: brandTheme.status.success }} />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: brandTheme.text.primary }}>Request Submitted!</h2>
          <p className="mb-6" style={{ color: brandTheme.text.secondary }}>
            Your request has been successfully submitted to the Product Development team. 
            You'll receive updates at the email address you provided.
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
                    onClick={goBackToTypeSelection}
                    className="text-white hover:text-blue-200 transition-colors"
                    title="Go back to request type selection"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {selectedRequestType?.label || 'Submit Request'}
                    </h1>
                    <p className="mt-1" style={{ color: brandTheme.primary.lightBlue }}>
                      {selectedRequestType?.description || 'Submit your request to our team'}
                    </p>
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
                  <h3 className="font-medium" style={{ color: brandTheme.status.error }}>Error submitting request</h3>
                  <p className="text-sm mt-1" style={{ color: brandTheme.status.error }}>{errorMessage}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="title" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                  Request Title *
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
                  placeholder="Brief summary of your request"
                />
              </div>

              <div>
                <label htmlFor="request_type" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                  Request Type *
                </label>
                <select
                  id="request_type"
                  name="request_type"
                  required
                  value={formData.request_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: brandTheme.border.light,
                    color: brandTheme.text.primary
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                  onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                >
                  {requestTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
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

              <div>
                <label htmlFor="submitter_department" className="block text-sm font-medium mb-1" style={{ color: brandTheme.text.fieldLabel }}>
                  Department
                </label>
                <p className="text-xs mb-2" style={{ color: brandTheme.text.muted }}>
                  Department that needs support
                </p>
                <select
                  id="submitter_department"
                  name="submitter_department"
                  value={formData.submitter_department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: brandTheme.border.light,
                    color: brandTheme.text.primary
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                  onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                >
                  <option value="">Select department (optional)</option>
                  <option value="Community Management">Community Management</option>
                  <option value="Sales">Sales</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Bug report specific questions */}
              {(formData.request_type === 'bug' || selectedRequestType?.id === 'bug_report') && (
                <div className="md:col-span-2">
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <h3 className="text-sm font-medium mb-3" style={{ color: brandTheme.status.error }}>
                      Bug Report Details
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                          Where did you encounter this bug? *
                        </label>
                        <select
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
                          <option value="Zoho">Zoho</option>
                          <option value="Our Website">Our Website</option>
                          <option value="CCA Data Portal">CCA Data Portal</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {formData.bug_location === 'other' && (
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                            Please specify the location *
                          </label>
                          <input
                            type="text"
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
                    </div>
                  </div>
                </div>
              )}

              {/* Priority-specific questions for High/Urgent or data-related issues */}
              {(formData.priority === 'high' || formData.priority === 'urgent' || selectedRequestType?.id === 'credit_report_issue' || selectedRequestType?.category === 'data') && (
                <>
                  <div className="md:col-span-2">
                    <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-4">
                      <h3 className="text-sm font-medium mb-3" style={{ color: brandTheme.status.warning }}>
                        {selectedRequestType?.category === 'data' 
                          ? 'Data Issue Assessment' 
                          : `Additional Information Required for ${formData.priority === 'urgent' ? 'Urgent' : 'High'} Priority`}
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
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                  Detailed Description *
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
                  placeholder="Please provide detailed information about your request, including steps to reproduce (for bugs), acceptance criteria (for tasks), or specific questions you have..."
                />
              </div>

              <div className="md:col-span-2">
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
                  backgroundColor: isSubmitting ? brandTheme.interactive.disabled : brandTheme.primary.navy
                }}
                onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = brandTheme.interactive.hover)}
                onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = brandTheme.primary.navy)}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Request
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

export default SubmitRequestPage;
