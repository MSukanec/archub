# Instrucciones para actualizar la vista movements_view

## ⚠️ IMPORTANTE
Esta actualización es **necesaria** para que la IA pueda distinguir entre el nombre del **subcontrato** y el nombre del **subcontratista** (contacto).

## ¿Qué hace este cambio?
Agrega un nuevo campo `subcontract_contact` a la vista `movements_view` que contiene el nombre del subcontratista (contacto), diferenciándolo del nombre del subcontrato (`subcontract`).

## Cómo ejecutar la actualización

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en Supabase
2. En el menú lateral, haz click en **SQL Editor**
3. Crea una nueva query
4. Copia y pega el siguiente código SQL:

```sql
drop view if exists public.movements_view;

create or replace view public.movements_view as
select
  m.id,
  m.description,
  m.amount,
  m.movement_date,
  m.created_at,
  m.exchange_rate,
  m.is_conversion,
  m.is_favorite,
  m.organization_id,
  m.project_id,
  m.currency_id,
  m.wallet_id,
  m.type_id,
  m.category_id,
  m.subcategory_id,
  m.conversion_group_id,
  m.transfer_group_id,
  m.created_by,

  -- JOINs con otras tablas
  p.name as project_name,
  p.color as project_color,

  c.name as currency_name,
  c.symbol as currency_symbol,
  c.code as currency_code,
  c.country as currency_country,

  w.name as wallet_name,

  t.name as type_name,
  cat.name as category_name,
  subcat.name as subcategory_name,

  -- Partner
  coalesce(ct.full_name, concat_ws(' ', ct.first_name, ct.last_name)) as partner,

  -- Subcontract
  s.title as subcontract,
  coalesce(cs.full_name, concat_ws(' ', cs.first_name, cs.last_name)) as subcontract_contact,

  -- Client
  coalesce(cc.full_name, concat_ws(' ', cc.first_name, cc.last_name)) as client,

  -- Member (usuario creador del movimiento)
  u.full_name as member,
  u.avatar_url as member_avatar,

  -- Indirectos
  mi.indirect_id,
  ic.name as indirect,

  -- Personnel
  mpers.id as movement_personnel_id,
  coalesce(cp.full_name, concat_ws(' ', cp.first_name, cp.last_name)) as personnel,

  -- General Costs
  mgc.general_cost_id,
  gc.name as general_cost

from public.movements m
left join public.projects p
  on p.id = m.project_id
left join public.currencies c
  on c.id = m.currency_id
left join public.organization_wallets ow
  on ow.id = m.wallet_id
left join public.wallets w
  on w.id = ow.wallet_id
left join public.movement_concepts t
  on t.id = m.type_id
left join public.movement_concepts cat
  on cat.id = m.category_id
left join public.movement_concepts subcat
  on subcat.id = m.subcategory_id

-- socios
left join public.movement_partners mp
  on mp.movement_id = m.id
left join public.partners pr
  on pr.id = mp.partner_id
left join public.contacts ct
  on ct.id = pr.contact_id

-- subcontratos
left join public.movement_subcontracts ms
  on ms.movement_id = m.id
left join public.subcontracts s
  on s.id = ms.subcontract_id
left join public.contacts cs
  on cs.id = s.contact_id

-- clientes
left join public.movement_clients mc
  on mc.movement_id = m.id
left join public.project_clients pc
  on pc.id = mc.project_client_id
left join public.contacts cc
  on cc.id = pc.client_id

-- creador (paso por organization_members)
left join public.organization_members om
  on om.id = m.created_by
left join public.users u
  on u.id = om.user_id

-- indirectos
left join public.movement_indirects mi
  on mi.movement_id = m.id
left join public.indirect_costs ic
  on ic.id = mi.indirect_id

-- personnel
left join public.movement_personnel mpers
  on mpers.movement_id = m.id
left join public.project_personnel pp
  on pp.id = mpers.personnel_id
left join public.contacts cp
  on cp.id = pp.contact_id

-- general costs
left join public.movement_general_costs mgc
  on mgc.movement_id = m.id
left join public.general_costs gc
  on gc.id = mgc.general_cost_id;
```

5. Haz click en **Run** (o presiona `Ctrl + Enter`)
6. Verifica que se ejecute sin errores

### Opción 2: Desde psql o cualquier cliente de PostgreSQL

Copia el mismo SQL de arriba y ejecútalo en tu cliente SQL preferido.

## ✅ Verificación

Para verificar que la vista se actualizó correctamente, ejecuta:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'movements_view' 
  AND column_name = 'subcontract_contact';
```

Deberías ver una fila con `column_name = subcontract_contact`.

## Resultado

Después de ejecutar esta actualización, la IA podrá responder correctamente a preguntas como:

- ✅ "¿Cuánto le pagué a ALEJANDRO SABATINO este mes?" (busca por nombre del subcontratista)
- ✅ "Muéstrame los gastos del subcontrato de Instalación Eléctrica" (busca por nombre del subcontrato)
- ✅ "Dame los movimientos de ALEJANDRO SABATINO en el proyecto Casa Verde" (busca por ambos)

---

**Nota:** Este cambio **NO afecta datos existentes**, solo agrega una nueva columna a la vista para mejorar las búsquedas.
