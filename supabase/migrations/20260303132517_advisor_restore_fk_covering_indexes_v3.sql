create index if not exists idx_guest_visits_guest_visited on public.guest_visits(guest_id, visited_at desc);
create index if not exists idx_rate_limit_logs_restaurant_id on public.rate_limit_logs(restaurant_id);
