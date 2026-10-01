import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const ADMIN_USERNAME = 'admin'
const ADMIN_EMAIL = 'sammyfemi18@gmail.com'
const ADMIN_PASSWORD = 'Password@123'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  if (String(body.username).trim().toLowerCase() !== ADMIN_USERNAME || body.password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 })
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: users, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) return NextResponse.json({ error: 'Authentication service unavailable.' }, { status: 503 })

  const existing = users.users.find(user => user.email?.toLowerCase() === ADMIN_EMAIL)
  const result = existing
    ? await admin.auth.admin.updateUserById(existing.id, { password: ADMIN_PASSWORD, email_confirm: true })
    : await admin.auth.admin.createUser({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, email_confirm: true, user_metadata: { username: ADMIN_USERNAME, role: 'admin' } })

  if (result.error) return NextResponse.json({ error: 'Could not prepare the admin account.' }, { status: 503 })
  return NextResponse.json({ email: ADMIN_EMAIL })
}
