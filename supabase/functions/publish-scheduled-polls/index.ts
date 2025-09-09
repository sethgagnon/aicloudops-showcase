import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    console.log('Checking for scheduled polls to publish...');

    // Get all scheduled polls that should be published now
    const now = new Date().toISOString();
    const { data: scheduledPolls, error: fetchError } = await supabase
      .from('polls')
      .select('id, title, scheduled_at')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now);

    if (fetchError) {
      console.error('Error fetching scheduled polls:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${scheduledPolls?.length || 0} polls to publish`);

    if (scheduledPolls && scheduledPolls.length > 0) {
      // First, close any currently live polls
      const { error: closeError } = await supabase
        .from('polls')
        .update({ status: 'closed' })
        .eq('status', 'live');

      if (closeError) {
        console.error('Error closing live polls:', closeError);
        throw closeError;
      }

      // Then publish the scheduled polls (usually should be just one, but handle multiple)  
      const pollIds = scheduledPolls.map(poll => poll.id);
      const { error: publishError } = await supabase
        .from('polls')
        .update({ status: 'live' })
        .in('id', pollIds);

      if (publishError) {
        console.error('Error publishing scheduled polls:', publishError);
        throw publishError;
      }

      console.log(`Successfully published ${scheduledPolls.length} polls`);
      
      return new Response(JSON.stringify({
        success: true,
        publishedPolls: scheduledPolls.length,
        polls: scheduledPolls.map(p => ({ id: p.id, title: p.title }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      publishedPolls: 0,
      message: 'No scheduled polls to publish'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in publish-scheduled-polls function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});