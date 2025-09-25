import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, AlertCircle, ArrowLeft, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { brandTheme } from '../../../styles/brandTheme';
import ImageUpload from '../../../components/ui/ImageUpload';

interface CreditReportFormData {
  title: string;
  company_name_searched: string;
  issue_location: string;
  issue_sublocation: string;
  priority: string;
  description: string;
  submitter_name: string;
  submitter_email: string;
  image_attachment_url: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface CreditReportIssueProps {
  onBack: () => void;
}

const CreditReportIssue: React.FC<CreditReportIssueProps> = ({ onBack }) => {
  const [formData, setFormData] = useState<CreditReportFormData>({
    title: 'Credit Report Issue',
    company_name_searched: '',
    issue_location: '',
    issue_sublocation: '',
    priority: 'high',
    description: '',
    submitter_name: '',
    submitter_email: '',
    image_attachment_url: ''
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const priorities = [
    { value: 'low', label: 'Low - Minor issue with minimal impact' },
    { value: 'medium', label: 'Medium - Issue affects some functionality' },
    { value: 'high', label: 'High - Issue significantly impacts users' },
    { value: 'urgent', label: 'Urgent - Critical issue requiring immediate attention' }
  ];

  const issueLocations = [
    { value: 'search_function', label: 'Search Function' },
    { value: 'in_credit_report', label: 'In Credit Report' }
  ];

  const searchFunctionOptions = [
    { value: 'matched_records', label: 'Matched Records Results' },
    { value: 'unmatched_records', label: 'Unmatched Records Results' }
  ];

  const creditReportOptions = [
    { value: 'collections', label: 'Collections' },
    { value: 'ar_records', label: 'AR Records' }
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

    // Reset sublocation when main location changes
    if (name === 'issue_location') {
      setFormData(prev => ({
        ...prev,
        issue_location: value,
        issue_sublocation: ''
      }));
    }

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
      // Build enhanced description with credit report specific information
      let enhancedDescription = `**Credit Report Issue**\n\n`;
      
      // Add company information
      if (formData.company_name_searched) {
        enhancedDescription += `**Company Name Searched:** ${formData.company_name_searched}\n\n`;
      }
      
      // Add issue location details
      if (formData.issue_location) {
        const locationLabel = issueLocations.find(loc => loc.value === formData.issue_location)?.label;
        enhancedDescription += `**Issue Location:** ${locationLabel}\n`;
        
        if (formData.issue_sublocation) {
          let sublocationLabel = '';
          if (formData.issue_location === 'search_function') {
            sublocationLabel = searchFunctionOptions.find(opt => opt.value === formData.issue_sublocation)?.label || '';
          } else if (formData.issue_location === 'in_credit_report') {
            sublocationLabel = creditReportOptions.find(opt => opt.value === formData.issue_sublocation)?.label || '';
          }
          enhancedDescription += `**Specific Area:** ${sublocationLabel}\n`;
        }
        enhancedDescription += '\n';
      }
      
      // Add main description
      enhancedDescription += `**Issue Description:**\n${formData.description}\n\n`;

      // Prepare submission request info for JSONB column
      const submissionRequestInfo = {
        request_form_type: 'credit_report_issue',
        company_name_searched: formData.company_name_searched,
        issue_location: formData.issue_location,
        issue_sublocation: formData.issue_sublocation,
        submitted_at: new Date().toISOString()
      };

      const { error } = await (supabase as any)
        .from('PMA_Requests')
        .insert([{
          title: formData.title,
          description: formData.description, // Use original description, not enhanced
          request_type: 'task',
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
        title: 'Credit Report Issue',
        company_name_searched: '',
        issue_location: '',
        issue_sublocation: '',
        priority: 'high',
        description: '',
        submitter_name: formData.submitter_name,
        submitter_email: formData.submitter_email,
        image_attachment_url: ''
      });
    } catch (error: any) {
      console.error('Error submitting credit report issue:', error);
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Failed to submit credit report issue. Please try again.');
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
          <h2 className="text-2xl font-bold mb-2" style={{ color: brandTheme.text.primary }}>Credit Report Issue Submitted!</h2>
          <p className="mb-6" style={{ color: brandTheme.text.secondary }}>
            Your credit report issue has been successfully submitted to the Product Development team. 
            We'll investigate and keep you updated on the progress.
          </p>
          <button
            onClick={resetForm}
            className="w-full py-2 px-4 rounded-md transition-colors text-white"
            style={{ backgroundColor: brandTheme.primary.navy }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = brandTheme.interactive.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = brandTheme.primary.navy}
          >
            Submit Another Issue
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
                    <AlertTriangle className="w-6 h-6 text-white" />
                    <div>
                      <h1 className="text-2xl font-bold text-white">Credit Report Issue</h1>
                      <p className="mt-1" style={{ color: brandTheme.primary.lightBlue }}>
                        Report issues with credit reports or credit-related data
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
                  <h3 className="font-medium" style={{ color: brandTheme.status.error }}>Error submitting credit report issue</h3>
                  <p className="text-sm mt-1" style={{ color: brandTheme.status.error }}>{errorMessage}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="company_name_searched" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                  Company Name Searched *
                </label>
                <input
                  type="text"
                  id="company_name_searched"
                  name="company_name_searched"
                  required
                  value={formData.company_name_searched}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: brandTheme.border.light,
                    color: brandTheme.text.primary
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                  onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                  placeholder="Enter the company name that was searched"
                />
              </div>

              <div>
                <label htmlFor="issue_location" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                  Where is the issue? *
                </label>
                <select
                  id="issue_location"
                  name="issue_location"
                  required
                  value={formData.issue_location}
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
                  {issueLocations.map(location => (
                    <option key={location.value} value={location.value}>
                      {location.label}
                    </option>
                  ))}
                </select>
              </div>

              {formData.issue_location && (
                <div>
                  <label htmlFor="issue_sublocation" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                    Specific Area *
                  </label>
                  <select
                    id="issue_sublocation"
                    name="issue_sublocation"
                    required
                    value={formData.issue_sublocation}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2"
                    style={{ 
                      borderColor: brandTheme.border.light,
                      color: brandTheme.text.primary
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = brandTheme.primary.navy}
                    onBlur={(e) => e.currentTarget.style.borderColor = brandTheme.border.light}
                  >
                    <option value="">Select specific area...</option>
                    {formData.issue_location === 'search_function' && 
                      searchFunctionOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))
                    }
                    {formData.issue_location === 'in_credit_report' && 
                      creditReportOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}

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
                <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: brandTheme.text.fieldLabel }}>
                  Describe the issue *
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
                  placeholder="Please provide detailed information about the credit report issue, including what you expected to see vs what actually appeared, any error messages, and steps you took..."
                />
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
                    Submit Credit Report Issue
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

export default CreditReportIssue;
