# Detalle de las tablas de Supabase de Cursos:

---------- Tabla COURSE_DETAILS:

create table public.course_details (
  id uuid not null default gen_random_uuid (),
  course_id uuid not null,
  instructor_name text null,
  instructor_title text null,
  instructor_bio text null,
  instructor_photo_url text null,
  badge_text text null,
  highlights text[] null,
  preview_video_id text null,
  seo_keywords text[] null,
  og_image_url text null,
  landing_sections jsonb null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint course_details_pkey primary key (id),
  constraint course_details_course_id_uniq unique (course_id),
  constraint course_details_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE
) TABLESPACE pg_default;

---------- Tabla COURSE_ENROLLMENTS:

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

create unique INDEX IF not exists course_enrollments_user_course_uniq on public.course_enrollments using btree (user_id, course_id) TABLESPACE pg_default;

create index IF not exists course_enrollments_user_id_course_id_idx on public.course_enrollments using btree (user_id, course_id) TABLESPACE pg_default;

create index IF not exists idx_course_enrollments_user on public.course_enrollments using btree (user_id) TABLESPACE pg_default;

---------- Tabla COURSE_FAQS:

create table public.course_faqs (
  id uuid not null default gen_random_uuid (),
  course_id uuid not null,
  question text not null,
  answer text not null,
  sort_index integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint course_faqs_pkey primary key (id),
  constraint course_faqs_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists course_faqs_course_id_sort_idx on public.course_faqs using btree (course_id, sort_index) TABLESPACE pg_default;

---------- Vista COURSE_LESSON_COMPLETIONS_VIEW:

create view public.course_lesson_completions_view as
select
  clp.id as progress_id,
  clp.user_id,
  clp.lesson_id,
  clp.is_completed,
  clp.completed_at,
  clp.last_position_sec,
  clp.updated_at,
  cl.id as lesson_id_ref,
  cl.title as lesson_title,
  cm.id as module_id,
  cm.title as module_title,
  cm.course_id,
  c.id as course_id_ref,
  c.title as course_title,
  c.slug as course_slug
from
  course_lesson_progress clp
  join course_lessons cl on cl.id = clp.lesson_id
  join course_modules cm on cm.id = cl.module_id
  join courses c on c.id = cm.course_id;

  ---------- Tabla COURSE_LESSON_NOTES:

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

    ---------- Tabla LESSON_PROGRESS:

    create table public.course_lesson_progress (
      id uuid not null default gen_random_uuid (),
      user_id uuid not null,
      lesson_id uuid not null,
      progress_pct numeric(5, 2) not null default 0,
      last_position_sec integer not null default 0,
      completed_at timestamp with time zone null,
      updated_at timestamp with time zone not null default now(),
      is_completed boolean null default false,
      is_favorite boolean not null default false,
      constraint lesson_progress_pkey primary key (id),
      constraint lesson_progress_unique unique (user_id, lesson_id),
      constraint lesson_progress_lesson_id_fkey foreign KEY (lesson_id) references course_lessons (id) on delete CASCADE,
      constraint lesson_progress_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
    ) TABLESPACE pg_default;

    create index IF not exists idx_lesson_progress_favorites on public.course_lesson_progress using btree (user_id, is_favorite) TABLESPACE pg_default
    where
      (is_favorite = true);

    create index IF not exists lesson_progress_user_id_lesson_id_idx on public.course_lesson_progress using btree (user_id, lesson_id) TABLESPACE pg_default;

    create index IF not exists idx_progress_user_updated_at on public.course_lesson_progress using btree (user_id, updated_at) TABLESPACE pg_default;

    create unique INDEX IF not exists uq_progress_user_lesson on public.course_lesson_progress using btree (user_id, lesson_id) TABLESPACE pg_default;

    create index IF not exists idx_course_lesson_progress_user_completed on public.course_lesson_progress using btree (user_id, is_completed, completed_at desc) TABLESPACE pg_default;

    create trigger trg_progress_fill_user BEFORE INSERT on course_lesson_progress for EACH row
    execute FUNCTION fill_progress_user_id_from_auth ();

    ---------- Tabla COURSE_LESSONS:

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

    create index IF not exists idx_course_lessons_module_active on public.course_lessons using btree (module_id, is_active) TABLESPACE pg_default;

    ---------- Vista COURSE_LESSONS_TOTAL_VIEW:

    create view public.course_lessons_total_view as
    select
      c.id as course_id,
      count(l.id)::integer as total_lessons
    from
      courses c
      join course_modules m on m.course_id = c.id
      join course_lessons l on l.module_id = m.id
    where
      l.is_active = true
    group by
      c.id;

      ---------- Tabla COURSE_MODULES:

      create table public.course_modules (
        id uuid not null default gen_random_uuid (),
        course_id uuid not null,
        title text not null,
        sort_index integer not null default 0,
        created_at timestamp with time zone not null default now(),
        updated_at timestamp with time zone not null default now(),
        description text null,
        constraint course_modules_pkey primary key (id),
        constraint course_modules_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE
      ) TABLESPACE pg_default;

      create index IF not exists course_modules_course_id_sort_index_idx on public.course_modules using btree (course_id, sort_index) TABLESPACE pg_default;

      create index IF not exists idx_course_modules_course on public.course_modules using btree (course_id) TABLESPACE pg_default;

---------- Tabla COURSES:

create table public.courses (
  id uuid not null default gen_random_uuid (),
  slug text not null,
  title text not null,
  short_description text null,
  is_active boolean not null default true,
  visibility text not null default 'public'::text,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  price numeric null,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  constraint courses_pkey primary key (id),
  constraint courses_slug_key unique (slug),
  constraint courses_created_by_fkey foreign KEY (created_by) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists courses_not_deleted_idx on public.courses using btree (is_deleted) TABLESPACE pg_default
where
  (is_deleted = false);