import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current week date
    const currentWeek = new Date().toISOString().split('T')[0];

    // Check if we already have a poll for this week
    const { data: existingPoll } = await supabase
      .from('polls')
      .select('id')
      .eq('week_of', currentWeek)
      .maybeSingle();

    if (existingPoll) {
      return new Response(
        JSON.stringify({ error: 'A poll already exists for this week' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate AI poll using GPT-5
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
            content: `You are an expert at creating engaging weekly polls for an AI Cloud Ops blog. Create polls that are:
            - Relevant to AI, Cloud Computing, DevOps, or Technology Leadership
            - Professional but engaging
            - Have exactly 4 clear, distinct options
            - Suitable for both technical and business audiences
            - Current and trending topics
            
            Return ONLY a valid JSON object with this exact structure:
            {
              "title": "Clear, engaging poll question",
              "description": "Brief context or explanation (optional, can be null)",
              "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
            }`
          },
          {
            role: 'user',
            content: 'Generate a weekly poll for an AI Cloud Ops blog audience. Focus on current trends, practical decisions, or thought-provoking questions about AI, cloud infrastructure, DevOps practices, or tech leadership.'
          }
        ],
        max_completion_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    const generatedContent = data.choices[0].message.content;
    
    let pollData;
    try {
      pollData = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedContent);
      throw new Error('Failed to parse AI-generated poll data');
    }

    // Validate the structure
    if (!pollData.title || !Array.isArray(pollData.options) || pollData.options.length !== 4) {
      console.error('Invalid poll structure:', pollData);
      throw new Error('AI generated invalid poll structure');
    }

    // Insert the generated poll as draft
    const { data: newPoll, error: insertError } = await supabase
      .from('polls')
      .insert({
        title: pollData.title,
        description: pollData.description,
        options: pollData.options,
        week_of: currentWeek,
        ai_generated: true,
        status: 'draft'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to save generated poll');
    }

    console.log('Poll generated successfully:', newPoll.id);

    return new Response(
      JSON.stringify({ 
        poll: newPoll,
        message: 'Weekly poll generated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-weekly-poll function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate poll',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});