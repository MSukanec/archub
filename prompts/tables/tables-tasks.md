# Tablas de Supabase relacionadas a TAREAS (Tasks) y OBRA (Construction):

TABLA TASK_PARAMETERS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "slug",
    "data_type": "text"
  },
  {
    "column_name": "label",
    "data_type": "text"
  },
  {
    "column_name": "type",
    "data_type": "text"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "expression_template",
    "data_type": "text"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "is_required",
    "data_type": "boolean"
  }
]

TABLA TASK_PARAMETER_OPTIONS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "parameter_id",
    "data_type": "uuid"
  },
  {
    "column_name": "label",
    "data_type": "text"
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
    "column_name": "description",
    "data_type": "text"
  },
  {
    "column_name": "unit_id",
    "data_type": "uuid"
  },
  {
    "column_name": "category_id",
    "data_type": "uuid"
  }
]

TABLA TASK_CATEGORIES:

[
  {
    "column_name": "name",
    "data_type": "text"
  },
  {
    "column_name": "position",
    "data_type": "text"
  },
  {
    "column_name": "code",
    "data_type": "text"
  },
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "parent_id",
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

TABLA TASK_PARAMETER_DEPENDENCIES

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "parent_parameter_id",
    "data_type": "uuid"
  },
  {
    "column_name": "parent_option_id",
    "data_type": "uuid"
  },
  {
    "column_name": "child_parameter_id",
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

TASK_PARAMETER_DEPENDENCY_OPTIONS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "parameter_id",
    "data_type": "uuid"
  },
  {
    "column_name": "label",
    "data_type": "text"
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
    "column_name": "description",
    "data_type": "text"
  }
]

TABLA TASKS:

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
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "param_values",
    "data_type": "jsonb"
  },
  {
    "column_name": "code",
    "data_type": "text"
  },
  {
    "column_name": "param_order",
    "data_type": "ARRAY"
  },
  {
    "column_name": "name_rendered",
    "data_type": "text"
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
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "is_system",
    "data_type": "boolean"
  },
  {
    "column_name": "custom_name",
    "data_type": "text"
  },
  {
    "column_name": "task_template_id",
    "data_type": "uuid"
  },
  {
    "column_name": "is_completed",
    "data_type": "boolean"
  },
  {
    "column_name": "task_division_id",
    "data_type": "uuid"
  }
]

TABLA TASK_PARAMETER_POSITIONS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "parameter_id",
    "data_type": "uuid"
  },
  {
    "column_name": "x",
    "data_type": "integer"
  },
  {
    "column_name": "y",
    "data_type": "integer"
  },
  {
    "column_name": "visible_options",
    "data_type": "ARRAY"
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

TABLA TASK_MATERIALS:

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
    "column_name": "task_id",
    "data_type": "uuid"
  },
  {
    "column_name": "material_id",
    "data_type": "uuid"
  },
  {
    "column_name": "amount",
    "data_type": "real"
  },
  {
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "is_system",
    "data_type": "boolean"
  }
]

TABLA TASK_TEMPLATES:

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
    "column_name": "unit_id",
    "data_type": "uuid"
  },
  {
    "column_name": "name_expression",
    "data_type": "text"
  },
  {
    "column_name": "is_active",
    "data_type": "boolean"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "task_kind_id",
    "data_type": "uuid"
  },
  {
    "column_name": "task_category_id",
    "data_type": "uuid"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "code",
    "data_type": "text"
  },
  {
    "column_name": "version",
    "data_type": "integer"
  },
  {
    "column_name": "is_system",
    "data_type": "boolean"
  }
]

TABLA TASK_TEMPLATE_PARAMETERS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "template_id",
    "data_type": "uuid"
  },
  {
    "column_name": "parameter_id",
    "data_type": "uuid"
  },
  {
    "column_name": "order_index",
    "data_type": "integer"
  },
  {
    "column_name": "is_required",
    "data_type": "boolean"
  },
  {
    "column_name": "condition_json",
    "data_type": "jsonb"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  }
]

VISTA TASKS_VIEW:

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
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "param_values",
    "data_type": "jsonb"
  },
  {
    "column_name": "param_order",
    "data_type": "ARRAY"
  },
  {
    "column_name": "name_rendered",
    "data_type": "text"
  },
  {
    "column_name": "custom_name",
    "data_type": "text"
  },
  {
    "column_name": "code",
    "data_type": "text"
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
    "column_name": "is_completed",
    "data_type": "boolean"
  },
  {
    "column_name": "unit",
    "data_type": "text"
  },
  {
    "column_name": "category",
    "data_type": "text"
  },
  {
    "column_name": "division",
    "data_type": "text"
  },
  {
    "column_name": "division_en",
    "data_type": "text"
  }
]

TABLA TASK_DIVISIONS:

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
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "name",
    "data_type": "text"
  },
  {
    "column_name": "name_en",
    "data_type": "text"
  },
  {
    "column_name": "description",
    "data_type": "text"
  },
  {
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "is_system",
    "data_type": "boolean"
  },
  {
    "column_name": "order",
    "data_type": "integer"
  },
  {
    "column_name": "code",
    "data_type": "text"
  }
]

TABLA ORGANIZATION_TASK_PRICES:

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
    "column_name": "task_id",
    "data_type": "uuid"
  },
  {
    "column_name": "labor_unit_cost",
    "data_type": "numeric"
  },
  {
    "column_name": "material_unit_cost",
    "data_type": "numeric"
  },
  {
    "column_name": "total_unit_cost",
    "data_type": "numeric"
  },
  {
    "column_name": "currency_code",
    "data_type": "text"
  },
  {
    "column_name": "note",
    "data_type": "text"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  }
]

VISTA ORGANIZATION_TASK_PRICES_VIEW:

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
    "column_name": "task_id",
    "data_type": "uuid"
  },
  {
    "column_name": "task_name",
    "data_type": "text"
  },
  {
    "column_name": "division_name",
    "data_type": "text"
  },
  {
    "column_name": "division_order",
    "data_type": "integer"
  },
  {
    "column_name": "unit",
    "data_type": "text"
  },
  {
    "column_name": "labor_unit_cost",
    "data_type": "numeric"
  },
  {
    "column_name": "material_unit_cost",
    "data_type": "numeric"
  },
  {
    "column_name": "supply_unit_cost",
    "data_type": "numeric"
  },
  {
    "column_name": "total_unit_cost",
    "data_type": "numeric"
  },
  {
    "column_name": "currency_code",
    "data_type": "text"
  },
  {
    "column_name": "note",
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