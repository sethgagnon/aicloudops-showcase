import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Send, Tag as TagIcon, X, CalendarIcon, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import AIAssistant from '@/components/AIAssistant';
import { PublishDialog } from '@/components/PublishDialog';

interface PostData {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  status: 'draft' | 'published' | 'scheduled';
  scheduled_at: string;
}

const PostEditor = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [post, setPost] = useState<PostData>({
    title: '',
    excerpt: '',
    content: '',
    tags: [],
    status: 'draft',
    scheduled_at: ''
  });
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchAvailableTags();
    if (isEditing && id) {
      fetchPost(id);
    }
  }, [isEditing, id]);

  const fetchAvailableTags = async () => {
    try {
      const { data } = await supabase
        .from('tags')
        .select('name')
        .order('name');
      
      if (data) {
        setAvailableTags(data.map(tag => tag.name));
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchPost = async (postId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .eq('author_id', user?.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setPost({
          title: data.title,
          excerpt: data.excerpt || '',
          content: data.content,
          tags: data.tags || [],
          status: data.status as 'draft' | 'published' | 'scheduled',
          scheduled_at: data.scheduled_at ? data.scheduled_at.slice(0, 16) : ''
        });
      }
    } catch (error: any) {
      toast({
        title: "Error loading post",
        description: error.message,
        variant: "destructive"
      });
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const savePost = async (status: 'draft' | 'published' | 'scheduled') => {
    if (!post.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your post.",
        variant: "destructive"
      });
      return;
    }

    if (!post.content.trim()) {
      toast({
        title: "Content required", 
        description: "Please write some content for your post.",
        variant: "destructive"
      });
      return;
    }

    if (status === 'scheduled' && !post.scheduled_at) {
      toast({
        title: "Schedule date required",
        description: "Please select a date and time to schedule your post.",
        variant: "destructive"
      });
      return;
    }

    if (status === 'scheduled' && post.scheduled_at) {
      const scheduledDate = new Date(post.scheduled_at);
      const now = new Date();
      if (scheduledDate <= now) {
        toast({
          title: "Invalid schedule date",
          description: "Scheduled date must be in the future.",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      setLoading(true);

      const slug = generateSlug(post.title);
      const postData = {
        title: post.title,
        slug: slug,
        excerpt: post.excerpt || post.content.slice(0, 200) + '...',
        content: post.content,
        tags: post.tags,
        status: status,
        scheduled_at: status === 'scheduled' && post.scheduled_at ? post.scheduled_at : null,
        author_id: user?.id
      };

      let result;
      if (isEditing) {
        result = await supabase
          .from('posts')
          .update(postData)
          .eq('id', id)
          .eq('author_id', user?.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('posts')
          .insert([postData])
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      // Update tags table
      for (const tag of post.tags) {
        const tagSlug = generateSlug(tag);
        await supabase
          .from('tags')
          .upsert([{ name: tag, slug: tagSlug }], { onConflict: 'name' });
      }

      toast({
        title: `Post ${isEditing ? 'updated' : 'created'}`,
        description: `Your post has been ${status === 'published' ? 'published' : status === 'scheduled' ? 'scheduled' : 'saved as draft'}.`
      });

      if (status === 'published') {
        navigate(`/blog/${slug}`);
      } else {
        navigate('/admin');
      }
    } catch (error: any) {
      toast({
        title: `Error ${isEditing ? 'updating' : 'creating'} post`,
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !post.tags.includes(trimmedTag)) {
      setPost({ ...post, tags: [...post.tags, trimmedTag] });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPost({ ...post, tags: post.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const handleAIContentGenerated = async (aiContent: any) => {
    setPost(prev => ({
      ...prev,
      title: aiContent.title,
      excerpt: aiContent.excerpt,
      content: aiContent.content,
      tags: [...new Set([...prev.tags, ...aiContent.tags])], // Merge tags without duplicates
    }));
    
    // Auto-save as draft after AI content generation
    setTimeout(() => {
      savePost('draft');
    }, 100);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/admin"
                className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors duration-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  {isEditing ? 'Edit Post' : 'New Post'}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => savePost('draft')}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              
              <Button
                onClick={() => setPublishDialogOpen(true)}
                disabled={loading}
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <input
                type="text"
                placeholder="Post title..."
                value={post.title}
                onChange={(e) => setPost({ ...post, title: e.target.value })}
                className="w-full text-3xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground resize-none"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Excerpt (Optional)
              </label>
              <Textarea
                placeholder="Brief description of your post..."
                value={post.excerpt}
                onChange={(e) => setPost({ ...post, excerpt: e.target.value })}
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Content
              </label>
              <RichTextEditor
                content={post.content}
                onChange={(content) => setPost({ ...post, content })}
                placeholder="Start writing your post content here..."
              />
              <p className="text-sm text-muted-foreground mt-2">
                Use the toolbar above to format your text, add images, and create rich content.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Assistant */}
            <AIAssistant onContentGenerated={handleAIContentGenerated} />
            {/* Publishing Status */}
            {post.status === 'scheduled' && post.scheduled_at && (
              <div className="card-elegant p-6">
                <h3 className="font-semibold text-foreground mb-4">Publishing</h3>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Scheduled for:</strong><br />
                    {format(new Date(post.scheduled_at), "PPP 'at' p")}
                  </p>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="card-elegant p-6">
              <h3 className="font-semibold text-foreground mb-4">Tags</h3>
              
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onBlur={() => {
                      if (tagInput.trim()) {
                        addTag(tagInput);
                      }
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Press Enter or comma to add tag
                  </p>
                </div>

                {/* Current Tags */}
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm"
                    >
                      <TagIcon className="h-3 w-3 mr-1" />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Available Tags */}
                {availableTags.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Suggested tags:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {availableTags
                        .filter(tag => !post.tags.includes(tag))
                        .slice(0, 8)
                        .map((tag) => (
                          <button
                            key={tag}
                            onClick={() => addTag(tag)}
                            className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        post={post}
        onPost={setPost}
        onPublishNow={() => {
          setPublishDialogOpen(false);
          savePost('published');
        }}
        onSchedule={(scheduledAt) => {
          setPost(prev => ({ ...prev, scheduled_at: scheduledAt, status: 'scheduled' }));
          setPublishDialogOpen(false);
          savePost('scheduled');
        }}
        loading={loading}
      />
    </div>
  );
};

export default PostEditor;