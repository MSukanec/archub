# Función Supabase: `get_user()`

## Descripción General
`get_user()` es la función RPC principal que devuelve todos los datos del usuario autenticado con sus organizaciones, roles, permisos y preferencias en una única llamada optimizada.

**Ubicación:** Supabase RPC Function (PostgreSQL PL/pgSQL)
**Lenguaje:** PL/pgSQL
**Seguridad:** `SECURITY DEFINER` (ejecuta con permisos de propietario)
**Retorno:** JSON con toda la información del usuario

---

## Flujo de Ejecución

### 1. Validación de Usuario
```sql
current_user_id := auth.uid();
IF current_user_id IS NULL THEN
  RETURN NULL;
END IF;
```
- Obtiene el UUID de autenticación de Supabase Auth
- Si no existe usuario autenticado, retorna `NULL`

### 2. Mapeo a Usuario Interno
```sql
SELECT id INTO current_user_internal_id
FROM public.users
WHERE auth_id = current_user_id;
```
- Supabase Auth ≠ base de datos interna
- Mapea `auth.uid()` → `public.users.id`
- Si no existe en BD interna, retorna `NULL` (usuario debe estar creado)

### 3. CTEs (Common Table Expressions) - 4 Consultas Paralelas

#### CTE 1: `active_org`
```sql
WITH active_org AS (
  SELECT ...
  FROM public.user_preferences up
  JOIN public.organizations o ON o.id = up.last_organization_id
  LEFT JOIN public.plans p ON p.id = o.plan_id
  ...
  JOIN public.organization_members om ON om.organization_id = o.id AND om.user_id = up.user_id AND om.is_active = true
)
```
**Obtiene:**
- Organización activa (la última que el usuario usó)
- Plan del plan (features, precios, etc.)
- Preferencias de la organización
- Rol del usuario EN ESA organización
- Último proyecto activo

#### CTE 2: `active_role_permissions`
```sql
WITH active_role_permissions AS (
  SELECT r.id, r.name,
  json_agg(json_build_object('id', perm.id, 'key', perm.key, ...)) AS permissions
  FROM roles r
  LEFT JOIN role_permissions rp ON rp.role_id = r.id
  LEFT JOIN permissions perm ON perm.id = rp.permission_id
)
```
**Obtiene:**
- Rol del usuario EN la organización activa
- Lista de todos los permisos asociados a ese rol
- Maneja roles sin permisos (FILTER para evitar nulls)

#### CTE 3: `user_memberships`
```sql
WITH user_memberships AS (
  SELECT json_agg(json_build_object(...)) AS memberships
  FROM public.organization_members om
  WHERE om.user_id = current_user_internal_id AND om.is_active = true
)
```
**Obtiene:**
- TODAS las organizaciones a las que el usuario pertenece (activas)
- Info de cada membresía: rol, fecha de unión, estado

#### CTE 4: `user_organizations`
```sql
WITH user_organizations AS (
  SELECT json_agg(json_build_object(...)) AS organizations
  FROM public.organization_members om
  JOIN public.organizations org ON org.id = om.organization_id
  LEFT JOIN public.plans p ON p.id = org.plan_id
  WHERE om.user_id = current_user_internal_id AND om.is_active = true
)
```
**Obtiene:**
- TODAS las organizaciones del usuario CON sus planes
- Info: nombre, plan, features, es_activa, etc.

---

## Estructura del JSON Retornado

```json
{
  "user": {
    "id": "uuid",
    "auth_id": "uuid",
    "email": "usuario@example.com",
    "full_name": "Nombre Completo",
    "avatar_url": "https://...",
    "avatar_source": "google|supabase",
    "created_at": "2025-01-01T00:00:00Z"
  },
  
  "user_data": {
    "id": "uuid",
    "first_name": "Nombre",
    "last_name": "Apellido",
    "country": "AR",
    "birthdate": "1990-01-01",
    "phone_e164": "+541234567890",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  },
  
  "preferences": {
    "id": "uuid",
    "theme": "dark|light",
    "sidebar_docked": true,
    "last_organization_id": "uuid",
    "last_project_id": "uuid",
    "last_user_type": "viewer|admin",
    "onboarding_completed": true,
    "layout": "dashboard|list",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  },
  
  "organization": {
    "id": "uuid",
    "name": "Nombre Organización",
    "is_active": true,
    "is_system": false,
    "created_by": "uuid",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z",
    
    "plan": {
      "id": "uuid",
      "name": "PRO|TEAMS|ENTERPRISE|FREE",
      "slug": "pro",
      "features": {
        "max_projects": 50,
        "max_members": 10,
        "custom_project_color": true,
        "max_kanban_boards": 5
      },
      "monthly_amount": 9999,
      "annual_amount": 99999,
      "billing_type": "monthly|annual"
    },
    
    "preferences": {
      "organization_id": "uuid",
      "default_currency": "uuid",
      "default_wallet": "uuid",
      "pdf_template": "uuid",
      "use_currency_exchange": false,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  },
  
  "role": {
    "id": "uuid",
    "name": "admin|manager|member",
    "permissions": [
      {
        "id": "uuid",
        "key": "create_projects",
        "description": "Crear proyectos",
        "category": "projects"
      }
    ]
  },
  
  "organizations": [
    {
      "id": "uuid",
      "name": "Organización 1",
      "created_at": "2025-01-01T00:00:00Z",
      "is_active": true,
      "is_system": false,
      "plan": { ... }
    }
  ],
  
  "memberships": [
    {
      "organization_id": "uuid",
      "organization_name": "Nombre",
      "is_active": true,
      "joined_at": "2025-01-01T00:00:00Z",
      "last_active_at": "2025-01-05T10:30:00Z",
      "role": {
        "id": "uuid",
        "name": "admin|manager|member"
      }
    }
  ]
}
```

---

## Cambios en la Optimización (30/11/2025)

### ✅ MEJORAS Implementadas

| Problema | Solución |
|----------|----------|
| **Plan duplicado** | Plan ahora SOLO está dentro de `organization` (no en raíz) |
| **Preferencias desordenadas** | Ahora están integradas EN `organization.preferences` |
| **Null handling inconsistente** | Todos los campos usan `CASE WHEN` + `COALESCE` |
| **Arrays inciertos** | `COALESCE` asegura `[]` vacíos, nunca null |
| **CTEs desorganizadas** | 4 CTEs claramente definidas y reutilizables |
| **Performance** | Mejor: menos LEFT JOINs redundantes, más efficient |

---

## Dónde se usa

### Frontend
```tsx
import { useCurrentUser } from '@/hooks/use-current-user';

const { data: user } = useCurrentUser();

// Acceso a datos:
user?.user?.email
user?.organization?.plan?.features?.max_projects
user?.role?.permissions
user?.organizations // Todas las orgs del usuario
user?.memberships
```

### Backend
```ts
// En src/server/routes.ts
router.get('/api/current-user', async (req, res) => {
  const userData = await supabase.rpc('get_user');
  // userData es el JSON completo
});
```

---

## Validaciones Importantes

### ¿Qué pueden causar NULL o datos vacíos?

| Escenario | Resultado |
|-----------|-----------|
| Usuario no autenticado | `NULL` total |
| Usuario en auth pero no en BD | `NULL` total |
| Usuario sin preferences | `preferences: null` |
| Usuario sin organización activa | `organization: null` |
| Usuario sin permisos en rol | `permissions: []` (array vacío) |
| Usuario sin membresías activas | `memberships: []` (array vacío) |
| Organización sin plan | `plan: null` |

---

## Seguridad

### SECURITY DEFINER
```sql
SECURITY DEFINER
SET search_path = public, auth
```
- La función se ejecuta con permisos del propietario (rol de Supabase)
- Permite a usuarios ver solo datos de organizaciones donde son miembros
- Los JOINs con `organization_members` aseguran que el usuario ES miembro

### RLS Policies (Row Level Security)
- Las tablas pueden tener policies pero esta función bypasa RLS
- **Importante:** La función DEBE validar manualmente que el usuario tiene acceso (como hace con `organization_members`)

---

## Performance Notes

- **Indexar:** `organization_members(user_id)`, `user_preferences(user_id)`
- **CTEs:** Se ejecutan en paralelo, muy eficiente
- **Limpieza:** COALESCE y FILTER previenen NULLs innecesarios
- **Caché:** Las llamadas devuelven 304 si no hay cambios

---

## Debugging

### Ver estructura actual en Supabase
```sql
-- Ejecutar como usuario autenticado
SELECT get_user() as result;
```

### Verificar plan features
```sql
SELECT (get_user()->'organization'->'plan'->'features')::jsonb as features;
```

### Verificar permisos del rol
```sql
SELECT get_user()->'role'->'permissions' as permissions;
```

---

## Próximas Mejoras Potenciales

- [ ] Agregar `last_login_at` a usuario
- [ ] Cachear features del plan para queries rápidas
- [ ] Agregar `subscription` details (próxima renovación, etc.)
- [ ] Paginación de `organizations` si crecen mucho
