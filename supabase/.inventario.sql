\echo '=== MUNICIPIOS ==='
select name, slug, published,
       (select count(*) from public.cases c where c.city_id = ci.id) as casos,
       left(summary, 40) as resumen
from public.cities ci
order by published desc, name;

\echo '=== CASOS ==='
select id, display_name, published, consent_to_publish,
       left(story, 45) as historia
from public.cases order by created_at;

\echo '=== FOTOS por prefijo ==='
select case when storage_path like 'demo/%' then 'demo/ (archivo)' else 'Storage real' end as origen,
       count(*)
from public.photos group by 1;

\echo '=== OFERTAS ==='
select id, offerer_name, status, resource from public.offers order by created_at;

\echo '=== DONACIONES ==='
select id, amount_cop, status, donor_name, publish_name, provider, payment_ref,
       created_at, settled_at, case_id
from public.donations order by created_at;

\echo '=== NECESIDADES / AVANCES / AVISOS / BUZON ==='
select 'necesidades' as tabla, count(*) from public.needs
union all select 'avances', count(*) from public.case_updates
union all select 'presupuesto', count(*) from public.budget_items
union all select 'avisos (newsletter)', count(*) from public.newsletter_signups
union all select 'buzon (feedback)', count(*) from public.feedback
union all select 'ofertas de apoyo', count(*) from public.support_offers;

\echo '=== CANAL GENERAL ==='
select * from public.donation_channel;

\echo '=== MARCADOS DE PRUEBA ==='
select 'casos CASO DE PRUEBA' as que, count(*) from public.cases where story like 'CASO DE PRUEBA%'
union all select 'municipios (prueba)', count(*) from public.cities where name like '%(prueba)%'
union all select 'ofertas (prueba)', count(*) from public.offers where offerer_name like '%(prueba)%'
union all select 'fotos demo/', count(*) from public.photos where storage_path like 'demo/%'
union all select 'uuid 00000000-0000-4000-8000', (
  select count(*) from public.cases where id::text like '00000000-0000-4000-8000-%'
);
