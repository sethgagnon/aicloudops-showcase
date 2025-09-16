import Hero from '@/components/Hero';
import BlogPreview from '@/components/BlogPreview';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

const Index = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Seth Gagnon",
    "jobTitle": "Cloud Engineering Director",
    "worksFor": {
      "@type": "Organization",
      "name": "Evernorth Health Services"
    },
    "url": "https://aicloudops.tech",
    "sameAs": [
      "https://www.linkedin.com/in/sethgagnon/",
      "https://twitter.com/sethgagnon"
    ],
    "knowsAbout": [
      "Artificial Intelligence",
      "Cloud Computing",
      "AWS",
      "Azure",
      "Google Cloud Platform",
      "Engineering Leadership",
      "Digital Transformation"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "North Andover",
      "addressRegion": "MA",
      "addressCountry": "US"
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Seth Gagnon | AI, Cloud & Leadership Insights - AI Cloud Ops"
        description="AI, Cloud & Leadership insights from Seth Gagnon. Expert strategies for digital transformation, cloud architecture, and AI-driven team management."
        keywords="Seth Gagnon, AI leadership, cloud strategy, digital transformation, engineering management, technology consulting, AWS, Azure, GCP"
        canonical="https://aicloudops.tech"
        structuredData={structuredData}
      />
      <Navigation />
      <main>
        <Hero />
        <BlogPreview />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
