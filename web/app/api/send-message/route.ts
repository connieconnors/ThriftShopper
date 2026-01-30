import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { listingId, buyerUserId, messageBody } = await request.json();

    // Get listing details and seller info
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, seller_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Get buyer profile
    const { data: buyerProfile, error: buyerError } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('user_id', buyerUserId)
      .single();

    if (buyerError || !buyerProfile) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    // Get seller profile
    const { data: sellerProfile, error: sellerError } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('user_id', listing.seller_id)
      .single();

    if (sellerError || !sellerProfile) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Generate unique masked email ID
    const maskedEmailId = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const subject = `Question about: ${listing.title}`;
    const buyerName = buyerProfile.display_name || 'A buyer';
    const escapeHtml = (s: string) =>
      String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const escapedMessageBody = messageBody
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
    const escapedBuyerName = escapeHtml(buyerName);
    const escapedListingTitle = escapeHtml(listing.title);

    // Logo URL from env – works in dev (localhost) and production (Vercel sets NEXT_PUBLIC_SITE_URL)
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
    const logoUrl = `${baseUrl}/logo-email.png`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
  <style type="text/css">
    @media only screen and (max-width: 620px) {
      .email-padding { padding: 16px 20px !important; }
      .header-padding { padding: 24px 20px 20px !important; }
      .message-title { font-size: 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif; background-color: #f8f9fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; padding: 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; border-collapse: collapse; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header: logo + "You have a new message" in Playfair Display navy -->
          <tr>
            <td class="header-padding" style="padding: 40px 40px 24px; text-align: center;">
              <table role="presentation" align="center" style="border-collapse: collapse; margin: 0 auto 16px;">
                <tr><td align="center" style="padding: 0;">
                  <img src="${logoUrl}" alt="ThriftShopper" width="48" height="48" style="display: block; width: 48px; height: 48px; border-radius: 50%;" />
                </td></tr>
              </table>
              <h1 style="margin: 0; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; color: #191970; font-weight: 700;" class="message-title">You have a new message</h1>
            </td>
          </tr>
          <!-- Gold accent line -->
          <tr>
            <td style="height: 2px; background-color: #EFBF04;"></td>
          </tr>
          <!-- Content -->
          <tr>
            <td class="email-padding" style="padding: 30px 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Hi ${escapeHtml(sellerProfile.display_name || 'there')},
              </p>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                A buyer sent you a message about one of your listings.
              </p>
              <div style="background-color: #FFF8E6; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #EFBF04;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                  <strong style="color: #333333;">From:</strong> ${escapedBuyerName}
                </p>
                <p style="margin: 0 0 14px; font-size: 14px; color: #666666;">
                  <strong style="color: #333333;">Listing:</strong> <span style="color: #191970; font-weight: 600;">${escapedListingTitle}</span>
                </p>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #333333;">${escapedMessageBody}</p>
              </div>
              <p style="margin: 20px 0 0; font-size: 14px; color: #666666;">
                Reply directly to this email to respond to ${escapedBuyerName}.
              </p>
            </td>
          </tr>
          <!-- Footer (match item sold) -->
          <tr>
            <td class="email-padding" style="padding: 30px 40px; background-color: #f8f9fa; text-align: center;">
              <p style="margin: 0; font-size: 16px; font-family: 'Playfair Display', Georgia, serif; color: #000080; font-weight: 500; line-height: 1.1;">ThriftShopper</p>
              <p style="margin: 2px 0 0; font-size: 12px; color: #efbf04; font-style: italic; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.1;">the magic of discovery<sup style="font-size: 0.6em; color: #efbf04;">TM</sup></p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #999999;">Message ID: ${maskedEmailId}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // Send email to seller via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'ThriftShopper <messages@thriftshopper.com>',
      to: sellerProfile.email,
      replyTo: buyerProfile.email,
      subject: subject,
      html,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    // Log message to database
    const { error: dbError } = await supabase
      .from('messages')
      .insert({
        listing_id: listingId,
        buyer_user_id: buyerUserId,
        seller_user_id: listing.seller_id,
        buyer_email: buyerProfile.email,
        seller_email: sellerProfile.email,
        subject: subject,
        message_body: messageBody,
        masked_email_id: maskedEmailId,
        status: 'sent'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Email sent but logging failed - not critical
    }

    return NextResponse.json({ 
      success: true, 
      messageId: maskedEmailId 
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}