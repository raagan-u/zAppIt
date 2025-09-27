import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from 'react-native';
import { WalletBalance } from '../../components/WalletBalance';
import { useWallet } from '../../contexts/WalletContext';

export default function WalletScreen() {
  const { isConnected, connectWallet, disconnectWallet, isLoading, error } = useWallet();
  const [privateKey, setPrivateKey] = useState('');
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Try to connect with environment private key on mount
  useEffect(() => {
    const envPrivateKey = process.env.EXPO_PUBLIC_PRIVATE_KEY;
    if (envPrivateKey && !isConnected) {
      connectWallet(envPrivateKey).catch((err) => {
        console.log('Failed to connect with env private key:', err.message);
      });
    }
  }, []);

  // Animation effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleConnect = async () => {
    if (!privateKey.trim()) {
      Alert.alert('Error', 'Please enter a private key');
      return;
    }

    try {
      await connectWallet(privateKey.trim());
      setPrivateKey('');
      setShowConnectForm(false);
    } catch (error) {
      Alert.alert('Connection Failed', error instanceof Error ? error.message : 'Failed to connect wallet');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
    } catch (error) {
      Alert.alert('Disconnect Failed', error instanceof Error ? error.message : 'Failed to disconnect wallet');
    }
  };

  const backgroundColor = isDark ? '#0F0F0F' : '#FAFAFA';
  const surfaceColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDark ? '#F9FAFB' : '#1F2937';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={backgroundColor} />
        <View style={styles.centerContainer}>
          <Animated.View 
            style={[
              styles.errorCard,
              { 
                backgroundColor: surfaceColor,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
            </View>
            <Text style={[styles.errorTitle, { color: textPrimary }]}>Connection Error</Text>
            <Text style={[styles.errorText, { color: textSecondary }]}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => window.location.reload()}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={backgroundColor} />
      
      {!isConnected ? (
        <KeyboardAvoidingView 
          style={styles.flex} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View 
              style={[
                styles.connectContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <View style={styles.brandingSection}>
                <View style={styles.logoContainer}>
                  <View style={[styles.logoCircle, { backgroundColor: '#2563EB' }]}>
                    <Ionicons name="wallet" size={32} color="#FFFFFF" />
                  </View>
                </View>
                
                <Text style={[styles.appTitle, { color: textPrimary }]}>zAppVault</Text>
                <Text style={[styles.appSubtitle, { color: textSecondary }]}>
                  Secure multi-chain wallet
                </Text>
              </View>
              
              {!showConnectForm ? (
                <View style={styles.welcomeSection}>
                  <View style={[styles.welcomeCard, { backgroundColor: surfaceColor }]}>
                    <Text style={[styles.welcomeTitle, { color: textPrimary }]}>Welcome Back</Text>
                    <Text style={[styles.welcomeText, { color: textSecondary }]}>
                      Connect your wallet to access your digital assets and manage transactions
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.primaryButton}
                      onPress={() => setShowConnectForm(true)}
                    >
                      <Text style={styles.primaryButtonText}>Connect Wallet</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.formSection}>
                  <View style={[styles.formCard, { backgroundColor: surfaceColor }]}>
                    <View style={styles.formHeader}>
                      <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => {
                          setShowConnectForm(false);
                          setPrivateKey('');
                        }}
                      >
                        <Ionicons name="arrow-back" size={24} color={textSecondary} />
                      </TouchableOpacity>
                      <Text style={[styles.formTitle, { color: textPrimary }]}>Connect Wallet</Text>
                      <View style={{ width: 24 }} />
                    </View>
                    
                    <View style={styles.inputSection}>
                      <Text style={[styles.inputLabel, { color: textPrimary }]}>Private Key</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          { 
                            backgroundColor: isDark ? '#111827' : '#F9FAFB',
                            borderColor: isDark ? '#374151' : '#E5E7EB',
                            color: textPrimary
                          }
                        ]}
                        placeholder="Enter your private key"
                        placeholderTextColor={textSecondary}
                        value={privateKey}
                        onChangeText={setPrivateKey}
                        secureTextEntry
                        multiline
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    
                    <TouchableOpacity 
                      style={[styles.connectButtonLarge, isLoading && styles.disabledButton]}
                      onPress={handleConnect}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Text style={styles.connectButtonText}>Connecting...</Text>
                      ) : (
                        <Text style={styles.connectButtonText}>Connect</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.walletContainer}>
          <View style={[styles.walletHeader, { backgroundColor: surfaceColor }]}>
            <View style={styles.headerContent}>
              <Text style={[styles.walletTitle, { color: textPrimary }]}>Wallet</Text>
              <Text style={[styles.walletSubtitle, { color: textSecondary }]}>
                Manage your digital assets
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={handleDisconnect}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color={textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.walletContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.walletScrollContent}
          >
            <WalletBalance />
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  
  // Error State
  errorCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Connect State
  connectContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  brandingSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Welcome Section
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Form Section
  formSection: {
    width: '100%',
  },
  formCard: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  connectButtonLarge: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  
  // Wallet State
  walletContainer: {
    flex: 1,
  },
  walletHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flex: 1,
  },
  walletTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  walletSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
  },
  walletContent: {
    flex: 1,
  },
  walletScrollContent: {
    paddingBottom: 100, // Space for tab bar
  },
});
