import { supabase } from '../../supabaseClient';
import type { DecisionFocus, GuidanceStyle, ProfileRow } from '../types/profile';
import { toErrorMessage } from '../utils/errors';

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw new Error(toErrorMessage(error));
  return data as ProfileRow | null;
}

export async function upsertProfile(
  userId: string,
  fields: {
    display_name?: string | null;
    guidance_style?: GuidanceStyle | null;
    decision_focus?: DecisionFocus | null;
    onboarding_completed_at?: string | null;
  },
): Promise<ProfileRow> {
  if (!supabase) throw new Error('Supabase not configured');
  const existing = await fetchProfile(userId);
  const row = {
    id: userId,
    display_name: fields.display_name !== undefined ? fields.display_name : (existing?.display_name ?? null),
    guidance_style:
      fields.guidance_style !== undefined ? fields.guidance_style : (existing?.guidance_style ?? null),
    decision_focus:
      fields.decision_focus !== undefined ? fields.decision_focus : (existing?.decision_focus ?? null),
    onboarding_completed_at:
      fields.onboarding_completed_at !== undefined
        ? fields.onboarding_completed_at
        : (existing?.onboarding_completed_at ?? null),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' }).select().single();
  if (error) throw new Error(toErrorMessage(error));
  return data as ProfileRow;
}
