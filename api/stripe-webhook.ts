import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Disable body parsing to get raw body for webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to get raw body from request
async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("Webhook received, method:", req.method);
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Check environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("Missing STRIPE_SECRET_KEY");
    return res.status(500).json({ error: "Server configuration error" });
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return res.status(500).json({ error: "Server configuration error" });
  }
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing Supabase configuration");
    return res.status(500).json({ error: "Server configuration error" });
  }

  // Get raw body for signature verification
  let rawBody: Buffer;
  try {
    rawBody = await getRawBody(req);
    console.log("Raw body received, length:", rawBody.length);
  } catch (err) {
    console.error("Error reading request body:", err);
    return res.status(400).json({ error: "Could not read request body" });
  }

  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("Missing stripe-signature header");
    return res.status(400).json({ error: "Missing signature" });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    console.log("Event verified successfully:", event.type);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return res.status(400).json({ error: `Webhook Error: ${message}` });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    console.error("Error processing webhook:", error);
    return res.status(500).json({ error: message });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  console.log("Handling checkout completed for user:", userId);

  if (!userId) {
    console.error("No user ID in session metadata");
    return;
  }

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const subData = subscription as unknown as Record<string, unknown>;
  const items = subData.items as { data: Array<{ price: { id: string } }> };
  const priceId = items?.data?.[0]?.price?.id;

  // Determine plan based on price ID
  let plan = "pro"; // Default to pro
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
    plan = "enterprise";
  }

  const periodStart = subData.current_period_start as number;
  const periodEnd = subData.current_period_end as number;

  // Update or create user subscription in Supabase
  const { error } = await supabase
    .from("user_subscriptions")
    .upsert({
      user_id: userId,
      plan: plan,
      status: "active",
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      current_period_start: new Date(periodStart * 1000).toISOString(),
      current_period_end: new Date(periodEnd * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id",
    });

  if (error) {
    console.error("Error updating subscription in Supabase:", error);
    throw error;
  }

  console.log(`Subscription created for user ${userId}: ${plan}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const subData = subscription as unknown as Record<string, unknown>;
  const customerId = subData.customer as string;
  
  // Try to find user by customer ID
  const { data } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();
  
  if (!data) {
    console.error("Could not find user for subscription update");
    return;
  }

  const items = subData.items as { data: Array<{ price: { id: string } }> };
  const priceId = items?.data?.[0]?.price?.id;
  let plan = "pro";
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
    plan = "enterprise";
  }

  const subscriptionStatus = subData.status as string;
  const status = subscriptionStatus === "active" ? "active" : 
                 subscriptionStatus === "past_due" ? "past_due" :
                 subscriptionStatus === "canceled" ? "canceled" : "incomplete";

  const periodStart = subData.current_period_start as number;
  const periodEnd = subData.current_period_end as number;

  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      plan: plan,
      status: status,
      current_period_start: new Date(periodStart * 1000).toISOString(),
      current_period_end: new Date(periodEnd * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
  
  console.log("Subscription updated:", subscription.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Handling subscription deletion:", subscription.id);
  
  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      plan: "free",
      status: "canceled",
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Error handling subscription deletion:", error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const invoiceData = invoice as unknown as Record<string, unknown>;
  const subscriptionId = invoiceData.subscription as string;
  
  console.log("Handling invoice payment succeeded for subscription:", subscriptionId);
  
  if (!subscriptionId) return;

  // Update the subscription period
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const subData = subscription as unknown as Record<string, unknown>;
  const periodStart = subData.current_period_start as number;
  const periodEnd = subData.current_period_end as number;
  
  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "active",
      current_period_start: new Date(periodStart * 1000).toISOString(),
      current_period_end: new Date(periodEnd * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error("Error updating after payment success:", error);
  }

  // Reset analysis usage for the new period
  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (sub?.user_id) {
    await supabase
      .from("analysis_usage")
      .upsert({
        user_id: sub.user_id,
        analysis_count: 0,
        period_start: new Date(periodStart * 1000).toISOString(),
        period_end: new Date(periodEnd * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceData = invoice as unknown as Record<string, unknown>;
  const subscriptionId = invoiceData.subscription as string;
  
  console.log("Handling invoice payment failed for subscription:", subscriptionId);
  
  if (!subscriptionId) return;

  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  if (error) {
    console.error("Error updating subscription to past_due:", error);
  }
}
