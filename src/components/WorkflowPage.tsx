
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowPageProps {
  workflow: string;
  onBack: () => void;
}

const getWorkflowTitle = (workflow: string) => {
  const titles: Record<string, string> = {
    'demand-letter': 'Draft a Demand Letter',
    'petition': 'Draft a Petition',
    'motion': 'Draft a Motion',
    'response': 'Draft a Response',
    'discovery-requests': 'Discovery Requests',
    'discovery-response': 'Discovery Response',
    'settlement-letter': 'Settlement Letter',
    'affidavit': 'Affidavit',
    'estate-planning': 'Estate Planning'
  };
  return titles[workflow] || 'Legal Workflow';
};

const WorkflowPage = ({ workflow, onBack }: WorkflowPageProps) => {
  const [matter, setMatter] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare the data for the webhook
      const workflowData = {
        workflowType: workflow,
        matter,
        notes,
        fileCount: files?.length || 0,
        timestamp: new Date().toISOString(),
        user: 'test' // In production, this would be the actual user
      };

      console.log('Submitting workflow data:', workflowData);

      if (webhookUrl) {
        // Call the webhook if URL is provided
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'no-cors',
          body: JSON.stringify(workflowData),
        });

        toast.success('Workflow submitted successfully! The document will be processed and available for download shortly.');
      } else {
        // Simulate workflow submission
        await new Promise(resolve => setTimeout(resolve, 2000));
        toast.success('Workflow submitted successfully! (Note: Configure webhook URL for actual processing)');
      }

      // Reset form
      setMatter('');
      setNotes('');
      setFiles(null);
      (document.getElementById('file-upload') as HTMLInputElement).value = '';

    } catch (error) {
      console.error('Error submitting workflow:', error);
      toast.error('Failed to submit workflow. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Button
            onClick={onBack}
            variant="ghost"
            className="mr-4 text-white hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">The Woodlands Law Firm</h1>
            <p className="text-blue-200">{getWorkflowTitle(workflow)}</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center">
                <FileText className="w-6 h-6 mr-2 text-primary" />
                {getWorkflowTitle(workflow)}
              </CardTitle>
              <CardDescription className="text-blue-200">
                Please provide the required information to generate your legal document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="matter" className="text-white">Matter/Case Description</Label>
                  <Input
                    id="matter"
                    value={matter}
                    onChange={(e) => setMatter(e.target.value)}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    placeholder="Enter the matter or case description"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-upload" className="text-white">Upload Supporting Files</Label>
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-slate-500 transition-colors">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-white">Click to upload files</span>
                      <span className="text-slate-400 block text-sm mt-1">
                        PDF, DOC, DOCX, TXT files supported
                      </span>
                    </Label>
                    {files && files.length > 0 && (
                      <div className="mt-2 text-sm text-blue-200">
                        {files.length} file(s) selected
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-white">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[120px]"
                    placeholder="Enter any additional notes, special instructions, or relevant details for this workflow..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook" className="text-white">n8n Webhook URL (Optional)</Label>
                  <Input
                    id="webhook"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                    placeholder="Enter your n8n webhook URL for workflow automation"
                  />
                  <p className="text-sm text-slate-400">
                    This URL will receive the workflow data to trigger document generation
                  </p>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    onClick={onBack}
                    variant="outline"
                    className="border-slate-600 text-white hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    {isSubmitting ? 'Processing...' : 'Submit Workflow'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
            <h3 className="text-white font-medium mb-2">Next Steps:</h3>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>• Your workflow will be processed through our automated system</li>
              <li>• Generated documents will be available for download</li>
              <li>• You'll receive a notification when processing is complete</li>
              <li>• All submissions are logged for quality assurance</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkflowPage;
