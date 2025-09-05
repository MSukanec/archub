drop view if exists public.material_view;

create view public.materials_view as
select
  m.id,
  m.name,
  mc.name as category_name,
  m.unit_id,
  u.name as unit_of_computation,     -- símbolo (KG, M2, etc.)
  u.description as unit_description, -- nombre completo (Kilogramo, Metro cuadrado, etc.)
  m.default_unit_presentation_id,
  up.name as default_unit_presentation,
  up.equivalence as unit_equivalence,
  m.is_system,
  m.is_completed,
  m.created_at,
  m.updated_at,

  -- precios desde la vista material_avg_prices
  map.min_price,
  map.max_price,
  map.avg_price,
  map.product_count,
  map.provider_product_count,
  map.price_count

from public.materials m
left join public.material_categories mc
  on mc.id = m.category_id
left join public.units u
  on u.id = m.unit_id
left join public.unit_presentations up
  on up.id = m.default_unit_presentation_id
left join public.material_avg_prices map
  on map.material_id = m.id;
