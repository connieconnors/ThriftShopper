/**
 * Item Sold Email Template (to seller)
 */

export interface ItemSoldData {
  sellerName: string;
  itemName: string;
  price: number;
  buyerName: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  orderId: string;
  sellerDashboardUrl: string;
  shippingDays?: number; // Default to 3 if not provided
}

export function getItemSoldEmailHtml(data: ItemSoldData): string {
  const shippingAddressFormatted = `${data.shippingAddress.address}, ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}`;
  const shippingDays = data.shippingDays || 3;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your item sold! 🎉</title>
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
                Your item sold! 🎉
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
                Great news — your item just sold!
              </p>
              
              <div style="background-color: #FFF8E6; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #EFBF05;">
                <p style="margin: 0 0 10px; font-size: 18px; color: #191970; font-weight: 600;">
                  ${data.itemName}
                </p>
                <p style="margin: 0 0 10px; font-size: 15px; color: #666666;">
                  Sale price: <span style="font-weight: 600; color: #191970;">$${data.price.toFixed(2)}</span>
                </p>
                <p style="margin: 0; font-size: 15px; color: #666666;">
                  Buyer: <span style="font-weight: 600; color: #191970;">${data.buyerName}</span>
                </p>
              </div>
              
              <div style="margin: 30px 0;">
                <p style="margin: 0 0 10px; font-size: 14px; color: #666666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                  Ship to:
                </p>
                <p style="margin: 0; font-size: 15px; color: #333333; line-height: 1.6;">
                  ${data.shippingAddress.name}<br>
                  ${shippingAddressFormatted}
                </p>
              </div>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
                <p style="margin: 0 0 15px; font-size: 15px; color: #191970; font-weight: 600;">
                  Next steps:
                </p>
                <ol style="margin: 0; padding-left: 20px; font-size: 15px; color: #333333; line-height: 1.8;">
                  <li>Package your item securely</li>
                  <li>Add tracking in your seller dashboard</li>
                  <li>Ship within ${shippingDays} days</li>
                </ol>
              </div>
              
              <p style="margin: 20px 0; font-size: 15px; line-height: 1.6; color: #333333;">
                Your payment will be processed to your Stripe account after the item is delivered.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 15px 0;">
                    <a href="${data.sellerDashboardUrl}" style="display: inline-block; padding: 14px 32px; background-color: #191970; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
                      Manage this order
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
              <p style="margin: 0; font-size: 13px; color: #999999; font-style: italic;">
                The magic of discovery
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

export function getItemSoldEmailText(data: ItemSoldData): string {
  const shippingAddressFormatted = `${data.shippingAddress.address}, ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}`;
  const shippingDays = data.shippingDays || 3;
  
  return `
Hi ${data.sellerName},

Great news — your item just sold!

${data.itemName}
Sale price: $${data.price.toFixed(2)}
Buyer: ${data.buyerName}

Ship to:
${data.shippingAddress.name}
${shippingAddressFormatted}

Next steps:
1. Package your item securely
2. Add tracking in your seller dashboard
3. Ship within ${shippingDays} days

Your payment will be processed to your Stripe account after the item is delivered.

Manage this order: ${data.sellerDashboardUrl}

—
ThriftShopper
The magic of discovery
  `.trim();
}
