// Email service for sending invoices and notifications
import { supabase } from './supabase';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding: string;
  }>;
}

// SMTP Configuration options
const SMTP_PROVIDERS = {
  HOSTINGER: {
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
      user: 'help@getallscripts.com',
      pass: '8v+swT4uz=O'
    }
  },
  GMAIL: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false
  },
  SENDINBLUE: {
    host: 'smtp-relay.sendinblue.com',
    port: 587,
    secure: false
  }
};

// Default SMTP configuration
const DEFAULT_SMTP = SMTP_PROVIDERS.HOSTINGER;

export const sendInvoiceEmail = async (emailData: EmailData, userProfile?: any): Promise<boolean> => {
  try {
    console.log('Sending email:', emailData);
    
    // For Agency users with custom email domains, use their branded email
    let fromEmail = DEFAULT_SMTP.auth.user;
    let fromName = 'InvoiceFlow';
    let customSignature = '';
    
    if (userProfile?.plan === 'agency') {
      // Check if user has custom email domain configured
      const { data: companyInfo } = await supabase
        .from('company_info')
        .select('custom_email_domain, business_name, email_signature')
        .eq('user_id', userProfile.id)
        .maybeSingle();
      
      if (companyInfo?.custom_email_domain) {
        fromEmail = `invoices@${companyInfo.custom_email_domain}`;
        fromName = companyInfo.business_name || fromName;
        
        // Add custom signature if available
        if (companyInfo.email_signature) {
          customSignature = companyInfo.email_signature;
        }
      }
    }
    
    // Add custom signature to email if available
    if (customSignature) {
      emailData.html += `<br><br><div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">${customSignature.replace(/\n/g, '<br>')}</div>`;
    }
    
    // Log email activity
    await supabase
      .from('email_logs')
      .insert({
        user_id: userProfile?.id || null,
        recipient_email: emailData.to,
        subject: emailData.subject,
        email_type: emailData.subject.toLowerCase().includes('invoice') ? 'invoice' : 
                   emailData.subject.toLowerCase().includes('welcome') ? 'welcome' : 
                   emailData.subject.toLowerCase().includes('password') ? 'password_reset' : 'notification',
        status: 'sent',
        sent_at: new Date().toISOString()
      });
    
    console.log('Email would be sent with:', {
      from: `${fromName} <${fromEmail}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html
    });
    
    // Simulate successful email sending
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    
    // Log failed email
    try {
      await supabase
        .from('email_logs')
        .insert({
          user_id: userProfile?.id || null,
          recipient_email: emailData.to,
          subject: emailData.subject,
          email_type: 'invoice',
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
    } catch (logError) {
      console.error('Failed to log email error:', logError);
    }
    
    return false;
  }
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  try {
    const emailTemplate = generateWelcomeEmailTemplate(name);
    
    return await sendInvoiceEmail({
      to: email,
      subject: 'Welcome to InvoiceFlow!',
      html: emailTemplate,
    });
  } catch (error) {
    console.error('Welcome email sending failed:', error);
    return false;
  }
};

export const sendForgotPasswordEmail = async (email: string, resetLink: string): Promise<boolean> => {
  try {
    const emailTemplate = generateForgotPasswordEmailTemplate(resetLink);
    
    return await sendInvoiceEmail({
      to: email,
      subject: 'Reset Your Password - InvoiceFlow',
      html: emailTemplate,
    });
  } catch (error) {
    console.error('Forgot password email sending failed:', error);
    return false;
  }
};

export const generateWelcomeEmailTemplate = (name: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to InvoiceFlow</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #2563eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to InvoiceFlow!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Welcome to InvoiceFlow! We're excited to have you on board. You now have access to our powerful invoicing platform that will help streamline your business operations.</p>
          
          <div class="feature">
            <h3>🚀 Get Started</h3>
            <p>Create your first professional invoice in minutes with our intuitive interface.</p>
          </div>
          
          <div class="feature">
            <h3>💰 Multiple Payment Options</h3>
            <p>Accept payments via UPI, bank transfers, cryptocurrency, and payment links.</p>
          </div>
          
          <div class="feature">
            <h3>📊 Track Your Business</h3>
            <p>Monitor your revenue, client relationships, and business growth with detailed analytics.</p>
          </div>
          
          <p style="text-align: center;">
            <a href="${window.location.origin}/dashboard" class="button">Go to Dashboard</a>
          </p>
          
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>The InvoiceFlow Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateForgotPasswordEmailTemplate = (resetLink: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .warning { background: #fef3cd; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <p>You requested to reset your password for your InvoiceFlow account.</p>
          
          <p style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </p>
          
          <div class="warning">
            <p><strong>Security Notice:</strong></p>
            <ul>
              <li>This link will expire in 24 hours</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">${resetLink}</p>
          
          <p>Best regards,<br>The InvoiceFlow Team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateInvoiceEmailTemplate = (
  invoiceNumber: string,
  clientName: string,
  total: string,
  currency: string,
  companyName: string,
  companyEmail: string = '',
  companyPhone: string = '',
  paymentMethods: any[] = []
): string => {
  const paymentMethodsHtml = paymentMethods.length > 0 ? `
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #2563eb; margin-bottom: 15px;">Payment Methods</h3>
      ${paymentMethods.map(method => {
        switch (method.type) {
          case 'upi':
            return `
              <div style="margin-bottom: 10px;">
                <strong>UPI Payment:</strong><br>
                UPI ID: ${method.details.upi_id}<br>
                ${method.details.merchant_name ? `Merchant: ${method.details.merchant_name}` : ''}
              </div>
            `;
          case 'bank':
            return `
              <div style="margin-bottom: 10px;">
                <strong>Bank Transfer:</strong><br>
                Account: ${method.details.account_number}<br>
                Bank: ${method.details.bank_name}<br>
                IFSC: ${method.details.ifsc_code}
              </div>
            `;
          case 'crypto':
            return `
              <div style="margin-bottom: 10px;">
                <strong>Cryptocurrency (${method.details.currency}):</strong><br>
                Address: ${method.details.wallet_address}<br>
                ${method.details.network ? `Network: ${method.details.network}` : ''}
              </div>
            `;
          default:
            return `
              <div style="margin-bottom: 10px;">
                <strong>${method.name}:</strong><br>
                ${method.details.instructions || 'Contact us for payment details'}
              </div>
            `;
        }
      }).join('')}
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px 20px; background: #ffffff; border: 1px solid #e5e7eb; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; background: #f9fafb; border-radius: 0 0 8px 8px; }
        .invoice-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .amount-highlight { font-size: 24px; font-weight: bold; color: #2563eb; }
        .contact-info { background: #eff6ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Invoice ${invoiceNumber}</h1>
          <p style="margin: 0; opacity: 0.9;">From ${companyName}</p>
        </div>
        <div class="content">
          <p>Dear ${clientName},</p>
          <p>Thank you for your business! Please find your invoice details below:</p>
          
          <div class="invoice-details">
            <h3 style="margin-top: 0; color: #374151;">Invoice Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Invoice Number:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${new Date().toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>From:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${companyName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Amount Due:</strong></td>
                <td style="padding: 8px 0;" class="amount-highlight">${currency}${total}</td>
              </tr>
            </table>
          </div>
          
          ${paymentMethodsHtml}
          
          <div class="contact-info">
            <h4 style="margin-top: 0; color: #1f2937;">Contact Information</h4>
            ${companyEmail ? `<p style="margin: 5px 0;"><strong>Email:</strong> ${companyEmail}</p>` : ''}
            ${companyPhone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${companyPhone}</p>` : ''}
          </div>
          
          <p>Please find the detailed invoice attached as a PDF. If you have any questions about this invoice, please don't hesitate to contact us.</p>
          
          <p style="margin-top: 30px;">Best regards,<br><strong>${companyName}</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated email from InvoiceFlow. Please do not reply to this message.</p>
          <p style="margin: 5px 0;">For support, contact us at help@getallscripts.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Function to send team member invitation
export const sendTeamInvitation = async (
  inviteeEmail: string, 
  inviteeName: string, 
  role: string, 
  permissions: any,
  inviterName: string,
  companyName: string
): Promise<boolean> => {
  try {
    const inviteLink = `${window.location.origin}/join-team`;
    
    const emailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Team Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .role { background: #e0f2fe; padding: 10px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You've Been Invited!</h1>
          </div>
          <div class="content">
            <p>Hi ${inviteeName},</p>
            <p>${inviterName} has invited you to join the team at ${companyName} on InvoiceFlow.</p>
            
            <div class="role">
              <h3>Your Role: ${role}</h3>
              <p><strong>Permissions:</strong></p>
              <ul>
                ${permissions.manage_invoices ? '<li>Manage Invoices</li>' : ''}
                ${permissions.manage_clients ? '<li>Manage Clients</li>' : ''}
                ${permissions.view_analytics ? '<li>View Analytics</li>' : ''}
                ${permissions.manage_settings ? '<li>Manage Settings</li>' : ''}
              </ul>
            </div>
            
            <p style="text-align: center;">
              <a href="${inviteLink}" class="button">Accept Invitation</a>
            </p>
            
            <p>If you don't have an account yet, you'll need to create one using this email address.</p>
            <p>If you have any questions, please contact ${inviterName} directly.</p>
            
            <p>Best regards,<br>The InvoiceFlow Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await sendInvoiceEmail({
      to: inviteeEmail,
      subject: `${inviterName} invited you to join their team on InvoiceFlow`,
      html: emailTemplate,
    });
  } catch (error) {
    console.error('Team invitation email sending failed:', error);
    return false;
  }
};

// Function to send client portal access link
export const sendClientPortalLink = async (
  clientEmail: string,
  clientName: string,
  accessToken: string,
  businessName: string,
  userProfile?: any
): Promise<boolean> => {
  try {
    const portalLink = `${window.location.origin}/client/${accessToken}`;
    
    const emailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Your Invoice Portal Access</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .info { background: #e0f2fe; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Invoice Portal Access</h1>
          </div>
          <div class="content">
            <p>Hello ${clientName},</p>
            <p>${businessName} has provided you with access to your invoice portal where you can view and download all your invoices.</p>
            
            <div class="info">
              <p><strong>What you can do in the portal:</strong></p>
              <ul>
                <li>View all your invoices</li>
                <li>Download invoice PDFs</li>
                <li>Check payment status</li>
                <li>Make payments directly</li>
              </ul>
            </div>
            
            <p style="text-align: center;">
              <a href="${portalLink}" class="button">Access Your Invoice Portal</a>
            </p>
            
            <p>This link is unique to you and should not be shared with others.</p>
            
            <p>If you have any questions about your invoices, please contact ${businessName} directly.</p>
            
            <p>Thank you for your business!</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return await sendInvoiceEmail({
      to: clientEmail,
      subject: `Your Invoice Portal Access - ${businessName}`,
      html: emailTemplate,
    }, userProfile);
  } catch (error) {
    console.error('Client portal email sending failed:', error);
    return false;
  }
};