/**
 * Email sending utility functions
 * 
 * These functions handle sending emails using Resend.
 * Each function corresponds to a specific email type.
 */

import { resend, FROM_EMAIL_ORDERS, FROM_EMAIL_MESSAGES } from './resendClient';
import { 
  getOrderConfirmationEmailHtml, 
  getOrderConfirmationEmailText,
  type OrderConfirmationData 
} from './templates/orderConfirmation';
import { 
  getItemSoldEmailHtml, 
  getItemSoldEmailText,
  type ItemSoldData 
} from './templates/itemSold';
import { 
  getItemShippedEmailHtml, 
  getItemShippedEmailText,
  type ItemShippedData 
} from './templates/itemShipped';
import { 
  getPaymentReceivedEmailHtml, 
  getPaymentReceivedEmailText,
  type PaymentReceivedData 
} from './templates/paymentReceived';
import { 
  getNewMessageEmailHtml, 
  getNewMessageEmailText,
  type NewMessageData 
} from './templates/newMessage';

/**
 * Send order confirmation email to buyer
 */
export async function sendOrderConfirmationEmail(
  to: string,
  data: OrderConfirmationData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL_ORDERS,
      to,
      subject: `Your ThriftShopper order confirmation`,
      html: getOrderConfirmationEmailHtml(data),
      text: getOrderConfirmationEmailText(data),
    });

    if (error) {
      console.error('Error sending order confirmation email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending order confirmation email:', err);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send item sold notification to seller
 */
export async function sendItemSoldEmail(
  to: string,
  data: ItemSoldData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL_ORDERS,
      to,
      subject: `Your item sold! 🎉`,
      html: getItemSoldEmailHtml(data),
      text: getItemSoldEmailText(data),
    });

    if (error) {
      console.error('Error sending item sold email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending item sold email:', err);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send shipping notification to buyer
 */
export async function sendItemShippedEmail(
  to: string,
  data: ItemShippedData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL_ORDERS,
      to,
      subject: `Your order is on the way`,
      html: getItemShippedEmailHtml(data),
      text: getItemShippedEmailText(data),
    });

    if (error) {
      console.error('Error sending item shipped email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending item shipped email:', err);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send payment received notification to seller
 */
export async function sendPaymentReceivedEmail(
  to: string,
  data: PaymentReceivedData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL_ORDERS,
      to,
      subject: `Payment received for ${data.itemName}`,
      html: getPaymentReceivedEmailHtml(data),
      text: getPaymentReceivedEmailText(data),
    });

    if (error) {
      console.error('Error sending payment received email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending payment received email:', err);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send new message notification (optional)
 */
export async function sendNewMessageEmail(
  to: string,
  data: NewMessageData
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL_MESSAGES,
      to,
      subject: `New message from ${data.senderName}${data.itemName ? ` about ${data.itemName}` : ''}`,
      html: getNewMessageEmailHtml(data),
      text: getNewMessageEmailText(data),
    });

    if (error) {
      console.error('Error sending new message email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error sending new message email:', err);
    return { success: false, error: errorMessage };
  }
}

export type ListingInquiryEmailData = {
  sellerName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  listingTitle: string;
  listingPrice: number;
  inquiryType: "reserve" | "contact";
  message?: string;
  pickupLocationName?: string;
};

/** Notify seller of reserve / ask-about-this inquiry (no in-app payment). */
export async function sendListingInquiryEmail(
  to: string,
  data: ListingInquiryEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const isReserve = data.inquiryType === "reserve";
    const subject = isReserve
      ? `Reservation: ${data.listingTitle}`
      : `Inquiry: ${data.listingTitle}`;

    const lines = [
      `Hi ${data.sellerName},`,
      "",
      isReserve
        ? `A buyer reserved "${data.listingTitle}" ($${data.listingPrice.toFixed(2)}).`
        : `A buyer asked about "${data.listingTitle}" ($${data.listingPrice.toFixed(2)}).`,
      "",
      `Buyer: ${data.buyerName}`,
      `Email: ${data.buyerEmail}`,
    ];
    if (data.buyerPhone) lines.push(`Phone: ${data.buyerPhone}`);
    if (data.pickupLocationName && isReserve) {
      lines.push("", `Pickup / pay at: ${data.pickupLocationName}`);
    }
    if (data.message) {
      lines.push("", "Message:", data.message);
    }
    lines.push("", "— ThriftShopper");

    const text = lines.join("\n");
    const html = lines.map((l) => `<p>${l || "&nbsp;"}</p>`).join("");

    const { error } = await resend.emails.send({
      from: FROM_EMAIL_MESSAGES,
      to,
      replyTo: data.buyerEmail,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Error sending listing inquiry email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Error sending listing inquiry email:", err);
    return { success: false, error: errorMessage };
  }
}

