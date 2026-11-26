-- Napoleon · esquema inicial (Wishlist)
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
