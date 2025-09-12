import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, ExternalLink, CheckCircle, AlertCircle, Globe, Clock, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const AdminSitemap = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [sitemapStats, setSitemapStats] = useState({
    totalUrls: 0,
    blogPosts: 0,
    staticPages: 0,
  });
  const [sitemapPreview, setSitemapPreview] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      try {
        const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
        setIsAdmin(!!data);
        if (!data) {
          navigate('/admin');
        }
      } catch {
        setIsAdmin(false);
        navigate('/admin');
      }
    };
    if (user) checkAdmin();
  }, [user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchSitemapStats();
    }
  }, [isAdmin]);

  const fetchSitemapStats = async () => {
    try {
      // Get published posts count
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id')
        .eq('status', 'published');

      if (postsError) throw postsError;

      // Get static pages count
      const { data: pages, error: pagesError } = await supabase
        .from('static_pages')
        .select('id');

      if (pagesError) console.error('Error fetching static pages:', pagesError);

      const blogPostsCount = posts?.length || 0;
      const staticPagesCount = (pages?.length || 0) + 4; // +4 for default pages (home, about, blog, contact)
      
      setSitemapStats({
        totalUrls: blogPostsCount + staticPagesCount,
        blogPosts: blogPostsCount,
        staticPages: staticPagesCount,
      });
    } catch (error: any) {
      console.error('Error fetching sitemap stats:', error);
    }
  };

  const generateSitemap = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-sitemap', {
        method: 'GET',
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate sitemap');
      }

      setLastGenerated(new Date());
      setSitemapPreview(data ? data.slice(0, 1000) + '...' : '');
      
      toast({
        title: "Sitemap generated successfully",
        description: "The sitemap has been updated with the latest content.",
      });

      // Refresh stats
      await fetchSitemapStats();
    } catch (error: any) {
      console.error('Error generating sitemap:', error);
      toast({
        title: "Error generating sitemap",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/admin')}
              className="btn-outline inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Sitemap Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage and monitor your website's sitemap for SEO
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card-elegant p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total URLs</p>
                  <p className="text-2xl font-bold text-foreground">{sitemapStats.totalUrls}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>

            <div className="card-elegant p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blog Posts</p>
                  <p className="text-2xl font-bold text-foreground">{sitemapStats.blogPosts}</p>
                </div>
                <div className="p-3 bg-accent/10 rounded-full">
                  <CheckCircle className="h-5 w-5 text-accent" />
                </div>
              </div>
            </div>

            <div className="card-elegant p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Static Pages</p>
                  <p className="text-2xl font-bold text-foreground">{sitemapStats.staticPages}</p>
                </div>
                <div className="p-3 bg-secondary/10 rounded-full">
                  <AlertCircle className="h-5 w-5 text-secondary-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Sitemap Actions */}
          <div className="card-elegant p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Sitemap Generation</h2>
                <p className="text-muted-foreground">
                  Generate an updated sitemap with all your latest content
                </p>
                {lastGenerated && (
                  <p className="text-sm text-muted-foreground mt-2 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Last generated: {lastGenerated.toLocaleString()}
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={generateSitemap}
                  disabled={generating}
                  className="btn-hero inline-flex items-center"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                  {generating ? 'Generating...' : 'Generate Sitemap'}
                </button>
                
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline inline-flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Sitemap
                </a>
              </div>
            </div>
          </div>

          {/* Sitemap Preview */}
          {sitemapPreview && (
            <div className="card-elegant">
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-semibold text-foreground">Sitemap Preview</h2>
                <p className="text-muted-foreground">Latest generated sitemap content</p>
              </div>
              <div className="p-6">
                <pre className="bg-muted/50 p-4 rounded-lg text-sm overflow-x-auto text-muted-foreground border border-border">
                  {sitemapPreview}
                </pre>
                <div className="mt-4 text-center">
                  <a
                    href="/sitemap.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 text-sm"
                  >
                    View full sitemap →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* SEO Tips */}
          <div className="card-elegant mt-8">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">SEO Best Practices</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Automatic Updates</p>
                    <p className="text-muted-foreground">Your sitemap automatically includes new blog posts when published.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Search Console Submission</p>
                    <p className="text-muted-foreground">Submit your sitemap to Google Search Console for better indexing.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Priority & Frequency</p>
                    <p className="text-muted-foreground">Pages are automatically assigned priorities and update frequencies for optimal SEO.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminSitemap;