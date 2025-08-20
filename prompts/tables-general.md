# Detalle de las tablas de Supabase Generales:

TABLA USERS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "instance_id",
    "data_type": "uuid"
  },
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "aud",
    "data_type": "character varying"
  },
  {
    "column_name": "auth_id",
    "data_type": "uuid"
  },
  {
    "column_name": "role",
    "data_type": "character varying"
  },
  {
    "column_name": "email",
    "data_type": "text"
  },
  {
    "column_name": "email",
    "data_type": "character varying"
  },
  {
    "column_name": "avatar_url",
    "data_type": "text"
  },
  {
    "column_name": "avatar_source",
    "data_type": "text"
  },
  {
    "column_name": "encrypted_password",
    "data_type": "character varying"
  },
  {
    "column_name": "full_name",
    "data_type": "text"
  },
  {
    "column_name": "email_confirmed_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "role_id",
    "data_type": "uuid"
  },
  {
    "column_name": "invited_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "confirmation_token",
    "data_type": "character varying"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "confirmation_sent_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "recovery_token",
    "data_type": "character varying"
  },
  {
    "column_name": "recovery_sent_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "email_change_token_new",
    "data_type": "character varying"
  },
  {
    "column_name": "email_change",
    "data_type": "character varying"
  },
  {
    "column_name": "email_change_sent_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "last_sign_in_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "raw_app_meta_data",
    "data_type": "jsonb"
  },
  {
    "column_name": "raw_user_meta_data",
    "data_type": "jsonb"
  },
  {
    "column_name": "is_super_admin",
    "data_type": "boolean"
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
    "column_name": "phone",
    "data_type": "text"
  },
  {
    "column_name": "phone_confirmed_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "phone_change",
    "data_type": "text"
  },
  {
    "column_name": "phone_change_token",
    "data_type": "character varying"
  },
  {
    "column_name": "phone_change_sent_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "confirmed_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "email_change_token_current",
    "data_type": "character varying"
  },
  {
    "column_name": "email_change_confirm_status",
    "data_type": "smallint"
  },
  {
    "column_name": "banned_until",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "reauthentication_token",
    "data_type": "character varying"
  },
  {
    "column_name": "reauthentication_sent_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "is_sso_user",
    "data_type": "boolean"
  },
  {
    "column_name": "deleted_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "is_anonymous",
    "data_type": "boolean"
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
  }
]

TABLA ORGANIZATION_PREFERENCES:

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
    "column_name": "default_pdf_template_id",
    "data_type": "uuid"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "default_currency_id",
    "data_type": "uuid"
  },
  {
    "column_name": "default_wallet_id",
    "data_type": "uuid"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  }
]

TABLA USER_ORGANIZATION_PREFERENCES:

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
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "last_project_id",
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