import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { path, title, utm_source, utm_medium, utm_campaign, utm_term, utm_content, session_id } = await req.json()

    // Respect Do Not Track header
    const dnt = req.headers.get('dnt')
    if (dnt === '1') {
      console.log('Do Not Track enabled, skipping analytics')
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Basic bot filtering
    const userAgent = req.headers.get('user-agent') || ''
    const botPatterns = [
      /bot/i, /crawl/i, /spider/i, /curl/i, /wget/i, /python/i, 
      /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i
    ]
    
    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      console.log('Bot detected, skipping analytics')
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse user agent for device info (basic parsing)
    let device = 'desktop'
    let browser = 'unknown'
    let os = 'unknown'

    if (userAgent) {
      // Device detection
      if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
        device = /iPad/.test(userAgent) ? 'tablet' : 'mobile'
      }

      // Browser detection
      if (/Chrome/.test(userAgent)) browser = 'chrome'
      else if (/Firefox/.test(userAgent)) browser = 'firefox'
      else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) browser = 'safari'
      else if (/Edge/.test(userAgent)) browser = 'edge'

      // OS detection
      if (/Windows/.test(userAgent)) os = 'windows'
      else if (/Mac/.test(userAgent)) os = 'macos'
      else if (/Linux/.test(userAgent)) os = 'linux'
      else if (/Android/.test(userAgent)) os = 'android'
      else if (/iOS/.test(userAgent)) os = 'ios'
    }

    // Parse referrer
    const referrer = req.headers.get('referer') || null
    let referrer_domain = null
    if (referrer) {
      try {
        const url = new URL(referrer)
        referrer_domain = url.hostname
      } catch (e) {
        console.log('Failed to parse referrer:', e)
      }
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Insert page view
    const { error } = await supabase
      .from('analytics_page_views')
      .insert({
        path: path || '/',
        title,
        referrer,
        referrer_domain,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        session_id,
        device,
        browser,
        os,
      })

    if (error) {
      console.error('Error inserting analytics:', error)
      throw error
    }

    console.log('Analytics tracked successfully:', { path, session_id, referrer_domain })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Analytics error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})