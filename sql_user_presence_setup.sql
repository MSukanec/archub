-- ============================================
-- USER PRESENCE TRACKING SETUP
-- ============================================
-- Este script configura el sistema de tracking de presencia de usuarios
-- Ejecuta estos comandos en el SQL Editor de Supabase
-- ============================================

-- 1. CREAR TABLA user_presence (si no existe)
-- Esta tabla almacena la última actividad de cada usuario
create table if not exists public.user_presence (
  user_id uuid not null,
  org_id uuid not null,
  last_seen_at timestamp with time zone not null default now(),
  status text not null default 'online'::text,
  user_agent text null,
  locale text null,
  updated_from text null,
  constraint user_presence_pkey primary key (user_id),
  constraint user_presence_user_fkey foreign key (user_id) 
    references public.users (id) on delete cascade
) tablespace pg_default;

-- Crear índice para optimizar búsquedas por organización
create index if not exists user_presence_org_idx 
  on public.user_presence using btree (org_id) 
  tablespace pg_default;

-- 2. CREAR FUNCIÓN heartbeat (si no existe)
-- Esta función actualiza o inserta el registro de presencia del usuario
create or replace function public.heartbeat(
  p_org_id uuid,
  p_status text default 'online',
  p_from text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_id uuid;
  v_user_id uuid;
begin
  -- Obtener el ID del usuario autenticado
  v_auth_id := auth.uid();
  if v_auth_id is null then
    raise exception 'Unauthenticated';
  end if;

  -- Buscar el user_id en la tabla public.users usando auth_id
  select u.id into v_user_id
  from public.users u
  where u.auth_id = v_auth_id;

  if v_user_id is null then
    raise exception 'User not provisioned in public.users';
  end if;

  -- Insertar o actualizar el registro de presencia
  insert into public.user_presence (user_id, org_id, last_seen_at, status, updated_from)
  values (v_user_id, p_org_id, now(), coalesce(p_status, 'online'), p_from)
  on conflict (user_id) do update
    set last_seen_at = excluded.last_seen_at,
        status       = excluded.status,
        updated_from = excluded.updated_from;
end;
$$;

-- 3. CONFIGURAR PERMISOS (Row Level Security)
-- Habilitar RLS en la tabla
alter table public.user_presence enable row level security;

-- Política para que los usuarios puedan ver su propia presencia
create policy "Users can view own presence"
  on public.user_presence
  for select
  using (user_id = auth.uid());

-- Políticas para INSERT/UPDATE (la función heartbeat usa security definer)
create policy "Enable insert for authenticated users"
  on public.user_presence
  for insert
  to authenticated
  with check (true);

create policy "Enable update for authenticated users"
  on public.user_presence
  for update
  to authenticated
  using (true)
  with check (true);

-- Política para service_role (backend admin)
create policy "Service role can view all presence"
  on public.user_presence
  for select
  to service_role
  using (true);

-- 4. VERIFICACIÓN
-- Ejecuta estas queries para verificar que todo está configurado:

-- Verificar que la tabla existe
select exists (
  select 1 
  from information_schema.tables 
  where table_schema = 'public' 
    and table_name = 'user_presence'
) as table_exists;

-- Verificar que la función existe
select exists (
  select 1 
  from information_schema.routines
  where routine_schema = 'public'
    and routine_name = 'heartbeat'
) as function_exists;

-- Ver registros de presencia (requiere permisos de admin)
-- select * from public.user_presence order by last_seen_at desc limit 10;
