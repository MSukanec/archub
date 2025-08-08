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

TABLA MOVEMENT_THIRD_PARTY_CONTRIBUTIONS:

[
  {
    "column_name": "movement_id",
    "data_type": "uuid"
  },
  {
    "column_name": "third_party_id",
    "data_type": "uuid"
  },
  {
    "column_name": "receipt_number",
    "data_type": "text"
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

