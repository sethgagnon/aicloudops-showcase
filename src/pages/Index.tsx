import Hero from '@/components/Hero';
import BlogPreview from '@/components/BlogPreview';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
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
