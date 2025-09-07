import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/Card';
import Button from '../../../../../../components/ui/Button';
import UpdatesList from '../../../../../../components/Update/UpdatesList';
import UpdateForm from '../../../../../../components/Update/UpdateForm';
import { brandTheme } from '../../../../../../styles/brandTheme';

interface ProjectUpdatesProps {
  projectId: string;
  directUpdates: any[];
  onOpenUpdatesModal: () => void;
}

const ProjectUpdates: React.FC<ProjectUpdatesProps> = ({
  projectId,
  directUpdates,
  onOpenUpdatesModal
}) => {
  return (
    <Card className="mt-6">
      <div
        className="flex items-center px-6 py-3 rounded-t-lg"
        style={{ backgroundColor: brandTheme.primary.navy }}
      >
        <MessageSquare size={18} className="mr-2" style={{ color: brandTheme.background.primary }} />
        <h3
          className="text-lg font-semibold"
          style={{ color: brandTheme.background.primary }}
        >
          Project Updates
        </h3>
      </div>
      <CardContent>
        {directUpdates.length > 0 ? (
          <div className="mb-6">
            <UpdatesList updates={directUpdates.slice(0, 5)} />
            {directUpdates.length > 5 && (
              <div className="mt-3 text-center">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onOpenUpdatesModal}
                  style={{
                    backgroundColor: brandTheme.primary.lightBlue,
                    color: brandTheme.primary.navy,
                    borderColor: brandTheme.primary.navy
                  }}
                >
                  View All Updates ({directUpdates.length})
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p 
            className="text-center py-4 mb-6"
            style={{ color: brandTheme.text.muted }}
          >
            No updates yet
          </p>
        )}
        
        <div 
          className="border-t pt-4"
          style={{ borderColor: brandTheme.border.light }}
        >
          <div
            className="px-3 py-2 mb-3 rounded-md"
            style={{ backgroundColor: brandTheme.primary.navy }}
          >
            <h4
              className="text-sm font-medium"
              style={{ color: brandTheme.background.primary }}
            >
              Add Update to Project
            </h4>
          </div>
          <div className="px-3">
            <UpdateForm entityType="project" entityId={projectId} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectUpdates;
