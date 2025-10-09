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

Tabla COURSE_LESSONS:

create table public.course_lessons (
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

create index IF not exists lessons_module_id_sort_index_idx on public.course_lessons using btree (module_id, sort_index) TABLESPACE pg_default;

Tabla COURSE_ENROLLMENTS:

create table public.course_enrollments (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  course_id uuid not null,
  status text not null default 'active'::text,
  started_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint course_enrollments_pkey primary key (id),
  constraint enroll_unique unique (user_id, course_id),
  constraint course_enrollments_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint course_enrollments_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists course_enrollments_user_id_course_id_idx on public.course_enrollments using btree (user_id, course_id) TABLESPACE pg_default;

Tabla COURSE_LESSON_PROGRESS:

create table public.course_lesson_progress (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  lesson_id uuid not null,
  progress_pct numeric(5, 2) not null default 0,
  last_position_sec integer not null default 0,
  completed_at timestamp with time zone null,
  updated_at timestamp with time zone not null default now(),
  is_completed boolean null default false,
  constraint lesson_progress_pkey primary key (id),
  constraint lesson_progress_unique unique (user_id, lesson_id),
  constraint lesson_progress_lesson_id_fkey foreign KEY (lesson_id) references course_lessons (id) on delete CASCADE,
  constraint lesson_progress_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists lesson_progress_user_id_lesson_id_idx on public.course_lesson_progress using btree (user_id, lesson_id) TABLESPACE pg_default;

Tabla COURSE_LESSON_NOTES:

create table public.course_lesson_notes (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  lesson_id uuid not null,
  body text not null,
  time_sec integer null,
  is_pinned boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  note_type text not null default 'marker'::text,
  constraint course_lesson_notes_pkey primary key (id),
  constraint course_lesson_notes_lesson_id_fkey foreign KEY (lesson_id) references course_lessons (id) on delete CASCADE,
  constraint course_lesson_notes_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint course_lesson_notes_time_nonneg_chk check (
    (
      (time_sec is null)
      or (time_sec >= 0)
    )
  ),
  constraint course_lesson_notes_type_chk check (
    (
      note_type = any (
        array[
          'summary'::text,
          'marker'::text,
          'todo'::text,
          'question'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists uniq_summary_per_user_lesson on public.course_lesson_notes using btree (user_id, lesson_id) TABLESPACE pg_default
where
  (note_type = 'summary'::text);

create index IF not exists lesson_notes_by_user_lesson on public.course_lesson_notes using btree (user_id, lesson_id, created_at desc) TABLESPACE pg_default;

create index IF not exists lesson_markers_idx on public.course_lesson_notes using btree (lesson_id, user_id, time_sec) TABLESPACE pg_default
where
  (note_type = 'marker'::text);

Tabla COURSE_PRICES:

create table public.course_prices (
  id uuid not null default gen_random_uuid (),
  course_id uuid not null,
  currency_code text not null,
  amount numeric(14, 2) not null,
  provider text not null default 'any'::text,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint course_prices_pkey primary key (id),
  constraint course_prices_unique_per_provider unique (course_id, currency_code, provider),
  constraint course_prices_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint course_prices_amount_check check ((amount >= (0)::numeric)),
  constraint course_prices_currency_chk check (
    (
      currency_code = any (array['ARS'::text, 'USD'::text, 'EUR'::text])
    )
  )
) TABLESPACE pg_default;

Tabla PAYMENTS_LOG:

create table public.payments_log (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  course_id uuid not null,
  provider text not null,
  provider_payment_id text not null,
  status text not null,
  amount numeric(12, 2) null,
  currency text null,
  external_reference text null,
  raw_payload jsonb not null,
  created_at timestamp with time zone not null default now(),
  constraint payments_log_pkey primary key (id),
  constraint payments_log_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint payments_log_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;