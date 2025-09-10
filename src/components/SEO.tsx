import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  structuredData?: object;
  noIndex?: boolean;
}

interface StaticPageSEO {
  title: string;
  meta_description: string;
  keywords: string;
  canonical: string;
  og_image: string;
  og_type: string;
  structured_data: any;
}

const SEO = ({
  title,
  description,
  keywords,
  canonical,
  ogImage,
  ogType,
  structuredData,
  noIndex = false
}: SEOProps) => {
  const location = useLocation();
  const [pageData, setPageData] = useState<StaticPageSEO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch static page SEO data
  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const { data, error } = await supabase
          .from('static_pages')
          .select('*')
          .eq('path', location.pathname)
          .maybeSingle();

        if (error) {
          console.error('Error fetching page SEO data:', error);
        } else if (data) {
          setPageData(data);
        }
      } catch (error) {
        console.error('Error fetching page SEO data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageData();
  }, [location.pathname]);

  // Use dynamic data if available, otherwise fall back to props or defaults
  const finalTitle = title || pageData?.title || "AI Cloud Ops - Seth Gagnon | AI Leadership & Cloud Strategy Insights";
  const finalDescription = description || pageData?.meta_description || "Expert insights on AI leadership, cloud architecture, and engineering team management from technology executive Seth Gagnon. Strategic guidance for digital transformation.";
  const finalKeywords = keywords || pageData?.keywords || "AI leadership, cloud strategy, digital transformation, engineering management, technology consulting";
  const finalCanonical = canonical || pageData?.canonical;
  const finalOgImage = ogImage || pageData?.og_image || "https://lovable.dev/opengraph-image-p98pqg.png";
  const finalOgType = ogType || pageData?.og_type || "website";
  const finalStructuredData = structuredData || pageData?.structured_data;
  useEffect(() => {
    if (isLoading) return;

    // Update document title
    document.title = finalTitle;
    
    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', finalDescription);
    updateMetaTag('keywords', finalKeywords);
    
    // Open Graph tags
    updateMetaTag('og:title', finalTitle, true);
    updateMetaTag('og:description', finalDescription, true);
    updateMetaTag('og:type', finalOgType, true);
    updateMetaTag('og:image', finalOgImage, true);
    updateMetaTag('og:url', finalCanonical || window.location.href, true);
    
    // Twitter tags
    updateMetaTag('twitter:title', finalTitle);
    updateMetaTag('twitter:description', finalDescription);
    updateMetaTag('twitter:image', finalOgImage);
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:site', '@sethgagnon');
    
    // Robots meta tag
    if (noIndex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow');
    }
    
    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', finalCanonical || window.location.href);
    
    // Structured Data
    if (finalStructuredData) {
      let script = document.querySelector('#structured-data') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = 'structured-data';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(finalStructuredData);
    }
    
  }, [isLoading, finalTitle, finalDescription, finalKeywords, finalCanonical, finalOgImage, finalOgType, finalStructuredData, noIndex]);

  return null;
};

export default SEO;