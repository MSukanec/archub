-- 1) Por las dudas, elimino la vista si ya existe
drop view if exists public.products_view;

-- 2) Creo la vista con las columnas solicitadas
create view public.products_view as
select
  p.id, 
  m.name as material,
  b.name as brand
from public.products p
left join public.materials m
  on m.id = p.material_id
left join public.brands b
  on b.id = p.brand_id;
