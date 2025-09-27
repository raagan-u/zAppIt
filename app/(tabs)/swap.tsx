import { StyleSheet, View } from 'react-native';
import Swap from '../../components/swap/Swap';

export default function SwapScreen() {
  return (
    <View style={styles.container}>
      <Swap 
        apiKey={process.env.EXPO_PUBLIC_SWAP_API_KEY || 'your-api-key-here'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
