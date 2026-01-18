-- Option 1: Drop RLS Policies on property_analysis table
-- This allows all authenticated roles to insert

DROP POLICY IF EXISTS "Users can read their own analyses" ON public.property_analysis;
DROP POLICY IF EXISTS "Users can create analyses" ON public.property_analysis;
DROP POLICY IF EXISTS "Users can update their own analyses" ON public.property_analysis;
DROP POLICY IF EXISTS "Users can delete their own analyses" ON public.property_analysis;

-- Option 2: Disable RLS entirely on property_analysis table
-- Uncomment the line below if Option 1 doesn't work for n8n
-- ALTER TABLE public.property_analysis DISABLE ROW LEVEL SECURITY;

-- Verify RLS status
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'property_analysis';

-- Verify policies are dropped
SELECT policy_name, table_name 
FROM information_schema.role_table_grants 
WHERE table_name = 'property_analysis';
