import { Calendar, Clock, ArrowRight, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

// Mock blog data - in real app this would come from Supabase
const blogPosts = [
  {
    id: 1,
    title: "Building AI-First Organizations: A Leadership Framework",
    excerpt: "How enterprise leaders can structure their organizations to leverage AI effectively while maintaining human-centered decision making.",
    slug: "ai-first-organizations-leadership-framework",
    tags: ["AI", "Leadership"],
    publishedAt: "2024-01-15",
    readTime: "8 min",
    coverImage: null
  },
  {
    id: 2,
    title: "Cloud Migration Strategies for Enterprise Scale",
    excerpt: "Proven methodologies for moving critical workloads to the cloud without disrupting business operations.",
    slug: "cloud-migration-strategies-enterprise",
    tags: ["Cloud", "Strategy"],
    publishedAt: "2024-01-10",
    readTime: "12 min",
    coverImage: null
  },
  {
    id: 3,
    title: "The Future of DevOps: AI-Powered Operations",
    excerpt: "Exploring how artificial intelligence is revolutionizing DevOps practices and operational efficiency.",
    slug: "future-devops-ai-powered-operations",
    tags: ["AI", "DevOps", "Cloud"],
    publishedAt: "2024-01-05",
    readTime: "10 min",
    coverImage: null
  },
  {
    id: 4,
    title: "Leading Remote Engineering Teams",
    excerpt: "Best practices for managing distributed engineering teams and maintaining productivity in remote environments.",
    slug: "leading-remote-engineering-teams",
    tags: ["Leadership", "Remote Work"],
    publishedAt: "2024-01-01",
    readTime: "6 min",
    coverImage: null
  },
  {
    id: 5,
    title: "Kubernetes Security: Enterprise Best Practices",
    excerpt: "Comprehensive security guidelines for running Kubernetes clusters in production enterprise environments.",
    slug: "kubernetes-security-enterprise-practices",
    tags: ["Cloud", "Security"],
    publishedAt: "2023-12-28",
    readTime: "15 min",
    coverImage: null
  },
  {
    id: 6,
    title: "Building High-Performance Engineering Culture",
    excerpt: "How to create an environment where engineering teams thrive and deliver exceptional results.",
    slug: "building-high-performance-engineering-culture",
    tags: ["Leadership", "Culture"],
    publishedAt: "2023-12-20",
    readTime: "9 min",
    coverImage: null
  }
];

const BlogPreview = () => {
  const featuredPosts = blogPosts.slice(0, 6);

  const getTagColor = (tag: string) => {
    const colors = {
      'AI': 'bg-primary/10 text-primary',
      'Cloud': 'bg-accent/10 text-accent',
      'Leadership': 'bg-primary-glow/10 text-primary-glow',
      'DevOps': 'bg-secondary/10 text-secondary-foreground',
      'Strategy': 'bg-muted text-muted-foreground',
      'Security': 'bg-destructive/10 text-destructive',
      'Culture': 'bg-success/10 text-success',
      'Remote Work': 'bg-accent-soft/20 text-accent'
    };
    return colors[tag as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

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
          {featuredPosts.map((post) => (
            <article key={post.id} className="card-elegant group cursor-pointer">
              <Link to={`/blog/${post.slug}`} className="block">
                {/* Post Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {post.readTime}
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
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
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