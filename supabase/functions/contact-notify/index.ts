import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactNotifyPayload {
  name: string;
  email: string;
  topic?: string;
  message: string;
}

const OWNER_EMAIL = "seth@aicloudops.tech"; // Update if needed

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, topic, message }: ContactNotifyPayload = await req.json();

    const subjectOwner = `New contact form submission: ${topic || "General Inquiry"}`;
    const htmlOwner = `
      <h2>New Contact Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Topic:</strong> ${topic || "(not specified)"}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;font-family:Inter,ui-sans-serif,system-ui;">${message}</pre>
      <hr />
      <p>Sent from AI Cloud Ops contact form.</p>
    `;

    const subjectUser = "We received your message";
    const htmlUser = `
      <h1>Thanks for reaching out, ${name}!</h1>
      <p>We received your message${topic ? ` about <strong>${topic}</strong>` : ''} and will get back to you within 24 hours.</p>
      <p>Summary of your message:</p>
      <blockquote style="border-left:4px solid #ddd;padding-left:12px;color:#555;">${message}</blockquote>
      <p>Best regards,<br/>AI Cloud Ops</p>
    `;

    // Notify owner
    await resend.emails.send({
      from: "AI Cloud Ops <onboarding@resend.dev>",
      to: [OWNER_EMAIL],
      subject: subjectOwner,
      html: htmlOwner,
    });

    // Confirmation to user
    await resend.emails.send({
      from: "AI Cloud Ops <onboarding@resend.dev>",
      to: [email],
      subject: subjectUser,
      html: htmlUser,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in contact-notify:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
