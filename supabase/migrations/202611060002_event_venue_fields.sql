-- Endereço estruturado do local do evento (aditivo / nullable / backwards-compatible).
-- Não exige campos para eventos antigos. `events.local` continua como texto humano.
--
-- Reaplica a migration 202610300001_event_venue_fields.sql (feature/meu-camp-live, commit
-- 3b41f53), que nunca chegou a esta linhagem de integração apesar de o código correspondente
-- (VenueFields, EditEventForm, public-access.ts, database.types.ts) ter sido trazido para esta
-- branch. Ver docs/engineering/CURRENT-HANDOFF.md.

alter table public.events
  add column if not exists local_nome text,
  add column if not exists local_cep text,
  add column if not exists local_logradouro text,
  add column if not exists local_numero text,
  add column if not exists local_complemento text,
  add column if not exists local_bairro text,
  add column if not exists local_cidade text,
  add column if not exists local_uf text,
  add column if not exists local_latitude double precision,
  add column if not exists local_longitude double precision;

comment on column public.events.local_nome is 'Nome do espaço (ex.: Ginásio Municipal).';
comment on column public.events.local_cep is 'CEP do local (somente dígitos ou máscara).';
comment on column public.events.local_latitude is 'Latitude WGS84 do local (opcional).';
comment on column public.events.local_longitude is 'Longitude WGS84 do local (opcional).';
