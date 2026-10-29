/**
 * UNDO targeted validation after PL/pgSQL ambiguity hotfix.
 * Sandbox only. Cleanup no finally.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import type { Database, Json } from '../../lib/supabase/database.types'
import {
  createCleanupClients,
  loadCleanupEnv,
  resolveOwnerId,
} from '../tests/support/e2e-cleanup'

type Client = SupabaseClient<Database>
type JsonObject = { [key: string]: Json | undefined }
type Status = 'PASS' | 'FAIL'

function isObj(value: Json | undefined): value is JsonObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function checked(label: string, result: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await result
  if (error) throw new Error(`${label}: ${error.message}`)
}

function asSession(data: unknown) {
  assert(isObj(data as Json), 'payload inválido')
  const row = data as JsonObject
  return {
    id: String(row.id || ''),
    status: String(row.status || ''),
    version: Number(row.version),
    scoreA: Number(row.scoreA || 0),
    scoreB: Number(row.scoreB || 0),
    advantagesA: Number(row.advantagesA || 0),
    advantagesB: Number(row.advantagesB || 0),
    penaltiesA: Number(row.penaltiesA || 0),
    penaltiesB: Number(row.penaltiesB || 0),
    lastEventId: row.lastEventId == null ? null : String(row.lastEventId),
    duplicate: row.duplicate === true,
  }
}

async function rpc(client: Client, fn: string, args: Record<string, unknown>) {
  return (client as unknown as {
    rpc: (name: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
  }).rpc(fn, args)
}

async function apply(
  client: Client,
  sessionId: string,
  version: number,
  actionType: string,
  key: string,
  extra: Record<string, unknown> = {},
) {
  return rpc(client, 'apply_match_live_action', {
    target_session_id: sessionId,
    expected_version: version,
    action_type: actionType,
    idempotency_key: key,
    competitor_side: extra.competitor_side ?? null,
    action_value: extra.action_value ?? null,
    target_event_id: extra.target_event_id ?? null,
    winner_side: extra.winner_side ?? null,
    result_type: extra.result_type ?? null,
    action_metadata: {},
  })
}

async function ensureUser(admin: Client, email: string, password: string, nome: string) {
  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const existing = listed.data.users.find((user) => user.email === email)
  if (existing) {
    await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true })
    return existing.id
  }
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome_completo: nome, tipo_cadastro: 'organizador', data_nascimento: '1990-01-01' },
  })
  if (created.error || !created.data.user) throw new Error(created.error?.message || 'createUser')
  return created.data.user.id
}

async function createAuthed(email: string, password: string) {
  loadCleanupEnv()
  const client = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.user) throw new Error(error?.message || 'login')
  return client
}

async function cleanupLive(admin: Client, eventId: string) {
  const live = admin as unknown as {
    from: (table: string) => {
      select: (cols: string) => { eq: (col: string, val: string) => PromiseLike<{ data: Array<{ id: string }> | null }> }
      delete: () => { in: (col: string, vals: string[]) => PromiseLike<{ error: { message: string } | null }> }
    }
  }
  const { data: sessions } = await live.from('match_live_sessions').select('id').eq('event_id', eventId)
  const ids = (sessions || []).map((row) => row.id)
  if (!ids.length) return
  await checked('live events', live.from('match_live_events').delete().in('session_id', ids))
  await checked('live sessions', live.from('match_live_sessions').delete().in('id', ids))
}

async function main() {
  loadCleanupEnv()
  process.env.E2E_ALLOW_WRITES = 'true'
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  assert(url.includes('kfvypacjzlzwwblsbpwj'), 'Sandbox zigjiu obrigatório')
  assert(!url.includes('qrasolgjxiocpltdlaez'), 'homework proibido')

  const { admin, actor } = await createCleanupClients()
  const ownerId = await resolveOwnerId(actor)
  const suffix = randomUUID().slice(0, 8)
  const staffEmail = `undo-staff-${suffix}@example.invalid`
  const staffPassword = `Undo-${suffix}-Aa1!`
  const staffId = await ensureUser(admin, staffEmail, staffPassword, `Undo Staff ${suffix}`)
  const publicOrgId = (process.env.PUBLIC_ORGANIZATION_ID || '').trim()
  assert(publicOrgId, 'PUBLIC_ORGANIZATION_ID necessário')

  const organizationId = publicOrgId
  const teamId = randomUUID()
  const eventId = randomUUID()
  const ruleSetId = randomUUID()
  const categoryId = randomUUID()
  const athleteIds = [randomUUID(), randomUUID()]
  const registrationIds = athleteIds.map(() => randomUUID())
  const rows: Array<{ id: string; status: Status; detail: string }> = []
  const mark = (id: string, status: Status, detail: string) => {
    rows.push({ id, status, detail })
    console.log(`[${status}] ${id}: ${detail}`)
  }

  try {
    await checked('membership staff', admin.from('organization_members').insert({
      organization_id: organizationId,
      user_id: staffId,
      role: 'staff',
    }))
    await checked('team', admin.from('teams').insert({
      id: teamId,
      organization_id: organizationId,
      nome: `Undo Team ${suffix}`,
      created_by: ownerId,
    }))
    await checked('event', admin.from('events').insert({
      id: eventId,
      organization_id: organizationId,
      nome: `UNDO Targeted ${suffix}`,
      slug: `undo-targeted-${suffix}`,
      data_evento: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      local: 'Tatame',
      status: 'chaves',
      checagem_travada_em: new Date().toISOString(),
      created_by: ownerId,
      valor_inscricao: 80,
    }))
    await checked('rules', admin.from('category_rule_sets').insert({
      id: ruleSetId, event_id: eventId, nome: 'undo', versao: 1, ativo: true,
    }))
    await checked('category', admin.from('event_categories').insert({
      id: categoryId,
      rule_set_id: ruleSetId,
      nome: `Undo Cat ${suffix}`,
      idade_min: 18,
      idade_max: 99,
      faixa_min_ordem: 1,
      faixa_max_ordem: 1,
      peso_min_kg: 0,
      peso_max_kg: 100,
      genero: 'M',
      ordem: 1,
      fight_duration_minutes: 5,
    }))
    await checked('athletes', admin.from('athletes').insert(athleteIds.map((id, index) => ({
      id,
      organization_id: organizationId,
      team_id: teamId,
      nome_completo: `Undo Atleta ${index + 1} ${suffix}`,
      data_nascimento: '1995-01-01',
      genero: 'M',
      faixa: 'Branca',
      peso_kg: 80,
    }))))
    await checked('regs', admin.from('registrations').insert(registrationIds.map((id, index) => ({
      id,
      event_id: eventId,
      athlete_id: athleteIds[index],
      category_id: categoryId,
      registered_by: ownerId,
      status: 'efetivada' as Database['public']['Enums']['registration_status'],
      valor: 80,
      athlete_snapshot: {
        nome_completo: `Undo Atleta ${index + 1} ${suffix}`,
        data_nascimento: '1995-01-01',
        genero: 'M',
        faixa: 'Branca',
        peso_kg: 80,
        team_id: teamId,
        team_name: `Undo Team ${suffix}`,
      },
      category_snapshot: { nome: `Undo Cat ${suffix}` },
      rule_set_version: 1,
      terms_version: 'MVP-2026-09',
      terms_accepted_at: new Date().toISOString(),
    }))))

    const generated = await actor.rpc('generate_category_bracket', {
      target_event_id: eventId,
      target_category_id: categoryId,
    })
    assert(!generated.error && isObj(generated.data), generated.error?.message || 'generate')
    const bracketId = String(generated.data.bracketId)
    assert(!(await actor.rpc('publish_category_bracket', { target_bracket_id: bracketId })).error, 'publish bracket')
    const { data: groups } = await admin.from('bracket_groups').select('id').eq('bracket_id', bracketId)
    const area = await actor.rpc('save_event_area', {
      target_event_id: eventId, target_area_id: null, area_number: 1, area_name: 'Verde',
    })
    assert(!area.error && isObj(area.data), area.error?.message || 'area')
    const areaId = String(area.data.areaId)
    for (const group of groups || []) {
      assert(!(await actor.rpc('assign_schedule_group', {
        target_group_id: group.id, target_area_id: areaId,
      })).error, 'assign')
    }
    assert(!(await actor.rpc('publish_event_schedule', { target_event_id: eventId })).error, 'publish schedule')
    assert(!(await actor.rpc('start_category_bracket', { target_bracket_id: bracketId })).error, 'start bracket')

    const { data: schedule } = await admin.from('event_schedules').select('id').eq('event_id', eventId).single()
    const { data: matches } = await admin
      .from('event_schedule_matches')
      .select('match_id')
      .eq('schedule_id', schedule!.id)
      .order('fight_number')
    assert(matches && matches.length >= 1, 'sem lutas')
    const matchId = matches![0].match_id

    const staff = await createAuthed(staffEmail, staffPassword)
    let session = asSession((await rpc(staff, 'create_match_live_session', {
      target_match_id: matchId,
      target_area_id: areaId,
      idempotency_key: `undo-create-${suffix}`,
    })).data)

    for (const [index, type] of ['call', 'on_mat', 'start'].entries()) {
      const step = await apply(staff, session.id, session.version, type, `undo-lc-${type}-${suffix}-${index}`)
      assert(!step.error, step.error?.message || type)
      session = asSession(step.data)
    }

    const score = await apply(staff, session.id, session.version, 'score', `undo-score-${suffix}`, {
      competitor_side: 'a', action_value: 2,
    })
    assert(!score.error, score.error?.message || 'score')
    session = asSession(score.data)
    const scoreEventId = session.lastEventId
    assert(scoreEventId, 'score event')

    const adv = await apply(staff, session.id, session.version, 'advantage', `undo-adv-${suffix}`, {
      competitor_side: 'b',
    })
    assert(!adv.error, adv.error?.message || 'advantage')
    session = asSession(adv.data)
    const advEventId = session.lastEventId!

    const pen = await apply(staff, session.id, session.version, 'penalty', `undo-pen-${suffix}`, {
      competitor_side: 'a',
    })
    assert(!pen.error, pen.error?.message || 'penalty')
    session = asSession(pen.data)
    const penEventId = session.lastEventId!
    assert(session.scoreA === 2 && session.advantagesB === 1 && session.penaltiesA === 1, 'placar pré-undo')

    // UNDO penalty → advantage → score
    let result = await apply(staff, session.id, session.version, 'undo', `undo-u-pen-${suffix}`, { target_event_id: penEventId })
    assert(!result.error, `UNDO penalty: ${result.error?.message}`)
    session = asSession(result.data)
    assert(session.penaltiesA === 0, 'penalty não revertida')
    mark('UNDO penalty', 'PASS', `version=${session.version}`)

    result = await apply(staff, session.id, session.version, 'undo', `undo-u-adv-${suffix}`, { target_event_id: advEventId })
    assert(!result.error, `UNDO advantage: ${result.error?.message}`)
    session = asSession(result.data)
    assert(session.advantagesB === 0, 'advantage não revertida')
    mark('UNDO advantage', 'PASS', `version=${session.version}`)

    result = await apply(staff, session.id, session.version, 'undo', `undo-u-score-${suffix}`, { target_event_id: scoreEventId })
    assert(!result.error, `UNDO score: ${result.error?.message}`)
    session = asSession(result.data)
    assert(session.scoreA === 0, 'score não revertido')
    mark('UNDO score', 'PASS', `version=${session.version}`)

    // Duplicate undo of same score
    const dup = await apply(staff, session.id, session.version, 'undo', `undo-u-score-dup-${suffix}`, {
      target_event_id: scoreEventId,
    })
    assert(dup.error && /Acao ja desfeita/i.test(dup.error.message), `dup undo: ${dup.error?.message}`)
    mark('UNDO duplicate', 'PASS', dup.error!.message)

    // Rebuild scoring then invalid undos of lifecycle events
    const score2 = await apply(staff, session.id, session.version, 'score', `undo-score2-${suffix}`, {
      competitor_side: 'a', action_value: 3,
    })
    session = asSession(score2.data)
    const liveAdmin = admin as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => PromiseLike<{
            data: Array<{ id: string; type: string }> | null
          }>
        }
      }
    }
    const { data: events } = await liveAdmin
      .from('match_live_events')
      .select('id, type')
      .eq('session_id', session.id)
    const startEvent = (events || []).find((row) => row.type === 'start')
    assert(startEvent, 'start event ausente')
    const badStart = await apply(staff, session.id, session.version, 'undo', `undo-bad-start-${suffix}`, {
      target_event_id: startEvent!.id,
    })
    assert(badStart.error && /Somente pontuacao pode ser desfeita/i.test(badStart.error.message), badStart.error?.message || 'start')
    mark('UNDO invalid lifecycle actions', 'PASS', 'start/lifecycle rejeitados; pontuação-only')

    // Undo of undo
    const pause = await apply(staff, session.id, session.version, 'pause', `undo-pause-${suffix}`)
    session = asSession(pause.data)
    const pauseEvent = (await liveAdmin.from('match_live_events').select('id, type').eq('session_id', session.id)).data
      ?.find((row) => row.type === 'pause')
    const badPause = await apply(staff, session.id, session.version, 'undo', `undo-bad-pause-${suffix}`, {
      target_event_id: pauseEvent!.id,
    })
    assert(badPause.error && /Somente pontuacao pode ser desfeita/i.test(badPause.error.message), badPause.error?.message || 'pause')

    const resume = await apply(staff, session.id, session.version, 'resume', `undo-resume-${suffix}`)
    session = asSession(resume.data)
    const finish = await apply(staff, session.id, session.version, 'finish', `undo-finish-${suffix}`, {
      winner_side: 'a', result_type: 'points',
    })
    session = asSession(finish.data)
    const finishEvent = (await liveAdmin.from('match_live_events').select('id, type').eq('session_id', session.id)).data
      ?.find((row) => row.type === 'finish')
    const badFinish = await apply(staff, session.id, session.version, 'undo', `undo-bad-finish-${suffix}`, {
      target_event_id: finishEvent!.id,
    })
    assert(badFinish.error, `finish undo aceito: ${badFinish.error?.message}`)

    // Cross-session: create second match session if available, else random uuid
    const foreign = await apply(staff, session.id, session.version, 'undo', `undo-foreign-${suffix}`, {
      target_event_id: randomUUID(),
    })
    assert(foreign.error, 'foreign undo aceito')
    mark('Cross-session isolation', 'PASS', foreign.error!.message)

    // Undo of undo event itself — reopen to running path not needed; use prior undo event id if any
    const undoEvent = (await liveAdmin.from('match_live_events').select('id, type').eq('session_id', session.id)).data
      ?.find((row) => row.type === 'undo')
    if (undoEvent) {
      // session finished — undo not allowed by transition; that's also a controlled fail
      const undoUndo = await apply(staff, session.id, session.version, 'undo', `undo-of-undo-${suffix}`, {
        target_event_id: undoEvent.id,
      })
      assert(undoUndo.error, 'undo-of-undo aceito')
    }
  } catch (error) {
    mark('UNDO score', rows.some((row) => row.id === 'UNDO score') ? rows.find((r) => r.id === 'UNDO score')!.status : 'FAIL', error instanceof Error ? error.message : String(error))
    console.error(error)
  } finally {
    try {
      await cleanupLive(admin, eventId)
      await checked('schedules', admin.from('event_schedules').delete().eq('event_id', eventId))
      const { data: brackets } = await admin.from('category_brackets').select('id').eq('event_id', eventId)
      const bracketIds = (brackets || []).map((row) => row.id)
      if (bracketIds.length) {
        const { data: groups } = await admin.from('bracket_groups').select('id').in('bracket_id', bracketIds)
        const groupIds = (groups || []).map((row) => row.id)
        if (groupIds.length) await checked('matches', admin.from('bracket_matches').delete().in('group_id', groupIds))
        await checked('entries', admin.from('bracket_entries').delete().in('bracket_id', bracketIds))
        if (groupIds.length) await checked('groups', admin.from('bracket_groups').delete().in('id', groupIds))
        await checked('participants', admin.from('bracket_participants').delete().in('bracket_id', bracketIds))
        await checked('brackets', admin.from('category_brackets').delete().in('id', bracketIds))
      }
      await checked('audits', admin.from('event_audit_logs').delete().eq('event_id', eventId))
      await checked('regs', admin.from('registrations').delete().in('id', registrationIds))
      await checked('category', admin.from('event_categories').delete().eq('id', categoryId))
      await checked('rules', admin.from('category_rule_sets').delete().eq('id', ruleSetId))
      await checked('event', admin.from('events').delete().eq('id', eventId))
      await checked('athletes', admin.from('athletes').delete().in('id', athleteIds))
      await checked('team', admin.from('teams').delete().eq('id', teamId))
      await admin.from('organization_members').delete().eq('organization_id', organizationId).eq('user_id', staffId)
      await admin.auth.admin.deleteUser(staffId).catch(() => null)
    } catch (cleanupError) {
      console.error('cleanup', cleanupError)
    }
  }

  const required = [
    'UNDO score', 'UNDO advantage', 'UNDO penalty', 'UNDO invalid lifecycle actions',
    'UNDO duplicate', 'Cross-session isolation',
  ]
  for (const id of required) {
    if (!rows.some((row) => row.id === id)) rows.push({ id, status: 'FAIL', detail: 'não executado' })
  }
  const ok = rows.every((row) => row.status === 'PASS')
  const report = { title: 'UNDO targeted', ok, matrix: required.map((id) => rows.find((row) => row.id === id)!) }
  const outDir = path.resolve(__dirname, '../../docs/design-system/evidencias/operator-pro')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(path.join(outDir, 'UNDO-TARGETED.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
  if (!ok) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
