import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Share2, Tag, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

interface BlogPostData {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  tags: string[];
  created_at: string;
  author_id: string;
}

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
    }
  }, [slug]);

  const fetchPost = async (postSlug: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', postSlug)
        .eq('status', 'published')
        .single();

      if (error || !data) {
        setNotFound(true);
        return;
      }

      setPost(data);
    } catch (error) {
      console.error('Error fetching post:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content ? content.split(/\s+/).length : 0;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const getTagColor = (tag: string) => {
    const colors = {
      'AI': 'bg-primary/10 text-primary border-primary/20',
      'Cloud': 'bg-accent/10 text-accent border-accent/20',
      'Leadership': 'bg-primary-glow/10 text-primary-glow border-primary-glow/20',
      'DevOps': 'bg-secondary/10 text-secondary-foreground border-secondary/20',
      'Strategy': 'bg-muted text-muted-foreground border-border',
      'Security': 'bg-destructive/10 text-destructive border-destructive/20',
      'Culture': 'bg-success/10 text-success border-success/20',
      'Remote Work': 'bg-accent-soft/20 text-accent border-accent/20'
    };
    return colors[tag as keyof typeof colors] || 'bg-muted text-muted-foreground border-border';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-8">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/blog" className="btn-hero">
              Back to Blog
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const sanitizedContent = DOMPurify.sanitize(post.content);

  // Create structured data for the blog post
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "author": {
      "@type": "Person",
      "name": "Seth Gagnon",
      "url": "https://aicloudops.tech/about"
    },
    "publisher": {
      "@type": "Person",
      "name": "Seth Gagnon",
      "url": "https://aicloudops.tech"
    },
    "datePublished": post.created_at,
    "dateModified": post.created_at,
    "url": `https://aicloudops.tech/blog/${post.slug}`,
    "keywords": post.tags?.join(", "),
    "wordCount": post.content ? post.content.split(/\s+/).length : 0,
    "timeRequired": `PT${calculateReadTime(post.content)}M`,
    "articleSection": "Technology"
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${post.title} | Seth Gagnon - AI Cloud Ops`}
        description={post.excerpt}
        keywords={`${post.tags?.join(", ")}, Seth Gagnon, AI leadership, cloud strategy`}
        canonical={`https://aicloudops.tech/blog/${post.slug}`}
        ogType="article"
        structuredData={structuredData}
      />
      <Navigation />
      
      <main>
        {/* Back Navigation */}
        <section className="py-8 bg-muted/20 border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link 
              to="/blog"
              className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </div>
        </section>

        {/* Article Header */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <header className="mb-12">
              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Seth Gagnon
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {calculateReadTime(post.content)} min read
                </div>
              </div>

              {/* Title */}
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Excerpt */}
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {post.excerpt}
              </p>

              {/* Tags and Share */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-border">
                <div className="flex flex-wrap gap-2">
                  {(post.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTagColor(tag)}`}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
                
                <button className="btn-outline inline-flex items-center">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Article
                </button>
              </div>
            </header>

            {/* Article Content */}
              <article className="prose prose-lg max-w-none">
                <div 
                  className="text-foreground leading-relaxed rich-content"
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
              </article>

            {/* Article Footer */}
            <footer className="mt-16 pt-8 border-t border-border">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Written by Seth Gagnon
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Technology executive specializing in AI strategy and cloud architecture
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button className="btn-outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </button>
                  <Link to="/contact" className="btn-secondary">
                    Contact Author
                  </Link>
                </div>
              </div>
            </footer>
          </div>
        </section>

        {/* Related Posts CTA */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Explore More Insights
            </h2>
            <p className="text-muted-foreground mb-8">
              Discover more articles on AI leadership, cloud strategy, and team management
            </p>
            <Link to="/blog" className="btn-hero">
              View All Articles
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;