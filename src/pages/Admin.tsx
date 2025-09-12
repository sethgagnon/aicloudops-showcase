import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Calendar, Clock, Tag as TagIcon, Users, LogOut, BarChart3, TrendingUp, Globe, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';


interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: 'draft' | 'published' | 'scheduled';
  created_at: string;
  updated_at: string;
  tags: string[];
  scheduled_at?: string;
}


const Admin = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      try {
        const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
        setIsAdmin(!!data);
      } catch {
        setIsAdmin(false);
      }
    };
    if (user) checkAdmin();
  }, [user]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPosts((data || []).map(post => ({
        ...post,
        status: post.status as 'draft' | 'published' | 'scheduled'
      })));
    } catch (error: any) {
      toast({
        title: "Error fetching posts",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const deletePost = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setPosts(posts.filter(post => post.id !== id));
      toast({
        title: "Post deleted",
        description: "The post has been successfully deleted."
      });
    } catch (error: any) {
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default:
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    }
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
      <Navigation />
      
      <main className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage your blog posts and content
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/admin/new')}
                className="btn-hero inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => navigate('/admin/users')}
                    className="btn-outline inline-flex items-center"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Users
                  </button>
                  <button
                    onClick={() => navigate('/admin/analytics')}
                    className="btn-outline inline-flex items-center"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </button>
                  <button
                    onClick={() => navigate('/admin/polls')}
                    className="btn-outline inline-flex items-center"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Polls
                  </button>
                  <button
                    onClick={() => navigate('/admin/sitemap')}
                    className="btn-outline inline-flex items-center"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Sitemap
                  </button>
                  <button
                    onClick={() => navigate('/admin/security')}
                    className="btn-outline inline-flex items-center"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Security
                  </button>
                </>
              )}
               <button
                 onClick={handleSignOut}
                 className="btn-outline inline-flex items-center"
               >
                 <LogOut className="h-4 w-4 mr-2" />
                 Sign Out
               </button>
             </div>
           </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card-elegant p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                  <p className="text-2xl font-bold text-foreground">{posts.length}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <Edit className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>

            <div className="card-elegant p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold text-foreground">
                    {posts.filter(p => p.status === 'published').length}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <Eye className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="card-elegant p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Drafts</p>
                  <p className="text-2xl font-bold text-foreground">
                    {posts.filter(p => p.status === 'draft').length}
                  </p>
                </div>
                <div className="p-3 bg-orange-500/10 rounded-full">
                  <Edit className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="card-elegant p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="text-2xl font-bold text-foreground">
                    {posts.filter(p => p.status === 'scheduled').length}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-full">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>

          </div>


          {/* Posts List */}
          <div className="card-elegant overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Your Posts</h2>
            </div>

            {posts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mb-4">
                  <Edit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No posts yet
                  </h3>
                  <p className="text-muted-foreground">
                    Create your first blog post to get started.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/admin/new')}
                  className="btn-hero"
                >
                  Create Your First Post
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {posts.map((post) => (
                  <div key={post.id} className="p-6 hover:bg-muted/20 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {post.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(post.status)}`}>
                            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </span>
                        </div>
                        
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {post.excerpt}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            Updated {new Date(post.updated_at).toLocaleDateString()}
                          </span>
                          {post.status === 'scheduled' && post.scheduled_at && (
                            <span className="flex items-center text-blue-600">
                              <Calendar className="h-4 w-4 mr-1" />
                              Scheduled: {format(new Date(post.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                          )}
                          {post.tags.length > 0 && (
                            <span className="flex items-center">
                              <TagIcon className="h-4 w-4 mr-1" />
                              {post.tags.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {post.status === 'published' && (
                          <button
                            onClick={() => navigate(`/blog/${post.slug}`)}
                            className="btn-outline inline-flex items-center"
                            title="View Post"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/admin/edit/${post.id}`)}
                          className="btn-outline inline-flex items-center"
                          title="Edit Post"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="btn-outline inline-flex items-center text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                          title="Delete Post"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;