# Detalle de las tablas de Supabase de OPS:

## Tabla OPS_ALERTS:

create table public.ops_alerts (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  severity text not null default 'high'::text,
  status text not null default 'open'::text,
  alert_type text not null,
  title text not null,
  description text null,
  organization_id uuid null,
  user_id uuid null,
  provider text null,
  provider_payment_id text null,
  payment_id uuid null,
  event_id uuid null,
  fingerprint text null,
  evidence jsonb not null default '{}'::jsonb,
  ack_by uuid null,
  ack_at timestamp with time zone null,
  resolved_by uuid null,
  resolved_at timestamp with time zone null,
  constraint ops_alerts_pkey primary key (id),
  constraint ops_alerts_event_id_fkey foreign KEY (event_id) references payment_events (id) on delete set null,
  constraint ops_alerts_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete set null,
  constraint ops_alerts_ack_by_fkey foreign KEY (ack_by) references users (id) on delete set null,
  constraint ops_alerts_resolved_by_fkey foreign KEY (resolved_by) references users (id) on delete set null,
  constraint ops_alerts_user_id_fkey foreign KEY (user_id) references users (id) on delete set null,
  constraint ops_alerts_payment_id_fkey foreign KEY (payment_id) references payments (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_ops_alerts_status on public.ops_alerts using btree (status, severity, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_ops_alerts_org on public.ops_alerts using btree (organization_id, created_at desc) TABLESPACE pg_default;

create unique INDEX IF not exists ux_ops_alerts_fingerprint_open on public.ops_alerts using btree (fingerprint) TABLESPACE pg_default
where
  (
    (fingerprint is not null)
    and (status = any (array['open'::text, 'ack'::text]))
  );

create trigger ops_alerts_set_updated_at BEFORE
update on ops_alerts for EACH row
execute FUNCTION update_updated_at_column ();

## Tabla OPS_CHECK_RUNS:

create table public.ops_check_runs (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  check_suite text not null default 'ops_core'::text,
  status text not null default 'success'::text,
  duration_ms integer null,
  stats jsonb not null default '{}'::jsonb,
  error_message text null,
  constraint ops_check_runs_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_ops_check_runs_created_at on public.ops_check_runs using btree (created_at desc) TABLESPACE pg_default;

## Tabla OPS_REPAIR_ACTIONS:

create table public.ops_repair_actions (
  id text not null,
  alert_type text not null,
  label text not null,
  description text null,
  requires_confirmation boolean null default true,
  is_dangerous boolean null default false,
  is_active boolean null default true,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  constraint ops_repair_actions_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_ops_repair_actions_alert_type on public.ops_repair_actions using btree (alert_type) TABLESPACE pg_default;

## Tabla OPS_REPAIR_LOGS:

create table public.ops_repair_logs (
  id uuid not null default gen_random_uuid (),
  alert_id uuid null,
  action_id text not null,
  executed_by uuid null,
  result text null,
  details jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  constraint ops_repair_logs_pkey primary key (id),
  constraint ops_repair_logs_alert_id_fkey foreign KEY (alert_id) references ops_alerts (id) on delete CASCADE,
  constraint ops_repair_logs_executed_by_fkey foreign KEY (executed_by) references auth.users (id),
  constraint ops_repair_logs_result_check check (
    (
      result = any (array['success'::text, 'error'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_ops_repair_logs_alert_id on public.ops_repair_logs using btree (alert_id) TABLESPACE pg_default;

create index IF not exists idx_ops_repair_logs_created_at on public.ops_repair_logs using btree (created_at desc) TABLESPACE pg_default;

## Tabla OPS_RUNBOOKS:

create table public.ops_runbooks (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  alert_type text not null,
  title text not null,
  steps_md text not null,
  links jsonb not null default '[]'::jsonb,
  constraint ops_runbooks_pkey primary key (id),
  constraint ops_runbooks_alert_type_key unique (alert_type)
) TABLESPACE pg_default;

create trigger ops_runbooks_set_updated_at BEFORE
update on ops_runbooks for EACH row
execute FUNCTION update_updated_at_column ();

## Tabla SYSTEM_ERRORS:

create table public.system_errors (
  id uuid not null default gen_random_uuid (),
  source text not null,
  entity text null,
  operation text null,
  error_message text not null,
  context jsonb null,
  severity text not null default 'critical'::text,
  occurred_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone null,
  constraint system_errors_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists system_errors_severity_resolved_at_idx on public.system_errors using btree (severity, resolved_at) TABLESPACE pg_default;

create index IF not exists system_errors_occurred_at_idx on public.system_errors using btree (occurred_at) TABLESPACE pg_default;

## Tabla SYSTEM_JOB_LOGS:

create table public.system_job_logs (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  subscription_id uuid null,
  job_type text not null,
  details jsonb null,
  status text not null,
  error_message text null,
  processed_at timestamp with time zone null default now(),
  constraint system_job_logs_pkey primary key (id),
  constraint system_job_logs_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;







## Funcion log_system_error:

begin
  insert into public.system_errors (
    source,
    entity,
    operation,
    error_message,
    context,
    severity
  )
  values (
    p_source,
    p_entity,
    p_operation,
    p_error,
    p_context,
    p_severity
  );
end;

## Funcion ops_apply_plan_to_org:


DECLARE
  v_org_id UUID;
  v_plan_id UUID;
  v_payment_id UUID;
BEGIN
  -- 1. Validar alerta
  SELECT
    (metadata->>'organization_id')::uuid,
    (metadata->>'plan_id')::uuid,
    (metadata->>'payment_id')::uuid
  INTO
    v_org_id,
    v_plan_id,
    v_payment_id
  FROM ops_alerts
  WHERE id = p_alert_id
    AND status = 'open';

  IF v_org_id IS NULL OR v_plan_id IS NULL THEN
    RAISE EXCEPTION 'Alert % does not contain required metadata', p_alert_id;
  END IF;

  -- 2. Aplicar plan a la organización
  UPDATE organizations
  SET
    plan_id = v_plan_id,
    updated_at = NOW()
  WHERE id = v_org_id;

  -- 3. Registrar reparación
  INSERT INTO ops_repair_logs (
    alert_id,
    action_id,
    executed_by,
    result,
    details
  )
  VALUES (
    p_alert_id,
    'apply_plan_to_org',
    p_executed_by,
    'success',
    jsonb_build_object(
      'organization_id', v_org_id,
      'plan_id', v_plan_id,
      'payment_id', v_payment_id
    )
  );

  -- 4. Marcar alerta como resuelta
  UPDATE ops_alerts
  SET
    status = 'resolved',
    resolved_at = NOW()
  WHERE id = p_alert_id;

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO ops_repair_logs (
      alert_id,
      action_id,
      executed_by,
      result,
      details
    )
    VALUES (
      p_alert_id,
      'apply_plan_to_org',
      p_executed_by,
      'error',
      jsonb_build_object('error', SQLERRM)
    );

    RAISE;
END;

## Funcion ops_detect_payment_not_applied:


BEGIN
  INSERT INTO ops_alerts (
    alert_type,
    severity,
    title,
    description,
    entity_type,
    entity_id,
    organization_id,
    metadata,
    status,
    created_at
  )
  SELECT
    'payment.approved_but_not_applied',
    'critical',
    'Pago aprobado sin aplicación de plan',
    'Se detectó un pago aprobado que no generó suscripción o no aplicó el plan a la organización.',
    'payment',
    p.id,
    p.organization_id,
    jsonb_build_object(
      'payment_id', p.id,
      'provider', p.provider,
      'amount', p.amount,
      'currency', p.currency,
      'plan_id', p.plan_id,
      'user_id', p.user_id
    ),
    'open',
    now()
  FROM payments p
  LEFT JOIN organization_subscriptions s
    ON s.organization_id = p.organization_id
    AND s.status = 'active'
    AND s.plan_id = p.plan_id
  WHERE
    p.status = 'approved'
    AND p.product_type = 'subscription'
    AND (
      s.id IS NULL
      OR p.entitlement_applied IS DISTINCT FROM true
    )
    AND NOT EXISTS (
      SELECT 1
      FROM ops_alerts a
      WHERE a.alert_type = 'payment.approved_but_not_applied'
        AND a.entity_id = p.id
        AND a.status = 'open'
    );
END;

## Funcion ops_execute_repair_action:

BEGIN
  -- Validar que la acción exista y esté activa
  IF NOT EXISTS (
    SELECT 1
    FROM ops_repair_actions
    WHERE id = p_action_id
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Repair action % does not exist or is inactive', p_action_id;
  END IF;

  -- Dispatcher
  CASE p_action_id

    WHEN 'apply_plan_to_org' THEN
      PERFORM ops_apply_plan_to_org(p_alert_id, p_executed_by);

    WHEN 'retry_user_creation' THEN
      PERFORM ops_retry_user_creation(p_alert_id, p_executed_by);

    WHEN 'force_resolve_alert' THEN
      UPDATE ops_alerts
      SET status = 'resolved', resolved_at = NOW()
      WHERE id = p_alert_id;

    ELSE
      RAISE EXCEPTION 'Repair action % not implemented yet', p_action_id;

  END CASE;

END;

## Funcion ops_retry_user_creation:


DECLARE
  v_auth_user_id UUID;
BEGIN
  SELECT (metadata->>'auth_user_id')::uuid
  INTO v_auth_user_id
  FROM ops_alerts
  WHERE id = p_alert_id;

  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'auth_user_id missing in alert metadata';
  END IF;

  -- Reintenta provisión del usuario
  PERFORM handle_new_user(
    (SELECT * FROM auth.users WHERE id = v_auth_user_id)
  );

  INSERT INTO ops_repair_logs (
    alert_id, action_id, executed_by, result
  )
  VALUES (
    p_alert_id, 'retry_user_creation', p_executed_by, 'success'
  );

  UPDATE ops_alerts
  SET status = 'resolved', resolved_at = NOW()
  WHERE id = p_alert_id;

END;

## Funcion ops_run_all_checks:


BEGIN
  -- ==========================================
  -- 🔍 DETECTORES DE OPERACIONES
  -- ==========================================

  -- Pagos aprobados sin plan aplicado
  PERFORM public.ops_detect_payment_not_applied();

  -- (futuro)
  -- PERFORM public.ops_detect_user_creation_failed();
  -- PERFORM public.ops_detect_webhook_stuck();
  -- PERFORM public.ops_detect_subscription_inconsistent();

  -- ==========================================
  -- ✅ FIN
  -- ==========================================
END;












