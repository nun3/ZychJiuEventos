begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-assets', 'event-assets', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists event_assets_public_read on storage.objects;
create policy event_assets_public_read on storage.objects for select
using (bucket_id = 'event-assets');

drop policy if exists event_assets_organizer_insert on storage.objects;
create policy event_assets_organizer_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'event-assets' and
  public.has_organization_role(((storage.foldername(name))[1])::uuid, array['owner','organizer']::public.organization_role[])
);

drop policy if exists event_assets_organizer_update on storage.objects;
create policy event_assets_organizer_update on storage.objects for update to authenticated
using (
  bucket_id = 'event-assets' and
  public.has_organization_role(((storage.foldername(name))[1])::uuid, array['owner','organizer']::public.organization_role[])
)
with check (
  bucket_id = 'event-assets' and
  public.has_organization_role(((storage.foldername(name))[1])::uuid, array['owner','organizer']::public.organization_role[])
);

drop policy if exists event_assets_organizer_delete on storage.objects;
create policy event_assets_organizer_delete on storage.objects for delete to authenticated
using (
  bucket_id = 'event-assets' and
  public.has_organization_role(((storage.foldername(name))[1])::uuid, array['owner','organizer']::public.organization_role[])
);

commit;
