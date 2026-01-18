# Subscription Implementation - Developer Migration Guide

## Quick Start

This guide walks you through deploying the subscription-based usage limits system to your Supabase project.

## Prerequisites

- Supabase project is set up and running
- `supabase` CLI is installed: `npm install -g @supabase/cli`
- You have access to your Supabase project

## Step 1: Apply Database Migrations

### Option A: Using Supabase CLI (Recommended)

```bash
cd /path/to/house-finder-mate

# Link to your Supabase project if not already linked
supabase link --project-ref ngrzyazmxndoiknbznee

# Push migrations to your project
supabase db push
```

The CLI will:
1. Detect all migration files in `/supabase/migrations/`
2. Apply them in order (by timestamp)
3. Update your local schema

### Option B: Manual SQL Execution

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of each migration file in order:
   - `20250115000001_create_user_subscriptions.sql`
   - `20250115000002_create_analysis_usage.sql`
   - `20250115000003_add_rls_policies.sql`
   - `20250115000004_create_before_insert_trigger.sql`
   - `20250115000005_create_after_insert_trigger.sql`
5. Execute each one individually

## Step 2: Initialize User Subscriptions

For existing users, create default subscriptions:

```sql
-- Run this in your Supabase SQL Editor
INSERT INTO user_subscriptions (user_id, plan, status, billing_period_start, billing_period_end)
SELECT 
  id,
  'free',
  'active',
  DATE_TRUNC('month', CURRENT_TIMESTAMP),
  DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'
FROM auth.users
WHERE id NOT IN (SELECT DISTINCT user_id FROM user_subscriptions)
ON CONFLICT DO NOTHING;
```

## Step 3: Verify Migrations

Check that everything was applied correctly:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_subscriptions', 'analysis_usage', 'property_analysis');

-- Check triggers exist
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND event_object_table = 'property_analysis';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_subscriptions', 'analysis_usage', 'property_analysis');
```

Expected output:
- 3 tables: `user_subscriptions`, `analysis_usage`, `property_analysis`
- 2 triggers on `property_analysis`
- All three tables should have `rowsecurity = true`

## Step 4: Update Frontend Types

The TypeScript types have already been updated in `/src/integrations/supabase/types.ts`, but if you want to regenerate them from your Supabase schema:

```bash
# Using Supabase CLI
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

## Step 5: Test the System

### Test Case 1: Free Plan Limit

```bash
# Use a test user with free plan
# Submit 3 analyses - all should succeed
# Submit 4th analysis - should fail with limit error
```

### SQL Test Queries

```sql
-- Create a test user subscription for testing
INSERT INTO user_subscriptions (user_id, plan, status, billing_period_start, billing_period_end)
VALUES (
  'your-test-user-id',
  'free',
  'active',
  DATE_TRUNC('month', CURRENT_TIMESTAMP),
  DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'
);

-- View the subscription
SELECT * FROM user_subscriptions WHERE user_id = 'your-test-user-id';

-- Create test analyses (simulating submissions)
INSERT INTO property_analysis (user_id, status, property_address, plan_at_time)
VALUES ('your-test-user-id', 'pending', '123 Test St', 'free');

-- Check usage was tracked
SELECT * FROM analysis_usage WHERE user_id = 'your-test-user-id';

-- Try to exceed limit (should fail)
INSERT INTO property_analysis (user_id, status, property_address, plan_at_time)
VALUES ('your-test-user-id', 'pending', '456 Test Ave', 'free');
-- ... repeat until you hit the limit error
```

## Step 6: Monitor the System

### View Current Usage

```sql
-- Get all users and their current usage
SELECT 
  u.user_id,
  s.plan,
  COALESCE(au.analysis_count, 0) as usage_count,
  CASE 
    WHEN s.plan = 'free' THEN 3
    ELSE 999
  END as limit_,
  CASE 
    WHEN s.plan = 'free' THEN 3 - COALESCE(au.analysis_count, 0)
    ELSE 999
  END as remaining
FROM user_subscriptions s
LEFT JOIN analysis_usage au ON au.user_id = s.user_id
  AND au.period_start >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
  AND au.period_end < DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'
JOIN auth.users u ON u.id = s.user_id
WHERE s.status = 'active'
  AND s.billing_period_start >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
ORDER BY s.plan DESC, usage_count DESC;
```

### Identify Users Near Limit

```sql
-- Users on free plan with 2 or more analyses
SELECT 
  u.email,
  au.analysis_count
FROM analysis_usage au
JOIN user_subscriptions s ON s.user_id = au.user_id AND s.plan = 'free' AND s.status = 'active'
JOIN auth.users u ON u.id = au.user_id
WHERE au.period_start >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
  AND au.analysis_count >= 2
ORDER BY au.analysis_count DESC;
```

## Troubleshooting

### Issue: Migrations failed to apply

**Solution**:
1. Check Supabase project is connected: `supabase projects list`
2. Verify migrations exist: `ls -la supabase/migrations/`
3. Check for syntax errors in migration files
4. Try applying migrations one at a time to identify which one fails

### Issue: RLS policies blocking access

**Solution**:
1. Verify user is authenticated in your app
2. Check that `auth.uid()` is returning the correct user ID
3. In Supabase, view the user's `id` in `auth.users` table
4. Make sure RLS policies match the user's auth scope

### Issue: Trigger not firing

**Solution**:
1. Check trigger is enabled: 
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE 'enforce_subscription_limits%';
   ```
2. Check trigger function exists:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'enforce_subscription_limits';
   ```
3. Check trigger definition:
   ```sql
   SELECT pg_get_triggerdef(oid) FROM pg_trigger 
   WHERE tgname = 'enforce_subscription_limits_trigger';
   ```

### Issue: Usage not incrementing

**Solution**:
1. Check AFTER INSERT trigger is enabled
2. Verify the trigger function was created
3. Check for errors in the trigger function by monitoring query logs
4. Manually increment usage to test:
   ```sql
   UPDATE analysis_usage SET analysis_count = analysis_count + 1
   WHERE user_id = 'your-user-id';
   ```

## Integration with Backend

Your n8n webhook endpoint should:

1. **Receive the analysis submission** from the frontend
2. **Extract user_id** from the authenticated context
3. **Insert into property_analysis**:
   ```javascript
   const response = await supabaseClient
     .from('property_analysis')
     .insert([{
       user_id: userId,
       status: 'processing',
       property_address: address,
       // ... other fields
     }]);
   ```
4. **Handle database errors**:
   ```javascript
   if (response.error?.code === 'P0001') {
     return {
       status: 409,
       message: 'Free plan limit reached. Please upgrade.'
     };
   }
   ```

## Frontend Usage

The frontend is already set up with:

1. **Subscription check** before submission (in `Analysis.tsx`)
2. **Usage utility functions** in `src/integrations/supabase/subscription.ts`
3. **Error handling** for limit exceeded errors

To use the subscription functions elsewhere:

```typescript
import { 
  canSubmitAnalysis, 
  getUsageInfo, 
  getUserSubscription 
} from '@/integrations/supabase/subscription';

// Check if user can submit
const result = await canSubmitAnalysis();
if (!result.allowed) {
  console.log(result.message);
}

// Get usage information
const usage = await getUsageInfo();
console.log(`${usage.currentCount}/${usage.limit} used`);

// Get subscription info
const subscription = await getUserSubscription();
console.log(`Plan: ${subscription.plan}`);
```

## Next Steps

1. **Monitor analytics**: Track free→paid conversion rates
2. **Setup Stripe**: Implement actual payment processing (future phase)
3. **Create admin dashboard**: View and manage user subscriptions
4. **Add email notifications**: Alert users when approaching limits
5. **Implement billing portal**: Let users manage their own subscriptions

## Support

For issues with migrations or deployment:
1. Check Supabase logs in the dashboard
2. Review database query logs for errors
3. Verify all migration files were applied in order
4. Check for any remaining errors in the Functions tab

