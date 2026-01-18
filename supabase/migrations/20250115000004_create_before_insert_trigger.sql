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
