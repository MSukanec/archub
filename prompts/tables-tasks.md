# Tablas de Supabase relacionadas a TAREAS (Tasks) y OBRA (Construction):

TABLA TASK_TEMPLATES:

[
  {
    "column_name": "id",
    "data_type": "uuid"
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
  },
  {
    "column_name": "task_group_id",
    "data_type": "uuid"
  },
  {
    "column_name": "unit_id",
    "data_type": "uuid"
  },
  {
    "column_name": "task_code",
    "data_type": "text"
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
  },
  {
    "column_name": "task_group_id",
    "data_type": "uuid"
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
    "column_name": "task_group_id",
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
    "column_name": "is_system",
    "data_type": "boolean"
  },
  {
    "column_name": "task_group_id",
    "data_type": "uuid"
  }
]

TABLA TASK_GROUPS:

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
    "column_name": "name",
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
    "column_name": "template_id",
    "data_type": "uuid"
  }
]

TABLA (VISTA) TASK_GENERATED_VIEW:

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
    "column_name": "organization_id",
    "data_type": "uuid"
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
    "column_name": "task_group_id",
    "data_type": "uuid"
  },
  {
    "column_name": "task_group_name",
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
    "column_name": "category_code",
    "data_type": "text"
  },
  {
    "column_name": "subcategory_id",
    "data_type": "uuid"
  },
  {
    "column_name": "subcategory_name",
    "data_type": "text"
  },
  {
    "column_name": "subcategory_code",
    "data_type": "text"
  },
  {
    "column_name": "rubro_id",
    "data_type": "uuid"
  },
  {
    "column_name": "rubro_name",
    "data_type": "text"
  },
  {
    "column_name": "rubro_code",
    "data_type": "text"
  },
  {
    "column_name": "display_name",
    "data_type": "text"
  }
]

TABLA CONSTRUCTION_TASKS

[
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
    "column_name": "project_id",
    "data_type": "uuid"
  },
  {
    "column_name": "task_id",
    "data_type": "uuid"
  },
  {
    "column_name": "quantity",
    "data_type": "real"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "column_name": "start_date",
    "data_type": "date"
  },
  {
    "column_name": "end_date",
    "data_type": "date"
  },
  {
    "column_name": "duration_in_days",
    "data_type": "integer"
  },
  {
    "column_name": "id",
    "data_type": "uuid"
  }
]

]
