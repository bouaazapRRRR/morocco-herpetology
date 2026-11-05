import { createClient } from '@supabase/supabase-js';

// Project ID: dtjyaxquidmehjkndmjb
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dtjyaxquidmehjkndmjb.supabase.co';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 20
  );
}

export interface ObservationPayload {
  public_reference_code: string;
  observation_date: string;
  observation_time?: string;
  location_description: string;
  raw_latitude: number;
  raw_longitude: number;
  public_latitude: number;
  public_longitude: number;
  species_id?: string | null;
  species_name: string;
  microhabitat?: string;
  condition?: string;
  individual_count?: number;
  field_notes?: string;
  observer_name: string;
  observer_email: string;
  observer_role?: string;
  image_url?: string;
  image_credit?: string;
  is_sensitive_location?: boolean;
}

/**
 * Submit citizen science observation to Supabase
 */
export async function submitObservationToSupabase(payload: ObservationPayload) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase ANON KEY not configured yet. Running in offline/mock mode.');
    return { data: payload, error: null, mock: true };
  }

  const { data, error } = await supabase
    .from('observation_submissions')
    .insert([
      {
        ...payload,
        review_status: 'pending',
      },
    ])
    .select()
    .single();

  return { data, error, mock: false };
}

/**
 * Fetch public verified observations for interactive distribution map
 */
export async function fetchVerifiedObservations() {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await supabase
    .from('observation_submissions')
    .select('*')
    .eq('review_status', 'verified')
    .eq('is_sensitive_location', false)
    .order('observation_date', { ascending: false });

  if (error) {
    console.error('Error fetching verified observations:', error.message);
    return [];
  }
  return data || [];
}

