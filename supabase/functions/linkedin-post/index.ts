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
    const { pollId, linkedinContent } = await req.json();

    console.log('Posting to LinkedIn for poll:', pollId);

    const linkedinAccessToken = Deno.env.get('LINKEDIN_ACCESS_TOKEN');
    
    if (!linkedinAccessToken) {
      throw new Error('LinkedIn access token not configured');
    }

    // Get LinkedIn user profile to get the person URN
    const profileResponse = await fetch('https://api.linkedin.com/v2/people/~', {
      headers: {
        'Authorization': `Bearer ${linkedinAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('LinkedIn profile API error:', profileResponse.status, errorText);
      throw new Error(`Failed to get LinkedIn profile: ${profileResponse.status}`);
    }

    const profileData = await profileResponse.json();
    const personUrn = profileData.id;

    console.log('LinkedIn profile obtained:', personUrn);

    // Create LinkedIn post
    const postData = {
      author: `urn:li:person:${personUrn}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: linkedinContent
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    };

    console.log('Posting to LinkedIn with data:', JSON.stringify(postData, null, 2));

    const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${linkedinAccessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postData),
    });

    if (!postResponse.ok) {
      const errorText = await postResponse.text();
      console.error('LinkedIn post API error:', postResponse.status, errorText);
      throw new Error(`Failed to post to LinkedIn: ${postResponse.status} - ${errorText}`);
    }

    const postResult = await postResponse.json();
    console.log('LinkedIn post created:', postResult);

    // Update the poll in Supabase with LinkedIn post info
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: updateError } = await supabase
      .from('polls')
      .update({
        linkedin_post_id: postResult.id,
        linkedin_posted_at: new Date().toISOString(),
        linkedin_content: linkedinContent
      })
      .eq('id', pollId);

    if (updateError) {
      console.error('Error updating poll with LinkedIn info:', updateError);
      throw new Error(`Failed to update poll: ${updateError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      linkedinPostId: postResult.id,
      linkedinUrl: `https://www.linkedin.com/feed/update/${postResult.id}/`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in linkedin-post function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to post to LinkedIn',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});