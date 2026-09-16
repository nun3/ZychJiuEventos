-- Garante que usuarios preexistentes no Supabase Auth tenham o perfil exigido
-- pelo dominio. Novos usuarios continuam sendo atendidos pelo trigger
-- auth_user_created da migracao inicial.

insert into public.profiles (id, nome_completo)
select
  auth_user.id,
  case
    when length(trim(coalesce(auth_user.raw_user_meta_data ->> 'nome_completo', ''))) >= 3
      then trim(auth_user.raw_user_meta_data ->> 'nome_completo')
    when length(trim(coalesce(split_part(auth_user.email, '@', 1), ''))) >= 3
      then trim(split_part(auth_user.email, '@', 1))
    else 'Usuario ' || left(auth_user.id::text, 8)
  end
from auth.users as auth_user
on conflict (id) do nothing;
