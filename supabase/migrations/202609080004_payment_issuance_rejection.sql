-- A definitive gateway refusal (validated 4xx) did not create a charge.
-- Release only the caller's current claim so a future explicit action can retry.
begin;

create or replace function public.release_payment_issuance_claim(
  target_payment_id uuid,
  claim_token uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.payment_issuance_jobs
  where payment_id = target_payment_id
    and token = claim_token
    and state = 'claimed';
end;
$$;

revoke all on function public.release_payment_issuance_claim(uuid, uuid) from public, anon, authenticated;
grant execute on function public.release_payment_issuance_claim(uuid, uuid) to service_role;

commit;
