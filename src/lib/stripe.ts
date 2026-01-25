import { supabase } from "@/integrations/supabase/client";

// Stripe Price ID from environment
export const STRIPE_PRO_PRICE_ID = import.meta.env.VITE_STRIPE_PRO_PRICE_ID || "";

export interface CheckoutResponse {
  sessionId: string;
  url: string;
}

/**
 * Create a Stripe Checkout session and redirect to payment
 */
export async function createCheckoutSession(priceId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const apiUrl = "/api/create-checkout-session";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: user.id,
      userEmail: user.email,
      priceId: priceId,
    }),
  });

  // Get response as text first to handle non-JSON responses
  const responseText = await response.text();
  console.log(responseText)
  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error("API returned non-JSON response:", responseText);
    throw new Error("Server error - please check Vercel function logs");
  }

  if (!response.ok) {
    throw new Error(data.error || "Failed to create checkout session");
  }

  // Redirect to Stripe Checkout
  if (data.url) {
    window.location.href = data.url;
  }
}

/**
 * Open Stripe Customer Portal for managing subscription
 */
export async function openCustomerPortal(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const apiUrl = window.location.hostname === "localhost" 
    ? `${window.location.origin}/api/create-portal-session`
    : "/api/create-portal-session";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: user.id,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to open customer portal");
  }

  const data = await response.json();

  if (data.url) {
    window.location.href = data.url;
  }
}

/**
 * Upgrade to Pro plan ($39/month)
 */
export async function upgradeToPro(): Promise<void> {
  if (!STRIPE_PRO_PRICE_ID) {
    throw new Error("Stripe Price ID not configured");
  }
  await createCheckoutSession(STRIPE_PRO_PRICE_ID);
}
