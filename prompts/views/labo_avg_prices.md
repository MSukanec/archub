-- Eliminamos si ya existe
drop materialized view if exists public.labor_avg_prices;

-- Creamos la vista materializada
create materialized view public.labor_avg_prices as
select
    lp.labor_id,
    avg(lp.unit_price) as avg_price,
    count(lp.id) as price_count,
    min(lp.unit_price) as min_price,
    max(lp.unit_price) as max_price,
    l.name as labor_name,
    l.description as labor_description,
    l.unit_id
from public.labor_prices lp
join public.labor_types l on l.id = lp.labor_id
where lp.valid_to is null or lp.valid_to >= current_date
group by lp.labor_id, l.name, l.description, l.unit_id;

-- Index para acelerar consultas
create unique index labor_avg_prices_labor_id_idx
    on public.labor_avg_prices(labor_id);
