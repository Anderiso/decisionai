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
import { recommendChoice, refineBlurb } from '../api/decisionsApi';
import { useProfile } from '../context/ProfileContext';
import { C } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'MakeDecision'>;

export function MakeDecisionScreen({ navigation }: Props) {
  const { profile } = useProfile();
  const g = profile?.guidance_style;
  const toneHint: 'friend' | 'advisor' | 'either' =
    g === 'friend' || g === 'advisor' || g === 'either' ? g : 'either';
  const [blurb, setBlurb] = useState('');
  const [phase, setPhase] = useState<'idle' | 'refining' | 'recommending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const [question, setQuestion] = useState<string | null>(null);
  const [optionA, setOptionA] = useState<string | null>(null);
  const [optionB, setOptionB] = useState<string | null>(null);
  const [refineMessage, setRefineMessage] = useState<string | null>(null);
  const [notADecision, setNotADecision] = useState(false);

  const [recommended, setRecommended] = useState<'a' | 'b' | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  function resetFlow() {
    setPhase('idle');
    setError(null);
    setQuestion(null);
    setOptionA(null);
    setOptionB(null);
    setRefineMessage(null);
    setNotADecision(false);
    setRecommended(null);
    setReason(null);
  }

  async function onSubmit() {
    const text = blurb.trim();
    if (!text) {
      setError('Add a few words about what you’re deciding.');
      return;
    }

    setError(null);
    setPhase('refining');
    setQuestion(null);
    setOptionA(null);
    setOptionB(null);
    setRefineMessage(null);
    setNotADecision(false);
    setRecommended(null);
    setReason(null);

    try {
      const refined = await refineBlurb(text);
      setRefineMessage(refined.message);

      if (!refined.ok) {
        setNotADecision(true);
        setPhase('done');
        return;
      }

      if (!refined.question || !refined.option_a || !refined.option_b) {
        setError('Could not shape this into two choices. Try again with a clearer either/or.');
        setPhase('idle');
        return;
      }

      setQuestion(refined.question);
      setOptionA(refined.option_a);
      setOptionB(refined.option_b);
      setPhase('recommending');

      const rec = await recommendChoice(refined.question, refined.option_a, refined.option_b, toneHint);
      setRecommended(rec.recommended);
      setReason(rec.reason);
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setPhase('idle');
    }
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

        <Text style={styles.heroKicker}>Make a decision</Text>
        <Text style={styles.heroTitle}>Say it messy</Text>
        <Text style={styles.heroSub}>
          Type or use your keyboard’s microphone to dictate. Your input is unstructured—we’ll condense it into a clear
          two-option question, then suggest a pick (more nuance later).
        </Text>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Heads up</Text>
          <Text style={styles.noticeBody}>
            This works best for real either/or decisions. If it’s not decidable that way, we’ll say so kindly.
          </Text>
        </View>

        <Text style={styles.label}>What’s on your mind?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. I’m invited out but I’m tired and also want to finish this project…"
          placeholderTextColor="#A8A4B0"
          multiline
          textAlignVertical="top"
          value={blurb}
          onChangeText={setBlurb}
          editable={phase !== 'refining' && phase !== 'recommending'}
        />
        <Text style={styles.hint}>Tip: On iOS/Android, tap the mic on the keyboard to dictate.</Text>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            (phase === 'refining' || phase === 'recommending') && styles.primaryBtnDisabled,
            pressed && (phase === 'idle' || phase === 'done') && styles.primaryBtnPressed,
          ]}
          onPress={() => {
            if (phase === 'done') {
              setBlurb('');
              resetFlow();
              return;
            }
            void onSubmit();
          }}
          disabled={phase === 'refining' || phase === 'recommending'}
        >
          {phase === 'refining' || phase === 'recommending' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>{phase === 'done' ? 'Start over' : 'Get clarity'}</Text>
          )}
        </Pressable>

        {phase === 'done' && notADecision && refineMessage ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultKicker}>Not quite a decision</Text>
            <Text style={styles.resultBody}>{refineMessage}</Text>
          </View>
        ) : null}

        {question && optionA && optionB && (phase === 'recommending' || phase === 'done') && !notADecision ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultKicker}>Your decision</Text>
            <Text style={styles.questionText}>{question}</Text>
            <View style={styles.optionRow}>
              <View style={[styles.optionPill, recommended === 'a' && styles.optionPillHighlight]}>
                <Text style={styles.optionLabel}>A</Text>
                <Text style={styles.optionValue}>{optionA}</Text>
              </View>
              <View style={[styles.optionPill, recommended === 'b' && styles.optionPillHighlight]}>
                <Text style={styles.optionLabel}>B</Text>
                <Text style={styles.optionValue}>{optionB}</Text>
              </View>
            </View>
            {refineMessage ? <Text style={styles.refineNote}>{refineMessage}</Text> : null}

            {phase === 'recommending' ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator color={C.mint} />
                <Text style={styles.inlineLoadingText}>Getting a recommendation…</Text>
              </View>
            ) : null}

            {recommended && reason ? (
              <>
                <Text style={styles.recKicker}>Suggestion</Text>
                <Text style={styles.recMain}>
                  Lean toward <Text style={styles.recEm}>{recommended === 'a' ? 'A' : 'B'}</Text>
                </Text>
                <Text style={styles.recReason}>{reason}</Text>
              </>
            ) : null}

          </View>
        ) : null}
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
  heroSub: { fontSize: 15, lineHeight: 22, color: C.inkMuted, marginBottom: 14 },
  notice: {
    backgroundColor: 'rgba(45, 155, 140, 0.1)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 155, 140, 0.25)',
  },
  noticeTitle: { fontSize: 13, fontWeight: '800', color: C.mint, marginBottom: 6 },
  noticeBody: { fontSize: 14, lineHeight: 20, color: C.inkMuted },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: C.inkMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    minHeight: 120,
    borderWidth: 1.5,
    borderColor: 'rgba(20, 18, 28, 0.1)',
    backgroundColor: '#FAFAFA',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    fontSize: 16,
    color: C.ink,
    marginBottom: 8,
  },
  hint: { fontSize: 12, color: C.inkMuted, marginBottom: 14 },
  errorBanner: {
    backgroundColor: C.errorBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: '#9B2C2C', fontSize: 14, lineHeight: 20 },
  primaryBtn: {
    backgroundColor: C.coral,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryBtnDisabled: { opacity: 0.75 },
  primaryBtnPressed: { backgroundColor: C.coralPressed },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  resultCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 24,
  },
  resultKicker: {
    fontSize: 12,
    fontWeight: '800',
    color: C.mint,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  questionText: { fontSize: 18, fontWeight: '800', color: C.ink, lineHeight: 24, marginBottom: 14 },
  optionRow: { gap: 10, marginBottom: 12 },
  optionPill: {
    borderWidth: 1.5,
    borderColor: 'rgba(20, 18, 28, 0.12)',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  optionPillHighlight: {
    borderColor: C.mint,
    backgroundColor: 'rgba(45, 155, 140, 0.08)',
  },
  optionLabel: { fontSize: 11, fontWeight: '800', color: C.inkMuted, marginBottom: 4 },
  optionValue: { fontSize: 15, fontWeight: '600', color: C.ink, lineHeight: 20 },
  refineNote: { fontSize: 13, lineHeight: 19, color: C.inkMuted, fontStyle: 'italic', marginBottom: 12 },
  inlineLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 8 },
  inlineLoadingText: { fontSize: 14, color: C.inkMuted },
  recKicker: {
    fontSize: 12,
    fontWeight: '800',
    color: C.coral,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 6,
  },
  recMain: { fontSize: 17, fontWeight: '800', color: C.ink, marginBottom: 8 },
  recEm: { color: C.coral },
  recReason: { fontSize: 15, lineHeight: 22, color: C.inkMuted, marginBottom: 14 },
  resultBody: { fontSize: 15, lineHeight: 22, color: C.inkMuted },
});
