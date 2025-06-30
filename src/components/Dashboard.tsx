
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FileText, Scale, Gavel, Shield, Search, HandHeart, Scroll, Building } from 'lucide-react';

interface DashboardProps {
  onWorkflowSelect: (workflow: string) => void;
  onLogout: () => void;
}

const workflows = [
  { id: 'demand-letter', label: 'Draft a Demand Letter', icon: FileText, description: 'Create professional demand letters' },
  { id: 'petition', label: 'Draft a Petition', icon: Scale, description: 'Generate legal petitions' },
  { id: 'motion', label: 'Draft a Motion', icon: Gavel, description: 'Prepare court motions' },
  { id: 'response', label: 'Draft a Response', icon: Shield, description: 'Create legal responses' },
  { id: 'discovery-requests', label: 'Discovery Requests', icon: Search, description: 'Generate discovery requests' },
  { id: 'discovery-response', label: 'Discovery Response', icon: FileText, description: 'Prepare discovery responses' },
  { id: 'settlement-letter', label: 'Settlement Letter', icon: HandHeart, description: 'Draft settlement negotiations' },
  { id: 'affidavit', label: 'Affidavit', icon: Scroll, description: 'Create sworn affidavits' },
  { id: 'estate-planning', label: 'Estate Planning', icon: Building, description: 'Estate planning documents' }
];

const Dashboard = ({ onWorkflowSelect, onLogout }: DashboardProps) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState('');

  const handleProceed = () => {
    if (selectedWorkflow) {
      onWorkflowSelect(selectedWorkflow);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">The Woodlands Law Firm</h1>
            <p className="text-blue-200">Workflow Management System</p>
          </div>
          <Button 
            onClick={onLogout}
            variant="outline"
            className="border-slate-600 text-white hover:bg-slate-700"
          >
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Legal Workflow Center</h2>
            <p className="text-blue-200 text-lg">Select a workflow to begin document automation</p>
          </div>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-white text-xl">Available Workflows</CardTitle>
              <CardDescription className="text-blue-200">
                Choose the type of legal document you need to create
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workflows.map((workflow) => {
                    const Icon = workflow.icon;
                    return (
                      <div key={workflow.id} className="relative">
                        <Label
                          htmlFor={workflow.id}
                          className="flex flex-col items-center p-4 border border-slate-600 rounded-lg cursor-pointer hover:bg-slate-700/30 transition-colors"
                        >
                          <Icon className="w-8 h-8 text-primary mb-2" />
                          <span className="text-white font-medium text-center mb-1">{workflow.label}</span>
                          <span className="text-slate-400 text-sm text-center">{workflow.description}</span>
                          <RadioGroupItem
                            value={workflow.id}
                            id={workflow.id}
                            className="absolute top-2 right-2 border-slate-600 text-primary"
                          />
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>

              <div className="mt-8 flex justify-center">
                <Button
                  onClick={handleProceed}
                  disabled={!selectedWorkflow}
                  className="px-8 py-2 bg-primary hover:bg-primary/90 text-white"
                >
                  Proceed with Selected Workflow
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
