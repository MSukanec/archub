# Detalle de las tablas de Supabase de Productos:

TABLA PRODUCTS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "material_id",
    "data_type": "uuid"
  },
  {
    "column_name": "brand_id",
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
    "column_name": "image_url",
    "data_type": "text"
  },
  {
    "column_name": "specs",
    "data_type": "jsonb"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "unit_id",
    "data_type": "uuid"
  },
  {
    "column_name": "default_price",
    "data_type": "numeric"
  },
  {
    "column_name": "default_provider",
    "data_type": "text"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "url",
    "data_type": "text"
  },
  {
    "column_name": "is_system",
    "data_type": "boolean"
  }
]

TABLA PRODUCT_PRICES:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "provider_product_id",
    "data_type": "uuid"
  },
  {
    "column_name": "price",
    "data_type": "numeric"
  },
  {
    "column_name": "currency_id",
    "data_type": "uuid"
  },
  {
    "column_name": "valid_from",
    "data_type": "date"
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

TABLA PROVIDER_PRODUCTS:

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
    "column_name": "product_id",
    "data_type": "uuid"
  },
  {
    "column_name": "provider_code",
    "data_type": "text"
  },
  {
    "column_name": "is_active",
    "data_type": "boolean"
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

VISTA PRODUCTS_VIEW:

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
    "column_name": "url",
    "data_type": "text"
  },
  {
    "column_name": "image_url",
    "data_type": "text"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "material_id",
    "data_type": "uuid"
  },
  {
    "column_name": "unit_id",
    "data_type": "uuid"
  },
  {
    "column_name": "brand_id",
    "data_type": "uuid"
  },
  {
    "column_name": "default_provider",
    "data_type": "text"
  },
  {
    "column_name": "default_price",
    "data_type": "numeric"
  },
  {
    "column_name": "material",
    "data_type": "text"
  },
  {
    "column_name": "brand",
    "data_type": "text"
  },
  {
    "column_name": "unit",
    "data_type": "text"
  },
  {
    "column_name": "is_system",
    "data_type": "boolean"
  },
  {
    "column_name": "category_hierarchy",
    "data_type": "text"
  }
]