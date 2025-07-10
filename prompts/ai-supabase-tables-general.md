# Detalle de las tablas de Supabase Generales:

TABLA PROJECT_DATA

[
  {
    "column_name": "project_id",
    "data_type": "uuid"
  },
  {
    "column_name": "surface_total",
    "data_type": "numeric"
  },
  {
    "column_name": "surface_covered",
    "data_type": "numeric"
  },
  {
    "column_name": "surface_semi",
    "data_type": "numeric"
  },
  {
    "column_name": "start_date",
    "data_type": "date"
  },
  {
    "column_name": "estimated_end",
    "data_type": "date"
  },
  {
    "column_name": "project_type_id",
    "data_type": "uuid"
  },
  {
    "column_name": "project_image_url",
    "data_type": "text"
  },
  {
    "column_name": "lat",
    "data_type": "numeric"
  },
  {
    "column_name": "lng",
    "data_type": "numeric"
  },
  {
    "column_name": "zip_code",
    "data_type": "text"
  },
  {
    "column_name": "description",
    "data_type": "text"
  },
  {
    "column_name": "internal_notes",
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
    "column_name": "country",
    "data_type": "text"
  },
  {
    "column_name": "state",
    "data_type": "text"
  },
  {
    "column_name": "address",
    "data_type": "text"
  },
  {
    "column_name": "city",
    "data_type": "text"
  },
  {
    "column_name": "client_name",
    "data_type": "text"
  },
  {
    "column_name": "contact_phone",
    "data_type": "text"
  },
  {
    "column_name": "email",
    "data_type": "text"
  },
  {
    "column_name": "modality_id",
    "data_type": "uuid"
  }
]

TABLA ORGANIZATIONS:

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
    "column_name": "name",
    "data_type": "text"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "column_name": "is_active",
    "data_type": "boolean"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "plan_id",
    "data_type": "uuid"
  },
  {
    "column_name": "is_system",
    "data_type": "boolean"
  }
]