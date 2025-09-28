import { SafeAreaView, StatusBar, StyleSheet, useColorScheme } from 'react-native';
import Swap from '../../components/swap/Swap';

export default function SwapScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = isDark ? '#0F0F0F' : '#FAFAFA';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={backgroundColor} />
      <Swap 
        apiKey={process.env.EXPO_PUBLIC_SWAP_API_KEY || 'your-api-key-here'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 120, // Space for floating tab bar
  },
});
