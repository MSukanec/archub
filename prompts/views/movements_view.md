MOVEMENTS_VIEW

-- 1) Borro la vista anterior si existe
drop view if exists public.movement_view;
drop view if exists public.movements_view;

-- 2) Creo la nueva vista
create view public.movements_view as
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

  w.name as wallet_name,  -- ahora correctamente desde wallets

  t.name as type_name,
  cat.name as category_name,
  subcat.name as subcategory_name

from public.movements m
left join public.projects p
  on p.id = m.project_id
left join public.currencies c
  on c.id = m.currency_id
left join public.organization_wallets ow
  on ow.id = m.wallet_id
left join public.wallets w
  on w.id = ow.wallet_id         -- nombre real de la billetera
left join public.movement_concepts t
  on t.id = m.type_id
left join public.movement_concepts cat
  on cat.id = m.category_id
left join public.movement_concepts subcat
  on subcat.id = m.subcategory_id;
