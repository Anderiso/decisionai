import { StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';

export function BrandHeader() {
  return (
    <View style={styles.topBar}>
      <View style={styles.brandRow}>
        <Text style={styles.brandEmoji} accessibilityLabel="">
          ✦
        </Text>
        <Text style={styles.brandName}>Decisions AI</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandEmoji: {
    fontSize: 18,
    color: C.mint,
  },
  brandName: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: C.ink,
  },
});
