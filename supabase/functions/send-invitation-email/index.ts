import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Edge Function to send invitation emails
// This will be triggered by database webhooks when invitations are created

interface InvitationData {
  id: string;
  travel_profile_id: string;
  inviter_id: string;
  invitee_email: string;
  status: string;
  created_at: string;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: InvitationData;
  schema: string;
  old_record: InvitationData | null;
}

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

Deno.serve(async (req: Request) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const payload: WebhookPayload = await req.json();
    console.log('Received webhook payload:', payload);

    // Only process INSERT operations on user_invitations table
    if (payload.type !== 'INSERT' || payload.table !== 'user_invitations') {
      return new Response(JSON.stringify({ message: 'Ignored - not an invitation insert' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const invitation = payload.record;
    console.log('Processing invitation:', invitation);

    // For now, just log the email that would be sent
    // In production, you would integrate with an email service like SendGrid, Mailgun, etc.
    const emailContent = `
      Travel Profile Invitation
      
      You have been invited to join a travel profile!
      
      Invitation ID: ${invitation.id}
      Status: ${invitation.status}
      Created: ${invitation.created_at}
      
      To accept this invitation, please contact the inviter or use the travel sharing app.
      
      Best regards,
      Travel Expenses Tracker
    `;

    console.log('Email notification would be sent:');
    console.log('To:', invitation.invitee_email);
    console.log('Subject: Travel Profile Invitation');
    console.log('Content:', emailContent);

    // TODO: Integrate with email service
    // Example with SendGrid:
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{ to: [{ email: invitation.invitee_email }] }],
    //     from: { email: 'noreply@yourapp.com' },
    //     subject: 'Travel Profile Invitation',
    //     content: [{ type: 'text/plain', value: emailContent }]
    //   })
    // });

    return new Response(JSON.stringify({
      success: true,
      message: 'Invitation email processed',
      invitation_id: invitation.id,
      email_content: emailContent
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing invitation webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: errorMessage
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
