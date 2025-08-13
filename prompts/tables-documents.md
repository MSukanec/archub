# Detalle de las tablas de Supabase para Site Logs:

TABLA DOCUMENTS (EX DESIGN_DOCUMENTS)

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "file_name",
    "data_type": "text"
  },
  {
    "column_name": "description",
    "data_type": "text"
  },
  {
    "column_name": "file_path",
    "data_type": "text"
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
    "column_name": "version_number",
    "data_type": "integer"
  },
  {
    "column_name": "project_id",
    "data_type": "uuid"
  },
  {
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "status",
    "data_type": "text"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "file_size",
    "data_type": "bigint"
  },
  {
    "column_name": "folder_id",
    "data_type": "uuid"
  },
  {
    "column_name": "name",
    "data_type": "text"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid"
  }
]

TABLA DOCUMENT_FOLDERS:

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
    "column_name": "parent_id",
    "data_type": "uuid"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid"
  }
]