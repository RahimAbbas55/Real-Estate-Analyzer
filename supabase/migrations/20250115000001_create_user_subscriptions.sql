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
