# Detalle de las tablas de Supabase para Subcontratos:

TABLA SUBCONTRACTS:

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
    "column_name": "code",
    "data_type": "text"
  },
  {
    "column_name": "title",
    "data_type": "text"
  },
  {
    "column_name": "amount_total",
    "data_type": "numeric"
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
  },
  {
    "column_name": "currency_id",
    "data_type": "uuid"
  },
  {
    "column_name": "status",
    "data_type": "text"
  },
  {
    "column_name": "exchange_rate",
    "data_type": "numeric"
  },
  {
    "column_name": "date",
    "data_type": "date"
  },
  {
    "column_name": "winner_bid_id",
    "data_type": "uuid"
  }
]

TABLA SUBCONTRACT_BID_TASKS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "bid_id",
    "data_type": "uuid"
  },
  {
    "column_name": "task_id",
    "data_type": "uuid"
  },
  {
    "column_name": "quantity",
    "data_type": "numeric"
  },
  {
    "column_name": "unit",
    "data_type": "text"
  },
  {
    "column_name": "unit_price",
    "data_type": "numeric"
  },
  {
    "column_name": "amount",
    "data_type": "numeric"
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

TABLA SUBCONTRACT_TASKS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "subcontract_id",
    "data_type": "uuid"
  },
  {
    "column_name": "task_id",
    "data_type": "uuid"
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

TABLA SUBCONTRACT_BIDS:

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
    "column_name": "amount",
    "data_type": "numeric"
  },
  {
    "column_name": "currency_id",
    "data_type": "uuid"
  },
  {
    "column_name": "exchange_rate",
    "data_type": "numeric"
  },
  {
    "column_name": "notes",
    "data_type": "text"
  },
  {
    "column_name": "submitted_at",
    "data_type": "date"
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
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "column_name": "subcontract_id",
    "data_type": "uuid"
  }
]