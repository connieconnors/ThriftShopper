/**
 * Payment Received Email Template (to seller)
 */

export interface PaymentReceivedData {
  sellerName: string;
  itemName: string;
  orderId: string;
  amount: number;
  paymentDate: string;
  stripeDashboardUrl?: string;
}

export function getPaymentReceivedEmailHtml(data: PaymentReceivedData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment received for ${data.itemName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8f9fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; padding: 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 2px solid #EFBF05;">
              <h1 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 28px; color: #191970; font-weight: 700;">
                Payment received for ${data.itemName}
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Hi ${data.sellerName},
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                You've been paid for your sale!
              </p>
              
              <div style="background-color: #FFF8E6; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #EFBF05;">
                <p style="margin: 0 0 10px; font-size: 18px; color: #191970; font-weight: 600;">
                  ${data.itemName}
                </p>
                <p style="margin: 0 0 10px; font-size: 15px; color: #666666;">
                  Amount: <span style="font-weight: 600; color: #191970; font-size: 20px;">$${data.amount.toFixed(2)}</span>
                </p>
                <p style="margin: 0; font-size: 15px; color: #666666;">
                  Payment date: ${data.paymentDate}
                </p>
              </div>
              
              <p style="margin: 20px 0; font-size: 15px; line-height: 1.6; color: #333333;">
                Funds have been deposited to your Stripe account.
              </p>
              
              ${data.stripeDashboardUrl ? `
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 15px 0;">
                    <a href="${data.stripeDashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #191970; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
                      View transaction details
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <p style="margin: 20px 0; font-size: 15px; line-height: 1.6; color: #333333;">
                Thanks for being part of ThriftShopper.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center;">
              <p style="margin: 0; font-size: 16px; font-family: 'Playfair Display', serif; color: #000080; font-weight: 500;">
                ThriftShopper
              </p>
              <p style="margin: -2px 0 0; font-size: 12px; color: #efbf04; font-style: italic; font-weight: 400; font-family: 'Playfair Display', serif; line-height: 1.2;">
                the magic of discovery<sup style="font-size: 0.7em; color: #efbf04;">TM</sup>
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

export function getPaymentReceivedEmailText(data: PaymentReceivedData): string {
  return `
Hi ${data.sellerName},

You've been paid for your sale!

${data.itemName}
Amount: $${data.amount.toFixed(2)}
Payment date: ${data.paymentDate}

Funds have been deposited to your Stripe account.

${data.stripeDashboardUrl ? `View transaction details: ${data.stripeDashboardUrl}` : ''}

Thanks for being part of ThriftShopper.

ThriftShopper
the magic of discovery™
  `.trim();
}
