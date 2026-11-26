-- Napoleon · migración 002: color por tarjeta + ofertas de varias tiendas
-- Ejecútalo UNA vez en Supabase > SQL Editor > New query > Run
-- (si ya lo corriste, volver a correrlo no duplica nada)

-- 1. Cada tarjeta = un modelo + un color
alter table products add column if not exists color text;

-- 2. Ofertas: el mismo producto en distintas tiendas
create table if not exists offers (
  id            bigint generated always as identity primary key,
  product_id    bigint        not null references products (id) on delete cascade,
  created_at    timestamptz   not null default now(),
  url           text,
  store         text          not null,
  price_usd     numeric(10,2) check (price_usd >= 0),        -- vacío = no se pudo leer
  shipping_usd  numeric(10,2) not null default 0 check (shipping_usd >= 0),
  status        text          not null default 'EN STOCK'
                check (status in ('EN STOCK', 'AGOTADO', 'OFERTA')),
  image_url     text,
  checked_at    timestamptz,                                  -- última revisión de precio
  check_error   text                                          -- por qué falló la última lectura
);

create index if not exists offers_product_idx on offers (product_id);
alter table offers enable row level security;

-- 3. Pasar los productos que ya tenías como su primera oferta
insert into offers (product_id, url, store, price_usd, shipping_usd, status, image_url, checked_at)
select p.id, p.url, coalesce(p.store, 'OTRA'), p.price_usd, coalesce(p.shipping_usd, 0),
       coalesce(p.status, 'EN STOCK'), p.image_url, p.created_at
from products p
where p.price_usd is not null
  and not exists (select 1 from offers o where o.product_id = p.id);

-- 4. Esos datos ahora viven en offers: las columnas viejas dejan de ser obligatorias
alter table products alter column store     drop not null;
alter table products alter column price_usd drop not null;

-- 5. Permisos (solo la clave secreta del servidor)
grant select, insert, update, delete on table public.offers to service_role;
grant usage, select on all sequences in schema public to service_role;
