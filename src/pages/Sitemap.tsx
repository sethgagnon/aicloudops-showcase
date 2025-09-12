import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Sitemap = () => {
  const [sitemap, setSitemap] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateSitemap = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-sitemap', {
          method: 'GET',
        });

        if (error) {
          console.error('Error generating sitemap:', error);
          return;
        }

        if (data) {
          setSitemap(data);
        }
      } catch (error) {
        console.error('Error calling sitemap function:', error);
      } finally {
        setLoading(false);
      }
    };

    generateSitemap();
  }, []);

  // Set content type to XML
  useEffect(() => {
    if (sitemap && !loading) {
      document.head.querySelector('meta[http-equiv="Content-Type"]')?.remove();
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', 'Content-Type');
      meta.setAttribute('content', 'application/xml; charset=UTF-8');
      document.head.appendChild(meta);
    }
  }, [sitemap, loading]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontFamily: 'monospace'
      }}>
        Generating sitemap...
      </div>
    );
  }

  // Render as plain XML
  return (
    <pre
      style={{
        margin: 0,
        padding: 0,
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        background: 'white',
        color: 'black'
      }}
      dangerouslySetInnerHTML={{ __html: sitemap }}
    />
  );
};

export default Sitemap;