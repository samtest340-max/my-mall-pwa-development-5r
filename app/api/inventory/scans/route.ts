import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File) || !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Please upload an image' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be 10MB or smaller' }, { status: 400 })
  }

  const { data: profile } = await supabase.from('profiles').select('business_id').eq('user_id', user.id).maybeSingle()
  if (!profile?.business_id) return NextResponse.json({ error: 'Business profile not found' }, { status: 400 })

  const pathname = `inventory-scans/${profile.business_id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`
  const blob = await put(pathname, file, { access: 'private', addRandomSuffix: false })
  return NextResponse.json({ pathname: blob.pathname, name: file.name, size: file.size, type: file.type })
}

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get('pathname')
  if (!pathname) return NextResponse.json({ error: 'Missing pathname' }, { status: 400 })
  return NextResponse.json({ error: 'Private scan delivery must be implemented with an authenticated file route' }, { status: 501 })
}
