import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  created_at: string;
}

interface SelectedPage {
  id: string;
  type: 'post' | 'page';
  title: string;
  url: string;
  content: string;
}

interface ContentPickerProps {
  onPageSelected: (page: SelectedPage | null) => void;
  selectedPage: SelectedPage | null;
}

export function ContentPicker({ onPageSelected, selectedPage }: ContentPickerProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, slug, content, status, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectPost = (post: Post) => {
    const page: SelectedPage = {
      id: post.id,
      type: 'post',
      title: post.title,
      url: `/blog/${post.slug}`,
      content: post.content
    };
    onPageSelected(page);
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="text-muted-foreground">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Select a published post to analyze for SEO opportunities:
      </div>

      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {posts.map((post) => (
          <Card 
            key={post.id} 
            className={`cursor-pointer transition-colors hover:bg-accent ${
              selectedPage?.id === post.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => selectPost(post)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <FileText className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{post.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Post
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        /blog/{post.slug}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/blog/${post.slug}`, '_blank');
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  {selectedPage?.id === post.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPageSelected(null);
                      }}
                    >
                      Deselect
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No published posts found. Create and publish a post first.
          </div>
        )}
      </div>

      {selectedPage && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="text-sm">
              <div className="font-medium">Selected for Analysis:</div>
              <div className="text-muted-foreground mt-1">
                {selectedPage.title} ({selectedPage.url})
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}