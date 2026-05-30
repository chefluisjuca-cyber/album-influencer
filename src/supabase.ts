import { createClient } from '@supabase/supabase-js';

// Suas chaves novas copiadas do painel do Supabase
const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL || 'https://hfashjfzzweszqpnusiw.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Os0WJEl-oXd2VMEgPY5KdQ_wOOLyLMv';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type CollectionMap = Record<string, Record<string, number>>;

export interface Profile {
  id: string;
  display_name: string;
  cep: string;
  lat: number | null;
  lng: number | null;
  show_in_nearby: boolean;
  whatsapp: string;
  accepts_trades: boolean;
  contact_info: string;
  is_premium: boolean;
}

export interface NearbyUser {
  id: string;
  display_name: string;
  whatsapp: string;
  accepts_trades: boolean;
  lat: number;
  lng: number;
  distance_km: number;
}

export interface TradeRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message: string;
  created_at: string;
  completed_at: string | null;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: 'trade_request' | 'trade_accepted' | 'trade_declined';
  payload: {
    trade_request_id?: string;
    sender_id?: string;
    sender_name?: string;
    receiver_id?: string;
    receiver_name?: string;
    message?: string;
  };
  read: boolean;
  created_at: string;
}

// ─── Collection ───────────────────────────────────────────────────────────────

export async function loadCollectionFromDB(userId: string): Promise<CollectionMap> {
  const { data } = await supabase
    .from('collections')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  return (data?.data as CollectionMap) ?? {};
}

export async function saveCollectionToDB(userId: string, collection: CollectionMap): Promise<void> {
  await supabase
    .from('collections')
    .upsert({ user_id: userId, data: collection, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function loadProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id,display_name,cep,lat,lng,show_in_nearby,whatsapp,accepts_trades,contact_info,is_premium')
    .eq('id', userId)
    .maybeSingle();
  return data as Profile | null;
}

export async function saveProfile(profile: Profile): Promise<void> {
  await supabase.from('profiles').upsert(profile, { onConflict: 'id' });
}

// ─── Nearby ───────────────────────────────────────────────────────────────────

export async function findNearbyUsers(lat: number, lng: number, radiusKm: number): Promise<NearbyUser[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id,display_name,whatsapp,accepts_trades,lat,lng')
    .eq('show_in_nearby', true)
    .not('lat', 'is', null)
    .not('lng', 'is', null);

  if (!data) return [];

  const R = 6371;
  return (data as NearbyUser[])
    .map((u) => {
      if (typeof u.lat !== 'number' || typeof u.lng !== 'number' || isNaN(u.lat) || isNaN(u.lng)) {
        return { ...u, distance_km: Infinity };
      }
      const dLat = ((u.lat - lat) * Math.PI) / 180;
      const dLng = ((u.lng - lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) * Math.cos((u.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      
      const aClamped = Math.min(1, Math.max(0, a));
      const distance_km = R * 2 * Math.atan2(Math.sqrt(aClamped), Math.sqrt(1 - aClamped));
      return { ...u, distance_km };
    })
    .filter((u) => u.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);
}

// ─── Trade Requests ───────────────────────────────────────────────────────────

export async function sendTradeRequests(
  receiverIds: string[],
  message: string
): Promise<{ success: number; failed: number }> {
  let success = 0, failed = 0;
  for (const receiver_id of receiverIds) {
    const { error } = await supabase.from('trade_requests').insert({ receiver_id, message });
    if (error) failed++; else success++;
  }
  return { success, failed };
}

export async function respondToTradeRequest(
  tradeRequestId: string,
  status: 'accepted' | 'declined'
): Promise<void> {
  await supabase.from('trade_requests').update({ status }).eq('id', tradeRequestId);
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function loadNotifications(userId: string): Promise<AppNotification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return (data ?? []) as AppNotification[];
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await supabase.from('notifications').update({ read: true }).in('id', ids);
}

// ─── Push Subscriptions ───────────────────────────────────────────────────────

export async function savePushSubscription(
  userId: string,
  sub: PushSubscription
): Promise<void> {
  const json    = sub.toJSON();
  const keys    = json.keys as Record<string, string>;
  await supabase.from('push_subscriptions').upsert(
    {
      user_id:  userId,
      endpoint: sub.endpoint,
      p256dh:   keys.p256dh,
      auth_key: keys.auth,
    },
    { onConflict: 'endpoint' }
  );
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
}

// ─── URL Shortener ────────────────────────────────────────────────────────────

export async function shortenUrl(url: string): Promise<string> {
  try {
    const res = await fetch(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`
    );
    if (res.ok) {
      const short = await res.text();
      if (short.startsWith('http')) return short.trim();
    }
  } catch { /* fall through */ }
  return url;
}

// ─── Geocoding ────────────────────────────────────────────────────────────────

// Tries BrasilAPI Cep v2 (which returns coordinates directly) first.
// Falls back to BrasilAPI v1 or ViaCEP, and uses a progressive Nominatim geocoding fallback
// to guarantee that we find at least the city/state coordinates instead of failing completely.
export async function geocodeCep(postalCode: string): Promise<{ lat: number; lng: number } | null> {
  const clean = postalCode.trim();
  if (!clean) return null;

  // --- Brazilian CEP path ---
  const digits = clean.replace(/\D/g, '');
  if (digits.length === 8) {
    // 1. Try BrasilAPI v2 (returns coordinates directly in many cases)
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`);
      if (res.ok) {
        const data = await res.json();
        const lat = data.location?.coordinates?.latitude;
        const lng = data.location?.coordinates?.longitude;
        if (lat !== undefined && lng !== undefined && lat !== null && lng !== null) {
          const numLat = typeof lat === 'string' ? parseFloat(lat) : lat;
          const numLng = typeof lng === 'string' ? parseFloat(lng) : lng;
          if (!isNaN(numLat) && !isNaN(numLng) && numLat !== 0 && numLng !== 0) {
            return round(numLat, numLng);
          }
        }
        // If v2 didn't have coordinates, geocode with fallbacks using the address fields
        if (data.city && data.state) {
          const geo = await geocodeWithFallbacks({
            street: data.street,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state
          });
          if (geo) return geo;
        }
      }
    } catch { /* fall through to BrasilAPI v1 */ }

    // 2. Try BrasilAPI v1
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${digits}`);
      if (res.ok) {
        const data = await res.json();
        if (data.city && data.state) {
          const geo = await geocodeWithFallbacks({
            street: data.street,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state
          });
          if (geo) return geo;
        }
      }
    } catch { /* fall through to ViaCEP */ }

    // 3. Try ViaCEP
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (res.ok) {
        const data = await res.json();
        if (!data.erro && data.localidade && data.uf) {
          const geo = await geocodeWithFallbacks({
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          });
          if (geo) return geo;
        }
      }
    } catch { /* fall through to generic path */ }
  }

  // --- Generic international path via Nominatim postalcode search ---
  try {
    // Try postalcode-specific endpoint first (faster, more accurate)
    const pcRes = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(clean)}&format=json&limit=1&addressdetails=0`,
      { headers: { 'User-Agent': 'AlbumCopa2026/1.0' } }
    );
    const pcData = await pcRes.json();
    if (pcData[0]) {
      return round(parseFloat(pcData[0].lat), parseFloat(pcData[0].lon));
    }

    // Last resort: free-text search
    const geo = await nominatimSearch(clean);
    if (geo) return geo;
  } catch { /* ignore */ }

  return null;
}

interface AddressComponents {
  street?: string;
  neighborhood?: string;
  city: string;
  state: string;
}

async function geocodeWithFallbacks(addr: AddressComponents): Promise<{ lat: number; lng: number } | null> {
  const queries: string[] = [];
  const street = addr.street?.trim();
  const neighborhood = addr.neighborhood?.trim();
  const city = addr.city?.trim();
  const state = addr.state?.trim();

  // 1. Street, Neighborhood, City, State, Brazil
  if (street && neighborhood && city && state) {
    queries.push(`${street}, ${neighborhood}, ${city}, ${state}, Brazil`);
  }
  // 2. Street, City, State, Brazil
  if (street && city && state) {
    queries.push(`${street}, ${city}, ${state}, Brazil`);
  }
  // 3. Neighborhood, City, State, Brazil
  if (neighborhood && city && state) {
    queries.push(`${neighborhood}, ${city}, ${state}, Brazil`);
  }
  // 4. City, State, Brazil
  if (city && state) {
    queries.push(`${city}, ${state}, Brazil`);
  }
  // 5. State, Brazil
  if (state) {
    queries.push(`${state}, Brazil`);
  }

  for (const q of queries) {
    try {
      const geo = await nominatimSearch(q);
      if (geo) return geo;
    } catch {
      // Try next query
    }
  }

  return null;
}

async function nominatimSearch(query: string): Promise<{ lat: number; lng: number } | null> {
  const res  = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { 'User-Agent': 'AlbumCopa2026/1.0' } }
  );
  const data = await res.json();
  if (!data[0]) return null;
  return round(parseFloat(data[0].lat), parseFloat(data[0].lon));
}

function round(lat: number, lng: number) {
  return {
    lat: Math.round(lat * 100) / 100,
    lng: Math.round(lng * 100) / 100,
  };
}
