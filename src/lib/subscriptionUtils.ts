import { supabase } from "@/integrations/supabase/client";

/**
 * Get user's current subscription and usage for the month
 */
export async function checkUserSubscriptionAndUsage() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        allowed: false,
        message: "Not authenticated",
        plan: null,
        currentCount: 0,
        limit: 0
      };
    }

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("plan, status, current_period_start, current_period_end")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (subError && subError.code !== "PGRST116") {
      console.error("Error fetching subscription:", subError);
      return {
        allowed: false,
        message: "Error checking subscription",
        plan: "free",
        currentCount: 0,
        limit: 3
      };
    }

    const plan = subscription?.plan || "free";
    const periodStart = subscription?.current_period_start;
    const periodEnd = subscription?.current_period_end;

    // For paid users, no limit
    if (plan !== "free") {
      return {
        allowed: true,
        message: null,
        plan: plan,
        currentCount: 0,
        limit: -1 // unlimited
      };
    }

    // For free users, check usage
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const { data: usage, error: usageError } = await supabase
      .from("analysis_usage")
      .select("analysis_count")
      .eq("user_id", user.id)
      .gte("period_start", monthStart.toISOString())
      .lt("period_end", monthEnd.toISOString())
      .single();

    const currentCount = usage?.analysis_count || 0;
    const limit = 3;

    if (currentCount >= limit) {
      return {
        allowed: false,
        message: `Free plan limit reached. You have used all 3 analyses for this month. Please upgrade to continue.`,
        plan: "free",
        currentCount: currentCount,
        limit: limit
      };
    }

    return {
      allowed: true,
      message: null,
      plan: "free",
      currentCount: currentCount,
      limit: limit
    };
  } catch (error) {
    console.error("Error checking subscription and usage:", error);
    return {
      allowed: false,
      message: "Error checking subscription",
      plan: null,
      currentCount: 0,
      limit: 0
    };
  }
}

/**
 * Increment usage count after successful analysis insert
 */
export async function incrementAnalysisUsage() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("User not authenticated");
      return false;
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Upsert: insert if not exists, update if exists
    const { error } = await supabase
      .from("analysis_usage")
      .upsert({
        user_id: user.id,
        period_start: monthStart.toISOString(),
        period_end: monthEnd.toISOString(),
        analysis_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "user_id,period_start"
      });

    if (error) {
      console.error("Error incrementing usage:", error);
      return false;
    }

    // If upsert worked for new record, done. If it existed, we need to increment
    const { error: updateError } = await supabase
      .rpc("increment_analysis_count", {
        p_user_id: user.id,
        p_period_start: monthStart.toISOString()
      });

    // If RPC doesn't exist, do it with a direct update
    if (updateError) {
      const { data: existingUsage } = await supabase
        .from("analysis_usage")
        .select("analysis_count")
        .eq("user_id", user.id)
        .gte("period_start", monthStart.toISOString())
        .lt("period_end", monthEnd.toISOString())
        .single();

      if (existingUsage) {
        await supabase
          .from("analysis_usage")
          .update({
            analysis_count: existingUsage.analysis_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq("user_id", user.id)
          .gte("period_start", monthStart.toISOString())
          .lt("period_end", monthEnd.toISOString());
      }
    }

    return true;
  } catch (error) {
    console.error("Error incrementing usage:", error);
    return false;
  }
}
