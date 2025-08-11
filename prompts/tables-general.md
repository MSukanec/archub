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
  },
  {
    "column_name": "logo_url",
    "data_type": "text"
  }
]

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
  }
]

TABLA PROJECT_CLIENTS:

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
    "column_name": "client_id",
    "data_type": "uuid"
  },
  {
    "column_name": "committed_amount",
    "data_type": "numeric"
  },
  {
    "column_name": "currency_id",
    "data_type": "uuid"
  },
  {
    "column_name": "role",
    "data_type": "text"
  },
  {
    "column_name": "is_active",
    "data_type": "boolean"
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
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  }
]

TABLA USER_DATA:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "user_id",
    "data_type": "uuid"
  },
  {
    "column_name": "country",
    "data_type": "uuid"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "birthdate",
    "data_type": "date"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "first_name",
    "data_type": "text"
  },
  {
    "column_name": "last_name",
    "data_type": "text"
  },
  {
    "column_name": "discovered_by",
    "data_type": "USER-DEFINED"
  },
  {
    "column_name": "discovered_by_other_text",
    "data_type": "text"
  },
  {
    "column_name": "main_use",
    "data_type": "USER-DEFINED"
  },
  {
    "column_name": "user_role",
    "data_type": "USER-DEFINED"
  },
  {
    "column_name": "team_size",
    "data_type": "USER-DEFINED"
  },
  {
    "column_name": "main_use_other",
    "data_type": "text"
  },
  {
    "column_name": "user_role_other",
    "data_type": "text"
  }
]

TABLA ORGANIZATION_ACTIVITY_LOGS:

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
    "column_name": "user_id",
    "data_type": "uuid"
  },
  {
    "column_name": "action",
    "data_type": "text"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "target_table",
    "data_type": "text"
  },
  {
    "column_name": "target_id",
    "data_type": "uuid"
  },
  {
    "column_name": "metadata",
    "data_type": "jsonb"
  }
]

TABLA ORGANIZATION_DATA:

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
    "column_name": "slug",
    "data_type": "text"
  },
  {
    "column_name": "description",
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
    "column_name": "state",
    "data_type": "text"
  },
  {
    "column_name": "country",
    "data_type": "text"
  },
  {
    "column_name": "postal_code",
    "data_type": "text"
  },
  {
    "column_name": "phone",
    "data_type": "text"
  },
  {
    "column_name": "email",
    "data_type": "text"
  },
  {
    "column_name": "website",
    "data_type": "text"
  },
  {
    "column_name": "tax_id",
    "data_type": "text"
  },
  {
    "column_name": "last_activity_at",
    "data_type": "timestamp with time zone"
  }
]