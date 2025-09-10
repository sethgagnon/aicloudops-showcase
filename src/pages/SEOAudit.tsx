import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Zap, Search, TrendingUp, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface SEOAnalysis {
  id: string;
  url: string;
  title: string;
  meta_description: string;
  seo_score: number;
  title_score: number;
  meta_description_score: number;
  content_score: number;
  suggestions: SEOSuggestion[];
  created_at: string;
}

interface SEOSuggestion {
  type: string;
  priority: string;
  issue: string;
  suggestion: string;
  impact: string;
}

const SEOAudit = () => {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<SEOAnalysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [auditForm, setAuditForm] = useState({
    url: '',
    title: '',
    metaDescription: '',
    content: '',
    targetKeywords: ''
  });

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        try {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);
          
          const isAdmin = roles?.some(r => r.role === 'admin');
          setUserRole(isAdmin ? 'admin' : 'user');
          
          if (isAdmin) {
            fetchAnalyses();
          }
        } catch (error) {
          console.error('Error checking user role:', error);
        }
      }
    };
    
    checkUserRole();
  }, [user]);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_analysis')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map(item => ({
        ...item,
        suggestions: Array.isArray(item.suggestions) 
          ? (item.suggestions as unknown) as SEOSuggestion[]
          : typeof item.suggestions === 'string' 
            ? JSON.parse(item.suggestions) 
            : []
      }));
      
      setAnalyses(transformedData);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast.error('Failed to load SEO analyses');
    }
  };

  const runSEOAnalysis = async () => {
    if (!auditForm.url || !auditForm.title) {
      toast.error('URL and title are required');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-optimizer', {
        body: {
          action: 'analyze',
          url: auditForm.url,
          title: auditForm.title,
          metaDescription: auditForm.metaDescription,
          content: auditForm.content,
          targetKeywords: auditForm.targetKeywords.split(',').map(k => k.trim()).filter(Boolean)
        }
      });

      if (error) throw error;

      if (data.success) {
        setCurrentAnalysis(data.data);
        await fetchAnalyses(); // Refresh the list
        toast.success('SEO analysis completed!');
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('SEO analysis error:', error);
      toast.error('Failed to analyze content: ' + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="SEO Audit Dashboard - AI Cloud Ops"
        description="Comprehensive SEO analysis and optimization dashboard powered by AI"
        noIndex={true}
      />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <Search className="h-8 w-8 text-primary" />
            SEO Audit Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            AI-powered SEO analysis and optimization recommendations
          </p>
        </div>

        <Tabs defaultValue="analyzer" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analyzer" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              SEO Analyzer
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Analysis History
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyzer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Content Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">URL *</label>
                    <Input
                      placeholder="https://example.com/page"
                      value={auditForm.url}
                      onChange={(e) => setAuditForm(prev => ({ ...prev, url: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Keywords</label>
                    <Input
                      placeholder="ai, cloud computing, leadership"
                      value={auditForm.targetKeywords}
                      onChange={(e) => setAuditForm(prev => ({ ...prev, targetKeywords: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    placeholder="Page title"
                    value={auditForm.title}
                    onChange={(e) => setAuditForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Meta Description</label>
                  <Input
                    placeholder="Meta description"
                    value={auditForm.metaDescription}
                    onChange={(e) => setAuditForm(prev => ({ ...prev, metaDescription: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    placeholder="Page content to analyze..."
                    value={auditForm.content}
                    onChange={(e) => setAuditForm(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[120px]"
                  />
                </div>

                <Button 
                  onClick={runSEOAnalysis} 
                  disabled={isAnalyzing || !auditForm.url || !auditForm.title}
                  className="w-full"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Run SEO Analysis'}
                </Button>
              </CardContent>
            </Card>

            {currentAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Analysis Results
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      Score: {currentAnalysis.seoScore || 0}/100
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Overall Score</label>
                      <div className="flex items-center gap-2">
                        <Progress value={currentAnalysis.seoScore || 0} className="flex-1" />
                        <span className={`font-bold ${getScoreColor(currentAnalysis.seoScore || 0)}`}>
                          {currentAnalysis.seoScore || 0}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Title</label>
                      <div className="flex items-center gap-2">
                        <Progress value={currentAnalysis.titleScore || 0} className="flex-1" />
                        <span className={`font-bold ${getScoreColor(currentAnalysis.titleScore || 0)}`}>
                          {currentAnalysis.titleScore || 0}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Meta Description</label>
                      <div className="flex items-center gap-2">
                        <Progress value={currentAnalysis.metaDescriptionScore || 0} className="flex-1" />
                        <span className={`font-bold ${getScoreColor(currentAnalysis.metaDescriptionScore || 0)}`}>
                          {currentAnalysis.metaDescriptionScore || 0}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Content</label>
                      <div className="flex items-center gap-2">
                        <Progress value={currentAnalysis.contentScore || 0} className="flex-1" />
                        <span className={`font-bold ${getScoreColor(currentAnalysis.contentScore || 0)}`}>
                          {currentAnalysis.contentScore || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {currentAnalysis.suggestions && currentAnalysis.suggestions.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Recommendations
                      </h3>
                      <div className="space-y-3">
                        {currentAnalysis.suggestions.map((suggestion: SEOSuggestion, index: number) => (
                          <div key={index} className="border rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant={getSeverityColor(suggestion.priority) as any}>
                                {suggestion.priority?.toUpperCase()} Priority
                              </Badge>
                              <Badge variant="outline">{suggestion.type}</Badge>
                            </div>
                            <div>
                              <p className="font-medium text-sm text-red-600 mb-1">Issue:</p>
                              <p className="text-sm">{suggestion.issue}</p>
                            </div>
                            <div>
                              <p className="font-medium text-sm text-green-600 mb-1">Solution:</p>
                              <p className="text-sm">{suggestion.suggestion}</p>
                            </div>
                            {suggestion.impact && (
                              <div>
                                <p className="font-medium text-sm text-blue-600 mb-1">Expected Impact:</p>
                                <p className="text-sm text-muted-foreground">{suggestion.impact}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Keyword Density */}
                  {currentAnalysis.keywordDensity && Object.keys(currentAnalysis.keywordDensity).length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Keyword Density</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(currentAnalysis.keywordDensity).map(([keyword, density]: [string, any]) => (
                          <div key={keyword} className="border rounded p-3 text-center">
                            <p className="font-medium text-sm">{keyword}</p>
                            <p className="text-lg font-bold text-primary">{density}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Analyses</CardTitle>
              </CardHeader>
              <CardContent>
                {analyses.length > 0 ? (
                  <div className="space-y-4">
                    {analyses.map((analysis) => (
                      <div key={analysis.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium">{analysis.title}</h3>
                            <Badge variant="outline">{analysis.seo_score}/100</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(analysis.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{analysis.url}</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>Title: <span className={getScoreColor(analysis.title_score)}>{analysis.title_score}</span></div>
                          <div>Meta: <span className={getScoreColor(analysis.meta_description_score)}>{analysis.meta_description_score}</span></div>
                          <div>Content: <span className={getScoreColor(analysis.content_score)}>{analysis.content_score}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No analyses yet. Run your first SEO analysis to see results here.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyses.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="border rounded p-3">
                          <p className="text-2xl font-bold text-primary">
                            {Math.round(analyses.reduce((sum, a) => sum + a.seo_score, 0) / analyses.length)}
                          </p>
                          <p className="text-sm text-muted-foreground">Avg SEO Score</p>
                        </div>
                        <div className="border rounded p-3">
                          <p className="text-2xl font-bold text-primary">{analyses.length}</p>
                          <p className="text-sm text-muted-foreground">Pages Analyzed</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Best Performing</span>
                          <span className="font-medium">
                            {analyses.reduce((max, a) => a.seo_score > max.seo_score ? a : max, analyses[0])?.title}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Needs Attention</span>
                          <span className="font-medium">
                            {analyses.reduce((min, a) => a.seo_score < min.seo_score ? a : min, analyses[0])?.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No data available yet
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Quick Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Keep titles between 50-60 characters for optimal display</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Write meta descriptions between 150-160 characters</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Use target keywords naturally throughout content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Include related keywords and synonyms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Structure content with proper headings (H1, H2, H3)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default SEOAudit;