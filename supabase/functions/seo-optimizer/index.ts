import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SEOAnalysisRequest {
  url: string;
  title?: string;
  metaDescription?: string;
  content?: string;
  action: 'analyze' | 'suggest' | 'optimize' | 'audit';
  targetKeywords?: string[];
}

interface SEOScore {
  overall: number;
  title: number;
  metaDescription: number;
  content: number;
  suggestions: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { url, title, metaDescription, content, action, targetKeywords = [] } = await req.json() as SEOAnalysisRequest;

    console.log(`SEO Optimizer: ${action} request for ${url}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'analyze':
        systemPrompt = `You are an expert SEO analyst. Analyze the provided content and return a JSON response with SEO scores and actionable suggestions.

Return format:
{
  "seoScore": number (0-100),
  "titleScore": number (0-100),
  "metaDescriptionScore": number (0-100),
  "contentScore": number (0-100),
  "keywordDensity": {"keyword": density_percentage},
  "suggestions": [
    {
      "type": "title|meta_description|content|keywords|structure",
      "priority": "high|medium|low",
      "issue": "description of the issue",
      "suggestion": "specific actionable recommendation",
      "impact": "expected impact description"
    }
  ],
  "structuredData": {
    "recommended": "schema.org type",
    "properties": ["list of recommended properties"]
  }
}`;

        userPrompt = `Analyze this content for SEO:
URL: ${url}
Title: ${title || 'Not provided'}
Meta Description: ${metaDescription || 'Not provided'}
Content: ${content ? content.substring(0, 2000) : 'Not provided'}
Target Keywords: ${targetKeywords.join(', ') || 'None specified'}

Focus on: title length (50-60 chars), meta description (150-160 chars), keyword usage, content structure, readability, and missing elements.`;
        break;

      case 'suggest':
        systemPrompt = `You are an SEO copywriting expert. Generate optimized alternatives for the provided content elements.

Return format:
{
  "optimizedTitle": "improved title (50-60 chars)",
  "optimizedMetaDescription": "improved meta description (150-160 chars)",
  "keywordSuggestions": ["relevant", "keywords", "to", "target"],
  "contentImprovements": [
    {
      "section": "introduction|body|conclusion|headers",
      "current": "current text snippet",
      "improved": "improved text suggestion",
      "reason": "why this improves SEO"
    }
  ],
  "internalLinkingOpportunities": [
    {
      "anchorText": "suggested anchor text",
      "context": "where to place it",
      "targetPage": "suggested internal page to link to"
    }
  ]
}`;

        userPrompt = `Optimize this content for SEO:
Title: ${title}
Meta Description: ${metaDescription}
Content: ${content?.substring(0, 1500)}
Target Keywords: ${targetKeywords.join(', ')}
URL: ${url}

Generate improvements that maintain readability while improving search rankings.`;
        break;

      case 'optimize':
        systemPrompt = `You are an SEO content optimizer. Return optimized content that improves search rankings while maintaining quality.

Return format:
{
  "optimizedContent": "fully optimized content with improved structure",
  "headingStructure": [
    {"level": "h1|h2|h3", "text": "heading text", "keywords": ["targeted", "keywords"]}
  ],
  "metaImprovements": {
    "title": "optimized title",
    "description": "optimized meta description",
    "keywords": ["primary", "secondary", "keywords"]
  },
  "readabilityScore": number,
  "seoImprovements": ["list of improvements made"]
}`;

        userPrompt = `Optimize this entire content piece:
Original Title: ${title}
Original Meta: ${metaDescription}
Original Content: ${content}
Target Keywords: ${targetKeywords.join(', ')}
URL: ${url}

Improve structure, keyword placement, readability, and overall SEO value.`;
        break;

      case 'audit':
        systemPrompt = `You are conducting a comprehensive SEO audit. Analyze all aspects and provide a detailed report.

Return format:
{
  "auditScore": number (0-100),
  "criticalIssues": [
    {"issue": "problem description", "impact": "high|medium|low", "solution": "how to fix"}
  ],
  "opportunities": [
    {"opportunity": "improvement area", "potential": "expected benefit", "effort": "low|medium|high"}
  ],
  "technicalSEO": {
    "titleTag": {"status": "good|warning|error", "feedback": "specific feedback"},
    "metaDescription": {"status": "good|warning|error", "feedback": "specific feedback"},
    "headingStructure": {"status": "good|warning|error", "feedback": "specific feedback"},
    "keywordOptimization": {"status": "good|warning|error", "feedback": "specific feedback"}
  },
  "competitorInsights": ["insights based on content analysis"],
  "actionPlan": [
    {"priority": number, "action": "specific action", "timeline": "timeframe"}
  ]
}`;

        userPrompt = `Conduct a comprehensive SEO audit:
URL: ${url}
Title: ${title}
Meta Description: ${metaDescription}
Content: ${content?.substring(0, 2000)}
Target Keywords: ${targetKeywords.join(', ')}

Provide detailed analysis with prioritized recommendations.`;
        break;

      default:
        throw new Error('Invalid action specified');
    }

    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    console.log('OpenAI Response received');

    let result;
    try {
      result = JSON.parse(aiResponse.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback: return the raw text with basic structure
      result = {
        error: 'Failed to parse response',
        rawResponse: aiResponse.choices[0].message.content,
        action: action
      };
    }

    // Store analysis results in database if it's an analysis
    if (action === 'analyze' && result.seoScore) {
      try {
        const { error: dbError } = await supabase
          .from('seo_analysis')
          .insert({
            url: url,
            title: title,
            meta_description: metaDescription,
            content: content?.substring(0, 1000), // Store first 1000 chars
            seo_score: result.seoScore,
            title_score: result.titleScore || 0,
            meta_description_score: result.metaDescriptionScore || 0,
            content_score: result.contentScore || 0,
            keyword_density: result.keywordDensity || {},
            suggestions: result.suggestions || [],
            structured_data: result.structuredData || {}
          });

        if (dbError) {
          console.error('Database error:', dbError);
        } else {
          console.log('SEO analysis stored in database');
        }
      } catch (dbError) {
        console.error('Failed to store analysis:', dbError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: result,
      action: action,
      url: url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('SEO Optimizer Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'An unexpected error occurred',
      action: 'unknown'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});