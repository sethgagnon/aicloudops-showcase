import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Share2, Tag, User } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

// Mock blog post data - in real app this would come from Supabase
const blogPost = {
  title: "Building AI-First Organizations: A Leadership Framework",
  content: `
# Building AI-First Organizations: A Leadership Framework

In today's rapidly evolving technological landscape, artificial intelligence has become more than just a competitive advantage—it's a fundamental requirement for enterprise success. However, building an AI-first organization isn't just about adopting new technologies; it's about transforming how we think, work, and make decisions at every level of the organization.

## The Mindset Shift

The transition to an AI-first organization begins with a fundamental mindset shift. Traditional organizations are built around human decision-making processes, hierarchical structures, and linear workflows. AI-first organizations, on the other hand, are designed to leverage machine intelligence as a core component of their operational DNA.

This doesn't mean replacing human judgment—quite the opposite. It means augmenting human intelligence with artificial intelligence to make better, faster, and more informed decisions. The key is finding the right balance between automation and human oversight.

## Core Principles of AI-First Leadership

### 1. Data-Driven Decision Making

Every decision in an AI-first organization should be informed by data. This requires establishing robust data collection, processing, and analysis capabilities. Leaders must become comfortable with probabilistic thinking and be willing to act on insights derived from machine learning models.

### 2. Continuous Learning and Adaptation

AI systems improve through continuous learning, and so must AI-first organizations. This means creating feedback loops, embracing experimentation, and being willing to pivot quickly based on new information.

### 3. Human-AI Collaboration

The most successful AI implementations are those that amplify human capabilities rather than replace them entirely. Leaders must design workflows that optimize the collaboration between human intelligence and artificial intelligence.

## Implementation Strategy

Transforming an organization to become AI-first requires a systematic approach:

### Phase 1: Foundation Building
- Establish data infrastructure
- Build AI literacy across the organization
- Identify initial use cases and pilot projects

### Phase 2: Pilot Implementation
- Deploy AI solutions in controlled environments
- Measure and optimize performance
- Build confidence and expertise

### Phase 3: Scale and Integration
- Expand successful pilots across the organization
- Integrate AI into core business processes
- Develop proprietary AI capabilities

## Challenges and Solutions

Building AI-first organizations isn't without challenges. Common obstacles include:

**Resistance to Change**: Address through education and demonstrating clear value
**Data Quality Issues**: Invest in data governance and quality assurance processes
**Talent Shortage**: Develop internal capabilities while partnering with external experts
**Ethical Concerns**: Establish clear AI ethics guidelines and oversight mechanisms

## Measuring Success

Key metrics for AI-first transformation include:
- Decision-making speed and accuracy
- Operational efficiency improvements
- Employee satisfaction and engagement
- Customer experience enhancements
- Revenue and cost impact

## Conclusion

Building an AI-first organization is a journey, not a destination. It requires sustained commitment, continuous learning, and the courage to challenge traditional ways of working. However, organizations that successfully make this transformation will be positioned to thrive in an increasingly AI-driven world.

The future belongs to leaders who can effectively blend human wisdom with artificial intelligence to create organizations that are more efficient, more innovative, and more responsive to changing market conditions.
  `,
  excerpt: "How enterprise leaders can structure their organizations to leverage AI effectively while maintaining human-centered decision making and ethical considerations.",
  slug: "ai-first-organizations-leadership-framework",
  tags: ["AI", "Leadership"],
  publishedAt: "2024-01-15",
  readTime: "8 min",
  author: "Seth Gagnon"
};

const BlogPost = () => {
  const { slug } = useParams();

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
                  {blogPost.author}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(blogPost.publishedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {blogPost.readTime}
                </div>
              </div>

              {/* Title */}
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                {blogPost.title}
              </h1>

              {/* Excerpt */}
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {blogPost.excerpt}
              </p>

              {/* Tags and Share */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-border">
                <div className="flex flex-wrap gap-2">
                  {blogPost.tags.map((tag) => (
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
                className="text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: blogPost.content
                    .split('\n')
                    .map(line => {
                      if (line.startsWith('# ')) {
                        return `<h1 class="text-3xl font-bold text-foreground mb-6 mt-12">${line.substring(2)}</h1>`;
                      } else if (line.startsWith('## ')) {
                        return `<h2 class="text-2xl font-bold text-foreground mb-4 mt-10">${line.substring(3)}</h2>`;
                      } else if (line.startsWith('### ')) {
                        return `<h3 class="text-xl font-semibold text-foreground mb-4 mt-8">${line.substring(4)}</h3>`;
                      } else if (line.trim() === '') {
                        return '<br />';
                      } else if (line.startsWith('**') && line.endsWith('**')) {
                        return `<p class="font-semibold text-foreground mb-4">${line.slice(2, -2)}</p>`;
                      } else {
                        return `<p class="text-muted-foreground mb-4 leading-relaxed">${line}</p>`;
                      }
                    })
                    .join('')
                }}
              />
            </article>

            {/* Article Footer */}
            <footer className="mt-16 pt-8 border-t border-border">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Written by {blogPost.author}
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