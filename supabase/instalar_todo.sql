-- Janiwa · INSTALACIÓN COMPLETA (proyecto nuevo)
-- Pega TODO este archivo en Supabase > SQL Editor > New query > Run. Se puede correr más de una vez.

-- ════════════ schema.sql ════════════
-- Janiwa · esquema inicial (Wishlist)
-- Ejecuta este archivo en Supabase > SQL Editor > New query > Run

-- Configuración global (una sola fila)
create table if not exists settings (
  id               int primary key default 1 check (id = 1),
  tax_pct          numeric(5,2)  not null default 7,      -- impuesto del estado donde llega el paquete
  colchon_pct      numeric(5,2)  not null default 10,     -- margen para imprevistos
  paralelo_manual  numeric(8,2),                          -- si lo llenas, reemplaza al dólar automático
  updated_at       timestamptz   not null default now()
);

insert into settings (id) values (1) on conflict (id) do nothing;

-- Productos de la wishlist
create table if not exists products (
  id            bigint generated always as identity primary key,
  created_at    timestamptz   not null default now(),
  name          text          not null,
  url           text,
  image_url     text,
  store         text          not null,
  category      text          not null,
  price_usd     numeric(10,2) not null check (price_usd >= 0),
  shipping_usd  numeric(10,2) not null default 0 check (shipping_usd >= 0),
  status        text          not null default 'EN STOCK'
                check (status in ('EN STOCK', 'AGOTADO', 'OFERTA')),
  destino       text          not null default 'venta'
                check (destino in ('venta', 'personal')),
  notes         text
);

create index if not exists products_category_idx on products (category);

-- Seguridad: RLS activado y SIN políticas.
-- Así nadie puede leer ni escribir con la clave pública (anon);
-- la app solo accede desde el servidor con la service role key.
alter table settings enable row level security;
alter table products enable row level security;

-- Permisos: los proyectos nuevos de Supabase no dan acceso automático a las tablas.
-- Solo la service_role (la clave secreta que usa el servidor) puede leer y escribir.
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.products, public.settings to service_role;
grant usage, select on all sequences in schema public to service_role;

-- ════════════ 002_ofertas.sql ════════════
-- Janiwa · migración 002: color por tarjeta + ofertas de varias tiendas
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

-- ════════════ 003_tiendas.sql ════════════
-- Janiwa · migración 003: tiendas que visitas y lo que te interesa de cada una
-- Ejecútalo UNA vez en Supabase > SQL Editor > New query > Run

create table if not exists stores (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text        not null unique,          -- igual que offers.store (en MAYÚSCULAS)
  url         text,
  intereses   text[]      not null default '{}',    -- "cosas que me interesan" de la tienda
  notes       text,
  favorita    boolean     not null default false
);

alter table stores enable row level security;

-- Precarga con las tiendas que ya aparecen en tus ofertas
insert into stores (name)
select distinct store from offers
on conflict (name) do nothing;

grant select, insert, update, delete on table public.stores to service_role;
grant usage, select on all sequences in schema public to service_role;

-- ════════════ 005_monedas.sql ════════════
-- Janiwa · migración 005: precios en dólares, bolivianos o euros
-- Ejecútalo UNA vez en Supabase > SQL Editor > New query > Run

-- Moneda de cada oferta. El precio y el envío de la oferta están en ESTA moneda
-- (la columna se sigue llamando shipping_usd por compatibilidad).
alter table offers add column if not exists currency text not null default 'USD';
alter table offers drop constraint if exists offers_currency_check;
alter table offers add constraint offers_currency_check check (currency in ('USD', 'BOB', 'EUR'));

-- Cambio euro → dólar manual (vacío = automático)
alter table settings add column if not exists eur_usd_manual numeric(8,4);
