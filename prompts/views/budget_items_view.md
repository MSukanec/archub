-- actualizar la vista para incluir el order de la división
drop view if exists public.budget_items_view;

create view public.budget_items_view as
select
  -- claves y scope
  bi.id,
  bi.budget_id,
  bi.organization_id,
  bi.project_id,
  bi.task_id,

  -- trazas
  bi.created_at,
  bi.updated_at,
  bi.created_by,

  -- catálogo de la tarea
  t.custom_name                                   as custom_name,
  td.name                                         as division_name,
  td."order"                                      as division_order,  -- <- nuevo

  -- unidad (tasks.unit_id -> units.name)
  u.name                                          as unit,

  -- datos del renglón
  bi.description,
  bi.quantity,
  bi.unit_price,
  bi.currency_id,
  bi.markup_pct,
  bi.tax_pct,
  bi.cost_scope,
  case bi.cost_scope
    when 'materials_and_labor' then 'Materiales + Mano de obra'
    when 'materials_only'      then 'Sólo materiales'
    when 'labor_only'          then 'Sólo mano de obra'
    else initcap(replace(bi.cost_scope::text, '_', ' '))
  end                                             as cost_scope_label

from public.budget_items       bi
left join public.tasks         t  on t.id  = bi.task_id
left join public.task_divisions td on td.id = t.task_division_id
left join public.units         u  on u.id  = t.unit_id;
