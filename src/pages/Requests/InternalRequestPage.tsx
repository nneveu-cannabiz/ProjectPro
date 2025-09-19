import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import RequestsList from './RequestsList';

const InternalRequestPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Link 
          to="/submit-request" 
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Submit a Request
        </Link>
        <p className="text-sm text-gray-600 mt-1">
          Share this link with team members to submit requests to the Product Development team
        </p>
      </div>
      <RequestsList />
    </div>
  );
};

export default InternalRequestPage;
