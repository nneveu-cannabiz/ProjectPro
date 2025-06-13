import React, { useState } from 'react';
import { Table as Tabs, Settings as SettingsIcon, Tag, Users, Shield } from 'lucide-react';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import SettingsForm from '../components/Settings/SettingsForm';
import UserManagement from '../components/Settings/UserManagement';
import RoleManagement from '../components/Settings/RoleManagement';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'taskTypes' | 'users' | 'roles'>('categories');
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <SettingsIcon size={24} className="mr-3 text-gray-500" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      <Card className="bg-gray-50/60 border-gray-300">
        <div className="border-b border-gray-300">
          <div className="flex p-4 space-x-2">
            <Button
              variant={activeTab === 'categories' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('categories')}
            >
              <Tag size={18} className="mr-2" />
              Categories
            </Button>
            <Button
              variant={activeTab === 'taskTypes' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('taskTypes')}
            >
              <Tabs size={18} className="mr-2" />
              Task Types
            </Button>
            <Button
              variant={activeTab === 'users' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('users')}
            >
              <Users size={18} className="mr-2" />
              Users
            </Button>
            <Button
              variant={activeTab === 'roles' ? 'primary' : 'ghost'}
              onClick={() => setActiveTab('roles')}
            >
              <Shield size={18} className="mr-2" />
              Roles
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          {activeTab === 'categories' && <SettingsForm type="category" />}
          {activeTab === 'taskTypes' && <SettingsForm type="taskType" />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'roles' && <RoleManagement />}
        </div>
      </Card>
    </div>
  );
};

export default Settings;