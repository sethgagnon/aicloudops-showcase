import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Share2, Tag, User, Copy, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useFreeArticle } from '@/hooks/useFreeArticle';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import SignupPrompt from '@/components/SignupPrompt';
import FreeArticleBanner from '@/components/FreeArticleBanner';

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
  const [shareOpen, setShareOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { canReadFreeArticle, markArticleAsRead } = useFreeArticle();

  useEffect(() => {
    if (!authLoading && slug) {
      // Allow unauthenticated users if they can still read free articles
      if (!user && !canReadFreeArticle()) {
        navigate(`/auth?return=/blog/${slug}`);
        return;
      }
      
      fetchPost(slug);
    }
  }, [slug, user, authLoading, navigate, canReadFreeArticle]);

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
      
      // Mark article as read for unauthenticated users
      if (!user) {
        markArticleAsRead();
      }
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

  const getShareData = () => {
    const url = window.location.href;
    const title = post?.title || '';
    const description = post?.excerpt || '';
    return { url, title, description };
  };

  const copyToClipboard = async () => {
    const { url } = getShareData();
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "The article URL has been copied to your clipboard.",
      });
      setShareOpen(false);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        toast({
          title: "Link copied!",
          description: "The article URL has been copied to your clipboard.",
        });
        setShareOpen(false);
      } catch (err) {
        toast({
          title: "Copy failed",
          description: "Unable to copy the link. Please copy the URL manually.",
          variant: "destructive"
        });
      }
      document.body.removeChild(textArea);
    }
  };

  const shareToSocialMedia = (platform: string) => {
    const { url, title, description } = getShareData();
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'reddit':
        shareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`;
        break;
      default:
        return;
    }
    
    if (platform === 'email') {
      window.location.href = shareUrl;
    } else {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    setShareOpen(false);
  };

  const handleNativeShare = async () => {
    const { url, title, description } = getShareData();
    const shareData = { title, text: description, url };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        setShareOpen(false);
        return;
      }
    } catch (error) {
      console.log('Web Share API failed, showing platform options');
    }
    
    // If native share is not available, we'll show the popover with platform options
    setShareOpen(true);
  };

  const shareOptions = [
    { name: 'LinkedIn', key: 'linkedin', color: 'text-blue-600', bgColor: 'hover:bg-blue-50' },
    { name: 'Facebook', key: 'facebook', color: 'text-blue-800', bgColor: 'hover:bg-blue-50' },
    { name: 'Twitter', key: 'twitter', color: 'text-sky-500', bgColor: 'hover:bg-sky-50' },
    { name: 'Reddit', key: 'reddit', color: 'text-orange-600', bgColor: 'hover:bg-orange-50' },
    { name: 'Email', key: 'email', color: 'text-gray-600', bgColor: 'hover:bg-gray-50' },
  ];

  if (authLoading || loading) {
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

  const sanitizedContent = DOMPurify.sanitize(post.content, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'width', 'height', 'autoplay', 'cclanguage', 'disablekbcontrols', 'enableiframeapi', 'endtime', 'interfacelanguage', 'ivloadpolicy', 'loop', 'modestbranding', 'origin', 'playlist', 'rel', 'start'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|xxx|youtube):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });

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
      <FreeArticleBanner />
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
                
                
                <Popover open={shareOpen} onOpenChange={setShareOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={handleNativeShare}
                      className="inline-flex items-center"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Article
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" align="end">
                    <div className="space-y-1">
                      <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                        Share this article
                      </div>
                      {shareOptions.map((option) => (
                        <button
                          key={option.key}
                          onClick={() => shareToSocialMedia(option.key)}
                          className={`w-full flex items-center px-2 py-2 text-sm rounded-md transition-colors ${option.bgColor} ${option.color}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          {option.name}
                        </button>
                      ))}
                      <div className="border-t border-border mt-1 pt-1">
                        <button
                          onClick={copyToClipboard}
                          className="w-full flex items-center px-2 py-2 text-sm rounded-md transition-colors hover:bg-muted text-foreground"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </header>

            {/* Article Content */}
              <article className="prose prose-lg max-w-none">
                <div 
                  className="text-foreground leading-relaxed rich-content"
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
              </article>

              {/* Show signup prompt for unauthenticated users who have used their free article */}
              {!user && !canReadFreeArticle() && (
                <div className="mt-12">
                  <SignupPrompt />
                </div>
              )}

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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="end">
                      <div className="space-y-1">
                        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                          Share this article
                        </div>
                        {shareOptions.map((option) => (
                          <button
                            key={option.key}
                            onClick={() => shareToSocialMedia(option.key)}
                            className={`w-full flex items-center px-2 py-2 text-sm rounded-md transition-colors ${option.bgColor} ${option.color}`}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {option.name}
                          </button>
                        ))}
                        <div className="border-t border-border mt-1 pt-1">
                          <button
                            onClick={copyToClipboard}
                            className="w-full flex items-center px-2 py-2 text-sm rounded-md transition-colors hover:bg-muted text-foreground"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
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