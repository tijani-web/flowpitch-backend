// lib/emailService.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendInvitationEmail = async (email, inviteLink, projectTitle, inviterName) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'FlowPitch <invitations@basittijani.com>',
      to: email,
      subject: `You're invited to collaborate on ${projectTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px;
            }
            .header { 
              background: linear-gradient(135deg, #3B82F6, #1D4ED8);
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 12px 12px 0 0;
            }
            .content { 
              background: #fff; 
              padding: 30px; 
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 12px 12px;
            }
            .btn { 
              background: #3B82F6; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              display: inline-block; 
              font-weight: 600;
              margin: 20px 0;
            }
            .features { 
              background: #f8fafc; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0;
            }
            .footer { 
              text-align: center; 
              color: #6b7280; 
              font-size: 14px; 
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🚀 You're Invited!</h1>
            <p>Join ${projectTitle} on FlowPitch</p>
          </div>
          
          <div class="content">
            <p>Hi there,</p>
            
            <p><strong>${inviterName}</strong> has invited you to collaborate on <strong>"${projectTitle}"</strong> on FlowPitch.</p>
            
            <div class="features">
              <p><strong>As a team member, you'll be able to:</strong></p>
              <ul>
                <li>✅ Suggest new features and ideas</li>
                <li>✅ Vote and comment on roadmap items</li>
                <li>✅ Move features between stages</li>
                <li>✅ Collaborate with the team in discussions</li>
              </ul>
            </div>

            <div style="text-align: center;">
              <a href="${inviteLink}" class="btn">Accept Invitation</a>
            </div>

            <p>Or copy this link:<br>
            <code style="background: #f3f4f6; padding: 8px; border-radius: 4px; word-break: break-all;">${inviteLink}</code></p>

            <p>This invitation link will expire in 7 days.</p>
            
            <p>Welcome to the team!<br>
            <strong>The FlowPitch Team</strong></p>
          </div>

          <div class="footer">
            <p>© 2024 FlowPitch. All rights reserved.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send invitation email:', error);
      throw new Error('Failed to send invitation email');
    }

    console.log('Invitation email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
};

// Optional: Email for when someone joins
export const sendWelcomeEmail = async (email, projectTitle, inviterName) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'FlowPitch <team@flowpitch.com>',
      to: email,
      subject: `Welcome to ${projectTitle}!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1>🎉 Welcome Aboard!</h1>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p>You've successfully joined <strong>${projectTitle}</strong> on FlowPitch!</p>
            <p>You can now start collaborating with ${inviterName} and the team.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      `,
    });

    return data;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
};