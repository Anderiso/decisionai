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
import { supabase } from '../../supabaseClient';
import { BrandHeader } from '../components/BrandHeader';
import { ScreenShell } from '../components/ScreenShell';
import { C } from '../theme';

export function AuthScreen() {
  const configured = supabase !== null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleAuth() {
    if (!supabase) return;
    setBusy(true);
    setStatus(null);
    try {
      if (!email.trim() || !password.trim()) {
        setStatus('Enter an email and password.');
        return;
      }
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setStatus(error.message);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) setStatus(error.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenShell>
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.kav}>
        <BrandHeader />

        {!configured ? (
          <View style={styles.hero}>
            <Text style={styles.heroKicker}>Almost there</Text>
            <Text style={styles.heroTitle}>Connect Supabase</Text>
            <Text style={styles.heroSub}>
              Add your project URL and publishable key to <Text style={styles.heroMono}>apps/mobile/.env</Text>, then
              restart Expo.
            </Text>
            <View style={styles.decorRow}>
              <Text style={styles.decorEmoji}>🧠</Text>
              <Text style={styles.decorEmoji}>💭</Text>
              <Text style={styles.decorEmoji}>✨</Text>
            </View>
          </View>
        ) : (
          <View style={styles.hero}>
            <Text style={styles.heroKicker}>Decision co-pilot</Text>
            <Text style={styles.heroTitle}>Stop spiraling.</Text>
            <Text style={styles.heroSub}>
              Sign in to save your preferences and decisions—same brain, less rumination.
            </Text>

            <View style={styles.card}>
              <View style={styles.segment}>
                <Pressable
                  style={({ pressed }) => [
                    styles.segmentItem,
                    mode === 'signin' && styles.segmentItemActive,
                    pressed && styles.segmentItemPressed,
                  ]}
                  onPress={() => {
                    setMode('signin');
                    setStatus(null);
                  }}
                >
                  <Text style={[styles.segmentText, mode === 'signin' && styles.segmentTextActive]}>Sign in</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.segmentItem,
                    mode === 'signup' && styles.segmentItemActive,
                    pressed && styles.segmentItemPressed,
                  ]}
                  onPress={() => {
                    setMode('signup');
                    setStatus(null);
                  }}
                >
                  <Text style={[styles.segmentText, mode === 'signup' && styles.segmentTextActive]}>Create account</Text>
                </Pressable>
              </View>

              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="you@example.com"
                placeholderTextColor="#A8A4B0"
                style={styles.input}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#A8A4B0"
                style={styles.input}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />

              {status ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>{status}</Text>
                </View>
              ) : null}

              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
                onPress={handleAuth}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>{mode === 'signin' ? 'Continue' : 'Create my account'}</Text>
                )}
              </Pressable>

              <Text style={styles.footnote}>Tiny decisions, big relief. We’ll never roast your drafts—promise.</Text>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  hero: { paddingTop: 8, paddingBottom: 8 },
  heroKicker: {
    fontSize: 13,
    fontWeight: '700',
    color: C.mint,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    color: C.ink,
    marginBottom: 10,
  },
  heroSub: { fontSize: 16, lineHeight: 24, color: C.inkMuted, marginBottom: 22 },
  heroMono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, color: C.ink },
  decorRow: { flexDirection: 'row', gap: 14, marginTop: 8 },
  decorEmoji: { fontSize: 28 },
  card: {
    backgroundColor: C.card,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#1E1040',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 18, 28, 0.05)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
  },
  segmentItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 },
  segmentItemActive: {
    backgroundColor: C.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentItemPressed: { opacity: 0.92 },
  segmentText: { fontSize: 14, fontWeight: '600', color: C.inkMuted },
  segmentTextActive: { color: C.ink },
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
    marginBottom: 14,
  },
  errorBanner: { backgroundColor: C.errorBg, borderRadius: 12, padding: 12, marginBottom: 14 },
  errorText: { color: '#9B2C2C', fontSize: 14, lineHeight: 20 },
  primaryBtn: {
    backgroundColor: C.coral,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnPressed: { backgroundColor: C.coralPressed },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  footnote: {
    marginTop: 16,
    fontSize: 13,
    lineHeight: 19,
    color: C.inkMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
