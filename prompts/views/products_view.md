drop view if exists public.products_view;

create view public.products_view as
select
  p.id,
  p.name,
  p.description,
  p.url,
  p.image_url,
  p.created_at,
  p.material_id,
  p.unit_id,
  p.brand_id,
  p.default_provider,
  p.default_price,
  m.name as material,
  b.name as brand,
  up.name as unit,
  p.is_system,
  ch.category_hierarchy
from public.products p
left join public.materials m
  on m.id = p.material_id
left join public.brands b
  on b.id = p.brand_id
left join public.unit_presentations up
  on up.id = p.unit_id
left join lateral (
  with recursive cat_path as (
    -- arranco desde la categoría del material
    select 
      mc.id,
      mc.name,
      mc.parent_id,
      mc.name::text as path
    from public.material_categories mc
    where mc.id = m.category_id

    union all

    -- subo hacia el padre
    select 
      parent.id,
      parent.name,
      parent.parent_id,
      (parent.name || ' > ' || cp.path)::text
    from public.material_categories parent
    join cat_path cp on cp.parent_id = parent.id
  )
  -- al final me quedo con el camino más largo (raíz → hoja)
  select path as category_hierarchy
  from cat_path
  order by length(path) desc
  limit 1
) ch on true;
