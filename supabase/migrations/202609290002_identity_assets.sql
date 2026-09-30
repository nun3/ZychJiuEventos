-- Identidade: foto/banner do perfil e logo/foto da equipe.
-- Contrato: identity-assets contém exclusivamente imagens de identidade
-- destinadas à exibição pública. Leitura pública por CDN; escrita via RLS.
-- Não usar este bucket para documento, CPF, comprovante ou mídia privada.
-- Upload vai direto ao Storage; app só persiste URL.
begin;

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists banner_url text;

alter table public.teams
  add column if not exists logo_url text,
  add column if not exists photo_url text;

comment on column public.profiles.avatar_url is
  'URL pública da foto de perfil em identity-assets.';
comment on column public.profiles.banner_url is
  'URL pública do banner opcional em identity-assets.';
comment on column public.teams.logo_url is
  'URL pública do logo da equipe em identity-assets.';
comment on column public.teams.photo_url is
  'URL pública da foto representativa da equipe em identity-assets.';

-- Dono da equipe pode atualizar a linha; o trigger abaixo impede
-- alteração de nome/organização/created_by sem papel administrativo.
drop policy if exists teams_creator_update on public.teams;
create policy teams_creator_update on public.teams
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create or replace function public.enforce_team_creator_column_guard()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $fn$
begin
  if auth.uid() is null then
    return new;
  end if;

  if public.has_organization_role(
    old.organization_id,
    array['owner', 'organizer']::public.organization_role[]
  ) then
    return new;
  end if;

  if old.created_by is distinct from auth.uid() then
    return new;
  end if;

  if new.nome is distinct from old.nome
     or new.organization_id is distinct from old.organization_id
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at
  then
    raise exception 'Sem permissao para alterar dados estruturais da equipe';
  end if;

  return new;
end;
$fn$;

drop trigger if exists teams_creator_column_guard on public.teams;
create trigger teams_creator_column_guard
  before update on public.teams
  for each row
  execute function public.enforce_team_creator_column_guard();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'identity-assets',
  'identity-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists identity_assets_public_read on storage.objects;
create policy identity_assets_public_read on storage.objects for select
using (bucket_id = 'identity-assets');

drop policy if exists identity_assets_avatar_write on storage.objects;
create policy identity_assets_avatar_write on storage.objects for insert to authenticated
with check (
  bucket_id = 'identity-assets'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists identity_assets_avatar_update on storage.objects;
create policy identity_assets_avatar_update on storage.objects for update to authenticated
using (
  bucket_id = 'identity-assets'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'identity-assets'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists identity_assets_avatar_delete on storage.objects;
create policy identity_assets_avatar_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'identity-assets'
  and (storage.foldername(name))[1] = 'avatars'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists identity_assets_banner_write on storage.objects;
create policy identity_assets_banner_write on storage.objects for insert to authenticated
with check (
  bucket_id = 'identity-assets'
  and (storage.foldername(name))[1] = 'banners'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists identity_assets_banner_update on storage.objects;
create policy identity_assets_banner_update on storage.objects for update to authenticated
using (
  bucket_id = 'identity-assets'
  and (storage.foldername(name))[1] = 'banners'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'identity-assets'
  and (storage.foldername(name))[1] = 'banners'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists identity_assets_banner_delete on storage.objects;
create policy identity_assets_banner_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'identity-assets'
  and (storage.foldername(name))[1] = 'banners'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists identity_assets_team_write on storage.objects;
create policy identity_assets_team_write on storage.objects for insert to authenticated
with check (
  bucket_id = 'identity-assets'
  and (storage.foldername(name))[1] = 'teams'
  and exists (
    select 1
      from public.teams team_row
     where team_row.id = ((storage.foldername(name))[2])::uuid
       and (
         team_row.created_by = auth.uid()
         or public.has_organization_role(
           team_row.organization_id,
           array['owner', 'organizer']::public.organization_role[]
         )
       )
  )
);

drop policy if exists identity_assets_team_update on storage.objects;
create policy identity_assets_team_update on storage.objects for update to authenticated
using (
  bucket_id = 'identity-assets'
  and (storage.foldername(name))[1] = 'teams'
  and exists (
    select 1
      from public.teams team_row
     where team_row.id = ((storage.foldername(name))[2])::uuid
       and (
         team_row.created_by = auth.uid()
         or public.has_organization_role(
           team_row.organization_id,
           array['owner', 'organizer']::public.organization_role[]
         )
       )
  )
)
with check (
  bucket_id = 'identity-assets'
  and (storage.foldername(name))[1] = 'teams'
  and exists (
    select 1
      from public.teams team_row
     where team_row.id = ((storage.foldername(name))[2])::uuid
       and (
         team_row.created_by = auth.uid()
         or public.has_organization_role(
           team_row.organization_id,
           array['owner', 'organizer']::public.organization_role[]
         )
       )
  )
);

drop policy if exists identity_assets_team_delete on storage.objects;
create policy identity_assets_team_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'identity-assets'
  and (storage.foldername(name))[1] = 'teams'
  and exists (
    select 1
      from public.teams team_row
     where team_row.id = ((storage.foldername(name))[2])::uuid
       and (
         team_row.created_by = auth.uid()
         or public.has_organization_role(
           team_row.organization_id,
           array['owner', 'organizer']::public.organization_role[]
         )
       )
  )
);

commit;
