# Detalle de las tablas de Supabase de Construction:

TABLA MOVEMENTS:

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
    "column_name": "description",
    "data_type": "text"
  },
  {
    "column_name": "amount",
    "data_type": "numeric"
  },
  {
    "column_name": "file_url",
    "data_type": "text"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "subcategory_id",
    "data_type": "uuid"
  },
  {
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "wallet_id",
    "data_type": "uuid"
  },
  {
    "column_name": "currency_id",
    "data_type": "uuid"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "column_name": "type_id",
    "data_type": "uuid"
  },
  {
    "column_name": "category_id",
    "data_type": "uuid"
  },
  {
    "column_name": "is_conversion",
    "data_type": "boolean"
  },
  {
    "column_name": "is_favorite",
    "data_type": "boolean"
  },
  {
    "column_name": "movement_date",
    "data_type": "date"
  },
  {
    "column_name": "conversion_group_id",
    "data_type": "uuid"
  },
  {
    "column_name": "contact_id",
    "data_type": "uuid"
  },
  {
    "column_name": "exchange_rate",
    "data_type": "numeric"
  },
  {
    "column_name": "transfer_group_id",
    "data_type": "uuid"
  },
  {
    "column_name": "member_id",
    "data_type": "uuid"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  }
]

TABLA MOVEMENT_CLIENTS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "movement_id",
    "data_type": "uuid"
  },
  {
    "column_name": "project_client_id",
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
    "column_name": "project_installment_id",
    "data_type": "uuid"
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
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "currency_id",
    "data_type": "uuid"
  },
  {
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "unit",
    "data_type": "text"
  },
  {
    "column_name": "exchange_rate",
    "data_type": "numeric"
  }
]

TABLA PROJECT_INSTALLMENTS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "number",
    "data_type": "integer"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
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
    "column_name": "index_reference",
    "data_type": "numeric"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "column_name": "date",
    "data_type": "date"
  }
]

VISTA MOVEMENT_PAYMENTS_VIEW:

[
  {
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "project_id",
    "data_type": "uuid"
  },
  {
    "column_name": "movement_id",
    "data_type": "uuid"
  },
  {
    "column_name": "movement_client_id",
    "data_type": "uuid"
  },
  {
    "column_name": "project_client_id",
    "data_type": "uuid"
  },
  {
    "column_name": "project_installment_id",
    "data_type": "uuid"
  },
  {
    "column_name": "installment_number",
    "data_type": "integer"
  },
  {
    "column_name": "client_id",
    "data_type": "uuid"
  },
  {
    "column_name": "client_name",
    "data_type": "text"
  },
  {
    "column_name": "unit",
    "data_type": "text"
  },
  {
    "column_name": "amount",
    "data_type": "numeric"
  },
  {
    "column_name": "wallet_id",
    "data_type": "uuid"
  },
  {
    "column_name": "wallet_name",
    "data_type": "text"
  },
  {
    "column_name": "currency_id",
    "data_type": "uuid"
  },
  {
    "column_name": "currency_name",
    "data_type": "text"
  },
  {
    "column_name": "movement_date",
    "data_type": "date"
  },
  {
    "column_name": "exchange_rate",
    "data_type": "numeric"
  }
]

TABLA PAYMENT_PLANS:

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
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  }
]

TABLA PROJECT_PAYMENT_PLANS:

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
    "column_name": "payment_plan_id",
    "data_type": "uuid"
  },
  {
    "column_name": "installments_count",
    "data_type": "integer"
  },
  {
    "column_name": "frequency",
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