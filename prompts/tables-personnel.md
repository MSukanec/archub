# Detalle de las tablas de Supabase de Personal:

TABLA PROJECT_PERSONNEL:

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
    "column_name": "contact_id",
    "data_type": "uuid"
  },
  {
    "column_name": "notes",
    "data_type": "text"
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

TABLA ATTENDEES:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "site_log_id",
    "data_type": "uuid"
  },
  {
    "column_name": "attendance_type",
    "data_type": "text"
  },
  {
    "column_name": "hours_worked",
    "data_type": "numeric"
  },
  {
    "column_name": "description",
    "data_type": "text"
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
  },
  {
    "column_name": "project_id",
    "data_type": "uuid"
  },
  {
    "column_name": "personnel_id",
    "data_type": "uuid"
  }
]