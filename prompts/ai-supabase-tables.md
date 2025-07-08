# Tablas de Supabase relacionadas a TAREAS (Tasks):

TABLA TASK_TEMPLATES:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "category_id",
    "data_type": "uuid"
  },
  {
    "column_name": "code",
    "data_type": "text"
  },
  {
    "column_name": "name",
    "data_type": "text"
  },
  {
    "column_name": "name_template",
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

TABLA TASK_PARAMETERS:

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
    "column_name": "position",
    "data_type": "integer"
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
    "column_name": "option_group_id",
    "data_type": "uuid"
  }
]

TABLA TASK_PARAMETER_VALUES:

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
  }
]

TABLA TASK_PARAMETER_OPTION_GROUPS:

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
    "column_name": "name",
    "data_type": "text"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "category_id",
    "data_type": "uuid"
  }
]

TABLA TASK_PARAMETERS_OPTION_GROUP_ITEMS

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "group_id",
    "data_type": "uuid"
  },
  {
    "column_name": "parameter_value_id",
    "data_type": "uuid"
  }
]

TABLA TASK_GENERATED:

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
    "column_name": "template_id",
    "data_type": "uuid"
  },
  {
    "column_name": "param_values",
    "data_type": "jsonb"
  },
  {
    "column_name": "name",
    "data_type": "text"
  },
  {
    "column_name": "is_public",
    "data_type": "boolean"
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
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "scope",
    "data_type": "text"
  }
]