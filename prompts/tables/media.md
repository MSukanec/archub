# Detalle de las tablas de Supabase de ARCHIVOS Y MEDIA:

---------- TABLA MEDIA_FILES:

create table public.media_files (
  id uuid not null default gen_random_uuid (),
  organization_id uuid null,
  created_by uuid null,
  bucket text not null,
  file_path text not null,
  file_name text null,
  file_url text null,
  file_type text not null,
  file_size bigint null,
  is_public boolean not null default false,
  is_deleted boolean not null default false,
  deleted_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  constraint media_files_pkey primary key (id),
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

create trigger trigger_cleanup_media_file_hard_delete
after DELETE on media_files for EACH row
execute FUNCTION cleanup_media_file_storage ();

create trigger trigger_cleanup_media_file_soft_delete
after
update OF is_deleted on media_files for EACH row when (
  new.is_deleted = true
  and old.is_deleted = false
)
execute FUNCTION cleanup_media_file_storage ();

---------- TABLA MEDIA_LINKS:

create table public.media_links (
  id uuid not null default gen_random_uuid (),
  media_file_id uuid not null,
  organization_id uuid null,
  project_id uuid null,
  site_log_id uuid null,
  contact_id uuid null,
  course_lesson_id uuid null,
  general_cost_payment_id uuid null,
  created_by uuid null,
  created_at timestamp with time zone not null default now(),
  visibility text null,
  description text null,
  category text null,
  is_cover boolean null default false,
  position integer null,
  metadata jsonb null default '{}'::jsonb,
  client_payment_id uuid null,
  course_id uuid null,
  course_module_id uuid null,
  is_public boolean null default false,
  material_payment_id uuid null,
  material_purchase_id uuid null,
  constraint media_links_pkey primary key (id),
  constraint media_links_client_payment_fkey foreign KEY (client_payment_id) references client_payments (id) on delete CASCADE,
  constraint media_links_contact_fkey foreign KEY (contact_id) references contacts (id) on delete CASCADE,
  constraint media_links_course_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint media_links_course_lesson_fkey foreign KEY (course_lesson_id) references course_lessons (id) on delete set null,
  constraint media_links_course_module_fkey foreign KEY (course_module_id) references course_modules (id) on delete CASCADE,
  constraint media_links_general_cost_payment_id_fkey foreign KEY (general_cost_payment_id) references general_costs_payments (id) on delete CASCADE,
  constraint media_links_material_payment_id_fkey foreign KEY (material_payment_id) references material_payments (id) on delete set null,
  constraint media_links_material_purchase_id_fkey foreign KEY (material_purchase_id) references material_purchases (id) on delete set null,
  constraint media_links_media_fkey foreign KEY (media_file_id) references media_files (id) on delete CASCADE,
  constraint media_links_org_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint media_links_project_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint media_links_sitelog_fkey foreign KEY (site_log_id) references site_logs (id) on delete CASCADE,
  constraint media_links_category_check check (
    (
      (category is null)
      or (
        category = any (
          array[
            'document'::text,
            'photo'::text,
            'other'::text,
            'general'::text,
            'technical'::text,
            'financial'::text,
            'legal'::text,
            'course_cover'::text,
            'instructor_photo'::text,
            'module_image'::text,
            'section_background'::text,
            'testimonial_logo'::text,
            'testimonial_avatar'::text,
            'project_photo'::text,
            'og_image'::text,
            'client_gallery'::text
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

create index IF not exists idx_media_links_media_file on public.media_links using btree (media_file_id, organization_id) TABLESPACE pg_default;

create index IF not exists idx_media_links_client_payment on public.media_links using btree (client_payment_id) TABLESPACE pg_default
where
  (
    (client_payment_id is not null)
    and (organization_id is not null)
  );

create index IF not exists idx_media_links_course on public.media_links using btree (course_id) TABLESPACE pg_default
where
  (course_id is not null);

create index IF not exists idx_media_links_course_module on public.media_links using btree (course_module_id) TABLESPACE pg_default
where
  (course_module_id is not null);

create index IF not exists idx_media_links_is_public on public.media_links using btree (is_public) TABLESPACE pg_default
where
  (is_public = true);

create index IF not exists idx_media_links_created_by on public.media_links using btree (created_by) TABLESPACE pg_default
where
  (created_by is not null);