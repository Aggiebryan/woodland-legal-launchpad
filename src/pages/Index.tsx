
import React, { useState } from 'react';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';
import WorkflowPage from '@/components/WorkflowPage';

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSelectedWorkflow(null);
  };

  const handleWorkflowSelect = (workflow: string) => {
    setSelectedWorkflow(workflow);
  };

  const handleBackToDashboard = () => {
    setSelectedWorkflow(null);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (selectedWorkflow) {
    return (
      <WorkflowPage
        workflow={selectedWorkflow}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <Dashboard
      onWorkflowSelect={handleWorkflowSelect}
      onLogout={handleLogout}
    />
  );
};

export default Index;
