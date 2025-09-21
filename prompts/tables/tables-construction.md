# Detalle de las tablas de Supabase de Construction:

VISTA CONSTRUCTION_TASKS_VIEW:

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
    "column_name": "project_id",
    "data_type": "uuid"
  },
  {
    "column_name": "task_id",
    "data_type": "uuid"
  },
  {
    "column_name": "custom_name",
    "data_type": "text"
  },
  {
    "column_name": "unit",
    "data_type": "text"
  },
  {
    "column_name": "category_name",
    "data_type": "text"
  },
  {
    "column_name": "division_name",
    "data_type": "text"
  },
  {
    "column_name": "quantity",
    "data_type": "real"
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
    "column_name": "progress_percent",
    "data_type": "integer"
  },
  {
    "column_name": "description",
    "data_type": "text"
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
    "column_name": "phase_name",
    "data_type": "text"
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
  },
  {
    "column_name": "progress_percent",
    "data_type": "integer"
  },
  {
    "column_name": "description",
    "data_type": "text"
  }
]