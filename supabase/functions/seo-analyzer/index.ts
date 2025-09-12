import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SeoIssue {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  title: string;
  why: string;
  where: {
    field: string;
    selector?: string;
    example?: string;
  };
  currentValue?: string;
  proposedFix: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pageId, pageType, url, title, content, action = 'analyze' } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    if (action === 'analyze') {
      const analysisPrompt = `You are an SEO auditor following Google Search Essentials. Analyze the provided page HTML and content. Return a JSON array of issues with: severity, category, title, why, where (field and selector), currentValue, and proposedFix. Group issues into HIGH, MEDIUM, and LOW severity.

PAGE DETAILS:
URL: ${url}
Title: ${title}
Content: ${content.substring(0, 4000)}...

Check for:
- Title tag (50-60 chars, includes main keyword)
- Meta description (150-160 chars, compelling)
- H1 tag (single, descriptive)
- Header hierarchy (H2, H3 properly nested)
- Internal links (meaningful anchor text)
- External links (relevant, authoritative)
- Image alt text (descriptive)
- Content readability and keyword usage
- Structured data (Article, Organization, Breadcrumb)
- Canonical tags and robots directives

Return only a JSON array of issues, no additional text.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07',
          messages: [
            { role: 'system', content: 'You are an SEO expert. Return only valid JSON arrays.' },
            { role: 'user', content: analysisPrompt }
          ],
          max_completion_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const analysisResult = data.choices[0].message.content;
      
      let issues: SeoIssue[];
      try {
        issues = JSON.parse(analysisResult);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', analysisResult);
        throw new Error('Invalid JSON response from AI analysis');
      }

      // Generate unique IDs for issues
      issues = issues.map(issue => ({
        ...issue,
        id: crypto.randomUUID(),
      }));

      // Calculate summary counts
      const summary = {
        counts: {
          HIGH: issues.filter(i => i.severity === 'HIGH').length,
          MEDIUM: issues.filter(i => i.severity === 'MEDIUM').length,
          LOW: issues.filter(i => i.severity === 'LOW').length,
        }
      };

      // Store the report in database
      const { data: reportData, error: reportError } = await supabase
        .from('seo_reports')
        .insert({
          page_id: pageId,
          page_type: pageType,
          url,
          title,
          content: content.substring(0, 10000), // Truncate for storage
          analyzed_by: (await supabase.auth.getUser()).data.user?.id,
          summary
        })
        .select()
        .single();

      if (reportError) {
        console.error('Error saving report:', reportError);
        throw new Error('Failed to save SEO report');
      }

      // Store individual issues
      const issuesWithReportId = issues.map(issue => ({
        report_id: reportData.id,
        severity: issue.severity,
        category: issue.category,
        title: issue.title,
        why: issue.why,
        where_field: issue.where.field,
        where_selector: issue.where.selector,
        where_example: issue.where.example,
        current_value: issue.currentValue,
        proposed_fix: issue.proposedFix,
      }));

      const { error: issuesError } = await supabase
        .from('seo_issues')
        .insert(issuesWithReportId);

      if (issuesError) {
        console.error('Error saving issues:', issuesError);
        throw new Error('Failed to save SEO issues');
      }

      return new Response(JSON.stringify({
        reportId: reportData.id,
        issues,
        summary
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'regenerate') {
      const { issueContext, category } = await req.json();
      
      const regeneratePrompt = `You are an SEO copy editor. For the selected issue, produce the minimal replacement text or code snippet needed for the target field. 

ISSUE CONTEXT:
Category: ${category}
Current Issue: ${issueContext}

Generate a refined replacement snippet for this specific field. Consider:
- Titles: 50-60 characters, include main keyword
- Meta descriptions: 150-160 characters, compelling call-to-action
- Headings: Scannable, descriptive
- Internal links: Meaningful anchor text
- JSON-LD: Valid structured data

Return only the new snippet, no additional text or explanation.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07',
          messages: [
            { role: 'system', content: 'You are an SEO expert. Return only the requested snippet.' },
            { role: 'user', content: regeneratePrompt }
          ],
          max_completion_tokens: 300,
        }),
      });

      const data = await response.json();
      const newFix = data.choices[0].message.content.trim();

      return new Response(JSON.stringify({ proposedFix: newFix }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in seo-analyzer function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred',
      details: error.toString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});