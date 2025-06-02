import React, { useState } from 'react';
import Modal from '../ui/Modal';
import UpdatesList from './UpdatesList';
import UpdateForm from './UpdateForm';
import { Update } from '../../types';
import { Tabs, Tab } from '../ui/Tabs';

interface UpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'project' | 'task' | 'subtask';
  entityId: string;
  entityName: string;
  directUpdates: Update[];
  relatedUpdates?: Update[];
}

const UpdatesModal: React.FC<UpdatesModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName,
  directUpdates,
  relatedUpdates
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'all'>(
    relatedUpdates && relatedUpdates.length > 0 ? 'all' : 'direct'
  );
  
  // Force safe values for updates arrays
  const safeDirectUpdates = directUpdates || [];
  const safeRelatedUpdates = relatedUpdates || [];
  
  const showTabs = safeRelatedUpdates.length > 0;
  
  const handleUpdateComplete = () => {
    // No need to close modal, just refresh data
  };
  
  const modalTitle = `Updates for ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}: ${entityName}`;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <div>
        <div className="mb-6">
          <UpdateForm 
            entityType={entityType} 
            entityId={entityId} 
            onComplete={handleUpdateComplete} 
          />
        </div>
        
        {showTabs && (
          <Tabs 
            value={activeTab} 
            onChange={(value) => setActiveTab(value as 'direct' | 'all')}
            className="mb-4"
          >
            <Tab value="all" label="All Updates" />
            <Tab value="direct" label="Direct Updates" />
          </Tabs>
        )}
        
        <div className="border rounded-md overflow-hidden bg-white">
          {activeTab === 'direct' ? (
            <UpdatesList 
              updates={safeDirectUpdates} 
              emptyMessage={`No updates for this ${entityType} yet`}
            />
          ) : (
            <UpdatesList 
              updates={safeRelatedUpdates} 
              showEntity={true}
              emptyMessage={`No updates for this ${entityType} or related items yet`}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UpdatesModal;