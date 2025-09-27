import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { WalletBalance } from '../../components/WalletBalance';
import { useWallet } from '../../contexts/WalletContext';

export default function WalletScreen() {
  const { isConnected, connectWallet, disconnectWallet, isLoading, error } = useWallet();
  const [privateKey, setPrivateKey] = useState('');
  const [showConnectForm, setShowConnectForm] = useState(false);

  // Try to connect with environment private key on mount
  useEffect(() => {
    const envPrivateKey = process.env.EXPO_PUBLIC_PRIVATE_KEY;
    if (envPrivateKey && !isConnected) {
      connectWallet(envPrivateKey).catch((err) => {
        console.log('Failed to connect with env private key:', err.message);
      });
    }
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

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => window.location.reload()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isConnected ? (
        <View style={styles.connectContainer}>
          <Text style={styles.title}>Connect Your Wallet</Text>
          <Text style={styles.subtitle}>
            Enter your private key to connect your wallet and view your balance
          </Text>
          
          {!showConnectForm ? (
            <TouchableOpacity 
              style={styles.connectButton}
              onPress={() => setShowConnectForm(true)}
            >
              <Text style={styles.connectButtonText}>Connect Wallet</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your private key"
                placeholderTextColor="#666666"
                value={privateKey}
                onChangeText={setPrivateKey}
                secureTextEntry
                multiline
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowConnectForm(false);
                    setPrivateKey('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.submitButton, isLoading && styles.disabledButton]}
                  onPress={handleConnect}
                  disabled={isLoading}
                >
                  <Text style={styles.submitButtonText}>
                    {isLoading ? 'Connecting...' : 'Connect'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.walletContainer}>
          <View style={styles.header}>
            <Text style={styles.walletTitle}>My Wallet</Text>
            <TouchableOpacity 
              style={styles.disconnectButton}
              onPress={handleDisconnect}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
          <WalletBalance />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  connectContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  connectButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  connectButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  input: {
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter',
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333333',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555555',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#00ff88',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  disabledButton: {
    opacity: 0.6,
  },
  walletContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  walletTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  disconnectButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disconnectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4444',
    fontFamily: 'Inter',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
