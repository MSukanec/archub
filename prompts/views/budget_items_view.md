create or replace view public.budget_items_view as
select
  bi.id,
  bi.organization_id,
  bi.project_id,
  bi.task_id,
  bi.quantity,
  bi.created_at,
  bi.updated_at,

  -- nombre visible de la tarea (del catálogo)
  t.custom_name                                  as custom_name,

  -- división de la tarea (si existe)
  td.name                                        as division_name,

  -- unidad: tasks.unit_id → units.(name)
  u.name                                         as unit,

  -- descripción propia del renglón del presupuesto
  bi.description,

  -- scope técnico (enum) + etiqueta legible
  bi.cost_scope,
  case bi.cost_scope
    when 'materials_and_labor' then 'Materiales + Mano de obra'
    when 'materials_only'      then 'Sólo materiales'
    when 'labor_only'          then 'Sólo mano de obra'
    else initcap(replace(bi.cost_scope::text, '_', ' '))
  end                                            as cost_scope_label,

  -- markup del ítem
  bi.markup_pct

from public.budget_items       bi
left join public.tasks         t  on t.id = bi.task_id
left join public.task_divisions td on td.id = t.task_division_id
left join public.units         u  on u.id = t.unit_id;
