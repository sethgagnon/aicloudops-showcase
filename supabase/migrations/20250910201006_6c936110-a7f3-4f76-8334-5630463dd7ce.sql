-- Create static_pages table for SEO metadata management
CREATE TABLE public.static_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_description TEXT,
  keywords TEXT,
  canonical TEXT,
  og_image TEXT,
  og_type TEXT DEFAULT 'website',
  structured_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view static pages SEO data" 
ON public.static_pages 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage static pages SEO data" 
ON public.static_pages 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for timestamps
CREATE TRIGGER update_static_pages_updated_at
BEFORE UPDATE ON public.static_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert current hardcoded SEO values
INSERT INTO public.static_pages (path, title, meta_description, keywords, canonical, og_image, structured_data) VALUES 
('/', 'AI Cloud Ops - Seth Gagnon | AI Leadership & Cloud Strategy Insights', 'Expert insights on AI leadership, cloud architecture, and engineering team management from technology executive Seth Gagnon. Strategic guidance for digital transformation.', 'Seth Gagnon, AI leadership, cloud strategy, digital transformation, engineering management, technology consulting, AWS, Azure, GCP', 'https://aicloudops.tech', 'https://lovable.dev/opengraph-image-p98pqg.png', '{
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
}'::jsonb),
('/about', 'About Seth Gagnon - AI & Cloud Leadership Expert', 'Learn about Seth Gagnon''s expertise in AI leadership, cloud architecture, and engineering management. Director of Cloud Engineering at Evernorth Health Services.', 'Seth Gagnon, about, AI leadership, cloud engineering, technology executive, engineering management', 'https://aicloudops.tech/about', 'https://lovable.dev/opengraph-image-p98pqg.png', '{
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "mainEntity": {
    "@type": "Person",
    "name": "Seth Gagnon",
    "jobTitle": "Cloud Engineering Director",
    "worksFor": {
      "@type": "Organization",
      "name": "Evernorth Health Services"
    }
  }
}'::jsonb),
('/contact', 'Contact Seth Gagnon - AI & Cloud Strategy Consulting', 'Get in touch with Seth Gagnon for AI leadership consulting, cloud strategy guidance, and digital transformation expertise.', 'contact Seth Gagnon, AI consulting, cloud strategy, digital transformation consulting', 'https://aicloudops.tech/contact', 'https://lovable.dev/opengraph-image-p98pqg.png', '{
  "@context": "https://schema.org",
  "@type": "ContactPage"
}'::jsonb),
('/blog', 'Blog - AI Cloud Ops Insights', 'Latest insights on AI leadership, cloud architecture, and engineering management from Seth Gagnon.', 'AI blog, cloud computing blog, engineering leadership, technology insights', 'https://aicloudops.tech/blog', 'https://lovable.dev/opengraph-image-p98pqg.png', '{
  "@context": "https://schema.org",
  "@type": "Blog"
}'::jsonb);