# Detalle de las tablas de Supabase de Cursos:

Tabla COURSES:

create table public.courses (
  id uuid not null default gen_random_uuid (),
  slug text not null,
  title text not null,
  short_description text null,
  long_description text null,
  cover_url text null,
  is_active boolean not null default true,
  visibility text not null default 'public'::text,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint courses_pkey primary key (id),
  constraint courses_slug_key unique (slug),
  constraint courses_created_by_fkey foreign KEY (created_by) references users (id) on delete set null
) TABLESPACE pg_default;

Tabla COURSE_MODULES:

create table public.courses (
  id uuid not null default gen_random_uuid (),
  slug text not null,
  title text not null,
  short_description text null,
  long_description text null,
  cover_url text null,
  is_active boolean not null default true,
  visibility text not null default 'public'::text,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint courses_pkey primary key (id),
  constraint courses_slug_key unique (slug),
  constraint courses_created_by_fkey foreign KEY (created_by) references users (id) on delete set null
) TABLESPACE pg_default;

Tabla LESSONS:

create table public.lessons (
  id uuid not null default gen_random_uuid (),
  module_id uuid not null,
  title text not null,
  vimeo_video_id text null,
  duration_sec integer null,
  free_preview boolean not null default false,
  sort_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint lessons_pkey primary key (id),
  constraint lessons_module_id_fkey foreign KEY (module_id) references course_modules (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists lessons_module_id_sort_index_idx on public.lessons using btree (module_id, sort_index) TABLESPACE pg_default;