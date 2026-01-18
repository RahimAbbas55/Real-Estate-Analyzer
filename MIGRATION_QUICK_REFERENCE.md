# Migration Quick Reference

## Files to Execute in Supabase Dashboard SQL Editor

### Step 1: RLS Policies for User Subscriptions
📄 **File:** `supabase/migrations/20250115000001_create_user_subscriptions.sql`

Enables RLS on `user_subscriptions` table with policies:
- Users can read their own subscriptions
- Service role manages subscriptions

---

### Step 2: RLS Policies for Analysis Usage  
📄 **File:** `supabase/migrations/20250115000002_create_analysis_usage.sql`

Enables RLS on `analysis_usage` table with policies:
- Users can read their own usage
- Service role manages usage

---

### Step 3: RLS on Property Analysis + plan_at_time Column
📄 **File:** `supabase/migrations/20250115000003_add_rls_policies.sql`

- Adds `plan_at_time` column to `property_analysis`
- Enables RLS with complete policies for CRUD operations

---

### Step 4: BEFORE INSERT Trigger - Enforce Limits
📄 **File:** `supabase/migrations/20250115000004_create_before_insert_trigger.sql`

Creates `enforce_subscription_limits()` function with trigger:
- ✅ Forces `user_id` from `auth.uid()`
- ✅ Fetches active subscription (defaults to free)
- ✅ For free plan: checks if 3 analyses reached
- ✅ Rejects insert with error code P0001 if limit exceeded
- ✅ Sets `plan_at_time` column
- ✅ Sets timestamps automatically

---

### Step 5: AFTER INSERT Trigger - Increment Usage
📄 **File:** `supabase/migrations/20250115000005_create_after_insert_trigger.sql`

Creates `increment_analysis_usage()` function with trigger:
- ✅ Auto-increments `analysis_count` in `analysis_usage`
- ✅ Creates usage record if not exists
- ✅ Uses UPSERT for concurrent safety

---

### Step 6: Auto-Create Free Subscription on Signup
📄 **File:** `supabase/migrations/20250115000006_auto_create_free_subscription.sql`

Creates `handle_new_user_subscription()` function with trigger:
- ✅ Fires when new user created in `auth.users`
- ✅ Auto-creates free plan subscription
- ✅ Sets billing period to current month

---

## Backfill for Existing Users

After running all migrations above, execute this to give existing users subscriptions:

```sql
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

---

## Verification Commands

After all migrations, verify everything is set up:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check user_subscriptions RLS is enabled
SELECT relname, relrowsecurity FROM pg_class 
WHERE relname = 'user_subscriptions';

-- Check analysis_usage RLS is enabled
SELECT relname, relrowsecurity FROM pg_class 
WHERE relname = 'analysis_usage';

-- Check property_analysis has plan_at_time column
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'property_analysis' 
ORDER BY ordinal_position;

-- Check triggers exist
SELECT trigger_name, event_object_table FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
ORDER BY trigger_name;

-- Sample user subscriptions
SELECT * FROM public.user_subscriptions LIMIT 5;

-- Sample usage tracking
SELECT * FROM public.analysis_usage LIMIT 5;
```

---

## Error Expected During Testing

When free plan limit (3) is reached:

```
Error Code: P0001
Message: Free plan limit reached: maximum 3 analyses per billing period. 
         Please upgrade to pro or enterprise plan.
HINT: upgrade_required
```

This is **expected and correct** - it means the database enforcement is working!

---

## Key Design Decisions

✅ **Database-level enforcement** - Frontend cannot bypass  
✅ **SECURITY DEFINER functions** - Run with service role privileges  
✅ **auth.uid() source of truth** - Never trust user_id from client  
✅ **Monthly billing periods** - Auto-calculated from timestamp  
✅ **One subscription per user** - UNIQUE constraint on user_id  
✅ **Automatic usage tracking** - No app code needed  
✅ **Zero trust architecture** - All validation in database  
