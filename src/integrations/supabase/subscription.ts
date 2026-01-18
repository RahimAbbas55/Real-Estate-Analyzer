import { supabase } from "./client";

export interface SubscriptionStatus {
  plan: "free" | "pro" | "enterprise";
  status: "active" | "canceled" | "past_due" | "incomplete";
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
}

export interface UsageInfo {
  currentCount: number;
  limit: number;
  remainingAllowance: number;
  percentageUsed: number;
}

export interface SubscriptionCheckResult {
  allowed: boolean;
  message?: string;
  subscription?: SubscriptionStatus;
  usage?: UsageInfo;
}

/**
 * Get the current billing period for the user
 * Returns [periodStart, periodEnd] as dates
 */
function getCurrentBillingPeriod(): [Date, Date] {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return [periodStart, periodEnd];
}

/**
 * Fetch user's active subscription
 * Defaults to 'free' plan if none exists
 */
export async function getUserSubscription(): Promise<SubscriptionStatus> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Not authenticated");
    }


    const now = new Date().toISOString();
    const { data: subscription, error } = await supabase
      .from("user_subscriptions")
      .select("plan, status, current_period_start, current_period_end")
      .eq("user_id", user.id)
      .eq("status", "active")
      .lte("current_period_start", now)
      .gt("current_period_end", now)
      .single();

    if (subscription) {
      return {
        plan: subscription.plan as "free" | "pro" | "enterprise",
        status: subscription.status as "active" | "canceled" | "past_due" | "incomplete",
        billingPeriodStart: new Date(subscription.current_period_start),
        billingPeriodEnd: new Date(subscription.current_period_end),
      };
    }

    // Default to free plan with current month as billing period
    return {
      plan: "free",
      status: "active",
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
    };
  } catch (error) {
    console.error("Error fetching subscription:", error);
    const [periodStart, periodEnd] = getCurrentBillingPeriod();
    return {
      plan: "free",
      status: "active",
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
    };
  }
}

/**
 * Get current usage count for the billing period
 */
export async function getCurrentUsageCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return 0;
    }


    const now = new Date().toISOString();
    const { data: usage, error } = await supabase
      .from("analysis_usage")
      .select("analysis_count")
      .eq("user_id", user.id)
      .lte("period_start", now)
      .gt("period_end", now)
      .single();

    // If PGRST116 error, it means no record exists (usage is 0)
    if (error?.code === "PGRST116") {
      return 0;
    }

    if (error) {
      console.error("Error fetching usage:", error);
      return 0;
    }
    return usage.analysis_count || 0;
  } catch (error) {
    console.error("Error getting usage count:", error);
    return 0;
  }
}

/**
 * Get comprehensive usage information
 */
export async function getUsageInfo(): Promise<UsageInfo> {
  const currentCount = await getCurrentUsageCount();
  const subscription = await getUserSubscription();

  let limit = 999; // Effectively unlimited for paid plans
  if (subscription.plan === "free") {
    limit = 3;
  }

  const remainingAllowance = Math.max(0, limit - currentCount);
  const percentageUsed = limit === 999 ? 0 : Math.round((currentCount / limit) * 100);

  return {
    currentCount,
    limit: subscription.plan === "free" ? 3 : 999,
    remainingAllowance,
    percentageUsed,
  };
}

/**
 * Check if user can submit a new analysis
 * Provides detailed information about subscription status and usage
 */
export async function canSubmitAnalysis(): Promise<SubscriptionCheckResult> {
  try {
    const subscription = await getUserSubscription();
    const usage = await getUsageInfo();

    // Check if limit would be exceeded
    if (subscription.plan === "free" && usage.currentCount >= 3) {
      return {
        allowed: false,
        message: "Free plan limit reached: maximum 3 analyses per billing period. Please upgrade to Pro or Enterprise for unlimited analyses.",
        subscription,
        usage,
      };
    }

    return {
      allowed: true,
      subscription,
      usage,
    };
  } catch (error) {
    console.error("Error checking subscription:", error);
    // Allow on error to not block users
    return {
      allowed: true,
      message: "Unable to verify subscription status, proceeding anyway",
    };
  }
}

/**
 * Format usage information for display
 */
export function formatUsageMessage(usage: UsageInfo): string {
  if (usage.limit === 999) {
    return "Unlimited analyses available";
  }

  return `${usage.currentCount} of ${usage.limit} analyses used this month (${usage.percentageUsed}%)`;
}

/**
 * Increment analysis usage count for the current billing period
 * Record is automatically created when user signs up, this just increments it
 */
export async function incrementAnalysisUsage(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("Not authenticated - cannot increment usage");
      return;
    }

    const [periodStart] = getCurrentBillingPeriod();
    const periodStartStr = periodStart.toISOString();

    // Get current count and increment by 1
    const { data: currentRecord, error: fetchError } = await supabase
      .from("analysis_usage")
      .select("analysis_count")
      .eq("user_id", user.id)
      .eq("period_start", periodStartStr)
      .single();

    if (fetchError) {
      console.error("Error fetching current usage:", fetchError);
      return;
    }

    const newCount = (currentRecord?.analysis_count || 0) + 1;

    // Update with new count
    const { error: updateError } = await supabase
      .from("analysis_usage")
      .update({ analysis_count: newCount })
      .eq("user_id", user.id)
      .eq("period_start", periodStartStr);

    if (updateError) {
      console.error("Error incrementing usage:", updateError);
    } else {
      console.log(`Analysis usage incremented to ${newCount}`);
    }
  } catch (error) {
    console.error("Error in incrementAnalysisUsage:", error);
  }
}
