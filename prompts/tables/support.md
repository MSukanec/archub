# Detalle de las tablas de Supabase relacionadas a AYUDA Y SOPORTE:

--------------- TABLA SUPPORT_MESSAGES:

create table public.support_messages (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  message text not null,
  sender text not null,
  created_at timestamp with time zone null default now(),
  constraint support_messages_pkey primary key (id),
  constraint support_messages_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint support_messages_sender_check check (
    (sender = any (array['user'::text, 'admin'::text]))
  )
) TABLESPACE pg_default;