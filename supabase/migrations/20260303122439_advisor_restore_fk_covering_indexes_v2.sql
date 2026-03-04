create index if not exists idx_staff_invites_created_by on public.staff_invites(created_by);
create index if not exists idx_support_tickets_created_by on public.support_tickets(created_by);
