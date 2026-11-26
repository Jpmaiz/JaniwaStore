-- Janiwa · migración 006: datos de venta y tienda pública
-- Ejecútalo UNA vez en Supabase > SQL Editor > New query > Run (se puede repetir sin problema)

alter table products add column if not exists publicado         boolean     not null default false;
alter table products add column if not exists precio_venta_bs   numeric(10,2) check (precio_venta_bs >= 0);
alter table products add column if not exists precio_minimo_bs  numeric(10,2) check (precio_minimo_bs >= 0);
alter table products add column if not exists tallas            text[]      not null default '{}';
alter table products add column if not exists disponibilidad    text        not null default 'encargo';
alter table products add column if not exists llegada_estimada  date;
alter table products add column if not exists descripcion       text;
alter table products add column if not exists interes           integer     not null default 0;  -- veces que tocaron "Lo quiero"

alter table products drop constraint if exists products_disponibilidad_check;
alter table products add constraint products_disponibilidad_check check (disponibilidad in ('stock', 'encargo'));

create index if not exists products_publicado_idx on products (publicado) where publicado;

-- Suma 1 al contador de interés (solo productos publicados)
create or replace function incrementar_interes(pid bigint) returns void
language sql as $$
  update products set interes = interes + 1 where id = pid and publicado;
$$;

-- Solo el servidor de la app puede llamarla (no la clave pública)
revoke execute on function incrementar_interes(bigint) from public, anon, authenticated;
grant execute on function incrementar_interes(bigint) to service_role;
