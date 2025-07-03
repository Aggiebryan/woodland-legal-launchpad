
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
import { Checkbox } from '@/components/ui/checkbox';
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

const getWebhookUrl = (workflow: string) => {
  const webhooks: Record<string, string> = {
    'demand-letter': 'https://n8n.twlf.dev/webhook/demandletter',
    'petition': 'https://n8n.twlf.dev/webhook-test/draftpetition',
    'motion': 'https://n8n.twlf.dev/webhook/motion',
    'response': 'https://n8n.twlf.dev/webhook/response',
    'discovery-requests': 'https://n8n.twlf.dev/webhook/discoveryreq',
    'settlement-letter': 'https://n8n.twlf.dev/webhook/settlement',
    'affidavit': 'https://n8n.twlf.dev/webhook/affidavit',
    'estate-planning': 'https://n8n.twlf.dev/webhook/estateplan'
  };
  return webhooks[workflow] || '';
};

const WorkflowPage = ({ workflow, onBack }: WorkflowPageProps) => {
  const [matter, setMatter] = useState('');
  const [otherMatterDescription, setOtherMatterDescription] = useState('');
  const [clioMatters, setClioMatters] = useState<any[]>([]);
  const [loadingMatters, setLoadingMatters] = useState(false);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [responseFile, setResponseFile] = useState<FileList | null>(null);
  const [petitionFile, setPetitionFile] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Specific fields for different workflows
  const [stowersDemand, setStowersDemand] = useState(false);
  const [motionType, setMotionType] = useState('');
  const [affidavitFor, setAffidavitFor] = useState('');
  const [estatePlanningFor, setEstatePlanningFor] = useState('');
  const [isPlaintiff, setIsPlaintiff] = useState(false);
  const [isDefendant, setIsDefendant] = useState(false);

  useEffect(() => {
    const fetchMatters = async () => {
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
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'general' | 'response' | 'petition') => {
    if (fileType === 'general') {
      setFiles(e.target.files);
    } else if (fileType === 'response') {
      setResponseFile(e.target.files);
    } else if (fileType === 'petition') {
      setPetitionFile(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const webhookUrl = getWebhookUrl(workflow);
      
      // Prepare the data for the webhook
      const workflowData = {
        workflowType: workflow,
        matter: matter === 'other' ? otherMatterDescription : matter,
        notes,
        fileCount: files?.length || 0,
        responseFileCount: responseFile?.length || 0,
        petitionFileCount: petitionFile?.length || 0,
        timestamp: new Date().toISOString(),
        user: 'test',
        // Workflow-specific fields
        ...(workflow === 'demand-letter' && { stowersDemand }),
        ...(workflow === 'motion' && { motionType }),
        ...(workflow === 'affidavit' && { affidavitFor }),
        ...(workflow === 'estate-planning' && { estatePlanningFor }),
        ...(workflow === 'discovery-requests' && { 
          representingParty: {
            plaintiff: isPlaintiff,
            defendant: isDefendant
          }
        })
      };

      console.log('Submitting workflow data:', workflowData);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(workflowData),
      });

      toast.success('All documents have been submitted. Your document will be created shortly. All documents must be reviewed and finalized before use.');

      // Reset form
      setMatter('');
      setOtherMatterDescription('');
      setNotes('');
      setFiles(null);
      setResponseFile(null);
      setPetitionFile(null);
      setStowersDemand(false);
      setMotionType('');
      setAffidavitFor('');
      setEstatePlanningFor('');
      setIsPlaintiff(false);
      setIsDefendant(false);
    } catch (error) {
      console.error('Error submitting workflow:', error);
      toast.error('Failed to submit workflow. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMatterSelect = () => (
    <div className="space-y-2">
      <Label htmlFor="matter" className="text-white">Matter/Case Description</Label>
      <Select value={matter} onValueChange={setMatter}>
        <SelectTrigger
          id="matter"
          className="bg-slate-800/50 border-slate-600 text-white"
        >
          <SelectValue placeholder={loadingMatters ? 'Loading...' : 'Select a matter'} />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-600 text-white">
          {clioMatters.map((m) => (
            <SelectItem
              key={m.id}
              value={`${m.display_number} - ${m.description}`}
              className="text-white hover:bg-slate-700"
            >
              {m.display_number} - {m.description}
            </SelectItem>
          ))}
          <SelectItem value="other" className="text-white hover:bg-slate-700">
            Other
          </SelectItem>
        </SelectContent>
      </Select>
      {matter === 'other' && (
        <Input
          value={otherMatterDescription}
          onChange={(e) => setOtherMatterDescription(e.target.value)}
          className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
          placeholder="Enter matter description"
          required
        />
      )}
    </div>
  );

  const renderFileUpload = (label: string, fileType: 'general' | 'response' | 'petition', acceptedTypes?: string) => (
    <div className="space-y-2">
      <Label htmlFor={`${fileType}-upload`} className="text-white">{label}</Label>
      <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-slate-500 transition-colors">
        <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <input
          id={`${fileType}-upload`}
          type="file"
          multiple={fileType === 'general'}
          onChange={(e) => handleFileChange(e, fileType)}
          className="hidden"
          accept={acceptedTypes || ".pdf,.doc,.docx,.txt,.xls,.xlsx"}
        />
        <Label htmlFor={`${fileType}-upload`} className="cursor-pointer">
          <span className="text-white">Click to upload files</span>
          <span className="text-slate-400 block text-sm mt-1">
            {acceptedTypes ? 'PDF, DOC, TXT files supported' : 'PDF, DOC, DOCX, TXT, XLS, XLSX files supported'}
          </span>
        </Label>
        {((fileType === 'general' && files && files.length > 0) ||
          (fileType === 'response' && responseFile && responseFile.length > 0) ||
          (fileType === 'petition' && petitionFile && petitionFile.length > 0)) && (
          <div className="mt-2 text-sm text-blue-200">
            {fileType === 'general' ? files?.length : 
             fileType === 'response' ? responseFile?.length : 
             petitionFile?.length} file(s) selected
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center">
          <Button
            onClick={onBack}
            variant="ghost"
            className="text-white hover:bg-slate-700 mr-4"
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
                {renderMatterSelect()}

                {workflow === 'motion' && (
                  <div className="space-y-2">
                    <Label htmlFor="motion-type" className="text-white">Motion Type</Label>
                    <Input
                      id="motion-type"
                      value={motionType}
                      onChange={(e) => setMotionType(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="Enter motion type"
                      required
                    />
                  </div>
                )}

                {workflow === 'response' && (
                  renderFileUpload('Upload File to Respond To', 'response', '.pdf,.doc,.docx,.txt')
                )}

                {workflow === 'discovery-requests' && (
                  renderFileUpload('Upload Petition', 'petition', '.pdf,.doc,.docx,.txt')
                )}

                {workflow === 'discovery-requests' && (
                  <div className="space-y-2">
                    <Label className="text-white">What party are you representing?</Label>
                    <div className="flex space-x-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="plaintiff"
                          checked={isPlaintiff}
                          onCheckedChange={(checked) => setIsPlaintiff(checked === true)}
                          className="border-slate-600"
                        />
                        <Label htmlFor="plaintiff" className="text-white">Plaintiff</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="defendant"
                          checked={isDefendant}
                          onCheckedChange={(checked) => setIsDefendant(checked === true)}
                          className="border-slate-600"
                        />
                        <Label htmlFor="defendant" className="text-white">Defendant</Label>
                      </div>
                    </div>
                  </div>
                )}

                {workflow === 'affidavit' && (
                  <div className="space-y-2">
                    <Label htmlFor="affidavit-for" className="text-white">Who is this affidavit for?</Label>
                    <Input
                      id="affidavit-for"
                      value={affidavitFor}
                      onChange={(e) => setAffidavitFor(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="Enter who this affidavit is for"
                      required
                    />
                  </div>
                )}

                {workflow === 'estate-planning' && (
                  <div className="space-y-2">
                    <Label htmlFor="estate-planning-for" className="text-white">Who is this for?</Label>
                    <Input
                      id="estate-planning-for"
                      value={estatePlanningFor}
                      onChange={(e) => setEstatePlanningFor(e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400"
                      placeholder="Enter who this is for"
                      required
                    />
                  </div>
                )}

                {renderFileUpload('Upload Supporting Files', 'general')}

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-white">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[100px]"
                    placeholder="Enter any additional notes, special instructions, or relevant details"
                  />
                </div>

                {workflow === 'demand-letter' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="stowers-demand"
                      checked={stowersDemand}
                      onCheckedChange={(checked) => setStowersDemand(checked === true)}
                      className="border-slate-600"
                    />
                    <Label htmlFor="stowers-demand" className="text-white">Stowers Demand</Label>
                  </div>
                )}

                <div className="flex justify-between pt-4">
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
                    disabled={isSubmitting || !matter}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    {isSubmitting ? 'Submitting...' : `Submit ${getWorkflowTitle(workflow)}`}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default WorkflowPage;
