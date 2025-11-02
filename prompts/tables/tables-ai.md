# Detalle de las tablas de Supabase para IA:

TABLA CONTACTS:

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
    "column_name": "first_name",
    "data_type": "text"
  },
  {
    "column_name": "email",
    "data_type": "text"
  },
  {
    "column_name": "phone",
    "data_type": "text"
  },
  {
    "column_name": "company_name",
    "data_type": "text"
  },
  {
    "column_name": "location",
    "data_type": "text"
  },
  {
    "column_name": "notes",
    "data_type": "text"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "last_name",
    "data_type": "text"
  },
  {
    "column_name": "linked_user_id",
    "data_type": "uuid"
  },
  {
    "column_name": "full_name",
    "data_type": "text"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "national_id",
    "data_type": "text"
  },
  {
    "column_name": "avatar_attachment_id",
    "data_type": "uuid"
  },
  {
    "column_name": "avatar_updated_at",
    "data_type": "timestamp with time zone"
  }
]

TABLA CONTACT_TYPES:

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
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  }
]

TABLA CONTACT_TYPE_LINKS:

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
    "column_name": "contact_type_id",
    "data_type": "uuid"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
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