import { useState } from 'react';
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
import { toErrorMessage } from '../utils/errors';

const GUIDANCE: { id: GuidanceStyle; title: string; body: string; emoji: string }[] = [
  { id: 'friend', title: 'Friend-like', body: 'Warm, casual, no jargon—like a smart friend.', emoji: '🤝' },
  { id: 'advisor', title: 'Advisor-like', body: 'Direct, structured—tradeoffs spelled out.', emoji: '📋' },
  { id: 'either', title: 'Mix it up', body: 'Let the app match tone to the moment.', emoji: '✨' },
];

const FOCUS: { id: DecisionFocus; title: string; body: string; emoji: string }[] = [
  { id: 'everyday', title: 'Everyday choices', body: 'What to eat, small plans, quick picks.', emoji: '🌤️' },
  { id: 'relationships', title: 'People & texts', body: 'Dates, replies, awkward convos.', emoji: '💬' },
  { id: 'career_money', title: 'Work & money', body: 'Jobs, offers, spending tradeoffs.', emoji: '💼' },
  { id: 'big_life', title: 'Big life moves', body: 'Moves, commitments, forks in the road.', emoji: '🧭' },
];

type Props = StackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen(_props: Props) {
  const { saveProfileFields } = useProfile();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [guidance, setGuidance] = useState<GuidanceStyle | null>(null);
  const [focus, setFocus] = useState<DecisionFocus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = 3;

  async function finish() {
    if (!displayName.trim() || !guidance || !focus) return;
    setBusy(true);
    setError(null);
    try {
      await saveProfileFields({
        display_name: displayName.trim(),
        guidance_style: guidance,
        decision_focus: focus,
        onboarding_completed_at: new Date().toISOString(),
      });
      // Do not call navigation.reset() here: while the stack only has `Onboarding`,
      // `Home` is not registered yet and reset throws. Saving updates the profile;
      // RootNavigator remounts with Home + Profile when onboarding completes.
    } catch (e) {
      setError(toErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setError(null);
    if (step === 0) {
      if (!displayName.trim()) {
        setError('Add a name so we know what to call you.');
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!guidance) {
        setError('Pick a style so answers feel right.');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!focus) {
        setError('Pick what you want the most help with.');
        return;
      }
      void finish();
    }
  }

  function back() {
    setError(null);
    if (step > 0) setStep((s) => s - 1);
  }

  return (
    <ScreenShell>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <BrandHeader />

        <View style={styles.progressRow}>
          {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
          ))}
        </View>

        <Text style={styles.stepLabel}>
          Step {step + 1} of {total}
        </Text>

        {step === 0 && (
          <View style={styles.block}>
            <Text style={styles.heroKicker}>First things first</Text>
            <Text style={styles.heroTitle}>What should we call you?</Text>
            <Text style={styles.heroSub}>We’ll use this in friendly nudges—not on a billboard.</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              placeholder="Alex"
              placeholderTextColor="#A8A4B0"
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              autoCorrect={false}
            />
          </View>
        )}

        {step === 1 && (
          <View style={styles.block}>
            <Text style={styles.heroKicker}>Tone</Text>
            <Text style={styles.heroTitle}>How do you like guidance?</Text>
            <Text style={styles.heroSub}>Matches future “friend” vs “advisor” modes.</Text>
            <View style={styles.choiceList}>
              {GUIDANCE.map((g) => (
                <Pressable
                  key={g.id}
                  style={({ pressed }) => [
                    styles.choiceCard,
                    guidance === g.id && styles.choiceCardActive,
                    pressed && styles.choiceCardPressed,
                  ]}
                  onPress={() => setGuidance(g.id)}
                >
                  <Text style={styles.choiceEmoji}>{g.emoji}</Text>
                  <View style={styles.choiceTextWrap}>
                    <Text style={styles.choiceTitle}>{g.title}</Text>
                    <Text style={styles.choiceBody}>{g.body}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.block}>
            <Text style={styles.heroKicker}>Focus</Text>
            <Text style={styles.heroTitle}>What ties you up most?</Text>
            <Text style={styles.heroSub}>Helps us prioritize compare, regret, and safe defaults later.</Text>
            <View style={styles.choiceList}>
              {FOCUS.map((f) => (
                <Pressable
                  key={f.id}
                  style={({ pressed }) => [
                    styles.choiceCard,
                    focus === f.id && styles.choiceCardActive,
                    pressed && styles.choiceCardPressed,
                  ]}
                  onPress={() => setFocus(f.id)}
                >
                  <Text style={styles.choiceEmoji}>{f.emoji}</Text>
                  <View style={styles.choiceTextWrap}>
                    <Text style={styles.choiceTitle}>{f.title}</Text>
                    <Text style={styles.choiceBody}>{f.body}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.spacer} />

        <View style={styles.footer}>
          {step > 0 ? (
            <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryPressed]} onPress={back}>
              <Text style={styles.secondaryText}>Back</Text>
            </Pressable>
          ) : (
            <View style={styles.footerSpacer} />
          )}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
            onPress={next}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{step === 2 ? 'Finish' : 'Next'}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  progressRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(20,18,28,0.12)' },
  dotActive: { backgroundColor: C.mint },
  stepLabel: { fontSize: 12, fontWeight: '700', color: C.inkMuted, marginBottom: 12, letterSpacing: 0.5 },
  block: { paddingTop: 4, paddingBottom: 8 },
  heroKicker: {
    fontSize: 13,
    fontWeight: '700',
    color: C.mint,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6, color: C.ink, marginBottom: 8 },
  heroSub: { fontSize: 15, lineHeight: 22, color: C.inkMuted, marginBottom: 16 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: C.inkMuted,
    marginBottom: 6,
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
  },
  choiceList: { gap: 10 },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(20, 18, 28, 0.1)',
    backgroundColor: C.card,
  },
  choiceCardActive: {
    borderColor: C.mint,
    backgroundColor: 'rgba(45, 155, 140, 0.08)',
  },
  choiceCardPressed: { opacity: 0.92 },
  choiceEmoji: { fontSize: 22, marginTop: 2 },
  choiceTextWrap: { flex: 1 },
  choiceTitle: { fontSize: 16, fontWeight: '700', color: C.ink, marginBottom: 4 },
  choiceBody: { fontSize: 13, lineHeight: 18, color: C.inkMuted },
  errorBanner: { backgroundColor: C.errorBg, borderRadius: 12, padding: 12, marginTop: 8 },
  errorText: { color: '#9B2C2C', fontSize: 14, lineHeight: 20 },
  spacer: { flexGrow: 1, minHeight: 24 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
    paddingBottom: 8,
  },
  footerSpacer: { width: 88 },
  primaryBtn: {
    flex: 1,
    backgroundColor: C.coral,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryBtnPressed: { backgroundColor: C.coralPressed },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryBtn: {
    width: 88,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(20, 18, 28, 0.12)',
    backgroundColor: C.card,
  },
  secondaryPressed: { opacity: 0.9 },
  secondaryText: { fontSize: 15, fontWeight: '700', color: C.ink },
});
