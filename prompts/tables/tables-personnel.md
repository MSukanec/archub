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

TABLA PERSONNEL_INSURANCES

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
    "column_name": "personnel_id",
    "data_type": "uuid"
  },
  {
    "column_name": "insurance_type",
    "data_type": "text"
  },
  {
    "column_name": "policy_number",
    "data_type": "text"
  },
  {
    "column_name": "provider",
    "data_type": "text"
  },
  {
    "column_name": "coverage_start",
    "data_type": "date"
  },
  {
    "column_name": "coverage_end",
    "data_type": "date"
  },
  {
    "column_name": "reminder_days",
    "data_type": "ARRAY"
  },
  {
    "column_name": "certificate_attachment_id",
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
  },
  {
    "column_name": "coverage_range",
    "data_type": "daterange"
  }
]

TABLA CONTACT_ATTACHMENTS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "contact_id",
    "data_type": "uuid"
  },
  {
    "column_name": "storage_bucket",
    "data_type": "text"
  },
  {
    "column_name": "storage_path",
    "data_type": "text"
  },
  {
    "column_name": "file_name",
    "data_type": "text"
  },
  {
    "column_name": "mime_type",
    "data_type": "text"
  },
  {
    "column_name": "size_bytes",
    "data_type": "bigint"
  },
  {
    "column_name": "category",
    "data_type": "text"
  },
  {
    "column_name": "metadata",
    "data_type": "jsonb"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  }
]

VISTA PERSONNEL_INSURANCE_VIEW:

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
    "column_name": "personnel_id",
    "data_type": "uuid"
  },
  {
    "column_name": "contact_id",
    "data_type": "uuid"
  },
  {
    "column_name": "insurance_type",
    "data_type": "text"
  },
  {
    "column_name": "policy_number",
    "data_type": "text"
  },
  {
    "column_name": "provider",
    "data_type": "text"
  },
  {
    "column_name": "coverage_start",
    "data_type": "date"
  },
  {
    "column_name": "coverage_end",
    "data_type": "date"
  },
  {
    "column_name": "reminder_days",
    "data_type": "ARRAY"
  },
  {
    "column_name": "certificate_attachment_id",
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
  },
  {
    "column_name": "days_to_expiry",
    "data_type": "integer"
  },
  {
    "column_name": "status",
    "data_type": "text"
  }
]