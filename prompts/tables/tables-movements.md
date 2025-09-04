# Detalle de las tablas de Supabase de Movimientos:

TABLA MOVEMENTS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "project_id",
    "data_type": "uuid"
  },
  {
    "column_name": "description",
    "data_type": "text"
  },
  {
    "column_name": "amount",
    "data_type": "numeric"
  },
  {
    "column_name": "file_url",
    "data_type": "text"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "subcategory_id",
    "data_type": "uuid"
  },
  {
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "wallet_id",
    "data_type": "uuid"
  },
  {
    "column_name": "currency_id",
    "data_type": "uuid"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "column_name": "type_id",
    "data_type": "uuid"
  },
  {
    "column_name": "category_id",
    "data_type": "uuid"
  },
  {
    "column_name": "is_conversion",
    "data_type": "boolean"
  },
  {
    "column_name": "is_favorite",
    "data_type": "boolean"
  },
  {
    "column_name": "movement_date",
    "data_type": "date"
  },
  {
    "column_name": "conversion_group_id",
    "data_type": "uuid"
  },
  {
    "column_name": "contact_id",
    "data_type": "uuid"
  },
  {
    "column_name": "exchange_rate",
    "data_type": "numeric"
  },
  {
    "column_name": "transfer_group_id",
    "data_type": "uuid"
  },
  {
    "column_name": "member_id",
    "data_type": "uuid"
  }
]

TABLA MOVEMENT_CONCEPTS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "name",
    "data_type": "text"
  },
  {
    "column_name": "parent_id",
    "data_type": "uuid"
  },
  {
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "is_system",
    "data_type": "boolean"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "view_mode",
    "data_type": "text"
  },
  {
    "column_name": "extra_fields",
    "data_type": "jsonb"
  }
]

TABLA MOVEMENT_PERSONNEL:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "personnel_id",
    "data_type": "uuid"
  },
  {
    "column_name": "movement_id",
    "data_type": "uuid"
  },
  {
    "column_name": "amount",
    "data_type": "numeric"
  }
]

TABLA MOVEMENT_SUBCONTRACTS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "movement_id",
    "data_type": "uuid"
  },
  {
    "column_name": "subcontract_id",
    "data_type": "uuid"
  },
  {
    "column_name": "amount",
    "data_type": "numeric"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  }
]

TABLA MOVEMENT_CLIENTS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "movement_id",
    "data_type": "uuid"
  },
  {
    "column_name": "project_client_id",
    "data_type": "uuid"
  },
  {
    "column_name": "amount",
    "data_type": "numeric"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  }
]

TABLE MOVEMENT_PARTNER_WITHDRAWALS:

create table public.movement_partner_withdrawals (
  id uuid not null default gen_random_uuid (),
  movement_id uuid not null,
  partner_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint movement_partner_withdrawals_pkey primary key (id),
  constraint movement_partner_withdrawals_movement_id_fkey foreign KEY (movement_id) references movements (id) on delete CASCADE,
  constraint movement_partner_withdrawals_partner_id_fkey foreign KEY (partner_id) references partners (id) on delete set null
) TABLESPACE pg_default;

TABLE MOVEMENT_PARTNER_CONTRIBUTONS:

create table public.movement_partner_contributions (
  id uuid not null default gen_random_uuid (),
  movement_id uuid not null,
  partner_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint movement_partner_contributions_pkey primary key (id),
  constraint movement_partner_contributions_movement_id_fkey foreign KEY (movement_id) references movements (id) on delete CASCADE,
  constraint movement_partner_contributions_partner_id_fkey foreign KEY (partner_id) references partners (id) on delete CASCADE
) TABLESPACE pg_default;

VISTA MOVEMENTS_VIEW:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "description",
    "data_type": "text"
  },
  {
    "column_name": "amount",
    "data_type": "numeric"
  },
  {
    "column_name": "movement_date",
    "data_type": "date"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "exchange_rate",
    "data_type": "numeric"
  },
  {
    "column_name": "is_conversion",
    "data_type": "boolean"
  },
  {
    "column_name": "is_favorite",
    "data_type": "boolean"
  },
  {
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "project_id",
    "data_type": "uuid"
  },
  {
    "column_name": "currency_id",
    "data_type": "uuid"
  },
  {
    "column_name": "wallet_id",
    "data_type": "uuid"
  },
  {
    "column_name": "type_id",
    "data_type": "uuid"
  },
  {
    "column_name": "category_id",
    "data_type": "uuid"
  },
  {
    "column_name": "subcategory_id",
    "data_type": "uuid"
  },
  {
    "column_name": "conversion_group_id",
    "data_type": "uuid"
  },
  {
    "column_name": "transfer_group_id",
    "data_type": "uuid"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "column_name": "project_name",
    "data_type": "text"
  },
  {
    "column_name": "project_color",
    "data_type": "text"
  },
  {
    "column_name": "currency_name",
    "data_type": "text"
  },
  {
    "column_name": "currency_symbol",
    "data_type": "text"
  },
  {
    "column_name": "currency_code",
    "data_type": "text"
  },
  {
    "column_name": "currency_country",
    "data_type": "text"
  },
  {
    "column_name": "wallet_name",
    "data_type": "text"
  },
  {
    "column_name": "type_name",
    "data_type": "text"
  },
  {
    "column_name": "category_name",
    "data_type": "text"
  },
  {
    "column_name": "subcategory_name",
    "data_type": "text"
  },
  {
    "column_name": "partner",
    "data_type": "text"
  },
  {
    "column_name": "subcontract",
    "data_type": "text"
  },
  {
    "column_name": "client",
    "data_type": "text"
  },
  {
    "column_name": "member",
    "data_type": "text"
  },
  {
    "column_name": "member_avatar",
    "data_type": "text"
  },
  {
    "column_name": "indirect_id",
    "data_type": "uuid"
  },
  {
    "column_name": "indirect",
    "data_type": "text"
  }
]

TABLE MOVEE