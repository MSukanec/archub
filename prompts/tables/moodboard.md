# Detalle de las tablas de Supabase de MOODBOARD:

## Tabla Pins:

create table public.pins (
  id uuid not null default gen_random_uuid (),
  title text null,
  source_url text null,
  image_url text null,
  created_at timestamp with time zone null default now(),
  constraint pins_pkey primary key (id)
) TABLESPACE pg_default;