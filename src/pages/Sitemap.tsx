import { useEffect } from 'react';

const Sitemap = () => {
  useEffect(() => {
    // Redirect to the edge function for proper XML serving
    window.location.href = 'https://trfjldpqwzcuvfxxbkqs.supabase.co/functions/v1/generate-sitemap';
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      fontFamily: 'monospace'
    }}>
      Redirecting to sitemap...
    </div>
  );
};

export default Sitemap;