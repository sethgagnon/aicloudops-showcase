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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Zap, Search, TrendingUp, FileText, Globe, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import SEOFixPreview from '@/components/SEOFixPreview';

interface SEOAnalysis {
  id: string;
  url: string;
  title: string;
  meta_description: string;
  content?: string;
  seo_score: number;
  title_score: number;
  meta_description_score: number;
  content_score: number;
  keyword_density?: Record<string, number>;
  suggestions: SEOSuggestion[];
  created_at: string;
}

interface SEOSuggestion {
  type: string;
  priority: string;
  issue: string;
  suggestion: string;
  proposedFix?: string;
  impact: string;
}

const SEOAudit = () => {
  const { user, loading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [analyses, setAnalyses] = useState<SEOAnalysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<SEOAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
  const [sitePages, setSitePages] = useState<Array<{url: string, title: string, content: string, type: 'post' | 'page', id?: string, isStatic?: boolean, metaDescription?: string, keywords?: string}>>([]);
  const [selectedPageUrl, setSelectedPageUrl] = useState('');
  const [fixPreviewOpen, setFixPreviewOpen] = useState(false);
  const [selectedAnalysisForFix, setSelectedAnalysisForFix] = useState<any>(null);
  const [proposalEdits, setProposalEdits] = useState<Record<string, string>>({});
  const [showProposals, setShowProposals] = useState<Record<string, boolean>>({});
  const [isApplyingFix, setIsApplyingFix] = useState(false);
  const [applyingIndividualFix, setApplyingIndividualFix] = useState<Record<string, boolean>>({});
  const [appliedFixes, setAppliedFixes] = useState<Record<string, boolean>>({});
  const [regeneratingFix, setRegeneratingFix] = useState<Record<string, boolean>>({});
  const [fixAlternatives, setFixAlternatives] = useState<Record<string, Array<{proposedFix: string, approach: string, pros: string}>>>({});
  const [auditForm, setAuditForm] = useState({
    url: '',
    title: '',
    metaDescription: '',
    content: '',
    targetKeywords: ''
  });

  // Utility function to extract text content from HTML
  const extractTextFromHTML = (html: string): string => {
    if (!html) return '';
    
    // Create a temporary div element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Remove script and style elements
    const scripts = tempDiv.querySelectorAll('script, style');
    scripts.forEach(script => script.remove());
    
    // Get text content and clean it up
    let text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Remove extra whitespace and normalize
    text = text.replace(/\s+/g, ' ').trim();
    
    // Limit to reasonable length for analysis (first 2000 chars)
    return text.substring(0, 2000);
  };

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
            fetchSitePages();
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          setUserRole('user');
        } finally {
          setRoleLoading(false);
        }
      } else if (!loading) {
        setRoleLoading(false);
      }
    };
    
    checkUserRole();
  }, [user, loading]);

  const fetchSitePages = async () => {
    try {
      // Fetch published blog posts with full content
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title, slug, excerpt, content')
        .eq('status', 'published');

      const blogPages = posts?.map(post => ({
        url: `/blog/${post.slug}`,
        title: post.title,
        metaDescription: post.excerpt || '',
        content: extractTextFromHTML(post.content || ''),
        isStatic: false,
        type: 'post' as const,
        id: post.id
      })) || [];

      // Fetch static pages from database
      const { data: staticPagesData } = await supabase
        .from('static_pages')
        .select('*');

      const staticPages = await Promise.all(staticPagesData?.map(async (page) => {
        let content = '';
        try {
          // For static pages, try to extract content from the actual page
          const response = await fetch(window.location.origin + page.path);
          if (response.ok) {
            const html = await response.text();
            content = extractTextFromHTML(html);
          }
        } catch (error) {
          console.warn(`Failed to fetch content for ${page.path}:`, error);
        }

        return {
          url: page.path,
          title: page.title,
          metaDescription: page.meta_description || '',
          content,
          isStatic: true,
          type: 'page' as const,
          keywords: page.keywords
        };
      }) || []);

      setSitePages([...staticPages, ...blogPages]);
    } catch (error) {
      console.error('Error fetching site pages:', error);
    }
  };

  const handlePageSelect = (pageUrl: string) => {
    const selectedPage = sitePages.find(page => page.url === pageUrl);
    if (selectedPage) {
      setSelectedPageUrl(pageUrl);
      setAuditForm(prev => ({
        ...prev,
        url: selectedPage.url,
        title: selectedPage.title,
        metaDescription: selectedPage.metaDescription || '',
        content: selectedPage.content
      }));
    }
  };

  const runBulkSiteAnalysis = async () => {
    setIsBulkAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('seo-optimizer', {
        body: {
          action: 'bulk-analyze',
          pages: sitePages.map(page => ({
            url: page.url,
            title: page.title,
            content: page.content,
            type: page.type
          }))
        }
      });

      if (error) throw error;

      if (data.success) {
        await fetchAnalyses(); // Refresh the list
        toast.success(`Bulk SEO analysis completed for ${sitePages.length} pages!`);
      } else {
        throw new Error(data.error || 'Bulk analysis failed');
      }
    } catch (error) {
      console.error('Bulk SEO analysis error:', error);
      toast.error('Failed to analyze site: ' + error.message);
    } finally {
      setIsBulkAnalyzing(false);
    }
  };

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('seo_analysis')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Transform the data to match our interface with proper type validation
      const transformedData = (data || []).map(item => {
        // Ensure all fields are properly typed and validated
        const transformedItem: SEOAnalysis = {
          id: String(item.id || ''),
          url: String(item.url || ''),
          title: String(item.title || ''),
          meta_description: String(item.meta_description || ''),
          content: String(item.content || ''),
          seo_score: Number(item.seo_score || 0),
          title_score: Number(item.title_score || 0),
          meta_description_score: Number(item.meta_description_score || 0),
          content_score: Number(item.content_score || 0),
          keyword_density: (item.keyword_density && typeof item.keyword_density === 'object' && item.keyword_density !== null) 
            ? item.keyword_density as Record<string, number>
            : {},
          suggestions: (() => {
            if (Array.isArray(item.suggestions)) {
              return item.suggestions as unknown as SEOSuggestion[];
            } else if (typeof item.suggestions === 'string') {
              try {
                const parsed = JSON.parse(item.suggestions);
                return Array.isArray(parsed) ? parsed as unknown as SEOSuggestion[] : [];
              } catch {
                return [];
              }
            }
            return [];
          })(),
          created_at: String(item.created_at || new Date().toISOString())
        };
        
        // Validate the transformed item
        if (!transformedItem.url || typeof transformedItem.url !== 'string') {
          console.warn('Invalid URL in analysis item:', { id: transformedItem.id, url: transformedItem.url });
        }
        
        return transformedItem;
      });
      
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
        const analysisData = {
          ...data.data,
          id: data.data.id || 'new-analysis',
          seo_score: data.data.seoScore || data.data.seo_score || 0,
          title_score: data.data.titleScore || data.data.title_score || 0,
          meta_description_score: data.data.metaDescriptionScore || data.data.meta_description_score || 0,
          content_score: data.data.contentScore || data.data.content_score || 0,
          keyword_density: data.data.keywordDensity || data.data.keyword_density || {},
          created_at: data.data.created_at || new Date().toISOString()
        };
        setCurrentAnalysis(analysisData);
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

  const openFixPreview = (analysis: SEOAnalysis) => {
    // Find the corresponding post ID if this is a blog post
    const matchingPage = sitePages.find(page => page.url === analysis.url);
    const postId = matchingPage?.type === 'post' ? matchingPage.id : undefined;
    
    console.log('Opening fix preview for:', {
      analysisUrl: analysis.url,
      matchingPageFound: !!matchingPage,
      matchingPageType: matchingPage?.type,
      postId,
      hasTitle: !!analysis.title,
      hasSuggestions: !!analysis.suggestions?.length
    });
    
    // Ensure we have required data
    if (!analysis.url) {
      toast.error('Analysis URL is missing');
      return;
    }
    
    // Apply any edited proposals to the suggestions
    const updatedSuggestions = analysis.suggestions.map((suggestion, index) => {
      const suggestionKey = `${analysis.url}-${index}`;
      const editedProposal = proposalEdits[suggestionKey];
      
      return editedProposal ? {
        ...suggestion,
        suggestion: editedProposal
      } : {
        ...suggestion,
        suggestion: suggestion.proposedFix || suggestion.suggestion
      };
    });
    
    setSelectedAnalysisForFix({
      ...analysis,
      suggestions: updatedSuggestions,
      postId
    });
    setFixPreviewOpen(true);
  };

  const selectAnalysisForWork = (analysis: SEOAnalysis) => {
    // Simple validation
    if (!analysis?.url || !analysis?.title) {
      toast.error('Invalid analysis data. Please run a new analysis.');
      return;
    }
    
    // Set current analysis directly - no complex validation needed
    setCurrentAnalysis(analysis);
    toast.success(`Selected analysis for "${analysis.title}"`);
  };

  const handleFixesApplied = () => {
    // Refresh analyses after fixes are applied
    fetchAnalyses();
    // Reset current analysis if it was the one being fixed
    if (selectedAnalysisForFix && currentAnalysis?.url === selectedAnalysisForFix.url) {
      setCurrentAnalysis(null);
    }
  };

  const applyIndividualFix = async (suggestionIndex: number) => {
    console.log('applyIndividualFix called - currentAnalysis:', {
      exists: !!currentAnalysis,
      id: currentAnalysis?.id,
      url: currentAnalysis?.url,
      urlType: typeof currentAnalysis?.url,
      title: currentAnalysis?.title
    });
    
    if (!currentAnalysis) {
      toast.error('No analysis selected. Please select an analysis from the history or run a new analysis.');
      return;
    }
    
    // Enhanced validation for URL corruption
    if (!currentAnalysis.url || typeof currentAnalysis.url !== 'string' || currentAnalysis.url.trim() === '') {
      console.error('Analysis missing or corrupted URL - full object:', {
        url: currentAnalysis.url,
        urlType: typeof currentAnalysis.url,
        fullAnalysis: currentAnalysis
      });
      
      // Try to recover by refetching the analysis
      if (currentAnalysis.id) {
        console.log('Attempting to recover analysis from database...');
        try {
          const { data: recoveredAnalysis, error } = await supabase
            .from('seo_analysis')
            .select('*')
            .eq('id', currentAnalysis.id)
            .single();
            
          if (!error && recoveredAnalysis?.url) {
            console.log('Recovered analysis URL:', recoveredAnalysis.url);
            // Re-select the recovered analysis with proper type conversion
            const suggestions = Array.isArray(recoveredAnalysis.suggestions) 
              ? recoveredAnalysis.suggestions 
              : typeof recoveredAnalysis.suggestions === 'string'
                ? JSON.parse(recoveredAnalysis.suggestions || '[]')
                : [];
                
            selectAnalysisForWork({
              ...recoveredAnalysis,
              suggestions
            } as SEOAnalysis);
            toast.success('Analysis data recovered. Please try applying the fix again.');
            return;
          }
        } catch (recoveryError) {
          console.error('Failed to recover analysis:', recoveryError);
        }
      }
      
      toast.error('Analysis data is corrupted. Please select a valid analysis from the history.');
      return;
    }
    
    const suggestionKey = `${currentAnalysis.url}-${suggestionIndex}`;
    const suggestion = currentAnalysis.suggestions?.[suggestionIndex];
    
    if (!suggestion) {
      toast.error('Suggestion not found');
      return;
    }
    
    setApplyingIndividualFix(prev => ({ ...prev, [suggestionKey]: true }));
    
    try {
      const fixToApply = proposalEdits[suggestionKey] || suggestion.proposedFix || suggestion.suggestion;
      
      // Determine if this is a static page or blog post with proper null checks
      const analysisUrl = currentAnalysis.url || '';
      const isStaticPage = !analysisUrl.includes('/blog/');
      const matchingPage = sitePages.find(page => page.url === analysisUrl);
      const postId = isStaticPage ? undefined : matchingPage?.id;
      
      console.log('Applying individual fix for:', {
        url: analysisUrl,
        isStaticPage,
        postId,
        matchingPageFound: !!matchingPage,
        suggestionType: suggestion.type,
        fixToApply: fixToApply?.substring(0, 100) + '...' // Log first 100 chars
      });
      
      if (!isStaticPage && !postId) {
        throw new Error('Could not find matching blog post ID for URL: ' + analysisUrl);
      }
      
      const { data, error } = await supabase.functions.invoke('seo-optimizer', {
        body: {
          action: 'apply-fixes',
          url: analysisUrl,
          suggestions: [{
            ...suggestion,
            suggestion: fixToApply
          }],
          postId,
          isStaticPage,
          title: currentAnalysis.title || '',
          metaDescription: currentAnalysis.meta_description || '',
          content: currentAnalysis.content || ''
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('Function returned error:', data);
        throw new Error(data?.error || 'Unknown error from SEO optimizer');
      }

      setAppliedFixes(prev => ({ ...prev, [suggestionKey]: true }));
      toast.success(data.message || `SEO fix applied successfully to ${isStaticPage ? 'static page' : 'blog post'}!`);
      
      // Refresh analysis if needed
      if (postId || isStaticPage) {
        fetchAnalyses();
      }
      
    } catch (error) {
      console.error('Error applying individual fix:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to apply SEO fix: ${errorMessage}`);
    } finally {
      setApplyingIndividualFix(prev => ({ ...prev, [suggestionKey]: false }));
    }
  };

  const regenerateIndividualFix = async (suggestionIndex: number) => {
    if (!currentAnalysis) {
      toast.error('No analysis selected');
      return;
    }

    const suggestionKey = `${currentAnalysis.url}-${suggestionIndex}`;
    setRegeneratingFix(prev => ({ ...prev, [suggestionKey]: true }));

    try {
      const { data, error } = await supabase.functions.invoke('seo-optimizer', {
        body: {
          action: 'regenerate-individual-fix',
          url: currentAnalysis.url,
          title: currentAnalysis.title,
          metaDescription: currentAnalysis.meta_description,
          content: currentAnalysis.content,
          suggestions: currentAnalysis.suggestions,
          suggestionIndex,
          targetKeywords: [] // Could be extracted from analysis if needed
        }
      });

      if (error) throw error;

      if (data.success) {
        setFixAlternatives(prev => ({
          ...prev,
          [suggestionKey]: data.data.alternatives
        }));
        toast.success('Generated 3 alternative fix options!');
      } else {
        throw new Error(data.error || 'Failed to regenerate fix');
      }
    } catch (error) {
      console.error('Error regenerating fix:', error);
      toast.error('Failed to regenerate fix: ' + error.message);
    } finally {
      setRegeneratingFix(prev => ({ ...prev, [suggestionKey]: false }));
    }
  };

  const selectFixAlternative = (suggestionIndex: number, alternativeIndex: number) => {
    if (!currentAnalysis) return;
    
    const suggestionKey = `${currentAnalysis.url}-${suggestionIndex}`;
    const alternatives = fixAlternatives[suggestionKey];
    
    if (alternatives && alternatives[alternativeIndex]) {
      setProposalEdits(prev => ({
        ...prev,
        [suggestionKey]: alternatives[alternativeIndex].proposedFix
      }));
      toast.success('Alternative fix selected and ready to apply!');
    }
  };

  if (loading || roleLoading) {
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
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quick Select from Your Site</label>
                    <Select onValueChange={handlePageSelect} value={selectedPageUrl}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a page from your site or enter custom URL below" />
                      </SelectTrigger>
                      <SelectContent>
                        {sitePages.map((page) => (
                          <SelectItem key={page.url} value={page.url}>
                            <div className="flex items-center gap-2">
                              {page.type === 'post' ? <FileText className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                              {page.title}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={runBulkSiteAnalysis}
                      disabled={isBulkAnalyzing || sitePages.length === 0}
                      variant="secondary"
                      className="flex-1"
                    >
                      {isBulkAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Analyzing {sitePages.length} pages...
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4 mr-2" />
                          Analyze Entire Site ({sitePages.length} pages)
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or analyze custom content</span>
                  </div>
                </div>

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
                  {auditForm.content && (
                    <div className="text-xs text-muted-foreground">
                      Content length: {auditForm.content.length} characters
                      {auditForm.content.length > 15000 && (
                        <span className="text-amber-600 ml-2">
                          ⚠️ Content will be truncated to 15,000 characters for analysis
                        </span>
                      )}
                    </div>
                  )}
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
                    <div className="flex items-center gap-3">
                      Analysis Results
                      <Badge variant="secondary" className="text-xs">
                        {currentAnalysis.url}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      Score: {currentAnalysis.seo_score || 0}/100
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Overall Score</label>
                      <div className="flex items-center gap-2">
                        <Progress value={currentAnalysis.seo_score || 0} className="flex-1" />
                        <span className={`font-bold ${getScoreColor(currentAnalysis.seo_score || 0)}`}>
                          {currentAnalysis.seo_score || 0}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Title</label>
                      <div className="flex items-center gap-2">
                        <Progress value={currentAnalysis.title_score || 0} className="flex-1" />
                        <span className={`font-bold ${getScoreColor(currentAnalysis.title_score || 0)}`}>
                          {currentAnalysis.title_score || 0}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Meta Description</label>
                      <div className="flex items-center gap-2">
                        <Progress value={currentAnalysis.meta_description_score || 0} className="flex-1" />
                        <span className={`font-bold ${getScoreColor(currentAnalysis.meta_description_score || 0)}`}>
                          {currentAnalysis.meta_description_score || 0}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Content</label>
                      <div className="flex items-center gap-2">
                        <Progress value={currentAnalysis.content_score || 0} className="flex-1" />
                        <span className={`font-bold ${getScoreColor(currentAnalysis.content_score || 0)}`}>
                          {currentAnalysis.content_score || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {currentAnalysis.suggestions && currentAnalysis.suggestions.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" />
                          Recommendations ({currentAnalysis.suggestions.length})
                        </h3>
                        <Button 
                          onClick={() => openFixPreview(currentAnalysis)}
                          className="flex items-center gap-2"
                          variant="default"
                        >
                          <Sparkles className="h-4 w-4" />
                          Apply All SEO Fixes
                        </Button>
                      </div>
                      
                       <div className="space-y-3">
                         {currentAnalysis.suggestions
                           .sort((a: SEOSuggestion, b: SEOSuggestion) => {
                             const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
                             return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - 
                                    (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
                           })
                           .map((suggestion: SEOSuggestion, index: number) => {
                          const suggestionKey = `${currentAnalysis.url}-${index}`;
                          const hasEditedProposal = proposalEdits[suggestionKey];
                          const showProposal = showProposals[suggestionKey] || false;
                          
                          const toggleProposal = () => {
                            setShowProposals(prev => ({
                              ...prev,
                              [suggestionKey]: !prev[suggestionKey]
                            }));
                          };
                          
                          return (
                            <div key={index} className="border rounded-lg p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge variant={getSeverityColor(suggestion.priority) as any}>
                                  {suggestion.priority?.toUpperCase()} Priority
                                </Badge>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{suggestion.type}</Badge>
                                   <div className="flex gap-1">
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={toggleProposal}
                                       className="text-xs"
                                     >
                                       {showProposal ? 'Hide' : 'Edit'} Fix
                                     </Button>
                                     <Button
                                       size="sm"
                                       variant="outline"
                                       onClick={() => regenerateIndividualFix(index)}
                                       disabled={regeneratingFix[suggestionKey]}
                                       className="text-xs flex items-center gap-1"
                                     >
                                       {regeneratingFix[suggestionKey] ? (
                                         <>
                                           <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                           Generating...
                                         </>
                                       ) : (
                                         <>
                                           <Sparkles className="h-3 w-3" />
                                           Regenerate
                                         </>
                                       )}
                                     </Button>
                                   </div>
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-sm text-red-600 mb-1">Issue:</p>
                                <p className="text-sm">{suggestion.issue}</p>
                              </div>
                              <div>
                                <p className="font-medium text-sm text-green-600 mb-1">Solution:</p>
                                <p className="text-sm">{suggestion.suggestion}</p>
                                {suggestion.proposedFix && (
                                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border-l-4 border-blue-400">
                                    <p className="font-medium text-sm text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                                      <Sparkles className="h-3 w-3" />
                                      AI-Generated Fix:
                                    </p>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">{suggestion.proposedFix}</p>
                                  </div>
                                )}
                              </div>
                              {suggestion.impact && (
                                <div>
                                  <p className="font-medium text-sm text-blue-600 mb-1">Expected Impact:</p>
                                  <p className="text-sm text-muted-foreground">{suggestion.impact}</p>
                                </div>
                              )}
                              
                               {showProposal && (
                                 <div className="mt-4 space-y-4">
                                   {/* Fix Alternatives */}
                                   {fixAlternatives[suggestionKey] && (
                                     <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                       <h4 className="font-medium text-sm text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
                                         <Sparkles className="h-4 w-4" />
                                         AI Generated Alternatives
                                       </h4>
                                       <div className="space-y-3">
                                         {fixAlternatives[suggestionKey].map((alternative, altIndex) => (
                                           <div 
                                             key={altIndex} 
                                             className="p-3 bg-white dark:bg-gray-800 border rounded-lg cursor-pointer hover:border-blue-300 transition-colors"
                                             onClick={() => selectFixAlternative(index, altIndex)}
                                           >
                                             <div className="flex items-start justify-between mb-2">
                                               <Badge variant="outline" className="text-xs">
                                                 Option {altIndex + 1}
                                               </Badge>
                                               <Button
                                                 size="sm"
                                                 variant="ghost"
                                                 onClick={(e) => {
                                                   e.stopPropagation();
                                                   selectFixAlternative(index, altIndex);
                                                 }}
                                                 className="h-6 px-2 text-xs"
                                               >
                                                 Select
                                               </Button>
                                             </div>
                                             <p className="text-sm font-mono text-gray-700 dark:text-gray-300 mb-2">
                                               {alternative.proposedFix}
                                             </p>
                                             <div className="text-xs text-muted-foreground">
                                               <p><strong>Approach:</strong> {alternative.approach}</p>
                                               <p><strong>Pros:</strong> {alternative.pros}</p>
                                             </div>
                                           </div>
                                         ))}
                                       </div>
                                     </div>
                                   )}

                                   {/* Editable Proposed Fix */}
                                   <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                                     <div className="flex items-center justify-between">
                                       <p className="font-medium text-sm">Proposed Fix:</p>
                                       {hasEditedProposal && (
                                         <Badge variant="secondary" className="text-xs">
                                           Modified
                                         </Badge>
                                       )}
                                     </div>
                                     <Textarea
                                       placeholder="Enter your custom fix proposal here..."
                                       value={proposalEdits[suggestionKey] || suggestion.proposedFix || suggestion.suggestion}
                                       onChange={(e) => setProposalEdits(prev => ({
                                         ...prev,
                                         [suggestionKey]: e.target.value
                                       }))}
                                       className="min-h-[80px]"
                                     />
                                     <p className="text-xs text-muted-foreground">
                                       {suggestion.proposedFix ? 
                                         "AI-generated proposed fix (you can edit this before applying)" : 
                                         "This proposal will be used when applying SEO fixes"
                                       }
                                     </p>
                                     <div className="flex gap-2 mt-3">
                                       <Button
                                         size="sm"
                                         onClick={() => applyIndividualFix(index)}
                                         disabled={applyingIndividualFix[suggestionKey] || appliedFixes[suggestionKey]}
                                         className="flex-1"
                                       >
                                         {applyingIndividualFix[suggestionKey] ? (
                                           <>
                                             <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                                             Applying...
                                           </>
                                         ) : appliedFixes[suggestionKey] ? (
                                           '✓ Applied'
                                         ) : (
                                           'Apply This Fix'
                                         )}
                                       </Button>
                                       {appliedFixes[suggestionKey] && (
                                         <Badge variant="default" className="bg-green-600">
                                           Applied
                                         </Badge>
                                       )}
                                     </div>
                                   </div>
                                 </div>
                               )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Keyword Density */}
                  {currentAnalysis.keyword_density && Object.keys(currentAnalysis.keyword_density).length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">Keyword Density</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(currentAnalysis.keyword_density).map(([keyword, density]: [string, any]) => (
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

            {/* Helpful message when no analysis is selected */}
            {!currentAnalysis && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Analysis Selected</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-4">
                    Select an analysis from the <strong>Analysis History</strong> tab to view detailed recommendations and apply individual fixes, or run a new analysis above.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                      const historyTab = document.querySelector('[value="history"]') as HTMLElement;
                      if (historyTab) historyTab.click();
                    }}>
                      View History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Analyses</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click on any analysis to select it for individual fix application. Selected analysis will appear in the SEO Analyzer tab.
                </p>
              </CardHeader>
              <CardContent>
                {analyses.length > 0 ? (
                  <div className="space-y-4">
                     {analyses.map((analysis) => (
                       <div 
                         key={analysis.id} 
                         className={`border rounded-lg p-4 transition-colors cursor-pointer ${
                           currentAnalysis?.id === analysis.id 
                             ? 'bg-primary/10 border-primary' 
                             : 'hover:bg-muted/30'
                         }`}
                         onClick={() => selectAnalysisForWork(analysis)}
                       >
                         <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-3">
                             <h3 className="font-medium">{analysis.title}</h3>
                             <Badge variant="outline">{analysis.seo_score}/100</Badge>
                             {currentAnalysis?.id === analysis.id && (
                               <Badge variant="default" className="bg-primary">
                                 <CheckCircle className="h-3 w-3 mr-1" />
                                 Selected
                               </Badge>
                             )}
                           </div>
                           <div className="flex items-center gap-2">
                             <span className="text-sm text-muted-foreground">
                               {new Date(analysis.created_at).toLocaleDateString()}
                             </span>
                             {analysis.suggestions && analysis.suggestions.length > 0 && (
                               <Button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   openFixPreview(analysis);
                                 }}
                                 size="sm"
                                 variant="outline"
                                 className="flex items-center gap-1"
                               >
                                 <Sparkles className="h-3 w-3" />
                                 Preview & Apply All
                               </Button>
                             )}
                           </div>
                         </div>
                        <p className="text-sm text-muted-foreground mb-2">{analysis.url}</p>
                        <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                          <div>Title: <span className={getScoreColor(analysis.title_score)}>{analysis.title_score}</span></div>
                          <div>Meta: <span className={getScoreColor(analysis.meta_description_score)}>{analysis.meta_description_score}</span></div>
                          <div>Content: <span className={getScoreColor(analysis.content_score)}>{analysis.content_score}</span></div>
                        </div>
                        {analysis.suggestions && analysis.suggestions.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {analysis.suggestions.length} improvement suggestions available
                          </p>
                        )}
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
      
      {selectedAnalysisForFix && (
        <SEOFixPreview
          open={fixPreviewOpen}
          onOpenChange={setFixPreviewOpen}
          analysis={selectedAnalysisForFix}
          postId={selectedAnalysisForFix.postId}
          onFixesApplied={handleFixesApplied}
        />
      )}
    </div>
  );
};

export default SEOAudit;