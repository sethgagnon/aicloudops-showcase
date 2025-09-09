import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    const { topic } = await req.json();

    console.log('Generating poll and LinkedIn content for topic:', topic);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { 
            role: 'system', 
            content: `You are an AI assistant that creates engaging professional polls and LinkedIn content for AI Cloud Ops - a thought leadership platform focused on AI, Cloud Computing, and Leadership insights.

Generate a professional poll with 3-4 options and corresponding LinkedIn post content that:
- Uses an engaging hook to start
- Presents the poll question clearly  
- Includes a call-to-action to visit the site
- Uses relevant hashtags (#AI #CloudComputing #Leadership #TechPolls #Innovation)
- Maintains a professional yet engaging tone
- Includes strategic emojis for engagement
- Drives traffic back to the website

Return your response as a valid JSON object with this exact structure:
{
  "title": "Poll question/title",
  "description": "Brief context for the poll", 
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "linkedinContent": "Complete LinkedIn post content with emojis and hashtags"
}

Make the poll relevant to professionals in tech leadership, AI, or cloud computing.`
          },
          { 
            role: 'user', 
            content: `Create a professional poll about: ${topic}. Make it engaging and relevant to tech leaders and AI/cloud professionals. Include LinkedIn post content that will drive engagement and traffic to our polls section.`
          }
        ],
        max_completion_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    const generatedContent = data.choices[0].message.content;
    
    // Parse the JSON response from GPT-5
    let pollData;
    try {
      pollData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse GPT-5 response as JSON:', generatedContent);
      // Fallback: create a basic poll structure
      pollData = {
        title: `Poll about ${topic}`,
        description: "Generated poll content",
        options: ["Option A", "Option B", "Option C"],
        linkedinContent: `🤔 What's your take on ${topic}?\n\nVote in our latest poll and share your thoughts!\n\n👉 See results at aicloudops.com/polls\n\n#AI #CloudComputing #Leadership #TechPolls`
      };
    }

    console.log('Generated poll data:', pollData);

    return new Response(JSON.stringify(pollData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-poll function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate poll content',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});