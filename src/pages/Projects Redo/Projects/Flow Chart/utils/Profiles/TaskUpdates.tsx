import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/Card';
import Button from '../../../../../../components/ui/Button';
import UpdatesList from '../../../../../../components/Update/UpdatesList';
import UpdateForm from '../../../../../../components/Update/UpdateForm';
import { brandTheme } from '../../../../../../styles/brandTheme';

interface TaskUpdatesProps {
  taskId: string;
  directUpdates: any[];
  onOpenUpdatesModal: () => void;
}

const TaskUpdates: React.FC<TaskUpdatesProps> = ({
  taskId,
  directUpdates,
  onOpenUpdatesModal
}) => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare size={18} className="mr-2" />
          Task Updates
        </CardTitle>
      </CardHeader>
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
          <h4 
            className="text-sm font-medium mb-2"
            style={{ color: brandTheme.text.primary }}
          >
            Add Update to Task
          </h4>
          <UpdateForm entityType="task" entityId={taskId} />
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskUpdates;
