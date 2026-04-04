import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useProfile } from '../context/ProfileContext';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { MakeDecisionScreen } from '../screens/MakeDecisionScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { C } from '../theme';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { session, configured, profile, loadState } = useProfile();

  const onboardingDone = Boolean(profile?.onboarding_completed_at);
  const authBusy = configured && loadState === 'loading';

  if (authBusy) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={C.mint} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={session ? `${session.user.id}-${onboardingDone ? 'main' : 'onb'}` : 'auth'}
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {!session && <Stack.Screen name="Auth" component={AuthScreen} />}
        {session && !onboardingDone && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
        {session && onboardingDone && (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="MakeDecision" component={MakeDecisionScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
  },
});
