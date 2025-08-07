# Detalle de las tablas de Supabase para Contactos:

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