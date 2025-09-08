import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { prompt, contentType = 'blog-post', tone = 'professional', wordCount = 800, action = 'generate' } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log(`${action === 'optimize' ? 'Optimizing' : 'Generating article with'} prompt:`, prompt);

    // Handle prompt optimization
    if (action === 'optimize') {
      const optimizationPrompt = `You are an expert content strategist. Take the user's basic prompt and transform it into a detailed, optimized prompt that will generate high-quality ${contentType} content.

Guidelines for optimization:
- Make the prompt more specific and actionable
- Include structure suggestions (headings, key points to cover)
- Add context about target audience and purpose
- Suggest key elements that should be included
- Make it clear what type of ${contentType} is needed
- Consider SEO and engagement factors

Original prompt: "${prompt}"
Content type: ${contentType}
Tone: ${tone}
Word count: ${wordCount}

Return ONLY the optimized prompt text, nothing else.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            { role: 'user', content: optimizationPrompt }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI API error:', error);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const optimizedPrompt = data.choices[0].message.content.trim();

      return new Response(JSON.stringify({ optimizedPrompt }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an expert content writer. Generate high-quality ${contentType} content in a ${tone} tone. 

Content requirements:
- Target word count: approximately ${wordCount} words
- Include an engaging title
- Write a compelling excerpt/summary (2-3 sentences)
- Structure the content with proper headings and paragraphs
- Suggest 3-5 relevant tags
- Make it SEO-friendly and engaging

Return your response as a JSON object with this exact structure:
{
  "title": "Article title here",
  "excerpt": "Brief summary here",
  "content": "Full HTML content with proper headings and formatting",
  "tags": ["tag1", "tag2", "tag3"]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const generatedContent = data.choices[0].message.content;
    
    // Parse the JSON response from OpenAI
    let parsedContent;
    try {
      parsedContent = JSON.parse(generatedContent);
    } catch (e) {
      // Fallback if JSON parsing fails
      console.warn('Failed to parse JSON, using fallback structure');
      parsedContent = {
        title: "AI Generated Article",
        excerpt: "Generated content based on your prompt.",
        content: generatedContent,
        tags: ["ai-generated", "content"]
      };
    }

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-article-generator function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred while generating content'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});