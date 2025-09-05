import { Download, ExternalLink, Award, Users, Briefcase, GraduationCap } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const About = () => {
  const skills = [
    { category: 'AI & Machine Learning', items: ['AI Strategy', 'MLOps', 'Data Architecture', 'LLM Integration'] },
    { category: 'Cloud Platforms', items: ['AWS', 'Azure', 'GCP', 'Kubernetes', 'Terraform'] },
    { category: 'Leadership', items: ['Team Building', 'Agile Management', 'Strategic Planning', 'Culture Development'] },
    { category: 'DevOps & Architecture', items: ['CI/CD', 'Infrastructure as Code', 'Microservices', 'Security'] }
  ];

  const speakingTopics = [
    {
      title: 'AI Leadership in Enterprise',
      description: 'Building AI-first organizations and leading digital transformation initiatives.'
    },
    {
      title: 'Cloud Strategy & Architecture',
      description: 'Designing scalable cloud solutions and managing large-scale migrations.'
    },
    {
      title: 'High-Performance Teams',
      description: 'Creating engineering cultures that deliver exceptional results.'
    },
    {
      title: 'Future of Work & Technology',
      description: 'Navigating remote leadership and emerging technology trends.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <section className="py-24 bg-gradient-to-br from-background to-muted/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Meet Seth Gagnon
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Technology leader, AI strategist, and team builder with 15+ years of experience 
                driving digital transformation in enterprise environments.
              </p>
            </div>

            {/* Profile Image Placeholder */}
            <div className="flex justify-center mb-16">
              <div className="w-64 h-64 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                <div className="text-6xl font-bold text-primary/60">SG</div>
              </div>
            </div>
          </div>
        </section>

        {/* Bio Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Seth Gagnon is a seasoned technology executive with over 15 years of experience leading 
                digital transformation initiatives across Fortune 500 companies. Currently serving as 
                Chief Technology Officer at a leading cloud services company, Seth specializes in AI 
                strategy, cloud architecture, and building high-performance engineering teams.
              </p>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                His expertise spans the full spectrum of modern technology leadership, from hands-on 
                technical architecture to strategic planning and organizational development. Seth has 
                successfully led teams of 100+ engineers through complex cloud migrations, AI adoption 
                initiatives, and cultural transformations.
              </p>
              
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                As a thought leader in the intersection of AI, cloud computing, and leadership, Seth 
                regularly speaks at industry conferences and contributes to leading technology publications. 
                His insights help other leaders navigate the rapidly evolving landscape of enterprise technology.
              </p>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Core Expertise
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {skills.map((skillGroup) => (
                <div key={skillGroup.category} className="card-elegant">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    {skillGroup.category}
                  </h3>
                  <ul className="space-y-2">
                    {skillGroup.items.map((skill) => (
                      <li key={skill} className="text-muted-foreground">
                        • {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Speaking Section */}
        <section id="speaking" className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Speaking & Media
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Available for keynotes, panels, and thought leadership discussions 
                on AI, cloud strategy, and engineering leadership.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {speakingTopics.map((topic) => (
                <div key={topic.title} className="card-feature">
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {topic.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {topic.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Media Kit CTA */}
            <div className="text-center">
              <div className="inline-flex items-center space-x-4">
                <button className="btn-hero inline-flex items-center">
                  <Download className="mr-2 h-5 w-5" />
                  Download Media Kit
                </button>
                <button className="btn-outline inline-flex items-center">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Speaking History
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Let's Connect
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Interested in collaboration, speaking opportunities, or strategic consulting?
            </p>
            <a href="/contact" className="btn-hero inline-flex items-center">
              Get In Touch
              <ExternalLink className="ml-2 h-5 w-5" />
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;