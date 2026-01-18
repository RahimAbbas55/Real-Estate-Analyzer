-- Create a function to increment analysis_usage when a new analysis is created
create or replace function public.increment_analysis_usage_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period_start timestamp with time zone;
begin
  -- Set period_start to 1st of current month
  v_period_start := date_trunc('month', now());

  -- Update or insert analysis_usage record
  insert into public.analysis_usage (user_id, analysis_count, period_start, period_end)
  values (new.user_id, 1, v_period_start, v_period_start + interval '1 month')
  on conflict (user_id, period_start) 
  do update set analysis_count = analysis_usage.analysis_count + 1;

  return new;
end;
$$;

-- Create trigger on property_analysis to increment usage
drop trigger if exists trigger_increment_analysis_usage on public.property_analysis;
create trigger trigger_increment_analysis_usage
after insert on public.property_analysis
for each row
execute function public.increment_analysis_usage_on_insert();
