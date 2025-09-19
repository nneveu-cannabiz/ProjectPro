import React from 'react';
import { Bug, AlertTriangle, Database, HelpCircle, BarChart3, RefreshCw, Workflow, CheckSquare, MessageSquare } from 'lucide-react';
import { brandTheme } from '../../../styles/brandTheme';

interface RequestTypeOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: 'bug' | 'data' | 'question' | 'task' | 'project';
}

interface RequestTypeOptionsProps {
  onSelectType: (option: RequestTypeOption) => void;
}

const RequestTypeOptions: React.FC<RequestTypeOptionsProps> = ({ onSelectType }) => {
  const requestOptions: RequestTypeOption[] = [
    {
      id: 'bug_report',
      label: 'Submit a Bug',
      description: 'Report technical issues, errors, or broken functionality',
      icon: <Bug className="w-6 h-6" />,
      category: 'bug'
    },
    {
      id: 'credit_report_issue',
      label: 'Credit Report Issue',
      description: 'Issues with credit reports or credit-related data',
      icon: <AlertTriangle className="w-6 h-6" />,
      category: 'data'
    },
    {
      id: 'data_issue',
      label: 'Data Issue',
      description: 'Problems with data accuracy, missing data, or data inconsistencies',
      icon: <Database className="w-6 h-6" />,
      category: 'data'
    },
    {
      id: 'general_question',
      label: 'General Question',
      description: 'Ask questions about processes, features, or how things work',
      icon: <HelpCircle className="w-6 h-6" />,
      category: 'question'
    },
    {
      id: 'data_stats_request',
      label: 'Request for Data Stats',
      description: 'Request specific data reports, analytics, or statistics',
      icon: <BarChart3 className="w-6 h-6" />,
      category: 'task'
    },
    {
      id: 'need_update',
      label: 'Need an Update',
      description: 'Request status updates on existing requests or projects',
      icon: <RefreshCw className="w-6 h-6" />,
      category: 'question'
    },
    {
      id: 'workflow_issue',
      label: 'Workflow Issue',
      description: 'Problems with business processes or workflow inefficiencies',
      icon: <Workflow className="w-6 h-6" />,
      category: 'task'
    },
    {
      id: 'general_task',
      label: 'General Task',
      description: 'Request for general tasks, improvements, or feature requests',
      icon: <CheckSquare className="w-6 h-6" />,
      category: 'task'
    },
    {
      id: 'project_discuss',
      label: 'Project to Discuss',
      description: 'Propose new projects or discuss project ideas',
      icon: <MessageSquare className="w-6 h-6" />,
      category: 'project'
    }
  ];


  return (
    <div className="min-h-screen py-8 px-4" style={{ background: `linear-gradient(135deg, ${brandTheme.primary.paleBlue} 0%, ${brandTheme.background.brandLight} 100%)` }}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg overflow-hidden" style={{ boxShadow: brandTheme.shadow.xl }}>
          <div className="px-6 py-4" style={{ backgroundColor: brandTheme.primary.navy }}>
            <h1 className="text-2xl font-bold text-white">Submit Request to Product Development</h1>
            <p className="mt-1" style={{ color: brandTheme.primary.lightBlue }}>
              Select the type of request you'd like to submit
            </p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {requestOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => onSelectType(option)}
                  className="p-4 border-2 rounded-lg text-left transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2"
                  style={{ 
                    borderColor: brandTheme.border.light,
                    backgroundColor: 'white'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = brandTheme.primary.navy;
                    e.currentTarget.style.backgroundColor = brandTheme.background.secondary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = brandTheme.border.light;
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = brandTheme.primary.navy;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${brandTheme.primary.paleBlue}`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = brandTheme.border.light;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div 
                      className="flex-shrink-0 p-2 rounded-lg"
                      style={{ 
                        backgroundColor: brandTheme.primary.paleBlue,
                        color: brandTheme.primary.navy
                      }}
                    >
                      {option.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1" style={{ color: brandTheme.text.primary }}>
                        {option.label}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: brandTheme.text.secondary }}>
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: brandTheme.background.secondary }}>
              <h3 className="font-medium mb-2" style={{ color: brandTheme.text.primary }}>
                Not sure which option to choose?
              </h3>
              <p className="text-sm" style={{ color: brandTheme.text.secondary }}>
                Don't worry! You can always provide more details in the next step. Choose the option that seems closest to your needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestTypeOptions;
