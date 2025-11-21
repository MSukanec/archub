# Detalle de las tablas de Supabase de ARCHIVOS Y MEDIA:

---------- TABLA MEDIA_FILES:

create table public.media_files (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  created_by uuid null,
  bucket text not null,
  file_path text not null,
  file_name text null,
  file_url text not null,
  file_type text not null,
  file_size bigint null,
  is_public boolean not null default false,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  constraint media_files_pkey primary key (id),
  constraint media_files_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete set null,
  constraint media_files_org_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint media_files_file_type_chk check (
    (
      file_type = any (
        array[
          'image'::text,
          'video'::text,
          'pdf'::text,
          'doc'::text,
          'other'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

---------- TABLA MEDIA_LINKS:

create table public.media_links (
  id uuid not null default gen_random_uuid (),
  media_file_id uuid not null,
  organization_id uuid not null,
  project_id uuid null,
  site_log_id uuid null,
  movement_id uuid null,
  contact_id uuid null,
  course_lesson_id uuid null,
  general_cost_id uuid null,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  visibility text null,
  description text null,
  category text null,
  is_cover boolean null default false,
  position integer null,
  metadata jsonb null default '{}'::jsonb,
  constraint media_links_pkey primary key (id),
  constraint media_links_contact_fkey foreign KEY (contact_id) references contacts (id) on delete CASCADE,
  constraint media_links_cost_fkey foreign KEY (general_cost_id) references general_costs (id) on delete set null,
  constraint media_links_course_lesson_fkey foreign KEY (course_lesson_id) references course_lessons (id) on delete set null,
  constraint media_links_media_fkey foreign KEY (media_file_id) references media_files (id) on delete CASCADE,
  constraint media_links_movement_fkey foreign KEY (movement_id) references movements (id) on delete CASCADE,
  constraint media_links_org_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint media_links_project_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint media_links_sitelog_fkey foreign KEY (site_log_id) references site_logs (id) on delete CASCADE,
  constraint media_links_category_check check (
    (
      (category is null)
      or (
        category = any (
          array[
            'dni_front'::text,
            'dni_back'::text,
            'document'::text,
            'photo'::text,
            'other'::text,
            'general'::text,
            'technical'::text,
            'financial'::text,
            'legal'::text
          ]
        )
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_media_links_project on public.media_links using btree (project_id) TABLESPACE pg_default
where
  (
    (project_id is not null)
    and (organization_id is not null)
  );

create index IF not exists idx_media_links_sitelog on public.media_links using btree (site_log_id) TABLESPACE pg_default
where
  (
    (site_log_id is not null)
    and (organization_id is not null)
  );

create index IF not exists idx_media_links_contact on public.media_links using btree (contact_id) TABLESPACE pg_default
where
  (
    (contact_id is not null)
    and (organization_id is not null)
  );

create index IF not exists idx_media_links_movement on public.media_links using btree (movement_id) TABLESPACE pg_default
where
  (
    (movement_id is not null)
    and (organization_id is not null)
  );

create index IF not exists idx_media_links_media_file on public.media_links using btree (media_file_id, organization_id) TABLESPACE pg_default;