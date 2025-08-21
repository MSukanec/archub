# Detalle de las tablas de Supabase para Kanban:

TABLA KANBAN_ATTACHMENTS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "card_id",
    "data_type": "uuid"
  },
  {
    "column_name": "file_url",
    "data_type": "text"
  },
  {
    "column_name": "file_name",
    "data_type": "text"
  },
  {
    "column_name": "uploaded_by",
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

TABLA KANBAN_BOARDS:

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
    "column_name": "organization_id",
    "data_type": "uuid"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "project_id",
    "data_type": "uuid"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid"
  }
]

TABLA KANBAN_CARDS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "list_id",
    "data_type": "uuid"
  },
  {
    "column_name": "title",
    "data_type": "text"
  },
  {
    "column_name": "description",
    "data_type": "text"
  },
  {
    "column_name": "due_date",
    "data_type": "date"
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
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "column_name": "is_completed",
    "data_type": "boolean"
  },
  {
    "column_name": "completed_at",
    "data_type": "timestamp with time zone"
  },
  {
    "column_name": "assigned_to",
    "data_type": "uuid"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  }
]

TABLA KANBAN_COMMENTS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "card_id",
    "data_type": "uuid"
  },
  {
    "column_name": "author_id",
    "data_type": "uuid"
  },
  {
    "column_name": "content",
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

TABLA KANBAN_LISTS:

[
  {
    "column_name": "id",
    "data_type": "uuid"
  },
  {
    "column_name": "board_id",
    "data_type": "uuid"
  },
  {
    "column_name": "name",
    "data_type": "text"
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
    "column_name": "created_by",
    "data_type": "uuid"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone"
  }
]





