# Detalle de las tablas de Supabase relacionadas a USUARIOS:

--------------- TABLA USUARIOS:



--------------- TABLA IA_MESSAGES:

create table public.ia_messages (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  role text not null,
  content text not null,
  context_type text null,
  created_at timestamp with time zone null default now(),
  constraint ia_messages_pkey primary key (id),
  constraint ia_messages_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_ia_messages_user_id on public.ia_messages using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_ia_messages_context_type on public.ia_messages using btree (context_type) TABLESPACE pg_default;

--------------- TABLA IA_USAGE_LOGS:

create table public.ia_usage_logs (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  provider text null default 'openai'::text,
  model text null default 'gpt-4o'::text,
  prompt_tokens integer null,
  completion_tokens integer null,
  total_tokens integer null,
  cost_usd numeric(6, 4) null,
  context_type text null,
  created_at timestamp with time zone null default now(),
  constraint ia_usage_logs_pkey primary key (id),
  constraint ia_usage_logs_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_ia_usage_logs_user_id on public.ia_usage_logs using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_ia_usage_logs_context_type on public.ia_usage_logs using btree (context_type) TABLESPACE pg_default;

--------------- TABLA IA_USER_PREFERENCES:

create table public.ia_user_preferences (
  user_id uuid not null,
  display_name text null,
  tone text null default 'amistoso'::text,
  language text null default 'es'::text,
  personality text null,
  updated_at timestamp with time zone null default now(),
  constraint ia_user_preferences_pkey primary key (user_id),
  constraint ia_user_preferences_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_ia_user_preferences_language on public.ia_user_preferences using btree (language) TABLESPACE pg_default;

create trigger trg_set_updated_at_ia_user_preferences BEFORE
update on ia_user_preferences for EACH row
execute FUNCTION set_updated_at_ia_user_preferences ();

--------------- TABLA IA_USER_USAGE_LIMITS:

create table public.ia_user_usage_limits (
  user_id uuid not null,
  plan text not null default 'free'::text,
  daily_limit integer not null default 3,
  prompts_used_today integer not null default 0,
  last_prompt_at timestamp with time zone null,
  last_reset_at date null default CURRENT_DATE,
  constraint ia_user_usage_limits_pkey primary key (user_id),
  constraint ia_user_usage_limits_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_ia_user_usage_limits_plan on public.ia_user_usage_limits using btree (plan) TABLESPACE pg_default;

create index IF not exists idx_ia_user_usage_limits_last_reset on public.ia_user_usage_limits using btree (last_reset_at) TABLESPACE pg_default;

create trigger trg_reset_prompt_limit BEFORE
update on ia_user_usage_limits for EACH row
execute FUNCTION reset_daily_prompt_limit_if_needed ();

--------------- TABLA IA_USER_GREETINGS:

create table public.ia_user_greetings (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  period text not null,
  greeting text not null,
  created_at timestamp with time zone null default now(),
  constraint ia_user_greetings_pkey primary key (id),
  constraint ia_user_greetings_unique unique (user_id, period),
  constraint ia_user_greetings_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint ia_user_greetings_period_check check (
    (
      period = any (
        array[
          'morning'::text,
          'afternoon'::text,
          'evening'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;