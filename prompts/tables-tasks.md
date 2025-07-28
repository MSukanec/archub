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

TABLA (VISTA) TASK_PARAMETRIC_VIEW:

[
  {
    "column_name": "id",
    "data_type": "uuid"
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
    "column_name": "param_values",
    "data_type": "jsonb"
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
    "column_name": "unit_name",
    "data_type": "text"
  },
  {
    "column_name": "category_id",
    "data_type": "uuid"
  },
  {
    "column_name": "category_name",
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

TABLA TASK_PARAMETRIC:

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