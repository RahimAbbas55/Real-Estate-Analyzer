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
