import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://pwtqeyiynrtiprjgqzuw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3dHFleWl5bnJ0aXByamdxenV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDMzMzMsImV4cCI6MjA4OTc3OTMzM30.acIEmilzlTCScWoKoyAX5rq1EwBWMzSQAmXQBPbX3Yw'
)

/* ── Génère un code partage lisible (8 chars, sans ambigüités) ── */
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function generateShareCode() {
  return Array.from({ length: 8 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
}

/* ── Convertit une base64 data-URL en Blob ── */
function base64ToBlob(dataUrl) {
  const [meta, data] = dataUrl.split(',')
  const mime = meta.match(/:(.*?);/)[1]
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

/* ── Upload une photo (base64 ou URL) vers Storage ; retourne URL publique ── */
export async function uploadPhoto(dataUrl, userId, entryId, index) {
  if (!dataUrl.startsWith('data:')) return dataUrl // déjà une URL, rien à faire
  const blob = base64ToBlob(dataUrl)
  const ext = blob.type.split('/')[1] || 'jpg'
  const path = `${userId}/${entryId}/${Date.now()}_${index}.${ext}`
  const { error } = await supabase.storage.from('gr34-photos').upload(path, blob, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('gr34-photos').getPublicUrl(path)
  return data.publicUrl
}

/* ── Sauvegarde les états des tronçons ── */
export async function saveStates(userId, routeType, states) {
  const { error } = await supabase.from('gr34_route_states').upsert(
    { user_id: userId, route_type: routeType, states, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,route_type' }
  )
  if (error) console.error('saveStates', error)
}

/* ── Charge les états des tronçons ── */
export async function loadStates(userId, routeType) {
  const { data } = await supabase.from('gr34_route_states')
    .select('states').eq('user_id', userId).eq('route_type', routeType).maybeSingle()
  return data?.states || null
}

/* ── Sauvegarde une entrée roadbook (avec upload photos si base64) ── */
export async function saveEntry(userId, routeType, entry) {
  const photoUrls = await Promise.all(
    (entry.photos || []).map((p, i) => uploadPhoto(p, userId, entry.id, i).catch(() => p))
  )
  const { error } = await supabase.from('gr34_roadbook_entries').upsert(
    {
      user_id: userId, route_type: routeType, local_id: entry.id,
      date: entry.date, depart: entry.depart, arrivee: entry.arrivee,
      km: entry.km, duree: entry.duree, notes: entry.notes,
      photo_urls: photoUrls,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,route_type,local_id' }
  )
  if (error) console.error('saveEntry', error)
  return photoUrls
}

/* ── Supprime une entrée roadbook ── */
export async function deleteEntry(userId, routeType, localId) {
  const { error } = await supabase.from('gr34_roadbook_entries')
    .delete().eq('user_id', userId).eq('route_type', routeType).eq('local_id', localId)
  if (error) console.error('deleteEntry', error)
}

/* ── Charge toutes les entrées roadbook ── */
export async function loadEntries(userId, routeType) {
  const { data } = await supabase.from('gr34_roadbook_entries')
    .select('*').eq('user_id', userId).eq('route_type', routeType).order('date')
  return (data || []).map(r => ({
    id: r.local_id, date: r.date, depart: r.depart, arrivee: r.arrivee,
    km: r.km, duree: r.duree, notes: r.notes, photos: r.photo_urls || [],
  }))
}

/* ── Crée un partage et retourne le code ── */
export async function createShare(userId, shareType, payload) {
  const code = generateShareCode()
  const { error } = await supabase.from('gr34_shares').insert({
    share_code: code, share_type: shareType, user_id: userId, payload,
  })
  if (error) throw error
  return code
}

/* ── Charge un partage par code ── */
export async function loadShare(code) {
  const { data, error } = await supabase.from('gr34_shares')
    .select('*').eq('share_code', code.toUpperCase().trim()).maybeSingle()
  if (error || !data) return null
  return data
}
