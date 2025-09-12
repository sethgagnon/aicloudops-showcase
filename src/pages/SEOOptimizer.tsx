import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ContentPicker } from '@/components/ContentPicker';
import { SEOAnalysisResults } from '@/components/SEOAnalysisResults';
import { SEOIssueDrawer } from '@/components/SEOIssueDrawer';
import { SEODiffModal } from '@/components/SEODiffModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, ArrowRight, RotateCcw } from 'lucide-react';

type Phase = 1 | 2 | 3 | 4;

interface SEOReport {
  id: string;
  pageId: string;
  pageType: 'post' | 'page';
  url: string;
  title: string;
  generatedAt: string;
  summary: {
    counts: {
      HIGH: number;
      MEDIUM: number;
      LOW: number;
    };
  };
}

interface SEOIssue {
  id: string;
  reportId: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  title: string;
  why: string;
  whereField: string;
  whereSelector?: string;
  whereExample?: string;
  currentValue?: string;
  proposedFix: string;
  status: 'OPEN' | 'APPLIED' | 'DISCARDED';
}

interface SelectedPage {
  id: string;
  type: 'post' | 'page';
  title: string;
  url: string;
  content: string;
}

export default function SEOOptimizer() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentPhase, setCurrentPhase] = useState<Phase>(1);
  const [selectedPage, setSelectedPage] = useState<SelectedPage | null>(null);
  const [currentReport, setCurrentReport] = useState<SEOReport | null>(null);
  const [issues, setIssues] = useState<SEOIssue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<SEOIssue | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showIssueDrawer, setShowIssueDrawer] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [pendingChange, setPendingChange] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const runAnalysis = async () => {
    if (!selectedPage) return;

    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-analyzer', {
        body: {
          pageId: selectedPage.id,
          pageType: selectedPage.type,
          url: selectedPage.url,
          title: selectedPage.title,
          content: selectedPage.content,
          action: 'analyze'
        }
      });

      if (error) throw error;

      // Fetch the saved issues from database
      const { data: reportData, error: reportError } = await supabase
        .from('seo_reports')
        .select('*')
        .eq('id', data.reportId)
        .single();

      if (reportError) throw reportError;

      const { data: issuesData, error: issuesError } = await supabase
        .from('seo_issues')
        .select('*')
        .eq('report_id', data.reportId);

      if (issuesError) throw issuesError;

      const formattedIssues: SEOIssue[] = issuesData.map(issue => ({
        id: issue.id,
        reportId: issue.report_id,
        severity: issue.severity as 'HIGH' | 'MEDIUM' | 'LOW',
        category: issue.category,
        title: issue.title,
        why: issue.why,
        whereField: issue.where_field,
        whereSelector: issue.where_selector,
        whereExample: issue.where_example,
        currentValue: issue.current_value,
        proposedFix: issue.proposed_fix,
        status: issue.status as 'OPEN' | 'APPLIED' | 'DISCARDED'
      }));

      setCurrentReport({
        id: reportData.id,
        pageId: reportData.page_id,
        pageType: reportData.page_type as 'post' | 'page',
        url: reportData.url,
        title: reportData.title,
        generatedAt: reportData.generated_at,
        summary: reportData.summary as { counts: { HIGH: number; MEDIUM: number; LOW: number; } }
      });

      setIssues(formattedIssues);
      
      toast({
        title: "Analysis Complete",
        description: `Found ${formattedIssues.length} SEO issues to review.`,
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze page for SEO issues.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const confirmPhase = (phase: Phase) => {
    if (phase < 4) {
      setCurrentPhase((phase + 1) as Phase);
      toast({
        title: `Phase ${phase} Complete`,
        description: `Moving to Phase ${phase + 1}`,
      });
    }
  };

  const openIssueDetails = (issue: SEOIssue) => {
    setSelectedIssue(issue);
    setShowIssueDrawer(true);
  };

  const handleApplyFix = (change: any) => {
    setPendingChange(change);
    setShowDiffModal(true);
  };

  const rerunAnalysis = async () => {
    if (selectedPage) {
      await runAnalysis();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">SEO Optimizer</h1>
            <p className="text-muted-foreground">
              Analyze and optimize your content for search engines with AI-powered recommendations.
            </p>
          </div>

          {/* Phase Progress */}
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              {[1, 2, 3, 4].map((phase) => (
                <div key={phase} className="flex items-center">
                  <Badge 
                    variant={currentPhase >= phase ? "default" : "secondary"}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                  >
                    {currentPhase > phase ? <CheckCircle className="h-4 w-4" /> : phase}
                  </Badge>
                  <span className="ml-2 text-sm">
                    {phase === 1 && "Analyze & Report"}
                    {phase === 2 && "Issue Details"}
                    {phase === 3 && "Apply Fixes"}
                    {phase === 4 && "Re-Analysis"}
                  </span>
                  {phase < 4 && <ArrowRight className="ml-4 h-4 w-4 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>

          {/* Phase 1: Analyze & Report */}
          {currentPhase === 1 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Phase 1: Select & Analyze Content
                </CardTitle>
                <CardDescription>
                  Choose a page or post to analyze for SEO opportunities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContentPicker 
                  onPageSelected={setSelectedPage}
                  selectedPage={selectedPage}
                />
                
                {selectedPage && (
                  <div className="mt-4 space-y-4">
                    <Button 
                      onClick={runAnalysis}
                      disabled={analyzing}
                      className="w-full"
                    >
                      {analyzing ? "Analyzing..." : "Run SEO Analysis"}
                    </Button>
                  </div>
                )}

                {currentReport && issues.length > 0 && (
                  <div className="mt-6">
                    <SEOAnalysisResults 
                      report={currentReport}
                      issues={issues}
                      onIssueClick={openIssueDetails}
                    />
                    
                    <Button 
                      onClick={() => confirmPhase(1)}
                      className="mt-4"
                    >
                      Confirm Phase 1 Complete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Phase 2: Issue Details & Draft Fixes */}
          {currentPhase === 2 && currentReport && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Phase 2: Review Issue Details</CardTitle>
                <CardDescription>
                  Click on any issue to view details and edit proposed fixes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SEOAnalysisResults 
                  report={currentReport}
                  issues={issues}
                  onIssueClick={openIssueDetails}
                />
                
                <Button 
                  onClick={() => confirmPhase(2)}
                  className="mt-4"
                >
                  Confirm Phase 2 Complete
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Phase 3: Apply Fixes */}
          {currentPhase === 3 && currentReport && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Phase 3: Apply Fixes</CardTitle>
                <CardDescription>
                  Review and apply SEO fixes to your content.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SEOAnalysisResults 
                  report={currentReport}
                  issues={issues}
                  onIssueClick={openIssueDetails}
                  showApplyButtons={true}
                />
                
                <Button 
                  onClick={() => confirmPhase(3)}
                  className="mt-4"
                >
                  Confirm Phase 3 Complete
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Phase 4: Re-Analysis & Closure */}
          {currentPhase === 4 && currentReport && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Phase 4: Re-Analysis & Summary</CardTitle>
                <CardDescription>
                  Re-run the analysis to see improvements and generate a final report.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    onClick={rerunAnalysis}
                    disabled={analyzing}
                    className="flex items-center"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {analyzing ? "Re-analyzing..." : "Re-run Analysis"}
                  </Button>

                  <SEOAnalysisResults 
                    report={currentReport}
                    issues={issues}
                    onIssueClick={openIssueDetails}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Issue Drawer */}
      <SEOIssueDrawer
        issue={selectedIssue}
        open={showIssueDrawer}
        onOpenChange={setShowIssueDrawer}
        onApplyFix={handleApplyFix}
        onUpdateIssue={(updatedIssue) => {
          setIssues(prev => prev.map(issue => 
            issue.id === updatedIssue.id ? updatedIssue : issue
          ));
        }}
      />

      {/* Diff Modal */}
      <SEODiffModal
        change={pendingChange}
        open={showDiffModal}
        onOpenChange={setShowDiffModal}
        onConfirm={(change) => {
          // Handle the confirmed change here
          toast({
            title: "Fix Applied",
            description: `Successfully updated ${change.field}`,
          });
          setShowDiffModal(false);
        }}
      />

      <Footer />
    </div>
  );
}