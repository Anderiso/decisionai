import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { StackScreenProps } from '@react-navigation/stack';
import { BrandHeader } from '../components/BrandHeader';
import { ScreenShell } from '../components/ScreenShell';
import { useProfile } from '../context/ProfileContext';
import type { DecisionFocus, GuidanceStyle } from '../types/profile';
import { C } from '../theme';
import type { RootStackParamList } from '../navigation/types';

const GUIDANCE: { id: GuidanceStyle; title: string; emoji: string }[] = [
  { id: 'friend', title: 'Friend-like', emoji: '🤝' },
  { id: 'advisor', title: 'Advisor-like', emoji: '📋' },
  { id: 'either', title: 'Mix it up', emoji: '✨' },
];

const FOCUS: { id: DecisionFocus; title: string; emoji: string }[] = [
  { id: 'everyday', title: 'Everyday', emoji: '🌤️' },
  { id: 'relationships', title: 'People & texts', emoji: '💬' },
  { id: 'career_money', title: 'Work & money', emoji: '💼' },
  { id: 'big_life', title: 'Big life', emoji: '🧭' },
];

type Props = StackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const { profile, saveProfileFields, signOut } = useProfile();
  const [displayName, setDisplayName] = useState('');
  const [guidance, setGuidance] = useState<GuidanceStyle | null>(null);
  const [focus, setFocus] = useState<DecisionFocus | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? '');
    setGuidance(profile.guidance_style);
    setFocus(profile.decision_focus);
  }, [profile]);

  async function save() {
    if (!displayName.trim() || !guidance || !focus) {
      setStatus('Fill in name, guidance, and focus.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await saveProfileFields({
        display_name: displayName.trim(),
        guidance_style: guidance,
        decision_focus: focus,
      });
      setStatus('Saved.');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    setBusy(false);
  }

  return (
    <ScreenShell>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <View style={styles.topRow}>
          <Pressable hitSlop={12} onPress={() => navigation.goBack()} style={({ pressed }) => [pressed && styles.backPressed]}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
        </View>
        <BrandHeader />

        <Text style={styles.heroKicker}>Your profile</Text>
        <Text style={styles.heroTitle}>Preferences</Text>
        <Text style={styles.heroSub}>Used for tone, compare defaults, and safe boundaries later on.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            placeholder="Alex"
            placeholderTextColor="#A8A4B0"
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            autoCorrect={false}
          />

          <Text style={styles.label}>Guidance style</Text>
          <View style={styles.chips}>
            {GUIDANCE.map((g) => (
              <Pressable
                key={g.id}
                style={({ pressed }) => [
                  styles.chip,
                  guidance === g.id && styles.chipActive,
                  pressed && styles.chipPressed,
                ]}
                onPress={() => setGuidance(g.id)}
              >
                <Text style={styles.chipEmoji}>{g.emoji}</Text>
                <Text style={[styles.chipText, guidance === g.id && styles.chipTextActive]}>{g.title}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Main focus</Text>
          <View style={styles.chips}>
            {FOCUS.map((f) => (
              <Pressable
                key={f.id}
                style={({ pressed }) => [styles.chip, focus === f.id && styles.chipActive, pressed && styles.chipPressed]}
                onPress={() => setFocus(f.id)}
              >
                <Text style={styles.chipEmoji}>{f.emoji}</Text>
                <Text style={[styles.chipText, focus === f.id && styles.chipTextActive]}>{f.title}</Text>
              </Pressable>
            ))}
          </View>

          {status ? (
            <Text style={[styles.status, status === 'Saved.' ? styles.statusOk : styles.statusErr]}>{status}</Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
            onPress={save}
            disabled={busy}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save changes</Text>}
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}
          onPress={handleSignOut}
          disabled={busy}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  topRow: { marginBottom: 4 },
  back: { fontSize: 16, fontWeight: '700', color: C.mint },
  backPressed: { opacity: 0.7 },
  heroKicker: {
    fontSize: 13,
    fontWeight: '700',
    color: C.mint,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6, color: C.ink, marginBottom: 8 },
  heroSub: { fontSize: 15, lineHeight: 22, color: C.inkMuted, marginBottom: 16 },
  card: {
    backgroundColor: C.card,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: C.inkMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(20, 18, 28, 0.1)',
    backgroundColor: '#FAFAFA',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    fontSize: 16,
    color: C.ink,
    marginBottom: 16,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(20, 18, 28, 0.1)',
    backgroundColor: '#FAFAFA',
  },
  chipActive: { borderColor: C.mint, backgroundColor: 'rgba(45, 155, 140, 0.1)' },
  chipPressed: { opacity: 0.9 },
  chipEmoji: { fontSize: 16 },
  chipText: { fontSize: 14, fontWeight: '700', color: C.inkMuted },
  chipTextActive: { color: C.ink },
  status: { fontSize: 14, marginBottom: 12, textAlign: 'center' },
  statusOk: { color: C.mint },
  statusErr: { color: '#9B2C2C' },
  primaryBtn: {
    backgroundColor: C.coral,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnPressed: { backgroundColor: C.coralPressed },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  signOut: { paddingVertical: 14, alignItems: 'center' },
  signOutPressed: { opacity: 0.8 },
  signOutText: { fontSize: 15, fontWeight: '800', color: '#9B2C2C' },
});
