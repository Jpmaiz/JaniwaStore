-- Napoleon · migración 005: precios en dólares, bolivianos o euros
-- Ejecútalo UNA vez en Supabase > SQL Editor > New query > Run

-- Moneda de cada oferta. El precio y el envío de la oferta están en ESTA moneda
-- (la columna se sigue llamando shipping_usd por compatibilidad).
alter table offers add column if not exists currency text not null default 'USD';
alter table offers drop constraint if exists offers_currency_check;
alter table offers add constraint offers_currency_check check (currency in ('USD', 'BOB', 'EUR'));

-- Cambio euro → dólar manual (vacío = automático)
alter table settings add column if not exists eur_usd_manual numeric(8,4);
