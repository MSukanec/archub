# Detalle de las tablas de Supabase de Construction:

TABLA CONSTRUCTION_DEPENDENCIES:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "predecessor_task_id",
    "data_type": "uuid"
  },
  {
    "column_name": "successor_task_id",
    "data_type": "uuid"
  },
  {
    "column_name": "type",
    "data_type": "text"
  },
  {
    "column_name": "lag_days",
    "data_type": "integer"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  }
]

VISTA CONSTRUCTION_GANTT_VIEW:

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

TABLA CONSTRUCTION_PHASE_TASKS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "construction_task_id",
    "data_type": "uuid"
  },
  {
    "column_name": "project_phase_id",
    "data_type": "uuid"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "progress_percent",
    "data_type": "integer"
  }
]

TABLA CONSTRUCTION_PHASES:

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
    "column_name": "description",
    "data_type": "text"
  },
  {
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "is_system",
    "data_type": "boolean"
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

TABLA CONSTRUCTION_PROJECT_PHASES:

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
    "column_name": "phase_id",
    "data_type": "uuid"
  },
  {
    "column_name": "start_date",
    "data_type": "date"
  },
  {
    "column_name": "duration_in_days",
    "data_type": "integer"
  },
  {
    "column_name": "end_date",
    "data_type": "date"
  },
  {
    "column_name": "position",
    "data_type": "integer"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid"
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

TABLA CONSTRUCTION_TASKS:

[
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "project_id",
    "data_type": "uuid"
  },
  {
    "column_name": "task_id",
    "data_type": "uuid"
  },
  {
    "column_name": "quantity",
    "data_type": "real"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "column_name": "start_date",
    "data_type": "date"
  },
  {
    "column_name": "end_date",
    "data_type": "date"
  },
  {
    "column_name": "duration_in_days",
    "data_type": "integer"
  },
  {
    "column_name": "id",
    "data_type": "uuid"
  }
]