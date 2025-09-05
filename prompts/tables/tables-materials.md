# Detalle de las tablas de Supabase de Materiales y Productos:

TABLA MATERIALS:

[
  {
    "column_name": "name",
    "data_type": "text"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "unit_id",
    "data_type": "uuid"
  },
  {
    "column_name": "category_id",
    "data_type": "uuid"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "is_system",
    "data_type": "boolean"
  },
  {
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "default_unit_presentation_id",
    "data_type": "uuid"
  },
  {
    "column_name": "is_completed",
    "data_type": "boolean"
  }
]

VISTA MATERIALS_VIEW:

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
    "column_name": "category_name",
    "data_type": "text"
  },
  {
    "column_name": "unit_id",
    "data_type": "uuid"
  },
  {
    "column_name": "unit_of_computation",
    "data_type": "text"
  },
  {
    "column_name": "unit_description",
    "data_type": "text"
  },
  {
    "column_name": "default_unit_presentation_id",
    "data_type": "uuid"
  },
  {
    "column_name": "default_unit_presentation",
    "data_type": "text"
  },
  {
    "column_name": "unit_equivalence",
    "data_type": "numeric"
  },
  {
    "column_name": "is_system",
    "data_type": "boolean"
  },
  {
    "column_name": "is_completed",
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
    "column_name": "min_price",
    "data_type": "numeric"
  },
  {
    "column_name": "max_price",
    "data_type": "numeric"
  },
  {
    "column_name": "avg_price",
    "data_type": "numeric"
  },
  {
    "column_name": "product_count",
    "data_type": "bigint"
  },
  {
    "column_name": "provider_product_count",
    "data_type": "bigint"
  },
  {
    "column_name": "price_count",
    "data_type": "bigint"
  }
]

TABLA MATERIAL_CATEGORIES:

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
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "parent_id",
    "data_type": "uuid"
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
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  }
]

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
  },
  {
    "column_name": "organization_id",
    "data_type": "uuid"
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
  },
  {
    "column_name": "avg_price",
    "data_type": "numeric"
  },
  {
    "column_name": "min_price",
    "data_type": "numeric"
  },
  {
    "column_name": "max_price",
    "data_type": "numeric"
  },
  {
    "column_name": "provider_count",
    "data_type": "bigint"
  }
]