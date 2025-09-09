import { useState, useEffect } from 'react';
import { Download, ExternalLink, Award, Users, Briefcase, GraduationCap } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ProfileImageUpload from '@/components/ProfileImageUpload';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SEO from '@/components/SEO';
const About = () => {
  const {
    user
  } = useAuth();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  useEffect(() => {
    if (user) {
      fetchProfileImage();
    }
  }, [user]);
  const fetchProfileImage = async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from('profiles').select('avatar_url').eq('user_id', user.id).maybeSingle();
    if (data?.avatar_url) {
      setProfileImageUrl(data.avatar_url);
    }
  };
  const handleImageUpdate = (imageUrl: string) => {
    setProfileImageUrl(imageUrl);
  };
  const skills = [{
    category: 'AI & Machine Learning',
    items: ['AI Strategy', 'MLOps', 'Data Architecture', 'LLM Integration']
  }, {
    category: 'Cloud Platforms',
    items: ['AWS', 'Azure', 'GCP', 'Kubernetes', 'Terraform']
  }, {
    category: 'Leadership',
    items: ['Team Building', 'Agile Management', 'Strategic Planning', 'Culture Development']
  }, {
    category: 'DevOps & Architecture',
    items: ['CI/CD', 'Infrastructure as Code', 'Microservices', 'Security']
  }];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Seth Gagnon",
    "jobTitle": "Cloud Engineering Director",
    "worksFor": {
      "@type": "Organization",
      "name": "Evernorth Health Services"
    },
    "owns": {
      "@type": "Organization",
      "name": "CloudTech LLC"
    },
    "url": "https://aicloudops.tech/about",
    "sameAs": ["https://www.linkedin.com/in/sethgagnon/"],
    "knowsAbout": ["AI Strategy", "MLOps", "Data Architecture", "LLM Integration", "AWS", "Azure", "GCP", "Kubernetes", "Terraform", "Team Building", "Agile Management", "Strategic Planning", "CI/CD", "Infrastructure as Code", "Microservices"],
    "hasOccupation": {
      "@type": "Occupation",
      "name": "Cloud Engineering Director",
      "occupationLocation": {
        "@type": "City",
        "name": "Boston Area"
      }
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "North Andover",
      "addressRegion": "MA",
      "addressCountry": "US"
    },
    "alumniOf": {
      "@type": "Organization",
      "name": "Technology Industry"
    }
  };
  return <div className="min-h-screen bg-background">
      <SEO title="About Seth Gagnon - Cloud Engineering Director & AI Leadership Expert" description="Meet Seth Gagnon, Cloud Engineering Director at Evernorth Health Services and owner of CloudTech LLC. 20+ years experience in AI, cloud platforms (AWS, Azure, GCP), and engineering leadership." keywords="Seth Gagnon, Cloud Engineering Director, Evernorth Health Services, CloudTech LLC, AI leadership, cloud platforms, AWS, Azure, GCP, engineering management" canonical="https://aicloudops.tech/about" ogType="profile" structuredData={structuredData} />
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <section className="py-24 bg-gradient-to-br from-background to-muted/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
                Meet Seth Gagnon
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Seasoned leader in public cloud consulting, guiding application teams across the enterprise through their cloud transformation journey with expertise in AWS, Azure, and Google Cloud. AI Integrator and Enabler.</p>
            </div>

            {/* Profile Image Upload */}
            <ProfileImageUpload currentImageUrl={profileImageUrl} />
          </div>
        </section>

        {/* Bio Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Main Bio */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-foreground mb-6">Professional Background</h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    As a seasoned leader in public cloud consulting, I spearhead a dynamic team of industry experts, 
                    guiding application teams across the enterprise through their cloud transformation journey, 
                    leveraging cloud platforms like AWS, Azure, and Google Cloud. With a deep understanding of cloud 
                    architectures and a strategic approach to innovation, I ensure that every project aligns with our 
                    customer's business goals and sets new benchmarks in efficiency and scalability.
                  </p>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    Currently serving as Cloud Engineering Director at Evernorth Health Services, I oversee a team of 
                    cloud engineers working across the enterprise to enable cloud adoption. I'm responsible for fully 
                    understanding and delivering cloud engineered solutions for the end user community, including 
                    documentation and relevant code artifacts.
                  </p>
                  
                  <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                    Whether navigating complex migrations, optimizing cloud operations, or innovating with cloud-native 
                    technologies, my mission is to lead transformations that redefine how businesses operate and thrive 
                    in the digital era. I foster a culture of continuous learning to stay at the forefront of industry 
                    trends, enabling cutting-edge insights and robust solutions.
                  </p>
                </div>
              </div>

              {/* Quick Facts */}
              <div className="lg:col-span-1">
                <div className="card-elegant">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Quick Facts</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Briefcase className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Current Role</p>
                        <p className="text-sm text-muted-foreground">Cloud Engineering Director</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Users className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Company</p>
                        <p className="text-sm text-muted-foreground">Evernorth Health Services</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Award className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Business Owner</p>
                        <p className="text-sm text-muted-foreground">CloudTech LLC (5+ years)</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Location</p>
                        <p className="text-sm text-muted-foreground">North Andover, MA</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <ExternalLink className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">LinkedIn</p>
                        <a href="https://www.linkedin.com/in/sethgagnon/" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:text-primary-glow transition-colors">
                          /in/sethgagnon
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Experience Highlights */}
        <section className="py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Professional Experience Highlights
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="card-elegant">
                <div className="flex items-center mb-4">
                  <Briefcase className="h-6 w-6 text-primary mr-3" />
                  <h3 className="text-lg font-semibold text-foreground">Evernorth Health Services</h3>
                  <span className="text-sm text-muted-foreground ml-auto">2022 - Present</span>
                </div>
                <p className="text-sm font-medium text-foreground mb-2">Cloud Engineering Director</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Oversee team of cloud engineers across enterprise</li>
                  <li>• Enable cloud adoption organization-wide</li>
                  <li>• Deliver cloud engineered solutions for end users</li>
                  <li>• Lead technical oversight and artifact review</li>
                </ul>
              </div>

              <div className="card-elegant">
                <div className="flex items-center mb-4">
                  <Award className="h-6 w-6 text-primary mr-3" />
                  <h3 className="text-lg font-semibold text-foreground">CloudTech LLC</h3>
                  <span className="text-sm text-muted-foreground ml-auto">2020 - Present</span>
                </div>
                <p className="text-sm font-medium text-foreground mb-2">Owner & Cloud Solutions Consultant</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Technology solutions and advisory services</li>
                  <li>• Application migration project leadership</li>
                  <li>• Cloud architecture and engineering guidance</li>
                  <li>• Cost optimization and roadmap definition</li>
                </ul>
              </div>

              <div className="card-elegant">
                <div className="flex items-center mb-4">
                  <Users className="h-6 w-6 text-primary mr-3" />
                  <h3 className="text-lg font-semibold text-foreground">Core Specializations</h3>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Cloud Platform Architecture (AWS, Azure, GCP)</li>
                  <li>• Enterprise Application Migration</li>
                  <li>• Cross-functional Team Leadership</li>
                  <li>• Technical Documentation & Code Artifacts</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Core Expertise & Skills
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {skills.map(skillGroup => <div key={skillGroup.category} className="card-elegant">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    {skillGroup.category}
                  </h3>
                  <ul className="space-y-2">
                    {skillGroup.items.map(skill => <li key={skill} className="text-muted-foreground">
                        • {skill}
                      </li>)}
                  </ul>
                </div>)}
            </div>
          </div>
        </section>


        {/* Contact CTA */}
        <section className="py-16 bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Let's Connect
            </h2>
            <p className="text-xl text-muted-foreground mb-8">Interested in collaboration or strategic consulting?</p>
            <a href="/contact" className="btn-hero inline-flex items-center">
              Get In Touch
              <ExternalLink className="ml-2 h-5 w-5" />
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>;
};
export default About;