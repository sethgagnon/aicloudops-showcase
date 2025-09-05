import { useState, useEffect } from 'react';
import { Search, Tag, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
interface Post {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  tags: string[];
  created_at: string;
  status: string;
}
const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchPosts();
    fetchTags();
  }, []);
  const fetchPosts = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('posts').select('id, title, excerpt, slug, tags, created_at, status').eq('status', 'published').order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }
      setAllPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchTags = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('tags').select('name').order('name');
      if (error) {
        console.error('Error fetching tags:', error);
        return;
      }
      setAllTags(data?.map(tag => tag.name) || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };
  const filteredPosts = allPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || (post.excerpt || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || post.tags?.includes(selectedTag);
    return matchesSearch && matchesTag;
  });
  const featuredPosts = allPosts.slice(0, 2); // Show first 2 as featured

  const calculateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content ? content.split(/\s+/).length : 100;
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
  return <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-background to-muted/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Insights & Analysis
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Deep dives into AI leadership, cloud, and building high-performance engineering teams in the modern enterprise.</p>
          </div>
        </section>

        {loading ? <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading posts...</p>
          </div> : <>
            {/* Search and Filter */}
            <section className="py-8 bg-muted/20 border-b border-border">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input type="text" placeholder="Search articles..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>

              {/* Tag Filter */}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSelectedTag('')} className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 border ${!selectedTag ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:bg-muted'}`}>
                  All Topics
                </button>
                {allTags.map(tag => <button key={tag} onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)} className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-300 border ${selectedTag === tag ? getTagColor(tag).replace('bg-', 'bg-').replace('/10', '/20') : getTagColor(tag) + ' hover:bg-opacity-20'}`}>
                    {tag}
                  </button>)}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        {!searchTerm && !selectedTag && <section className="py-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-foreground mb-8">Featured Articles</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {featuredPosts.map(post => <article key={post.id} className="card-feature group cursor-pointer">
                    <Link to={`/blog/${post.slug}`} className="block">
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(post.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {calculateReadTime(post.excerpt || '')} min
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
                          {(post.tags || []).map(tag => <span key={tag} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTagColor(tag)}`}>
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </span>)}
                        </div>
                        
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </Link>
                  </article>)}
              </div>
            </div>
          </section>}

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

            {filteredPosts.length === 0 ? <div className="text-center py-12">
                <p className="text-xl text-muted-foreground mb-4">
                  No articles found matching your criteria.
                </p>
                <button onClick={() => {
                setSearchTerm('');
                setSelectedTag('');
              }} className="btn-outline">
                  Clear Filters
                </button>
              </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map(post => <article key={post.id} className="card-elegant group cursor-pointer">
                    <Link to={`/blog/${post.slug}`} className="block">
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(post.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {calculateReadTime(post.excerpt || '')} min
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
                          {(post.tags || []).slice(0, 2).map(tag => <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}>
                              {tag}
                            </span>)}
                          {(post.tags || []).length > 2 && <span className="text-xs text-muted-foreground px-2 py-0.5">
                              +{(post.tags || []).length - 2}
                            </span>}
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </Link>
                  </article>)}
              </div>}
          </div>
        </section>
          </>}
      </main>

      <Footer />
    </div>;
};
export default Blog;