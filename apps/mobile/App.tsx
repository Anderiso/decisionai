import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProfileProvider } from './src/context/ProfileContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ProfileProvider>
          <RootNavigator />
        </ProfileProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
