import type { ReactNode } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, gradientColors } from '../theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

export function ScreenShell({ children, scroll = true, contentStyle }: Props) {
  const insets = useSafeAreaInsets();

  const scrollProps =
    Platform.OS === 'ios'
      ? {
          bounces: true as const,
          alwaysBounceVertical: true as const,
          keyboardDismissMode: 'interactive' as const,
        }
      : {
          overScrollMode: 'always' as const,
          keyboardDismissMode: 'on-drag' as const,
        };

  const inner = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, contentStyle]}>{children}</View>
  );

  return (
    <LinearGradient colors={[...gradientColors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradient}>
      <View style={[styles.safe, { paddingTop: insets.top }]}>
        {inner}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 22 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 28 },
  fill: { flex: 1, paddingBottom: 28 },
});
