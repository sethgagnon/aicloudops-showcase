import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ArrowRight, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  tags: string[];
  created_at: string;
  cover_image?: string;
}

const BlogPreview = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestPosts();
  }, []);

  const fetchLatestPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, excerpt, slug, tags, created_at, cover_image')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        throw error;
      }

      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateReadTime = (excerpt: string) => {
    const words = excerpt?.split(' ').length || 0;
    return Math.ceil(words / 200) || 1; // Assuming 200 words per minute, minimum 1 min
  };

  const getTagColor = (tag: string) => {
    const colors = {
      'AI': 'bg-primary/10 text-primary',
      'Cloud': 'bg-accent/10 text-accent',
      'Leadership': 'bg-primary-glow/10 text-primary-glow',
      'DevOps': 'bg-secondary/10 text-secondary-foreground',
      'Strategy': 'bg-muted text-muted-foreground',
      'Security': 'bg-destructive/10 text-destructive',
      'Culture': 'bg-success/10 text-success',
      'Remote Work': 'bg-accent-soft/20 text-accent',
      'Technology': 'bg-blue-500/10 text-blue-600',
      'Development': 'bg-green-500/10 text-green-600',
      'Design': 'bg-purple-500/10 text-purple-600',
      'Tutorial': 'bg-orange-500/10 text-orange-600',
      'News': 'bg-red-500/10 text-red-600',
      'Opinion': 'bg-yellow-500/10 text-yellow-600',
    };
    return colors[tag as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Latest Insights
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Deep dives into AI, cloud architecture, and leadership strategies 
              for the modern enterprise.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-elegant animate-pulse">
                <div className="space-y-3 p-6">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                  <div className="flex gap-2 pt-4">
                    <div className="h-6 bg-muted rounded-full w-16"></div>
                    <div className="h-6 bg-muted rounded-full w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return (
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Latest Insights
            </h2>
            <p className="text-xl text-muted-foreground">
              No articles published yet. Check back soon for the latest insights!
            </p>
            <Link 
              to="/blog"
              className="btn-outline inline-flex items-center group mt-6"
            >
              View All Posts
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Latest Insights
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Deep dives into AI, cloud architecture, and leadership strategies 
            for the modern enterprise.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {posts.map((post) => (
            <article key={post.id} className="card-elegant group cursor-pointer">
              <Link to={`/blog/${post.slug}`} className="block">
                {/* Post Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {calculateReadTime(post.excerpt)} min
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                {/* Tags and Read More */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                    {post.tags.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{post.tags.length - 2} more
                      </span>
                    )}
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </Link>
            </article>
          ))}
        </div>

        {/* View All Posts CTA */}
        <div className="text-center">
          <Link 
            to="/blog"
            className="btn-outline inline-flex items-center group"
          >
            View All Posts
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;