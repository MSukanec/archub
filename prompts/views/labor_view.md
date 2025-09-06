drop view if exists public.labor_view cascade;

create or replace view public.labor_view as
select distinct on (lp.labor_id, lp.organization_id)
    lp.id,
    lp.labor_id,
    lp.organization_id,
    lp.currency_id,
    lp.unit_price,
    lp.valid_from,
    lp.valid_to,
    lp.created_at,
    lp.updated_at
from public.labor_prices lp
where lp.valid_to is null or lp.valid_to >= current_date
order by lp.labor_id, lp.organization_id, lp.valid_from desc;
