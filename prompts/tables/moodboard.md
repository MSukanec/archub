# Detalle de las tablas de Supabase de MOODBOARD:

## Tabla PIN_BOARD_ITEMS:

create table public.pin_board_items (
  id uuid not null default gen_random_uuid (),
  board_id uuid not null,
  pin_id uuid not null,
  position integer null,
  created_at timestamp with time zone not null default now(),
  constraint pin_board_items_pkey primary key (id),
  constraint pin_board_items_unique unique (board_id, pin_id),
  constraint pin_board_items_board_fkey foreign KEY (board_id) references pin_boards (id) on delete CASCADE,
  constraint pin_board_items_pin_fkey foreign KEY (pin_id) references pins (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_pin_board_items_board on public.pin_board_items using btree (board_id) TABLESPACE pg_default;

create index IF not exists idx_pin_board_items_pin on public.pin_board_items using btree (pin_id) TABLESPACE pg_default;

## Tabla PIN_BOARDS:

create table public.pin_boards (
  id uuid not null default gen_random_uuid (),
  organization_id uuid not null,
  project_id uuid null,
  name text not null,
  description text null,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint pin_boards_pkey primary key (id),
  constraint pin_boards_created_by_fkey foreign KEY (created_by) references organization_members (id) on delete RESTRICT,
  constraint pin_boards_organization_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint pin_boards_project_fkey foreign KEY (project_id) references projects (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_pin_boards_organization on public.pin_boards using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_pin_boards_project on public.pin_boards using btree (project_id) TABLESPACE pg_default
where
  (project_id is not null);

## Tabla PINS:

create table public.pins (
  id uuid not null default gen_random_uuid (),
  title text null,
  source_url text null,
  image_url text null,
  created_at timestamp with time zone null default now(),
  organization_id uuid null,
  project_id uuid null,
  media_file_id uuid null,
  constraint pins_pkey primary key (id),
  constraint pins_media_file_fkey foreign KEY (media_file_id) references media_files (id) on delete set null,
  constraint pins_organization_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE,
  constraint pins_project_fkey foreign KEY (project_id) references projects (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_pins_organization on public.pins using btree (organization_id) TABLESPACE pg_default
where
  (organization_id is not null);

create index IF not exists idx_pins_project on public.pins using btree (project_id) TABLESPACE pg_default
where
  (project_id is not null);

create index IF not exists idx_pins_media_file on public.pins using btree (media_file_id) TABLESPACE pg_default
where
  (media_file_id is not null);
  