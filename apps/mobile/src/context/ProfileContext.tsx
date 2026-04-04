import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../../supabaseClient';
import type { Session } from '../../supabaseClient';
import * as profileApi from '../api/profile';
import type { DecisionFocus, GuidanceStyle, ProfileRow } from '../types/profile';

type ProfileLoadState = 'idle' | 'loading' | 'ready';

type ProfileContextValue = {
  session: Session | null;
  configured: boolean;
  profile: ProfileRow | null;
  loadState: ProfileLoadState;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<{ error: Error | null }>;
  saveProfileFields: (fields: {
    display_name?: string | null;
    guidance_style?: GuidanceStyle | null;
    decision_focus?: DecisionFocus | null;
    onboarding_completed_at?: string | null;
  }) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const configured = supabase !== null;
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loadState, setLoadState] = useState<ProfileLoadState>(() => (supabase ? 'loading' : 'idle'));
  const [profileError, setProfileError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!supabase) {
      setProfile(null);
      setLoadState('idle');
      return;
    }
    const {
      data: { session: s },
    } = await supabase.auth.getSession();
    if (!s?.user) {
      setProfile(null);
      setLoadState('ready');
      return;
    }
    setLoadState('loading');
    setProfileError(null);
    try {
      const row = await profileApi.fetchProfile(s.user.id);
      setProfile(row);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load profile';
      setProfileError(msg);
      setProfile(null);
    } finally {
      setLoadState('ready');
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    async function applySession(nextSession: Session | null) {
      setSession(nextSession ?? null);
      if (!nextSession?.user) {
        setProfile(null);
        setProfileError(null);
        setLoadState('ready');
        return;
      }
      setLoadState('loading');
      setProfileError(null);
      try {
        const row = await profileApi.fetchProfile(nextSession.user.id);
        if (!cancelled) setProfile(row);
      } catch (e) {
        if (!cancelled) {
          setProfileError(e instanceof Error ? e.message : 'Could not load profile');
          setProfile(null);
        }
      } finally {
        if (!cancelled) setLoadState('ready');
      }
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!cancelled) void applySession(s);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return { error: new Error('Not configured') };
    const { error } = await supabase.auth.signOut();
    return { error: error as Error | null };
  }, []);

  const saveProfileFields = useCallback(
    async (fields: {
      display_name?: string | null;
      guidance_style?: GuidanceStyle | null;
      decision_focus?: DecisionFocus | null;
      onboarding_completed_at?: string | null;
    }) => {
      if (!supabase || !session?.user) throw new Error('Not signed in');
      const row = await profileApi.upsertProfile(session.user.id, fields);
      setProfile(row);
      setProfileError(null);
    },
    [session?.user],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({
      session,
      configured,
      profile,
      loadState,
      profileError,
      refreshProfile,
      signOut,
      saveProfileFields,
    }),
    [session, configured, profile, loadState, profileError, refreshProfile, signOut, saveProfileFields],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
