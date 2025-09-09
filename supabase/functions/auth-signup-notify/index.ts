import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SignupNotifyPayload {
  email: string;
  name?: string;
  user_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("Missing RESEND_API_KEY secret");
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const payload = (await req.json()) as SignupNotifyPayload;
    const { email, name, user_id } = payload || {};

    if (!email) {
      return new Response(JSON.stringify({ error: "Missing required field: email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resend = new Resend(resendApiKey);

    const adminRecipient = "sethgagnon@gmail.com"; // Admin email to notify

    const subject = `New user signup: ${email}`;
    const now = new Date().toISOString();

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif;">
        <h2 style="margin:0 0 12px;">New user signed up</h2>
        <p style="margin:0 0 8px;">A new user just created an account.</p>
        <ul style="padding-left:16px;">
          <li><strong>Email:</strong> ${email}</li>
          ${name ? `<li><strong>Name:</strong> ${name}</li>` : ""}
          ${user_id ? `<li><strong>User ID:</strong> ${user_id}</li>` : ""}
          <li><strong>Time (UTC):</strong> ${now}</li>
        </ul>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: "Signup Notifier <onboarding@resend.dev>",
      to: [adminRecipient],
      subject,
      html,
      reply_to: email,
    } as any);

    if (error) {
      console.error("Resend error:", error);
      return new Response(JSON.stringify({ error }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Notification email sent:", data);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error("auth-signup-notify error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
