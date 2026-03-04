create index if not exists idx_orders_tenant on public.global_orders(tenant_id);
create index if not exists idx_workflow_audit_logs_tenant_id on public.workflow_audit_logs(tenant_id);
