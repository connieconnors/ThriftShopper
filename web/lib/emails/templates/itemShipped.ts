/**
 * Item Shipped Email Template (to buyer)
 */

export interface ItemShippedData {
  buyerName: string;
  orderId: string;
  itemName: string;
  trackingNumber: string;
  carrierName?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  sellerName: string;
}

export function getItemShippedEmailHtml(data: ItemShippedData): string {
  const trackingDisplay = data.carrierName 
    ? `${data.trackingNumber} (${data.carrierName})`
    : data.trackingNumber;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your order is on the way</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f8f9fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; padding: 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 2px solid #191970;">
              <h1 style="margin: 0; font-family: 'Merriweather', serif; font-size: 28px; color: #191970; font-weight: 700;">
                Your order is on the way
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Hi ${data.buyerName},
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Good news — your item has shipped!
              </p>
              
              <div style="background-color: #FFF8E6; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #EFBF05;">
                <p style="margin: 0 0 10px; font-size: 18px; color: #191970; font-weight: 600;">
                  ${data.itemName}
                </p>
                <p style="margin: 0 0 10px; font-size: 15px; color: #666666;">
                  Tracking: <span style="font-weight: 600; color: #191970; font-family: monospace;">${trackingDisplay}</span>
                </p>
                ${data.carrierName ? `<p style="margin: 0; font-size: 15px; color: #666666;">Carrier: ${data.carrierName}</p>` : ''}
              </div>
              
              ${data.trackingUrl ? `
              <!-- Tracking Button -->
              <table role="presentation" style="width: 100%; margin: 20px 0;">
                <tr>
                  <td align="center" style="padding: 15px 0;">
                    <a href="${data.trackingUrl}" style="display: inline-block; padding: 14px 32px; background-color: #191970; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
                      Track your package
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              ${data.estimatedDelivery ? `
              <p style="margin: 20px 0; font-size: 15px; line-height: 1.6; color: #333333;">
                <strong>Expected delivery:</strong> ${data.estimatedDelivery}
              </p>
              ` : ''}
              
              <p style="margin: 20px 0; font-size: 15px; line-height: 1.6; color: #333333;">
                Questions about your order? Message ${data.sellerName} through ThriftShopper.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center;">
              <p style="margin: 0; font-size: 16px; font-family: 'Merriweather', serif; color: #000080; font-weight: 500; line-height: 1.1;">
                ThriftShopper
              </p>
              <p style="margin: 2px 0 0; font-size: 12px; color: #efbf04; font-style: italic; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; line-height: 1.1;">
                the magic of discovery<sup style="font-size: 0.6em; color: #efbf04;">TM</sup>
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

export function getItemShippedEmailText(data: ItemShippedData): string {
  const trackingDisplay = data.carrierName 
    ? `${data.trackingNumber} (${data.carrierName})`
    : data.trackingNumber;
  
  return `
Hi ${data.buyerName},

Good news — your item has shipped!

${data.itemName}
Tracking: ${trackingDisplay}
${data.carrierName ? `Carrier: ${data.carrierName}` : ''}

${data.trackingUrl ? `Track your package: ${data.trackingUrl}` : ''}

${data.estimatedDelivery ? `Expected delivery: ${data.estimatedDelivery}` : ''}

Questions about your order? Message ${data.sellerName} through ThriftShopper.

ThriftShopper
the magic of discovery™
  `.trim();
}
