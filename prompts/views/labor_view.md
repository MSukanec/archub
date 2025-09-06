drop view if exists public.labor_view cascade;

create or replace view public.labor_view as
select
    lt.id as labor_id,
    lt.name as labor_name,
    lt.description as labor_description,
    lt.unit_id,
    u.name as unit_name,
    u.description as unit_description,
    lt.is_system,
    lt.organization_id,

    -- Precio vigente
    lpc.unit_price as current_price,
    lpc.currency_id as current_currency_id,
    c.code as current_currency_code,
    c.symbol as current_currency_symbol,
    lpc.valid_from,
    lpc.valid_to,
    lpc.updated_at,

    -- Promedios
    lap.avg_price,
    lap.price_count,
    lap.min_price,
    lap.max_price

from public.labor_types lt
left join public.units u on u.id = lt.unit_id
left join (
    select distinct on (lp.labor_id, lp.organization_id)
        lp.labor_id,
        lp.organization_id,
        lp.currency_id,
        lp.unit_price,
        lp.valid_from,
        lp.valid_to,
        lp.updated_at
    from public.labor_prices lp
    where lp.valid_to is null or lp.valid_to >= current_date
    order by lp.labor_id, lp.organization_id, lp.valid_from desc
) lpc on lpc.labor_id = lt.id
left join public.currencies c on c.id = lpc.currency_id
left join public.labor_avg_prices lap on lap.labor_id = lt.id;
