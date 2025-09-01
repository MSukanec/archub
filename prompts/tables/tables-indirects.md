# Detalle de las tablas de Supabase de Construction:

TABLA INDIRECT_COSTS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "name",
    "data_type": "text"
  },
  {
    "column_name": "description",
    "data_type": "text"
  },
  {
    "column_name": "unit_id",
    "data_type": "uuid"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "project_id",
    "data_type": "uuid"
  }
]

TABLA INDIRECT_COST_VALUES:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "indirect_cost_id",
    "data_type": "uuid"
  },
  {
    "column_name": "amount",
    "data_type": "numeric"
  },
  {
    "column_name": "currency_id",
    "data_type": "uuid"
  },
  {
    "column_name": "valid_from",
    "data_type": "date"
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

