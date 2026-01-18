# Supabase Dashboard SQL Instructions

## How to Apply Migrations via Supabase Dashboard

### Access the SQL Editor

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: **Real-Estate-Analyzer** (ngrzyazmxndoiknbznee)
3. Click **SQL Editor** in left sidebar
4. Click **New Query** button (top-right)

---

## Migration 1: User Subscriptions RLS

**File:** `supabase/migrations/20250115000001_create_user_subscriptions.sql`

Click **New Query**, then copy & paste:

```sql
-- Enable RLS on user_subscriptions table
ALTER TABLE IF EXISTS public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read their own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Service role manages subscriptions" ON public.user_subscriptions;

-- RLS policy: users can read their own subscriptions
CREATE POLICY "Users can read their own subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- RLS policy: only service role can insert/update subscriptions (via triggers)
CREATE POLICY "Service role manages subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create index for faster lookups if not exists
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_active ON public.user_subscriptions(user_id, status, current_period_start, current_period_end)
  WHERE status = 'active';
```

Click **Run** ▶️ (should see Success)

---

## Migration 2: Analysis Usage RLS

**File:** `supabase/migrations/20250115000002_create_analysis_usage.sql`

Click **New Query**, then copy & paste:

```sql
-- Enable RLS on analysis_usage table
ALTER TABLE IF EXISTS public.analysis_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read their own usage" ON public.analysis_usage;
DROP POLICY IF EXISTS "Service role manages usage" ON public.analysis_usage;

-- RLS policy: users can read their own usage
CREATE POLICY "Users can read their own usage"
  ON public.analysis_usage FOR SELECT
  USING (auth.uid() = user_id);

-- RLS policy: service role only can insert/update (via triggers)
CREATE POLICY "Service role manages usage"
  ON public.analysis_usage FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create indexes for faster lookups if not exists
CREATE INDEX IF NOT EXISTS idx_analysis_usage_user_id ON public.analysis_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_usage_period ON public.analysis_usage(user_id, period_start, period_end);
```

Click **Run** ▶️

---

## Migration 3: Property Analysis RLS

**File:** `supabase/migrations/20250115000003_add_rls_policies.sql`

Click **New Query**, then copy & paste:

```sql
-- Add plan_at_time column to property_analysis if it doesn't exist
ALTER TABLE IF EXISTS public.property_analysis 
ADD COLUMN IF NOT EXISTS plan_at_time TEXT DEFAULT 'free';

-- Enable RLS on property_analysis
ALTER TABLE IF EXISTS public.property_analysis ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read their own analyses" ON public.property_analysis;
DROP POLICY IF EXISTS "Users can create analyses" ON public.property_analysis;
DROP POLICY IF EXISTS "Users can update their own analyses" ON public.property_analysis;
DROP POLICY IF EXISTS "Users can delete their own analyses" ON public.property_analysis;

-- RLS policy: users can read their own analyses
CREATE POLICY "Users can read their own analyses"
  ON public.property_analysis FOR SELECT
  USING (auth.uid() = user_id);

-- RLS policy: users can insert their own analyses
CREATE POLICY "Users can create analyses"
  ON public.property_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policy: users can update their own analyses
CREATE POLICY "Users can update their own analyses"
  ON public.property_analysis FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policy: users can delete their own analyses
CREATE POLICY "Users can delete their own analyses"
  ON public.property_analysis FOR DELETE
  USING (auth.uid() = user_id);
```

Click **Run** ▶️

---

## Migration 4: BEFORE INSERT Trigger

**File:** `supabase/migrations/20250115000004_create_before_insert_trigger.sql`

Click **New Query**, then copy & paste:

```sql
-- Create BEFORE INSERT trigger function to enforce subscription limits
CREATE OR REPLACE FUNCTION public.enforce_subscription_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_plan TEXT;
  v_status TEXT;
  v_current_count INTEGER;
  v_period_start TIMESTAMP WITH TIME ZONE;
  v_period_end TIMESTAMP WITH TIME ZONE;
  v_limit INTEGER;
BEGIN
  -- Force user_id to be from auth context (never trust client)
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'PGRST301';
  END IF;
  
  -- Override the user_id with the authenticated user
  NEW.user_id := v_user_id;
  
  -- Get the user's active subscription
  SELECT sub.plan, sub.status, sub.current_period_start, sub.current_period_end
  INTO v_plan, v_status, v_period_start, v_period_end
  FROM public.user_subscriptions sub
  WHERE sub.user_id = v_user_id
    AND sub.status = 'active'
  ORDER BY sub.updated_at DESC
  LIMIT 1;
  
  -- Default to free plan if no active subscription found
  IF v_plan IS NULL THEN
    v_plan := 'free';
    v_period_start := DATE_TRUNC('month', CURRENT_TIMESTAMP);
    v_period_end := DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month';
  END IF;
  
  -- Set the plan used at time of analysis
  NEW.plan_at_time := v_plan;
  
  -- Check limits based on plan
  IF v_plan = 'free' THEN
    v_limit := 3;
    
    -- Get current usage for this billing period
    SELECT COALESCE(analysis_count, 0)
    INTO v_current_count
    FROM public.analysis_usage
    WHERE user_id = v_user_id
      AND period_start = v_period_start
      AND period_end = v_period_end;
    
    -- If no usage record exists, count is 0
    IF v_current_count IS NULL THEN
      v_current_count := 0;
    END IF;
    
    -- Check if limit would be exceeded
    IF v_current_count >= v_limit THEN
      RAISE EXCEPTION 'Free plan limit reached: maximum 3 analyses per billing period. Please upgrade to pro or enterprise plan.'
        USING ERRCODE = 'P0001',
              HINT = 'upgrade_required';
    END IF;
  END IF;
  
  -- Set timestamps
  IF NEW.created_at IS NULL THEN
    NEW.created_at := CURRENT_TIMESTAMP;
  END IF;
  NEW.updated_at := CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS enforce_subscription_limits_trigger ON public.property_analysis;

-- Create the BEFORE INSERT trigger
CREATE TRIGGER enforce_subscription_limits_trigger
BEFORE INSERT ON public.property_analysis
FOR EACH ROW
EXECUTE FUNCTION public.enforce_subscription_limits();
```

Click **Run** ▶️

---

## Migration 5: AFTER INSERT Trigger

**File:** `supabase/migrations/20250115000005_create_after_insert_trigger.sql`

Click **New Query**, then copy & paste:

```sql
-- Create AFTER INSERT trigger function to increment usage
CREATE OR REPLACE FUNCTION public.increment_analysis_usage()
RETURNS TRIGGER AS $$
DECLARE
  v_period_start TIMESTAMP WITH TIME ZONE;
  v_period_end TIMESTAMP WITH TIME ZONE;
  v_plan TEXT;
BEGIN
  -- Get the billing period from the current subscription
  SELECT sub.plan, sub.current_period_start, sub.current_period_end
  INTO v_plan, v_period_start, v_period_end
  FROM public.user_subscriptions sub
  WHERE sub.user_id = NEW.user_id
    AND sub.status = 'active'
  ORDER BY sub.updated_at DESC
  LIMIT 1;
  
  -- If no active subscription found, use monthly billing period
  IF v_period_start IS NULL THEN
    v_period_start := DATE_TRUNC('month', CURRENT_TIMESTAMP);
    v_period_end := DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month';
  END IF;
  
  -- Insert or update the usage record
  INSERT INTO public.analysis_usage (user_id, analysis_count, period_start, period_end, created_at, updated_at)
  VALUES (NEW.user_id, 1, v_period_start, v_period_end, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET
    analysis_count = public.analysis_usage.analysis_count + 1,
    updated_at = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS increment_analysis_usage_trigger ON public.property_analysis;

-- Create the AFTER INSERT trigger
CREATE TRIGGER increment_analysis_usage_trigger
AFTER INSERT ON public.property_analysis
FOR EACH ROW
EXECUTE FUNCTION public.increment_analysis_usage();
```

Click **Run** ▶️

---

## Migration 6: Auto-Create Free Subscription

**File:** `supabase/migrations/20250115000006_auto_create_free_subscription.sql`

Click **New Query**, then copy & paste:

```sql
-- Create function to initialize user subscription on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a default free plan subscription for new users
  INSERT INTO public.user_subscriptions (user_id, plan, status, current_period_start, current_period_end)
  VALUES (
    NEW.id,
    'free',
    'active',
    DATE_TRUNC('month', CURRENT_TIMESTAMP),
    DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to initialize subscriptions for new users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_subscription();
```

Click **Run** ▶️

---

## Backfill: Add Subscriptions for Existing Users

Click **New Query**, then copy & paste:

```sql
-- Create subscriptions for all existing users
INSERT INTO public.user_subscriptions (user_id, plan, status, current_period_start, current_period_end)
SELECT 
  u.id,
  'free',
  'active',
  DATE_TRUNC('month', CURRENT_TIMESTAMP),
  DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_subscriptions 
  WHERE user_id = u.id
);
```

Click **Run** ▶️

---

## Verification: Check Everything Works

Click **New Query**, then copy & paste to verify:

```sql
-- 1. Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('property_analysis', 'user_subscriptions', 'analysis_usage')
ORDER BY table_name;

-- 2. Check RLS is enabled
SELECT relname, relrowsecurity FROM pg_class 
WHERE relname IN ('property_analysis', 'user_subscriptions', 'analysis_usage');

-- 3. Check functions exist
SELECT proname FROM pg_proc 
WHERE proname IN ('enforce_subscription_limits', 'increment_analysis_usage', 'handle_new_user_subscription');

-- 4. Check triggers exist
SELECT trigger_name, event_object_table FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
ORDER BY trigger_name;

-- 5. Check plan_at_time column
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'property_analysis' AND column_name = 'plan_at_time';

-- 6. Sample data verification
SELECT 'user_subscriptions count:', COUNT(*) FROM public.user_subscriptions;
SELECT 'analysis_usage count:', COUNT(*) FROM public.analysis_usage;
SELECT 'property_analysis count:', COUNT(*) FROM public.property_analysis;
```

Click **Run** ▶️ - should see all results

---

## ✅ You're Done!

All migrations are now deployed. Your subscription enforcement system is live and will:

✅ **Auto-create** free subscriptions for new users  
✅ **Enforce limits** (3/month for free) at database level  
✅ **Track usage** automatically when analyses are created  
✅ **Reject** 4th+ analyses with clear error message  
✅ **Allow unlimited** for pro/enterprise plans

Test it by creating a test user and attempting 4 analyses - the 4th should fail! 🎉
