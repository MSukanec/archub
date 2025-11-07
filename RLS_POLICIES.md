# Políticas RLS Necesarias para Archub

## Tabla: `users`

### 1. Política de SELECT (lectura) - Ya la tienes ✅
```sql
CREATE POLICY "TODOS VEN USUARIOS"
ON public.users
FOR SELECT
TO authenticated
USING (true);
```

**Explicación**: Permite que cualquier usuario autenticado pueda leer información básica de otros usuarios (nombre, avatar, email). Esto es necesario para mostrar avatares, nombres en formularios, etc.

---

### 2. Política de UPDATE (actualización)
```sql
CREATE POLICY "USUARIOS PUEDEN ACTUALIZAR SU PROPIO PERFIL"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

**Explicación**: Los usuarios solo pueden actualizar su propia información.

---

### 3. Política de INSERT (creación)
```sql
CREATE POLICY "USUARIOS PUEDEN CREAR SU PROPIO REGISTRO"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```

**Explicación**: Los usuarios pueden crear su propio registro durante el signup.

---

## Tabla: `organization_members`

### 1. Política de SELECT (lectura)
```sql
CREATE POLICY "MIEMBROS VEN OTROS MIEMBROS DE SU ORGANIZACION"
ON public.organization_members
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);
```

**Explicación**: Los usuarios pueden ver los miembros de las organizaciones a las que pertenecen.

---

### 2. Política de INSERT (agregar miembros)
```sql
CREATE POLICY "ADMINS PUEDEN AGREGAR MIEMBROS"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);
```

**Explicación**: Solo los administradores de una organización pueden agregar nuevos miembros.

---

### 3. Política de DELETE (eliminar miembros)
```sql
CREATE POLICY "ADMINS PUEDEN ELIMINAR MIEMBROS"
ON public.organization_members
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);
```

**Explicación**: Solo los administradores pueden eliminar miembros de su organización.

---

### 4. Política de UPDATE (actualizar miembros)
```sql
CREATE POLICY "ADMINS PUEDEN ACTUALIZAR MIEMBROS"
ON public.organization_members
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);
```

**Explicación**: Solo los administradores pueden actualizar información de miembros.

---

## Cómo aplicar las políticas en Supabase

1. Ve a tu proyecto en Supabase
2. Navega a **Authentication** → **Policies**
3. Selecciona la tabla correspondiente (`users` o `organization_members`)
4. Haz clic en **"New Policy"**
5. Selecciona **"Create a policy from scratch"**
6. Copia y pega el código SQL de cada política
7. Guarda la política

---

## Verificación

Una vez aplicadas todas las políticas, deberías poder:
- ✅ Ver avatares y nombres de miembros en el header
- ✅ Ver lista de miembros en Preferencias
- ✅ Agregar/eliminar miembros (si eres admin)
- ✅ Todas las queries directas desde el frontend funcionarán correctamente

---

## Nota Importante

El endpoint `/api/organization-members` está diseñado para funcionar CON o SIN RLS porque:
1. Usa el cliente autenticado para verificar acceso a la organización
2. Usa service role para obtener datos de users (bypassing RLS de forma segura)

Pero las queries directas desde el frontend SÍ necesitan estas políticas RLS para funcionar.
