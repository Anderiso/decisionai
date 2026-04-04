import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import type { StackScreenProps } from '@react-navigation/stack';
import { BrandHeader } from '../components/BrandHeader';
import { ScreenShell } from '../components/ScreenShell';
import { useProfile } from '../context/ProfileContext';
import { C } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = StackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  const { profile, profileError } = useProfile();
  const name = profile?.display_name?.trim() || 'there';

  return (
    <ScreenShell>
      <StatusBar style="dark" />
      <BrandHeader />

      <View style={styles.hero}>
        <Text style={styles.heroKicker}>Home</Text>
        <Text style={styles.heroTitle}>Hey, {name} 👋</Text>
        <Text style={styles.heroSub}>
          Tap below to turn a messy thought into a clear two-option choice and a gentle suggestion. Open your profile to review or change what you shared during setup.
        </Text>

        {profileError ? (
          <View style={styles.warnBanner}>
            <Text style={styles.warnText}>
              {profileError.includes('relation') || profileError.includes('schema')
                ? 'Database setup: run the SQL in supabase/migrations/001_profiles.sql in your Supabase SQL editor.'
                : profileError}
            </Text>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.primaryBtnText}>Profile & preferences</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.ghostBtn, pressed && styles.ghostPressed]}
          onPress={() => navigation.navigate('MakeDecision')}
        >
          <Text style={styles.ghostText}>Make a decision</Text>
        </Pressable>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: { paddingTop: 12, paddingBottom: 8 },
  heroKicker: {
    fontSize: 13,
    fontWeight: '700',
    color: C.mint,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.8, color: C.ink, marginBottom: 10 },
  heroSub: { fontSize: 16, lineHeight: 24, color: C.inkMuted, marginBottom: 20 },
  warnBanner: {
    backgroundColor: 'rgba(232, 93, 76, 0.12)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  warnText: { fontSize: 13, lineHeight: 19, color: '#7A2E2E' },
  primaryBtn: {
    backgroundColor: C.coral,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnPressed: { backgroundColor: C.coralPressed },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  ghostBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(20, 18, 28, 0.12)',
    backgroundColor: C.card,
  },
  ghostPressed: { opacity: 0.92 },
  ghostText: { fontSize: 15, fontWeight: '700', color: C.inkMuted },
});
