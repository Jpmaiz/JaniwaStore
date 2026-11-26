-- Janiwa · migración 008: fotos propias de las prendas y anuncios de portada
-- Ejecútalo en Supabase > SQL Editor > New query > Run (se puede repetir sin problema)

-- 1. Varias fotos por producto (la primera es la portada)
alter table products add column if not exists fotos text[] not null default '{}';

-- 2. Carpeta pública para las fotos (lectura pública; solo el servidor puede subir o borrar)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png'];

-- 3. Anuncios (banner de la portada)
create table if not exists anuncios (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  titulo      text        not null,
  texto       text,
  imagen_url  text        not null,
  boton       text,                     -- texto del botón (ej. "VER LO NUEVO")
  enlace      text,                     -- a dónde lleva (ej. /mujer)
  activo      boolean     not null default true
);

alter table anuncios enable row level security;
grant select, insert, update, delete on table public.anuncios to service_role;
grant usage, select on all sequences in schema public to service_role;
