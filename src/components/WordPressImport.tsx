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
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  slug: string;
  status: string;
  date: string;
  tags: number[];
  categories: number[];
  _embedded?: {
    'wp:term'?: Array<Array<{
      name: string;
    }>>;
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
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [siteUrl, setSiteUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [posts, setPosts] = useState<ImportablePost[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const cleanContent = (content: string) => {
    // Remove WordPress shortcodes, then sanitize HTML thoroughly
    const noShortcodes = content.replace(/\[\/?\w+[^\]]*\]/g, '').trim();
    return DOMPurify.sanitize(noShortcodes, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'],
      ALLOWED_ATTR: []
    });
  };
  const generateSlug = (title: string, originalSlug: string) => {
    // Use original slug if available, otherwise generate from title
    if (originalSlug && originalSlug !== '') {
      return originalSlug.toLowerCase().replace(/[^a-z0-9\-]/g, '');
    }
    return title.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').trim();
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
      const importablePosts: ImportablePost[] = wordpressPosts.map(post => {
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
          excerpt: DOMPurify.sanitize(post.excerpt.rendered, {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: []
          }).replace(/&#\d+;/g, '').trim(),
          slug: generateSlug(post.title.rendered, post.slug),
          date: post.date,
          tags: tags.slice(0, 5),
          // Limit to 5 tags
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
    setPosts(posts.map(post => post.id === postId ? {
      ...post,
      selected: !post.selected
    } : post));
  };
  const selectAllPosts = (selected: boolean) => {
    setPosts(posts.map(post => ({
      ...post,
      selected
    })));
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
          const {
            data: existingPost
          } = await supabase.from('posts').select('id').eq('slug', post.slug).single();
          if (existingPost) {
            console.log(`Skipping duplicate post: ${post.title}`);
            continue;
          }

          // Insert post
          const {
            error: postError
          } = await supabase.from('posts').insert([{
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
            await supabase.from('tags').upsert([{
              name: tag,
              slug: tagSlug
            }], {
              onConflict: 'name'
            });
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
  return;
};
export default WordPressImport;