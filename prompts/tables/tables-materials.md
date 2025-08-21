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
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
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
  },
  {
    "column_name": "project_id",
    "data_type": "uuid"
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
  },
  {
    "column_name": "position",
    "data_type": "integer"
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

TABLA (VIEW) CONSTRUCTION_TASKS_VIEW:

[
  {
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "id",
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
    "column_name": "name_rendered",
    "data_type": "text"
  },
  {
    "column_name": "category_name",
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
    "column_name": "phase_name",
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