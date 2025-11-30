# Detalle de las tablas de Supabase de LAYOUT:

---------- TABLA HERO_SECTIONS:

create table public.hero_sections (
  id uuid not null default gen_random_uuid (),
  section_type text not null default 'learning_dashboard'::text,
  order_index integer not null default 0,
  title text null,
  description text null,
  media_url text null,
  media_type text null default 'image'::text,
  primary_button_text text null,
  primary_button_action text null,
  primary_button_action_type text null default 'url'::text,
  secondary_button_text text null,
  secondary_button_action text null,
  secondary_button_action_type text null default 'url'::text,
  is_active boolean null default true,
  created_at timestamp without time zone null default now(),
  updated_at timestamp without time zone null default now(),
  constraint hero_sections_pkey primary key (id)
) TABLESPACE pg_default;