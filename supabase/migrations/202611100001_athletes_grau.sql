-- Grau da faixa do atleta (0 a 4). Usado na faixa circular do menu. NÃO aplicado em produção: exige autorização do proprietário.
alter table public.athletes
  add column if not exists grau smallint not null default 0;

alter table public.athletes
  drop constraint if exists athletes_grau_range;
alter table public.athletes
  add constraint athletes_grau_range check (grau between 0 and 4);

comment on column public.athletes.grau is 'Grau (listras) da faixa, de 0 a 4.';
