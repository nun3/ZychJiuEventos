-- Faixa e grau declarados no perfil, para contas sem atleta vinculado (organizador, responsável). Aplicada em produção via MCP em 2026-11-10.
alter table public.profiles add column if not exists faixa text;
alter table public.profiles add column if not exists grau smallint not null default 0;
alter table public.profiles drop constraint if exists profiles_grau_range;
alter table public.profiles add constraint profiles_grau_range check (grau between 0 and 4);
alter table public.profiles drop constraint if exists profiles_faixa_known;
alter table public.profiles add constraint profiles_faixa_known check (faixa is null or faixa in ('branca','cinza','amarela','laranja','verde','azul','roxa','marrom','preta'));
comment on column public.profiles.faixa is 'Faixa declarada pela conta sem atleta vinculado (organizador, responsável).';
comment on column public.profiles.grau is 'Grau (listras) da faixa declarada, de 0 a 4.';
