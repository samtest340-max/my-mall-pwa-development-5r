import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { applyPulledRows, getDeviceId, offlineDb, pendingChanges, type OutboxChange } from './offline-db'

let client: SupabaseClient | undefined
function getSupabase() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase is not configured')
    client = createClient(url, key)
  }
  return client
}
let running = false
let timer: ReturnType<typeof setTimeout> | undefined
const backoff = [2000, 5000, 15000, 60000, 300000]

async function push(client: SupabaseClient, deviceId: string, changes: OutboxChange[]) {
  if (!changes.length) return []
  const { data, error } = await client.rpc('sync_push', { p_device_id: deviceId, p_changes: changes.map(({ id, table, op, payload, created_at }) => ({ id, table, op, payload, created_at })) })
  if (error) throw error
  return data ?? []
}

async function pull(client: SupabaseClient, since: number) {
  const { data, error } = await client.rpc('sync_pull', { p_since: since, p_batch_size: 500 })
  if (error) throw error
  return data as { rows: Array<{ table: never; row: Record<string, unknown> }>; cursor: number } | null
}

export async function syncNow() {
  if (running || !navigator.onLine) return { status: 'offline' as const, count: await offlineDb.outbox.count() }
  running = true
  try {
    const deviceId = await getDeviceId()
    const changes = (await pendingChanges()).filter((change) => !change.next_attempt_at || new Date(change.next_attempt_at) <= new Date())
    const results = await push(getSupabase(), deviceId, changes)
    await offlineDb.transaction('rw', offlineDb.outbox, async () => {
      for (const change of changes) {
        const result = results.find((item: { id: string }) => item.id === change.id)
        if (result?.result === 'conflict') await offlineDb.outbox.update(change.id, { status: 'sent' })
        else await offlineDb.outbox.update(change.id, { status: 'sent', error: undefined })
      }
    })
    let cursor = (await offlineDb.meta.get('sync_cursor'))?.last_pulled_version ?? 0
    while (true) {
      const batch = await pull(getSupabase(), cursor)
      if (!batch?.rows?.length) { cursor = batch?.cursor ?? cursor; break }
      await applyPulledRows(batch.rows)
      cursor = batch.cursor
      if (batch.rows.length < 500) break
    }
    await offlineDb.meta.put({ key: 'sync_cursor', last_pulled_version: cursor })
    window.dispatchEvent(new CustomEvent('my-mall-sync-complete'))
    return { status: 'caught-up' as const, count: await offlineDb.outbox.where('status').equals('pending').count() }
  } catch (error) {
    const changes = await pendingChanges()
    await offlineDb.transaction('rw', offlineDb.outbox, async () => {
      for (const change of changes.filter((item) => item.status !== 'sent')) {
        const attempts = change.attempts + 1
        await offlineDb.outbox.update(change.id, { attempts, status: attempts >= 10 ? 'failed' : 'pending', next_attempt_at: new Date(Date.now() + backoff[Math.min(attempts - 1, backoff.length - 1)]).toISOString(), error: error instanceof Error ? error.message : 'Sync failed' })
      }
    })
    window.dispatchEvent(new CustomEvent('my-mall-sync-error'))
    return { status: 'error' as const, count: await offlineDb.outbox.count() }
  } finally { running = false }
}

export function scheduleSync() { if (timer) clearTimeout(timer); timer = setTimeout(() => void syncNow(), 2000) }
export function startSync() { void syncNow(); const interval = window.setInterval(() => void syncNow(), 30000); const online = () => void syncNow(); const localWrite = () => scheduleSync(); window.addEventListener('online', online); window.addEventListener('my-mall-local-write', localWrite); return () => { clearInterval(interval); window.removeEventListener('online', online); window.removeEventListener('my-mall-local-write', localWrite) } }
