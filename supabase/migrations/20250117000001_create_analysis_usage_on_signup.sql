-- Create a function to initialize analysis_usage for new users
create or replace function public.create_analysis_usage_on_signup()
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

  -- Insert default analysis_usage record with count = 0
  insert into public.analysis_usage (user_id, analysis_count, period_start, period_end)
  values (new.id, 0, v_period_start, v_period_start + interval '1 month')
  on conflict (user_id, period_start) do nothing;

  return new;
end;
$$;

-- Create trigger on auth.users to initialize analysis_usage
drop trigger if exists trigger_create_analysis_usage_on_signup on auth.users;
create trigger trigger_create_analysis_usage_on_signup
after insert on auth.users
for each row
execute function public.create_analysis_usage_on_signup();

-- Enable RLS on analysis_usage table
alter table public.analysis_usage enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view own usage" on public.analysis_usage;
drop policy if exists "Users can insert own usage" on public.analysis_usage;
drop policy if exists "Users can update own usage" on public.analysis_usage;

-- Create RLS policies
create policy "Users can view own usage"
  on public.analysis_usage for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on public.analysis_usage for insert
  with check (auth.uid() = user_id);

create policy "Users can update own usage"
  on public.analysis_usage for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
