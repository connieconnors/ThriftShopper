/**
 * New Message Email Template (optional)
 */

export interface NewMessageData {
  recipientName: string;
  senderName: string;
  itemName?: string;
  messagePreview: string;
  messagesUrl: string;
}

export function getNewMessageEmailHtml(data: NewMessageData): string {
  const subjectLine = data.itemName 
    ? `New message from ${data.senderName} about ${data.itemName}`
    : `New message from ${data.senderName}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subjectLine}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; padding: 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 2px solid #191970;">
              <h1 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 28px; color: #191970; font-weight: 700;">
                New message from ${data.senderName}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Hi ${data.recipientName},
              </p>
              
              ${data.itemName ? `
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #666666;">
                You have a new message about <strong>${data.itemName}</strong>:
              </p>
              ` : `
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #666666;">
                You have a new message:
              </p>
              `}
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #191970;">
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #333333; font-style: italic;">
                  "${data.messagePreview}"
                </p>
              </div>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 15px 0;">
                    <a href="${data.messagesUrl}" style="display: inline-block; padding: 14px 32px; background-color: #191970; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
                      Reply in ThriftShopper
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                —
              </p>
              <p style="margin: 0 0 5px; font-size: 16px; color: #191970; font-weight: 600; font-family: 'Playfair Display', serif;">
                ThriftShopper
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function getNewMessageEmailText(data: NewMessageData): string {
  const itemContext = data.itemName 
    ? `You have a new message about ${data.itemName}:`
    : `You have a new message:`;
  
  return `
Hi ${data.recipientName},

${itemContext}

"${data.messagePreview}"

Reply in ThriftShopper: ${data.messagesUrl}

—
ThriftShopper
  `.trim();
}
