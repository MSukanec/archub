# Detalle de las tablas de Supabase de PDFs:

---------- TABLA PDF:

create table public.pdf (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  organization_id uuid null,
  updated_at timestamp with time zone null,
  name text null,
  blocks jsonb null,
  config jsonb null,
  constraint pdf_pkey primary key (id),
  constraint pdf_organization_id_fkey foreign KEY (organization_id) references organizations (id) on delete CASCADE
) TABLESPACE pg_default;

---------- TABLA PDF_TEMPLATES:

create table public.pdf_templates (
  id uuid not null default gen_random_uuid (),
  name text not null default 'Plantilla por defecto'::text,
  logo_width integer null default 80,
  logo_height integer null default 60,
  company_name_show boolean null default true,
  company_name_size integer null default 24,
  company_name_color text null default '#1f2937'::text,
  primary_color text null default '#4f9eff'::text,
  secondary_color text null default '#e5e7eb'::text,
  text_color text null default '#1f2937'::text,
  background_color text null default '#ffffff'::text,
  font_family text null default 'Arial'::text,
  title_size integer null default 18,
  subtitle_size integer null default 14,
  body_size integer null default 12,
  margin_top integer null default 20,
  margin_bottom integer null default 20,
  margin_left integer null default 20,
  margin_right integer null default 20,
  footer_text text null,
  footer_show_page_numbers boolean null default true,
  footer_show_date boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  company_address text null,
  company_email text null,
  company_phone text null,
  document_number text null,
  show_client_section boolean null default true,
  show_project_section boolean null default true,
  show_details_section boolean null default true,
  show_signature_section boolean null default true,
  signature_text text null,
  company_info_size integer null default 10,
  show_signature_fields boolean null default true,
  signature_layout character varying(20) null default 'vertical'::character varying,
  show_clarification_field boolean null default true,
  show_date_field boolean null default true,
  footer_info text null default 'Documento generado por Archub. www.archub.com'::text,
  show_footer_info boolean null default true,
  page_size character varying(10) null default 'A4'::character varying,
  page_orientation character varying(10) null default 'portrait'::character varying,
  custom_width numeric null,
  custom_height numeric null,
  constraint pdf_templates_pkey primary key (id),
  constraint pdf_templates_signature_layout_check check (
    (
      (signature_layout)::text = any (
        array[
          ('vertical'::character varying)::text,
          ('horizontal'::character varying)::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger update_pdf_templates_updated_at BEFORE
update on pdf_templates for EACH row
execute FUNCTION update_updated_at_column ();