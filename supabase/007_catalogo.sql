-- Janiwa · migración 007: catálogo tipo tienda de ropa
-- Género (mujer / hombre / unisex), tipo de prenda y fecha de publicación ("Lo nuevo")
-- Ejecútalo en Supabase > SQL Editor > New query > Run (se puede repetir sin problema)

alter table products add column if not exists genero        text;          -- vacío = unisex
alter table products add column if not exists subcategoria  text;          -- tipo de prenda (solo ROPA)
alter table products add column if not exists publicado_en  timestamptz;   -- primera vez que se publicó

alter table products drop constraint if exists products_genero_check;
alter table products add constraint products_genero_check check (genero is null or genero in ('mujer', 'hombre', 'unisex'));

-- Los que ya estaban publicados toman como fecha la de creación
update products set publicado_en = created_at where publicado and publicado_en is null;

create index if not exists products_publicado_en_idx on products (publicado_en desc) where publicado;
