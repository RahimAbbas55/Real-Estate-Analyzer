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
