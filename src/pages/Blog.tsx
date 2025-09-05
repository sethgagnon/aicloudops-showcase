import { useState } from 'react';
import { Search, Tag, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

// Mock blog data - in real app this would come from Supabase
const allPosts = [
  {
    id: 1,
    title: "Building AI-First Organizations: A Leadership Framework",
    excerpt: "How enterprise leaders can structure their organizations to leverage AI effectively while maintaining human-centered decision making and ethical considerations.",
    slug: "ai-first-organizations-leadership-framework",
    tags: ["AI", "Leadership"],
    publishedAt: "2024-01-15",
    readTime: "8 min",
    featured: true
  },
  {
    id: 2,
    title: "Cloud Migration Strategies for Enterprise Scale",
    excerpt: "Proven methodologies for moving critical workloads to the cloud without disrupting business operations or compromising security.",
    slug: "cloud-migration-strategies-enterprise",
    tags: ["Cloud", "Strategy"],
    publishedAt: "2024-01-10",
    readTime: "12 min",
    featured: true
  },
  {
    id: 3,
    title: "The Future of DevOps: AI-Powered Operations",
    excerpt: "Exploring how artificial intelligence is revolutionizing DevOps practices and operational efficiency in modern software development.",
    slug: "future-devops-ai-powered-operations",
    tags: ["AI", "DevOps", "Cloud"],
    publishedAt: "2024-01-05",
    readTime: "10 min",
    featured: false
  },
  {
    id: 4,
    title: "Leading Remote Engineering Teams",
    excerpt: "Best practices for managing distributed engineering teams and maintaining productivity in remote and hybrid work environments.",
    slug: "leading-remote-engineering-teams",
    tags: ["Leadership", "Remote Work"],
    publishedAt: "2024-01-01",
    readTime: "6 min",
    featured: false
  },
  {
    id: 5,
    title: "Kubernetes Security: Enterprise Best Practices",
    excerpt: "Comprehensive security guidelines for running Kubernetes clusters in production enterprise environments with real-world examples.",
    slug: "kubernetes-security-enterprise-practices",
    tags: ["Cloud", "Security"],
    publishedAt: "2023-12-28",
    readTime: "15 min",
    featured: false
  },
  {
    id: 6,
    title: "Building High-Performance Engineering Culture",
    excerpt: "How to create an environment where engineering teams thrive and deliver exceptional results through psychological safety and clear goals.",
    slug: "building-high-performance-engineering-culture",
    tags: ["Leadership", "Culture"],
    publishedAt: "2023-12-20",
    readTime: "9 min",
    featured: false
  }
];

const allTags = ["AI", "Cloud", "Leadership", "DevOps", "Strategy", "Security", "Culture", "Remote Work"];

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  const filteredPosts = allPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const featuredPosts = allPosts.filter(post => post.featured);

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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-background to-muted/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Insights & Analysis
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Deep dives into AI leadership, cloud architecture, and building 
              high-performance engineering teams in the modern enterprise.
            </p>
          </div>
        </section>

        {/* Search and Filter */}
        <section className="py-8 bg-muted/20 border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Tag Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag('')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 border ${
                    !selectedTag
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  All Topics
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 border ${
                      selectedTag === tag
                        ? getTagColor(tag).replace('bg-', 'bg-').replace('/10', '/20')
                        : getTagColor(tag) + ' hover:bg-opacity-20'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        {!searchTerm && !selectedTag && (
          <section className="py-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-foreground mb-8">Featured Articles</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {featuredPosts.map((post) => (
                  <article key={post.id} className="card-feature group cursor-pointer">
                    <Link to={`/blog/${post.slug}`} className="block">
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(post.publishedAt).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {post.readTime}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                        {post.title}
                      </h3>
                      
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTagColor(tag)}`}
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Posts */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground">
                {searchTerm || selectedTag ? 'Search Results' : 'All Articles'}
              </h2>
              <span className="text-muted-foreground">
                {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground mb-4">
                  No articles found matching your criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedTag('');
                  }}
                  className="btn-outline"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                  <article key={post.id} className="card-elegant group cursor-pointer">
                    <Link to={`/blog/${post.slug}`} className="block">
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
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
                      
                      <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                        {post.title}
                      </h3>
                      
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                            >
                              {tag}
                            </span>
                          ))}
                          {post.tags.length > 2 && (
                            <span className="text-xs text-muted-foreground px-2 py-0.5">
                              +{post.tags.length - 2}
                            </span>
                          )}
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;