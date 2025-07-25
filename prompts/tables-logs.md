# Detalle de las tablas de Supabase para Site Logs:

TABLA SITE_LOG_FILES:

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
    "column_name": "file_url",
    "data_type": "text"
  },
  {
    "column_name": "file_type",
    "data_type": "text"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "visibility",
    "data_type": "text"
  },
  {
    "column_name": "file_name",
    "data_type": "text"
  },
  {
    "column_name": "file_path",
    "data_type": "text"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "description",
    "data_type": "text"
  },
  {
    "column_name": "file_size",
    "data_type": "bigint"
  },
  {
    "column_name": "project_id",
    "data_type": "uuid"
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
    "column_name": "contact_id",
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
  }
]

TABLA SITE_LOGS:

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
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "column_name": "log_date",
    "data_type": "date"
  },
  {
    "column_name": "comments",
    "data_type": "text"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "is_public",
    "data_type": "boolean"
  },
  {
    "column_name": "status",
    "data_type": "USER-DEFINED"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "is_favorite",
    "data_type": "boolean"
  },
  {
    "column_name": "entry_type",
    "data_type": "USER-DEFINED"
  },
  {
    "column_name": "weather",
    "data_type": "USER-DEFINED"
  },
  {
    "column_name": "organization_id",
    "data_type": "uuid"
  }
]

