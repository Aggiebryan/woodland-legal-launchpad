
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [clioMatters, setClioMatters] = useState<any[]>([]);
  const [loadingMatters, setLoadingMatters] = useState(false);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchMatters = async () => {
      if (workflow !== 'petition') return;
      setLoadingMatters(true);
      try {
        const tokenRes = await fetch('https://app.clio.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'client_credentials',
            client_id: import.meta.env.VITE_CLIO_CLIENT_ID,
            client_secret: import.meta.env.VITE_CLIO_CLIENT_SECRET,
            scope: 'read:matters',
          }),
        });
        const token = await tokenRes.json();
        const res = await fetch(
          'https://app.clio.com/api/v4/matters?states=active',
          {
            headers: {
              Authorization: `Bearer ${token.access_token}`,
            },
          },
        );
        const data = await res.json();
        setClioMatters(data?.data || []);
      } catch (err) {
        console.error('Failed to fetch matters from Clio', err);
      } finally {
        setLoadingMatters(false);
      }
    };

    fetchMatters();
  }, [workflow]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const uploadFilesToSupabase = async (): Promise<string[]> => {
    if (!files || files.length === 0) return [];
    const uploaded: string[] = [];
    const project = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const supabaseUrl =
      import.meta.env.VITE_SUPABASE_URL || `https://${project}.supabase.co`;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const bucket = 'documents';

    for (const file of Array.from(files)) {
      const path = `petition/${Date.now()}-${file.name}`;
      const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': file.type,
          'x-upsert': 'false',
        },
        body: file,
      });
      if (res.ok) {
        uploaded.push(path);
        // schedule delete after 24h
        setTimeout(() => {
          fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${supabaseKey}` },
          });
        }, 24 * 60 * 60 * 1000);
      }
    }
    return uploaded;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const uploadedPaths = await uploadFilesToSupabase();
      // Prepare the data for the webhook
      const workflowData = {
        workflowType: workflow,
        matter,
        notes,
        fileCount: files?.length || 0,
        uploadedPaths,
        footerMatter: matter,
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
@@ -101,58 +183,79 @@ const WorkflowPage = ({ workflow, onBack }: WorkflowPageProps) => {
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
                  {workflow === 'petition' ? (
                    <Select value={matter} onValueChange={setMatter}>
                      <SelectTrigger
                        id="matter"
                        className="bg-slate-800/50 border-slate-600 text-white"
                      >
                        <SelectValue placeholder={loadingMatters ? 'Loading...' : 'Select a matter'} />
                      </SelectTrigger>
                      <SelectContent>
                        {clioMatters.map((m) => (
                          <SelectItem
                            key={m.id}
                            value={`${m.display_number} - ${m.description}`}
                          >
                            {m.display_number} - {m.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="matter"
                      value={matter}
                      onChange={(e) => setMatter(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="Enter the matter or case description"
                      required
                    />
                  )}
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


export default WorkflowPage;
