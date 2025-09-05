import { useState } from 'react';
import { Download, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface WordPressPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  slug: string;
  status: string;
  date: string;
  tags: number[];
  categories: number[];
  _embedded?: {
    'wp:term'?: Array<Array<{ name: string }>>;
  };
}

interface ImportablePost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  date: string;
  tags: string[];
  selected: boolean;
}

const WordPressImport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [siteUrl, setSiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [posts, setPosts] = useState<ImportablePost[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const cleanContent = (content: string) => {
    // Remove WordPress shortcodes, then sanitize HTML thoroughly
    const noShortcodes = content.replace(/\[\/?\w+[^\]]*\]/g, '').trim();
    return DOMPurify.sanitize(noShortcodes);
  };

  const generateSlug = (title: string, originalSlug: string) => {
    // Use original slug if available, otherwise generate from title
    if (originalSlug && originalSlug !== '') {
      return originalSlug.toLowerCase().replace(/[^a-z0-9\-]/g, '');
    }
    return title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const fetchWordPressPosts = async () => {
    if (!siteUrl.trim()) {
      toast({
        title: "URL required",
        description: "Please enter your WordPress site URL.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Clean and validate URL
      let cleanUrl = siteUrl.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = 'https://' + cleanUrl;
      }
      
      // Remove trailing slash
      cleanUrl = cleanUrl.replace(/\/$/, '');
      
      const apiUrl = `${cleanUrl}/wp-json/wp/v2/posts?per_page=50&status=publish&_embed=true`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
      }
      
      const wordpressPosts: WordPressPost[] = await response.json();
      
      const importablePosts: ImportablePost[] = wordpressPosts.map((post) => {
        const tags: string[] = [];
        
        // Extract tags from embedded data
        if (post._embedded && post._embedded['wp:term']) {
          post._embedded['wp:term'].forEach(termGroup => {
            termGroup.forEach(term => {
              if (term.name && !tags.includes(term.name)) {
                tags.push(term.name);
              }
            });
          });
        }

        return {
          id: post.id,
          title: post.title.rendered.replace(/&#\d+;/g, '').trim(),
          content: cleanContent(post.content.rendered),
          excerpt: DOMPurify.sanitize(post.excerpt.rendered, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).replace(/&#\d+;/g, '').trim(),
          slug: generateSlug(post.title.rendered, post.slug),
          date: post.date,
          tags: tags.slice(0, 5), // Limit to 5 tags
          selected: true
        };
      });

      setPosts(importablePosts);
      setShowPreview(true);
      
      toast({
        title: "Posts fetched successfully",
        description: `Found ${importablePosts.length} posts from your WordPress site.`
      });
    } catch (error: any) {
      console.error('Error fetching WordPress posts:', error);
      toast({
        title: "Failed to fetch posts",
        description: error.message || "Please check your WordPress site URL and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePostSelection = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, selected: !post.selected } : post
    ));
  };

  const selectAllPosts = (selected: boolean) => {
    setPosts(posts.map(post => ({ ...post, selected })));
  };

  const importSelectedPosts = async () => {
    const selectedPosts = posts.filter(post => post.selected);
    
    if (selectedPosts.length === 0) {
      toast({
        title: "No posts selected",
        description: "Please select at least one post to import.",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const post of selectedPosts) {
        try {
          // Check if post with same slug already exists
          const { data: existingPost } = await supabase
            .from('posts')
            .select('id')
            .eq('slug', post.slug)
            .single();

          if (existingPost) {
            console.log(`Skipping duplicate post: ${post.title}`);
            continue;
          }

          // Insert post
          const { error: postError } = await supabase
            .from('posts')
            .insert([{
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt || post.content.slice(0, 200) + '...',
              content: post.content,
              tags: post.tags,
              status: 'published',
              author_id: user?.id,
              created_at: post.date,
              updated_at: new Date().toISOString()
            }]);

          if (postError) {
            throw postError;
          }

          // Update tags table
          for (const tag of post.tags) {
            const tagSlug = tag.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
            await supabase
              .from('tags')
              .upsert([{ name: tag, slug: tagSlug }], { onConflict: 'name' });
          }

          successCount++;
        } catch (error) {
          console.error(`Error importing post "${post.title}":`, error);
          errorCount++;
        }
      }

      toast({
        title: "Import completed",
        description: `Successfully imported ${successCount} posts. ${errorCount > 0 ? `${errorCount} posts failed to import.` : ''}`
      });

      if (successCount > 0) {
        setShowPreview(false);
        setPosts([]);
        setSiteUrl('');
      }
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = posts.filter(post => post.selected).length;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Download className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Import from WordPress</h2>
      </div>

      {!showPreview ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              WordPress Site URL
            </label>
            <Input
              type="url"
              placeholder="https://yoursite.com or yoursite.com"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Enter your WordPress site URL. We'll fetch published posts via the REST API.
            </p>
          </div>
          
          <Button
            onClick={fetchWordPressPosts}
            disabled={loading || !siteUrl.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Fetching Posts...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Fetch Posts
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-medium text-foreground">
                Found {posts.length} posts
              </h3>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedCount === posts.length}
                  onCheckedChange={(checked) => selectAllPosts(checked as boolean)}
                />
                <span className="text-sm text-muted-foreground">
                  Select all ({selectedCount} selected)
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setShowPreview(false);
                setPosts([]);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-3 border rounded-lg p-4">
            {posts.map((post) => (
              <div key={post.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <Checkbox
                  checked={post.selected}
                  onCheckedChange={() => togglePostSelection(post.id)}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground line-clamp-1">
                    {post.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                    {post.tags.length > 0 && (
                      <span>Tags: {post.tags.join(', ')}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={importSelectedPosts}
              disabled={importing || selectedCount === 0}
              className="flex-1"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing {selectedCount} posts...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Import {selectedCount} Posts
                </>
              )}
            </Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Import Notes:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Posts will be imported as "published" status</li>
                  <li>• Duplicate posts (same slug) will be skipped</li>
                  <li>• HTML content will be cleaned and shortcodes removed</li>
                  <li>• Original publication date will be preserved</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default WordPressImport;