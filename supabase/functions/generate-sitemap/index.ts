import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=UTF-8',
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

interface BlogPost {
  slug: string;
  updated_at: string;
  created_at: string;
}

interface StaticPage {
  path: string;
  updated_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== SITEMAP GENERATION START ===');
  
  try {
    // Verify environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      supabaseUrlLength: supabaseUrl?.length || 0,
      supabaseKeyLength: supabaseKey?.length || 0
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created successfully');

    // Initialize variables for data
    let posts: BlogPost[] = [];
    let staticPages: StaticPage[] = [];

    // Fetch published blog posts with enhanced error handling
    console.log('Fetching published blog posts...');
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('slug, updated_at, created_at')
        .eq('status', 'published')
        .order('updated_at', { ascending: false });

      if (postsError) {
        console.error('Posts query error:', {
          message: postsError.message,
          details: postsError.details,
          hint: postsError.hint,
          code: postsError.code
        });
      } else {
        posts = postsData || [];
        console.log(`Successfully fetched ${posts.length} published posts`);
        console.log('Post slugs:', posts.map(p => p.slug));
      }
    } catch (postsException) {
      console.error('Exception fetching posts:', postsException);
    }

    // Fetch static pages with enhanced error handling
    console.log('Fetching static pages...');
    try {
      const { data: pagesData, error: pagesError } = await supabase
        .from('static_pages')
        .select('path, updated_at');

      if (pagesError) {
        console.error('Static pages query error:', {
          message: pagesError.message,
          details: pagesError.details,
          hint: pagesError.hint,
          code: pagesError.code
        });
      } else {
        staticPages = pagesData || [];
        console.log(`Successfully fetched ${staticPages.length} static pages`);
      }
    } catch (pagesException) {
      console.error('Exception fetching static pages:', pagesException);
    }

    const baseUrl = 'https://aicloudops.tech';
    const now = new Date().toISOString();

    // Generate enhanced SEO sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">`;

    // Add homepage with enhanced metadata
    sitemap += `
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    // Add static pages with SEO-optimized priorities
    const defaultStaticPages = [
      { path: '/about', priority: '0.9', changefreq: 'monthly' },
      { path: '/blog', priority: '0.95', changefreq: 'daily' },
      { path: '/contact', priority: '0.8', changefreq: 'monthly' },
      { path: '/polls', priority: '0.7', changefreq: 'weekly' },
      { path: '/auth', priority: '0.5', changefreq: 'yearly' }
    ];

    defaultStaticPages.forEach(page => {
      const lastmod = staticPages?.find(sp => sp.path === page.path)?.updated_at || now;
      sitemap += `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    // Add blog posts with enhanced SEO metadata
    if (posts && posts.length > 0) {
      const recentPosts = posts.slice(0, 10); // Latest 10 posts for news sitemap
      
      posts.forEach((post: BlogPost, index: number) => {
        const isRecent = new Date(post.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        const priority = index < 5 ? '0.9' : isRecent ? '0.8' : '0.7'; // Higher priority for latest posts
        const changefreq = isRecent ? 'weekly' : 'monthly';
        
        sitemap += `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${post.updated_at}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>`;
        
        // Add news sitemap data for recent posts
        if (recentPosts.includes(post)) {
          const pubDate = new Date(post.created_at).toISOString().split('T')[0]; // YYYY-MM-DD format
          sitemap += `
    <news:news>
      <news:publication>
        <news:name>AI Cloud Ops</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title><![CDATA[${post.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}]]></news:title>
    </news:news>`;
        }
        
        sitemap += `
  </url>`;
      });
    }

    // Add any additional static pages from database
    if (staticPages && staticPages.length > 0) {
      staticPages.forEach((page: StaticPage) => {
        // Skip if already added in default pages
        if (!defaultStaticPages.some(dp => dp.path === page.path)) {
          sitemap += `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${page.updated_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
        }
      });
    }

    sitemap += `
</urlset>`;

    console.log(`Generated sitemap with ${(posts?.length || 0) + defaultStaticPages.length} URLs`);

    return new Response(sitemap, {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return fallback sitemap
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://aicloudops.tech/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://aicloudops.tech/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://aicloudops.tech/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://aicloudops.tech/contact</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;

    return new Response(fallbackSitemap, {
      headers: corsHeaders,
      status: 200,
    });
  }
});