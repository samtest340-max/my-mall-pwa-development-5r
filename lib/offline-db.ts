import Dexie, { type Table } from 'dexie'

export type SyncOperation = 'insert' | 'update' | 'delete'
export type SyncStatus = 'pending' | 'sent' | 'failed'
export type OutboxChange = { id: string; table: string; op: SyncOperation; payload: Record<string, unknown>; created_at: string; attempts: number; status: SyncStatus; next_attempt_at?: string; error?: string }
export type SyncMeta = { key: string; last_pulled_version?: number; device_id?: string }

const syncedTables = ['businesses', 'branches', 'profiles', 'devices', 'categories', 'products', 'stock_movements', 'customers', 'sales', 'sale_items', 'payments', 'customer_ledger', 'suppliers', 'purchases', 'purchase_items', 'supplier_ledger', 'expenses', 'till_sessions', 'audit_log', 'sync_conflicts'] as const
export type SyncedTable = typeof syncedTables[number]

class OfflineDatabase extends Dexie {
  outbox!: Table<OutboxChange, string>
  meta!: Table<SyncMeta, string>
  [key: string]: Table<Record<string, unknown>, string> | Table<OutboxChange, string> | Table<SyncMeta, string> | unknown
  constructor() {
    super('my-mall-offline')
    this.version(1).stores({
      outbox: 'id, table, status, created_at, next_attempt_at', meta: 'key',
      ...Object.fromEntries(syncedTables.map((table) => [table, 'id, business_id, server_version, updated_at, deleted_at']))
    })
  }
}

export const offlineDb = new OfflineDatabase()
export const tables = syncedTables
export const getDeviceId = async () => {
  const saved = await offlineDb.meta.get('device_id')
  if (saved?.device_id) return saved.device_id
  const device_id = crypto.randomUUID()
  await offlineDb.meta.put({ key: 'device_id', device_id })
  return device_id
}

export async function writeLocal(table: SyncedTable, op: SyncOperation, payload: Record<string, unknown>) {
  const id = String(payload.id)
  await offlineDb.transaction('rw', [offlineDb.table(table), offlineDb.outbox], async () => {
    const local = offlineDb.table(table)
    if (op === 'delete') await local.delete(id)
    else await local.put(payload, id)
    await offlineDb.outbox.put({ id: crypto.randomUUID(), table, op, payload, created_at: new Date().toISOString(), attempts: 0, status: 'pending' })
  })
  window.dispatchEvent(new CustomEvent('my-mall-local-write'))
}

export async function pendingCount() { return offlineDb.outbox.where('status').anyOf('pending', 'failed').count() }
export async function pendingChanges() { return offlineDb.outbox.where('status').anyOf('pending', 'failed').reverse().sortBy('created_at') }
export async function applyPulledRows(rows: Array<{ table: SyncedTable; row: Record<string, unknown> }>) {
  await offlineDb.transaction('rw', tables.map((table) => offlineDb.table(table)), async () => {
    for (const item of rows) {
      const blocked = await offlineDb.outbox.where({ table: item.table, status: 'pending' }).filter((change) => String(change.payload.id) === String(item.row.id)).count()
      if (!blocked) await offlineDb.table(item.table).put(item.row, String(item.row.id))
    }
  })
}

export function localTable<T extends Record<string, unknown>>(table: SyncedTable) { return offlineDb.table(table) as Table<T, string> }
