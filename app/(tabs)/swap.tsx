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
        apiKey={'f242ea49332293424c96c562a6ef575a819908c878134dcb4fce424dc84ec796'}
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
