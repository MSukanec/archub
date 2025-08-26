-- 1) Elimino la vista si ya existe
drop view if exists public.products_view;

-- 2) Creo la vista con todas las columnas pedidas
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
  m.name as material,
  b.name as brand,
  up.name as unit,
  p.is_system
from public.products p
left join public.materials m
  on m.id = p.material_id
left join public.brands b
  on b.id = p.brand_id
left join public.unit_presentations up
  on up.id = p.unit_id;
