import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SEOAnalysisRequest {
  url?: string;
  title?: string;
  metaDescription?: string;
  content?: string;
  action: 'analyze' | 'suggest' | 'optimize' | 'audit' | 'bulk-analyze' | 'apply-fixes' | 'get-optimized-content';
  targetKeywords?: string[];
  pages?: Array<{
    url: string;
    title: string;
    content: string;
    type: 'post' | 'page';
  }>;
  postId?: string;
  isStaticPage?: boolean;
  suggestions?: Array<{
    type: string;
    priority: string;
    issue: string;
    suggestion: string;
    impact: string;
    current_content?: string;
  }>;
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
    const { url, title, metaDescription, content, action, targetKeywords = [], pages = [], postId, suggestions = [], isStaticPage = false } = await req.json() as SEOAnalysisRequest;

    console.log(`SEO Optimizer: ${action} request${action === 'bulk-analyze' ? ` for ${pages.length} pages` : ` for ${url}`}`);

    let systemPrompt = '';
    let userPrompt = '';

    switch (action) {
      case 'analyze':
        systemPrompt = `You are an expert SEO analyst. Analyze the provided content and return a JSON response with SEO scores and specific, actionable proposed fixes.

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
      "proposedFix": "exact text/content that should replace the current content",
      "impact": "expected impact description"
    }
  ],
  "structuredData": {
    "recommended": "schema.org type",
    "properties": ["list of recommended properties"]
  }
}`;

        userPrompt = `Analyze this content for SEO and provide specific proposed fixes:
URL: ${url}
Title: ${title || 'Not provided'}
Meta Description: ${metaDescription || 'Not provided'}
Content: ${content ? content.substring(0, 15000) : 'Not provided'}
Target Keywords: ${targetKeywords.join(', ') || 'None specified'}

For each suggestion, provide:
1. The specific issue identified
2. An actionable recommendation 
3. A "proposedFix" with the exact text/content that should replace the current content

Focus on: title length (50-60 chars), meta description (150-160 chars), keyword usage, content structure, readability, and missing elements.

Make the proposedFix field contain the actual improved text that can be directly applied.`;
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

      case 'bulk-analyze':
        // Handle bulk analysis differently - we'll process each page and save results
        console.log(`Processing bulk analysis for ${pages.length} pages`);
        
        const bulkResults = [];
        for (const page of pages) {
          try {
            // Analyze each page individually
            const pageSystemPrompt = `You are an expert SEO analyst. Analyze the provided content and return a JSON response with SEO scores and actionable suggestions.

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

            const pageUserPrompt = `Analyze this ${page.type} for SEO:
URL: ${page.url}
Title: ${page.title}
Content: ${page.content.substring(0, 2000)}

Focus on: title length (50-60 chars), content structure, readability, and missing elements.`;

            const pageResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openAIApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4.1-2025-04-14',
                messages: [
                  { role: 'system', content: pageSystemPrompt },
                  { role: 'user', content: pageUserPrompt }
                ],
                max_tokens: 1500,
                temperature: 0.3,
              }),
            });

            if (pageResponse.ok) {
              const pageAiResponse = await pageResponse.json();
              let pageResult;
              try {
                let responseContent = pageAiResponse.choices[0].message.content;
                
                // Handle markdown code blocks - strip ```json and ``` if present
                if (responseContent.includes('```json')) {
                  responseContent = responseContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
                } else if (responseContent.includes('```')) {
                  responseContent = responseContent.replace(/```\n?/, '').replace(/\n?```$/, '');
                }
                
                pageResult = JSON.parse(responseContent);
              } catch (parseError) {
                console.error('Failed to parse AI response for', page.url, parseError);
                pageResult = { seoScore: 0, error: 'Failed to parse analysis' };
              }

              // Save to database
              const { error: dbError } = await supabase
                .from('seo_analysis')
                .insert({
                  url: page.url,
                  title: page.title,
                  content: page.content.substring(0, 1000),
                  seo_score: pageResult.seoScore || 0,
                  title_score: pageResult.titleScore || 0,
                  meta_description_score: pageResult.metaDescriptionScore || 0,
                  content_score: pageResult.contentScore || 0,
                  keyword_density: pageResult.keywordDensity || {},
                  suggestions: pageResult.suggestions || [],
                  structured_data: pageResult.structuredData || {},
                  analyzed_by: null // Could be set to user ID if needed
                });

              if (dbError) {
                console.error('Database error for', page.url, dbError);
              } else {
                bulkResults.push({ url: page.url, success: true, score: pageResult.seoScore });
              }
            }
          } catch (error) {
            console.error('Error analyzing page', page.url, error);
            bulkResults.push({ url: page.url, success: false, error: error.message });
          }
        }

        return new Response(JSON.stringify({
          success: true,
          data: {
            message: `Bulk analysis completed for ${bulkResults.length} pages`,
            results: bulkResults,
            summary: {
              total: pages.length,
              successful: bulkResults.filter(r => r.success).length,
              failed: bulkResults.filter(r => !r.success).length
            }
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get-optimized-content':
        systemPrompt = `You are an SEO content optimizer. Based on the analysis suggestions, return optimized content that addresses the specific issues identified.

Return format:
{
  "optimizedTitle": "improved title based on suggestions",
  "optimizedMetaDescription": "improved meta description based on suggestions", 
  "optimizedContent": "improved content based on suggestions",
  "appliedFixes": [
    {
      "type": "title|meta_description|content|keywords|structure",
      "originalIssue": "original issue description",
      "appliedFix": "what was changed",
      "expectedImpact": "expected improvement"
    }
  ]
}`;

        userPrompt = `Based on these SEO analysis suggestions, optimize the content:

Original Title: ${title}
Original Meta Description: ${metaDescription || 'Not provided'}
Original Content: ${content}
Target Keywords: ${targetKeywords.join(', ')}
URL: ${url}

SEO Issues to Fix:
${suggestions.map(s => `- ${s.type.toUpperCase()}: ${s.issue} | Suggestion: ${s.suggestion}`).join('\n')}

Provide optimized versions that address these specific issues while maintaining quality and readability.`;
        break;

        case 'apply-fixes':
          console.log(`SEO Optimizer: apply-fixes request for ${url}`);
          
          if (!suggestions || !Array.isArray(suggestions)) {
            return new Response(
              JSON.stringify({ error: 'Suggestions array is required' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Generate optimized content based on suggestions
          const optimizationPrompt = `
Based on these SEO suggestions, provide optimized content:

${suggestions.map((s: any, i: number) => `
${i + 1}. Issue: ${s.issue}
   Suggestion: ${s.suggestion}
   Current content: ${s.current_content || 'N/A'}
`).join('\n')}

Please provide a JSON response with optimized:
- title (if title-related suggestions exist)
- meta_description (if meta description suggestions exist)  
- content (if content-related suggestions exist)
- keywords (if keyword-related suggestions exist)

Focus only on the areas mentioned in the suggestions. Keep the tone professional and maintain the original meaning while optimizing for SEO.
          `;

          const optimizationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                  content: 'You are an SEO optimization expert. Provide JSON responses with optimized content based on suggestions.' 
                },
                { role: 'user', content: optimizationPrompt }
              ],
              max_tokens: 1500,
              temperature: 0.7,
            }),
          });

          if (!optimizationResponse.ok) {
            console.error('OpenAI API error:', await optimizationResponse.text());
            return new Response(
              JSON.stringify({ error: 'Failed to generate optimized content' }),
              { status: 500, headers: corsHeaders }
            );
          }

          const optimizationData = await optimizationResponse.json();
          let optimizedContent;
          
          try {
            let responseContent = optimizationData.choices[0].message.content;
            
            // Handle markdown code blocks - strip ```json and ``` if present
            if (responseContent.includes('```json')) {
              responseContent = responseContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
            } else if (responseContent.includes('```')) {
              responseContent = responseContent.replace(/```\n?/, '').replace(/\n?```$/, '');
            }
            
            optimizedContent = JSON.parse(responseContent);
          } catch (parseError) {
            console.error('Failed to parse optimization response:', parseError);
            console.log('Raw response:', optimizationData.choices[0].message.content);
            
            // Fallback: create a basic response structure
            optimizedContent = {
              title: title,
              meta_description: metaDescription,
              content: content,
              message: 'Failed to parse AI response, using original content'
            };
          }

          // Handle static pages
          if (isStaticPage) {
            console.log(`Updating static page ${url} with optimized content`);
            
            const updateData: any = {};
            if (optimizedContent.title) updateData.title = optimizedContent.title;
            if (optimizedContent.meta_description) updateData.meta_description = optimizedContent.meta_description;
            if (optimizedContent.keywords) updateData.keywords = optimizedContent.keywords;

            const { error: updateError } = await supabase
              .from('static_pages')
              .update(updateData)
              .eq('path', url);

            if (updateError) {
              console.error('Error updating static page:', updateError);
              return new Response(
                JSON.stringify({ error: 'Failed to update static page' }),
                { status: 500, headers: corsHeaders }
              );
            }

            return new Response(
              JSON.stringify({ 
                success: true,
                optimizedContent,
                message: 'Static page SEO updated successfully'
              }),
              { headers: corsHeaders }
            );
          }

          // Handle blog posts
          if (postId) {
            console.log(`Updating blog post ${postId} with optimized content`);
            
            // Create backup in content_suggestions table
            const { error: backupError } = await supabase
              .from('content_suggestions')
              .insert({
                post_id: postId,
                suggestion_type: 'seo_optimization',
                original_text: JSON.stringify({
                  title: title,
                  excerpt: metaDescription,
                  content: content
                }),
                suggested_text: JSON.stringify(optimizedContent),
                status: 'applied',
                applied_at: new Date().toISOString(),
                confidence_score: 0.85
              });

            if (backupError) {
              console.error('Error creating content backup:', backupError);
            }

            // Update the blog post
            const updateData: any = {};
            if (optimizedContent.title) updateData.title = optimizedContent.title;
            if (optimizedContent.meta_description) updateData.excerpt = optimizedContent.meta_description;
            if (optimizedContent.content) updateData.content = optimizedContent.content;

            const { error: updateError } = await supabase
              .from('posts')
              .update(updateData)
              .eq('id', postId);

            if (updateError) {
              console.error('Error updating post:', updateError);
              return new Response(
                JSON.stringify({ error: 'Failed to update blog post' }),
                { status: 500, headers: corsHeaders }
              );
            }
          }

          return new Response(
            JSON.stringify({ 
              success: true,
              optimizedContent,
              message: postId ? 'Blog post updated successfully' : 'Optimized content generated'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        

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
      let responseContent = aiResponse.choices[0].message.content;
      
      // Handle markdown code blocks - strip ```json and ``` if present
      if (responseContent.includes('```json')) {
        responseContent = responseContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (responseContent.includes('```')) {
        responseContent = responseContent.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      result = JSON.parse(responseContent);
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