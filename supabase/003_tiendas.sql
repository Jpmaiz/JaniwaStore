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
