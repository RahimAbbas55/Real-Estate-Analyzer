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
