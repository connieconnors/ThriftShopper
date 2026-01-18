import {
  getOrderConfirmationEmailHtml,
} from "@/lib/emails/templates/orderConfirmation";
import { getItemSoldEmailHtml } from "@/lib/emails/templates/itemSold";
import { getPaymentReceivedEmailHtml } from "@/lib/emails/templates/paymentReceived";
import { getItemShippedEmailHtml } from "@/lib/emails/templates/itemShipped";
import { getNewMessageEmailHtml } from "@/lib/emails/templates/newMessage";

type TemplateKey =
  | "orderConfirmation"
  | "itemSold"
  | "paymentReceived"
  | "itemShipped"
  | "newMessage";

const templates: Record<TemplateKey, () => string> = {
  orderConfirmation: () =>
    getOrderConfirmationEmailHtml({
      buyerName: "Avery",
      orderId: "TS-48291",
      itemName: "Vintage Stoneware Plate",
      price: 48,
      shippingAddress: {
        name: "Avery Woods",
        address: "123 Maple Ave",
        city: "Nashville",
        state: "TN",
        zip: "37209",
      },
      sellerName: "Thrifter Connie",
      orderUrl: "https://example.com/orders/TS-48291",
    }),
  itemSold: () =>
    getItemSoldEmailHtml({
      sellerName: "Thrifter Connie",
      itemName: "Vintage Stoneware Plate",
      price: 48,
      buyerName: "Avery Woods",
      orderId: "TS-48291",
      shippingAddress: {
        name: "Avery Woods",
        address: "123 Maple Ave",
        city: "Nashville",
        state: "TN",
        zip: "37209",
      },
      sellerDashboardUrl: "https://example.com/seller/orders/TS-48291",
      shippingDays: 3,
    }),
  paymentReceived: () =>
    getPaymentReceivedEmailHtml({
      sellerName: "Thrifter Connie",
      itemName: "Vintage Stoneware Plate",
      amount: 48,
      orderId: "TS-48291",
      paymentDate: "January 18, 2026",
      stripeDashboardUrl: "https://dashboard.stripe.com/test",
    }),
  itemShipped: () =>
    getItemShippedEmailHtml({
      buyerName: "Avery",
      orderId: "TS-48291",
      itemName: "Vintage Stoneware Plate",
      sellerName: "Thrifter Connie",
      trackingNumber: "1Z999AA10123456784",
      trackingUrl: "https://example.com/track/1Z999AA10123456784",
    }),
  newMessage: () =>
    getNewMessageEmailHtml({
      senderName: "Thrifter Connie",
      recipientName: "Avery",
      messagePreview: "Just dropped the tracking details for your order.",
      messagesUrl: "https://example.com/messages",
    }),
};

const templateLabels: Record<TemplateKey, string> = {
  orderConfirmation: "Order Confirmation (Buyer)",
  itemSold: "Item Sold (Seller)",
  paymentReceived: "Payment Received (Seller)",
  itemShipped: "Item Shipped (Buyer)",
  newMessage: "New Message",
};

export default function EmailPreviewPage({
  searchParams,
}: {
  searchParams?: { template?: string };
}) {
  const templateKey = (searchParams?.template ||
    "orderConfirmation") as TemplateKey;
  const resolvedKey: TemplateKey =
    templateKey in templates ? templateKey : "orderConfirmation";
  const html = templates[resolvedKey]();

  return (
    <main className="min-h-screen bg-[#f8f9fa] px-6 py-8 text-[#191970]">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Email Preview</h1>
        <p className="text-sm text-[#191970]/70 mb-6">
          Choose a template to preview the HTML rendering.
        </p>
        <div className="flex flex-wrap gap-3 mb-6">
          {(Object.keys(templates) as TemplateKey[]).map((key) => (
            <a
              key={key}
              href={`/email-preview?template=${key}`}
              className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                key === resolvedKey
                  ? "bg-[#191970] text-white"
                  : "bg-white text-[#191970] border border-[#191970]/20 hover:border-[#191970]/40"
              }`}
            >
              {templateLabels[key]}
            </a>
          ))}
        </div>
        <div className="mb-3 text-sm font-medium">
          Previewing: {templateLabels[resolvedKey]}
        </div>
        <div className="rounded-2xl border border-[#191970]/10 overflow-hidden bg-white shadow-sm">
          <iframe
            title="Email preview"
            srcDoc={html}
            className="w-full"
            style={{ minHeight: "820px", border: "none" }}
          />
        </div>
      </div>
    </main>
  );
}
