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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user ID from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    let userId;
    try {
      // Decode JWT token to get user ID
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
      if (!userId) {
        throw new Error('No user ID found in token');
      }
    } catch (error) {
      console.error('Error extracting user ID from token:', error);
      throw new Error('Invalid authentication token');
    }

    if (action === 'analyze') {
      console.log('Starting SEO analysis for:', url);
      
      const analysisPrompt = `Analyze this content for SEO issues and return a valid JSON array. Each issue must have this exact structure:

{
  "severity": "HIGH" | "MEDIUM" | "LOW",
  "category": "Title" | "Meta Description" | "Headers" | "Content" | "Links" | "Images" | "Technical",
  "title": "Brief issue description",
  "why": "Why this matters for SEO",
  "where": {
    "field": "title" | "meta_description" | "h1" | "content" | "images",
    "selector": "CSS selector if applicable",
    "example": "Example of the issue"
  },
  "currentValue": "Current value or null",
  "proposedFix": "Specific fix recommendation"
}

PAGE TO ANALYZE:
URL: ${url}
Title: ${title}
Content Length: ${content.length} chars
Content Preview: ${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}

IMPORTANT: 
- Return ONLY a valid JSON array
- Include 3-8 realistic issues
- Focus on common SEO problems
- Use exact severity values: HIGH, MEDIUM, LOW

Example response format:
[
  {
    "severity": "HIGH",
    "category": "Title",
    "title": "Title too long",
    "why": "Search engines may truncate titles over 60 characters",
    "where": {"field": "title", "example": "Current title"},
    "currentValue": "${title}",
    "proposedFix": "Shorter, keyword-focused title"
  }
]`;

      console.log('Calling OpenAI API...');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are an SEO expert. You must return ONLY valid JSON arrays. No markdown, no explanations, just pure JSON array.' 
            },
            { role: 'user', content: analysisPrompt }
          ],
          max_tokens: 1500,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API error:', response.status, await response.text());
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('OpenAI response received');
      
      let analysisResult = data.choices[0]?.message?.content;
      console.log('Raw OpenAI response:', analysisResult);
      
      if (!analysisResult) {
        throw new Error('No content in OpenAI response');
      }

      // Clean up the response - remove markdown code blocks if present
      analysisResult = analysisResult.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      let issues: SeoIssue[];
      try {
        issues = JSON.parse(analysisResult);
        console.log('Successfully parsed issues:', issues.length);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', analysisResult);
        console.error('Parse error:', parseError);
        
        // Fallback: create sample issues if parsing fails
        issues = [
          {
            id: crypto.randomUUID(),
            severity: 'HIGH' as const,
            category: 'Title',
            title: 'SEO Analysis Error',
            why: 'Unable to complete automated analysis. Manual review recommended.',
            where: { field: 'title' },
            currentValue: title,
            proposedFix: 'Please review title length and keyword optimization manually.'
          },
          {
            id: crypto.randomUUID(),
            severity: 'MEDIUM' as const,
            category: 'Meta Description', 
            title: 'Meta Description Review Needed',
            why: 'Automated analysis failed. Manual optimization recommended.',
            where: { field: 'meta_description' },
            proposedFix: 'Create compelling 150-160 character meta description with target keywords.'
          }
        ];
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
          analyzed_by: userId,
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
      console.log('Regenerating fix for category:', category);
      
      const regeneratePrompt = `Generate a specific SEO fix for this issue. Return ONLY the fix text, no JSON, no markdown, no explanation.

Issue Context: ${issueContext}
Category: ${category}

Requirements:
- For titles: 50-60 characters, include main keyword
- For meta descriptions: 150-160 characters, compelling call-to-action  
- For headings: Clear, descriptive, scannable
- For content: Natural keyword integration
- For links: Meaningful anchor text

Return only the replacement text/content:`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an SEO expert. Return only the requested fix text, no formatting, no explanation.' },
            { role: 'user', content: regeneratePrompt }
          ],
          max_tokens: 200,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI regenerate error:', response.status);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      let newFix = data.choices[0]?.message?.content?.trim();
      
      if (!newFix) {
        newFix = "Please manually optimize this field based on SEO best practices.";
      }

      console.log('Generated new fix:', newFix);

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