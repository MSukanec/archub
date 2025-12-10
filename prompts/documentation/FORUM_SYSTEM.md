# Sistema de Foro - Documentación Completa

## Resumen

El sistema de foro permite a los usuarios crear discusiones organizadas por categorías, con soporte para:
- Categorías con roles de acceso
- Hilos de discusión (threads)
- Respuestas (posts)
- Reacciones (likes)
- Adjuntos de imágenes
- Control de acceso basado en roles
- **Foros por curso** (cada curso tiene su propio foro independiente)

---

## Tablas de Base de Datos (Supabase)

### 1. forum_categories

Almacena las categorías del foro.

```sql
create table public.forum_categories (
  id uuid not null default gen_random_uuid (),
  name text not null,                           -- Nombre de la categoría
  slug text not null,                           -- Slug único para URLs
  description text null,                        -- Descripción opcional
  icon text null,                               -- Nombre del icono (lucide-react)
  color text null default '#000000'::text,      -- Color hexadecimal
  sort_order integer null default 0,            -- Orden de visualización
  allowed_roles text[] null default array['public'::text],  -- Roles que pueden acceder
  is_read_only boolean null default false,      -- Si es solo lectura
  is_active boolean null default true,          -- Si está activa
  course_id uuid null,                          -- NULL = foro global, UUID = foro de curso específico
  created_at timestamp with time zone null default now(),
  constraint forum_categories_pkey primary key (id),
  constraint forum_categories_course_id_fkey foreign key (course_id) references courses(id) on delete cascade
);

-- Índice para categorías por curso
create index idx_forum_categories_course on forum_categories(course_id) where course_id is not null;

-- Índice único: slug único por contexto (global o por curso)
create unique index forum_categories_slug_unique 
on forum_categories (slug, coalesce(course_id, '00000000-0000-0000-0000-000000000000'::uuid));
```

**Comportamiento de course_id:**
- `course_id = NULL` → Categoría del foro global de fundadores
- `course_id = UUID` → Categoría del foro específico de ese curso

**Roles disponibles:**
- `public` - Todos los usuarios autenticados
- `founder` - Usuarios fundadores (organizations.settings.is_founder = true)
- `admin` - Administradores del sistema

---

### 2. forum_threads

Almacena los hilos/temas de discusión.

```sql
create table public.forum_threads (
  id uuid not null default gen_random_uuid (),
  category_id uuid not null,                    -- FK a forum_categories
  organization_id uuid not null,                -- FK a organizations
  author_id uuid not null,                      -- FK a users
  title text not null,                          -- Título del hilo
  slug text not null,                           -- Slug único (título-slugificado + nanoid)
  content jsonb not null,                       -- Contenido: { text: "..." }
  view_count integer null default 0,            -- Contador de vistas
  reply_count integer null default 0,           -- Contador de respuestas (auto-actualizado)
  last_activity_at timestamp with time zone null default now(),  -- Última actividad
  is_pinned boolean null default false,         -- Si está fijado
  is_locked boolean null default false,         -- Si está bloqueado
  is_deleted boolean null default false,        -- Soft delete
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint forum_threads_pkey primary key (id),
  constraint forum_threads_slug_key unique (slug),
  constraint forum_threads_author_id_fkey foreign key (author_id) references users (id) on delete set null,
  constraint forum_threads_category_id_fkey foreign key (category_id) references forum_categories (id) on delete restrict,
  constraint forum_threads_organization_id_fkey foreign key (organization_id) references organizations (id) on delete cascade
);

-- Índices
create index idx_forum_threads_category on forum_threads (category_id) where (is_deleted = false);
create index idx_forum_last_activity on forum_threads (last_activity_at desc);
```

---

### 3. forum_posts

Almacena las respuestas/posts de los hilos.

```sql
create table public.forum_posts (
  id uuid not null default gen_random_uuid (),
  thread_id uuid not null,                      -- FK a forum_threads
  organization_id uuid not null,                -- FK a organizations
  author_id uuid not null,                      -- FK a users
  parent_id uuid null,                          -- FK a forum_posts (para respuestas anidadas)
  content jsonb not null,                       -- Contenido: { text: "..." }
  is_accepted_answer boolean null default false, -- Si es respuesta aceptada
  is_deleted boolean null default false,        -- Soft delete
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint forum_posts_pkey primary key (id),
  constraint forum_posts_author_id_fkey foreign key (author_id) references users (id) on delete set null,
  constraint forum_posts_organization_id_fkey foreign key (organization_id) references organizations (id) on delete cascade,
  constraint forum_posts_parent_id_fkey foreign key (parent_id) references forum_posts (id) on delete set null,
  constraint forum_posts_thread_id_fkey foreign key (thread_id) references forum_threads (id) on delete cascade
);

-- Índices
create index idx_forum_posts_thread on forum_posts (thread_id) where (is_deleted = false);
```

---

### 4. forum_reactions

Almacena las reacciones (likes) a threads y posts.

```sql
create table public.forum_reactions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,                        -- FK a users
  item_type text not null,                      -- 'thread' o 'post'
  item_id uuid not null,                        -- ID del thread o post
  reaction_type text not null default 'like'::text,  -- Tipo de reacción
  created_at timestamp with time zone null default now(),
  constraint forum_reactions_pkey primary key (id),
  constraint forum_reactions_user_id_item_type_item_id_key unique (user_id, item_type, item_id),
  constraint forum_reactions_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
  constraint forum_reactions_item_type_check check (item_type = any (array['thread', 'post']))
);
```

---

### 5. Trigger: update_forum_thread_activity

Actualiza automáticamente `reply_count` y `last_activity_at` en forum_threads cuando se crean/eliminan posts.

```sql
CREATE OR REPLACE FUNCTION update_forum_thread_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.forum_threads
    SET last_activity_at = NOW(),
        reply_count = reply_count + 1
    WHERE id = NEW.thread_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.forum_threads
    SET reply_count = reply_count - 1
    WHERE id = OLD.thread_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_thread_activity
AFTER INSERT OR DELETE ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION update_forum_thread_activity();
```

---

### 6. Adjuntos (usa tabla media_links existente)

Los adjuntos de imágenes se almacenan usando el sistema de media existente:

```sql
-- La tabla media_links tiene columna forum_thread_id para vincular adjuntos a threads
SELECT * FROM media_links WHERE forum_thread_id = '<thread_id>';
```

---

## API Backend

**Archivo:** `server/routes/forum.ts`

### Endpoints de Categorías (Foro Global)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/forum/categories` | Lista categorías GLOBALES (course_id IS NULL) |
| POST | `/api/forum/categories` | Crea nueva categoría global (admin only) |
| PATCH | `/api/forum/categories/:id` | Actualiza categoría (admin only) |
| DELETE | `/api/forum/categories/:id` | Elimina categoría (admin only) |

### Endpoints de Foro por Curso

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/forum/courses/:courseId/categories` | Lista categorías del foro de un curso |
| POST | `/api/forum/courses/:courseId/categories` | Crea categoría para un curso (admin only) |
| GET | `/api/forum/courses/:courseId/threads` | Lista threads del foro de un curso |

### Endpoints de Threads

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/forum/threads` | Lista threads con paginación, filtro por categoría |
| GET | `/api/forum/threads/:slug` | Obtiene thread con posts y adjuntos |
| POST | `/api/forum/threads` | Crea nuevo thread |
| PATCH | `/api/forum/threads/:id` | Actualiza thread (solo autor) |
| DELETE | `/api/forum/threads/:id` | Soft delete thread (autor o admin) |
| POST | `/api/forum/threads/:id/view` | Incrementa contador de vistas |

### Endpoints de Posts

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/forum/posts` | Crea nuevo post/respuesta |
| PATCH | `/api/forum/posts/:id` | Actualiza post (solo autor) |
| DELETE | `/api/forum/posts/:id` | Soft delete post (solo autor) |

### Endpoints de Reacciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/forum/threads/:id/reactions` | Obtiene reacciones del thread y posts |
| POST | `/api/forum/reactions` | Toggle reacción (like/unlike) |

---

## Frontend

### Estructura de Archivos

```
src/features/forum/
├── components/
│   ├── CategoryList.tsx      # Lista de categorías en sidebar
│   ├── ForumLayout.tsx       # Layout con sidebar y contenido principal
│   ├── PostCard.tsx          # Tarjeta de respuesta/post
│   ├── ThreadCard.tsx        # Tarjeta de thread en lista
│   ├── ThreadDetail.tsx      # Vista detallada de thread con respuestas
│   ├── ThreadList.tsx        # Lista de threads
│   └── index.ts
├── forms/
│   ├── ForumCategoryForm.tsx # Formulario para crear/editar categorías
│   ├── ForumPostForm.tsx     # Formulario para crear/editar posts
│   ├── ForumThreadForm.tsx   # Formulario para crear/editar threads
│   └── index.ts
├── pages/
│   └── ForumPage.tsx         # Página principal del foro
├── services/
│   └── index.ts              # Hooks de React Query y tipos
├── types/
└── index.ts
```

### Servicios (React Query Hooks)

**Archivo:** `src/features/forum/services/index.ts`

#### Query Keys
```typescript
export const FORUM_QUERY_KEYS = {
  categories: ['/api/forum/categories'],
  threads: ['/api/forum/threads'],
  thread: (threadSlug: string) => ['/api/forum/threads', threadSlug],
  threadReactions: (threadId: string) => ['/api/forum/threads', threadId, 'reactions'],
};
```

#### Hooks Disponibles

| Hook | Descripción |
|------|-------------|
| `useForumCategories()` | Lista categorías |
| `useForumThreads(categorySlug, page, limit)` | Lista threads con paginación |
| `useForumThread(threadSlug)` | Obtiene thread con posts |
| `useThreadReactions(threadId)` | Obtiene reacciones |
| `useCreateThread()` | Mutation para crear thread |
| `useUpdateThread()` | Mutation para actualizar thread |
| `useDeleteThread()` | Mutation para eliminar thread |
| `useCreatePost()` | Mutation para crear post |
| `useUpdatePost()` | Mutation para actualizar post |
| `useDeletePost()` | Mutation para eliminar post |
| `useToggleReaction()` | Mutation para toggle like |
| `useIncrementViewCount()` | Mutation para incrementar vistas |
| `useCreateCategory()` | Mutation para crear categoría |
| `useUpdateCategory()` | Mutation para actualizar categoría |
| `useDeleteCategory()` | Mutation para eliminar categoría |

### Tipos Principales

```typescript
interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  allowed_roles: string[];
  is_read_only: boolean;
  is_active: boolean;
  created_at: string;
}

interface ForumThreadWithAuthor {
  id: string;
  category_id: string;
  organization_id: string;
  author_id: string;
  title: string;
  slug: string;
  content: { text: string } | null;
  is_pinned: boolean;
  is_locked: boolean;
  is_deleted: boolean;
  view_count: number;
  reply_count: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  author: ForumAuthor | null;
  category?: { id: string; name: string; slug: string; allowed_roles?: string[]; is_read_only?: boolean; } | null;
}

interface ForumPostWithAuthor {
  id: string;
  thread_id: string;
  organization_id: string;
  author_id: string;
  parent_id: string | null;
  content: { text: string };
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author: ForumAuthor | null;
}
```

---

## Uso del Componente ForumPage (Foro Global)

El componente `ForumPage` acepta una prop `allowedRoles` para filtrar qué categorías mostrar:

```tsx
// Para el portal de fundadores (solo muestra categorías con rol 'founder')
<ForumPage allowedRoles={['founder']} />

// Para un foro público (muestra todas las categorías públicas)
<ForumPage allowedRoles={['public']} />

// Sin filtro (muestra según permisos del usuario autenticado)
<ForumPage />
```

---

## Foro por Curso

Cada curso puede tener su propio foro independiente con categorías exclusivas.

### Componentes del Frontend

**Tab de Estudiante:** `src/pages/learning/courses/view/CourseForumTab.tsx`
```tsx
<CourseForumTab courseId={course.id} />
```
- Muestra el foro del curso a estudiantes inscritos
- Ubicada en la vista del curso, antes de la tab "Feedback"

**Tab de Admin:** `src/pages/admin/courses/view/AdminCourseForumTab.tsx`
```tsx
<AdminCourseForumTab courseId={course.id} />
```
- Permite a admins crear/editar/eliminar categorías del foro del curso
- Ubicada en la vista de administración del curso

### Diferencias con Foro Global

| Aspecto | Foro Global | Foro por Curso |
|---------|-------------|----------------|
| Acceso | Basado en roles (founder, admin) | Basado en inscripción al curso |
| Categorías | Configuradas por admin en portal | Configuradas por admin en curso |
| Columna course_id | NULL | UUID del curso |
| Componente | ForumPage | CourseForumTab |

---

## Flujo de Control de Acceso

1. **Usuario se autentica**
2. **Backend determina roles del usuario:**
   - `public` - Siempre
   - `admin` - Si está en tabla admin_users
   - `founder` - Si su organización tiene settings.is_founder = true
3. **Backend filtra categorías** según allowed_roles de cada categoría
4. **Frontend muestra solo categorías accesibles**
5. **Cada operación (crear thread/post) valida acceso**

---

## Modales del Sistema

El foro utiliza el sistema de modales global:

- `forum-thread` - Modal para crear/editar threads
- `forum-post` - Modal para crear/editar posts
- `forum-category` - Modal para crear/editar categorías (admin)
- `delete-confirmation` - Modal de confirmación de eliminación

---

## Características Adicionales

1. **Threads fijados (pinned):** Siempre aparecen primero
2. **Threads bloqueados (locked):** No permiten nuevas respuestas
3. **Soft delete:** Threads y posts se marcan como eliminados, no se borran
4. **Contador de vistas:** Se incrementa al abrir un thread
5. **Adjuntos de imágenes:** Soporte para múltiples imágenes con lightbox
6. **Optimistic updates:** Las reacciones se actualizan inmediatamente en UI
