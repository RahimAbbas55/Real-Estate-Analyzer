# Subscription-Based Usage Limits Implementation

## Overview

This document describes the implementation of subscription-based usage limits for the Real Estate Analyzer SaaS application using Supabase. The enforcement is **database-level** for maximum security, with no frontend-only trust.

## Architecture

### Database Tables

#### `user_subscriptions`
Stores user subscription information and plan details.

```sql
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL ('free', 'pro', 'enterprise'),
  status TEXT NOT NULL ('active', 'canceled', 'past_due'),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

**Key Changes:**
- `current_period_start` / `current_period_end` instead of `billing_period_*`
- `stripe_customer_id` added for Stripe integration
- `UNIQUE (user_id)` - one subscription per user only
- Uses `TIMESTAMPTZ` for timezone-aware timestamps

#### `analysis_usage`
Tracks the count of property analyses per user per billing period.

```sql
CREATE TABLE public.analysis_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_count INTEGER DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, period_start)
)
```

**Key Changes:**
- `UNIQUE (user_id, period_start)` instead of `(user_id, period_start, period_end)`
- Uses `TIMESTAMPTZ` for timezone-aware timestamps

#### `property_analysis` (Modified)
Added new column for plan tracking:

```sql
ALTER TABLE public.property_analysis 
ADD COLUMN plan_at_time TEXT DEFAULT 'free'
```

**Schema:**
```sql
CREATE TABLE public.property_analysis (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL,
  mortgage_payment NUMERIC,
  net_operating_income NUMERIC,
  monthly_cash_flow NUMERIC,
  cap_rate NUMERIC,
  cash_on_cash_return NUMERIC,
  required_investment NUMERIC,
  ai_risk_assessment JSONB,
  financial_breakdown JSONB,
  drive_link TEXT,
  notes TEXT,
  plan_at_time TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
```

### Security Features

#### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only read/modify their own data
- Service role handles subscription and usage updates via triggers
- Enforces `auth.uid()` as the source of truth

#### SECURITY DEFINER Functions
Both triggers use `SECURITY DEFINER` to run with elevated privileges:
- `enforce_subscription_limits()` - runs as service role
- `increment_analysis_usage()` - runs as service role

## Enforcement Logic

### BEFORE INSERT Trigger: `enforce_subscription_limits()`

**Purpose**: Enforce subscription limits at insert time, before data hits the database.

**Flow**:
1. Force `NEW.user_id = auth.uid()` (never trust client)
2. Fetch user's active subscription (status='active' and within billing period)
3. Default to 'free' plan if no active subscription
4. Set `plan_at_time` to the plan used
5. For free plan:
   - Check current usage count for the billing period
   - If usage >= 3, raise exception with error code `P0001`
   - Reject the INSERT
6. For paid plans (pro/enterprise): allow unlimited analyses
7. Set timestamps automatically

**Error Message**:
```
Free plan limit reached: maximum 3 analyses per billing period. 
Please upgrade to pro or enterprise plan.
```

**Error Code**: `P0001` (with HINT: `upgrade_required`)

### AFTER INSERT Trigger: `increment_analysis_usage()`

**Purpose**: Automatically increment usage count after successful insert.

**Flow**:
1. Fetch the user's active subscription billing period
2. If no subscription, use monthly period (1st-last day of month)
3. INSERT or UPDATE the `analysis_usage` record
4. Using UPSERT (INSERT ... ON CONFLICT) to handle concurrent requests
5. Increment `analysis_count` by 1

## Plan Limits

| Plan | Analyses/Month | Stripe Integration |
|------|----------------|--------------------|
| free | 3 | Not required |
| pro | Unlimited | Optional (future) |
| enterprise | Unlimited | Optional (future) |

## Deployment & Migration

### SQL Migrations

All SQL migrations are located in `/supabase/migrations/`:

1. `20250115000001_create_user_subscriptions.sql` - Create subscriptions table
2. `20250115000002_create_analysis_usage.sql` - Create usage tracking table
3. `20250115000003_add_rls_policies.sql` - Enable RLS and add policies
4. `20250115000004_create_before_insert_trigger.sql` - Pre-insert validation
5. `20250115000005_create_after_insert_trigger.sql` - Post-insert usage increment

### Applying Migrations

Using Supabase CLI:
```bash
supabase db push
```

Or manually in Supabase SQL Editor:
1. Copy contents of each migration file
2. Execute in order (by timestamp prefix)

### Initial Setup

After migrations are applied, create a default subscription for existing users:

```sql
-- For any existing users, create a free plan subscription for the current month
INSERT INTO user_subscriptions (user_id, plan, status, billing_period_start, billing_period_end)
SELECT 
  id,
  'free',
  'active',
  DATE_TRUNC('month', CURRENT_TIMESTAMP),
  DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month'
FROM auth.users
ON CONFLICT DO NOTHING;
```

## Frontend Integration

### Type Definitions

Updated TypeScript types in `/src/integrations/supabase/types.ts`:
- Added `user_subscriptions` table type
- Added `analysis_usage` table type
- Added `plan_at_time` column to `property_analysis`

### Analysis Page (`/src/pages/Analysis.tsx`)

#### New Function: `checkSubscriptionAndUsage()`

Performs pre-submission validation:
```typescript
const subCheck = await checkSubscriptionAndUsage();
if (!subCheck.allowed) {
  toast.error(subCheck.message);
  return;
}
```

**Logic**:
1. Get current authenticated user
2. Determine current billing period (monthly)
3. Query `user_subscriptions` for active subscription
4. If free plan, check `analysis_usage` against limit (3)
5. Return `{ allowed: boolean, message?: string }`

#### Enhanced Error Handling

Catches database-level errors from webhook backend:
```typescript
if (errorMessage.includes("limit reached") || 
    errorMessage.includes("upgrade_required")) {
  toast.error("Free plan limit reached: Please upgrade...");
}
```

## API/Backend Considerations

### Webhook Endpoint Requirements

The n8n webhook (`/webhook/property-analyzer`) should:

1. **Extract user_id from request**: Get from authenticated context
2. **Call Supabase INSERT**: Insert into `property_analysis` table
3. **Handle database errors**:
   - If error code `P0001` or message contains "limit reached"
   - Return HTTP 409 or 400 with clear message
   - Inform user about subscription upgrade requirement

### Example Backend Error Handling (Node.js/n8n)

```javascript
try {
  const response = await supabaseClient
    .from('property_analysis')
    .insert([analysisData]);
    
  if (response.error) {
    if (response.error.code === 'P0001') {
      return {
        status: 409,
        message: 'Free plan limit reached. Please upgrade.',
        requiresUpgrade: true
      };
    }
    throw response.error;
  }
} catch (error) {
  // Handle and propagate subscription limit errors
  if (error.message.includes('limit reached')) {
    return {
      status: 400,
      message: error.message
    };
  }
  throw error;
}
```

## Future Enhancements

### Stripe Integration

1. Create webhook listener for Stripe events
2. Update `user_subscriptions` on `checkout.session.completed`
3. Store `stripe_subscription_id` for reference
4. Implement plan upgrade/downgrade handlers
5. Handle subscription cancellation (set status='canceled')

### Admin Dashboard

1. View user subscription status
2. Manually adjust plans for support cases
3. Usage analytics and reports
4. Monitor free→paid conversion rates

### Billing Portal

1. Plan selection and upgrade flow
2. Usage display and warnings
3. Invoice history
4. Subscription management

## Security Checklist

- ✅ User ID forced from `auth.uid()` in triggers
- ✅ RLS enabled on all tables
- ✅ Service role only for data modification
- ✅ SECURITY DEFINER on all trigger functions
- ✅ Database-level enforcement (not frontend)
- ✅ Unique constraints on usage records
- ✅ Timestamps automatically set by database
- ✅ Error messages don't reveal system details

## Testing

### Test Cases

#### 1. Free Plan - Limit Not Reached
- User with free plan, 0 analyses
- Submit analysis → Should succeed
- Usage incremented to 1

#### 2. Free Plan - Limit Reached
- User with free plan, 3 analyses this month
- Submit analysis → Should fail with limit error
- Usage remains at 3

#### 3. Paid Plan - Unlimited
- User with pro/enterprise plan
- Submit 10 analyses → All succeed
- Usage increments correctly

#### 4. Plan Transition
- User starts on free, reaches limit
- Upgrade to pro plan
- Should now allow more analyses

#### 5. Billing Period Reset
- User reaches limit on Jan 31
- Feb 1: New billing period starts
- Usage counter resets
- Can submit 3 more analyses

### SQL Test Queries

```sql
-- View user's current subscription
SELECT * FROM user_subscriptions 
WHERE user_id = '{user_id}' 
ORDER BY created_at DESC LIMIT 1;

-- View user's current month usage
SELECT * FROM analysis_usage 
WHERE user_id = '{user_id}'
  AND period_start >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
  AND period_end < DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month';

-- Count analyses by user this month
SELECT COUNT(*) FROM property_analysis
WHERE user_id = '{user_id}'
  AND created_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP)
  AND created_at < DATE_TRUNC('month', CURRENT_TIMESTAMP) + INTERVAL '1 month';
```

## Troubleshooting

### Issue: Insert fails with "Free plan limit reached"

**Cause**: User has submitted 3 or more analyses in the current billing period
**Solution**: 
- User must upgrade to pro/enterprise plan
- OR wait for new billing period

### Issue: Usage counter not incrementing

**Cause**: AFTER INSERT trigger not firing
**Solution**:
1. Check trigger is enabled: `SELECT * FROM pg_trigger WHERE tgname = 'increment_analysis_usage_trigger'`
2. Check trigger function: `SELECT * FROM pg_proc WHERE proname = 'increment_analysis_usage'`
3. View trigger logs in Supabase dashboard

### Issue: RLS preventing reads/writes

**Cause**: Policy misconfiguration
**Solution**:
1. Verify user is authenticated (`auth.uid()` is set)
2. Check RLS policies allow the operation
3. Test with `SELECT auth.uid()` to verify authentication context

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Triggers Documentation](https://supabase.com/docs/guides/database/postgres/triggers)
- [PostgreSQL SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html)
