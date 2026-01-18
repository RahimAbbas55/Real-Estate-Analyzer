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
