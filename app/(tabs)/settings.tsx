import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAvailableChains, getChainConfig } from '../../constants/config';
import { useWallet } from '../../contexts/WalletContext';

export default function SettingsScreen() {
  const { isConnected, disconnectWallet, currentChain, switchChain } = useWallet();

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectWallet();
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect wallet');
            }
          },
        },
      ]
    );
  };

  const handleChainSwitch = async (chainName: string) => {
    if (chainName === currentChain) return;

    try {
      await switchChain(chainName);
      Alert.alert('Success', `Switched to ${getChainConfig(chainName).name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to switch chain');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      {isConnected ? (
        <View style={styles.connectedContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Chain</Text>
            <Text style={styles.currentChain}>
              {getChainConfig(currentChain).name}
            </Text>
            <Text style={styles.chainId}>
              Chain ID: {getChainConfig(currentChain).chainId}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Chains</Text>
            <View style={styles.chainList}>
              {getAvailableChains().map((chainName) => {
                const config = getChainConfig(chainName);
                const isActive = chainName === currentChain;
                
                return (
                  <TouchableOpacity
                    key={chainName}
                    style={[
                      styles.chainItem,
                      isActive && styles.activeChainItem
                    ]}
                    onPress={() => handleChainSwitch(chainName)}
                    disabled={isActive}
                  >
                    <View style={styles.chainInfo}>
                      <Text style={[
                        styles.chainName,
                        isActive && styles.activeChainName
                      ]}>
                        {config.name}
                      </Text>
                      <Text style={[
                        styles.chainIdText,
                        isActive && styles.activeChainIdText
                      ]}>
                        Chain ID: {config.chainId}
                      </Text>
                    </View>
                    {isActive && (
                      <Text style={styles.activeIndicator}>Active</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
            <Text style={styles.disconnectButtonText}>Disconnect Wallet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.disconnectedContainer}>
          <Text style={styles.disconnectedText}>
            Connect your wallet to access settings
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
    marginBottom: 32,
  },
  connectedContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter',
    marginBottom: 16,
  },
  currentChain: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00ff88',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  chainId: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter',
  },
  chainList: {
    gap: 12,
  },
  chainItem: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeChainItem: {
    backgroundColor: '#1a2a1a',
    borderColor: '#00ff88',
  },
  chainInfo: {
    flex: 1,
  },
  chainName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  activeChainName: {
    color: '#00ff88',
  },
  chainIdText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter',
  },
  activeChainIdText: {
    color: '#88ff88',
  },
  activeIndicator: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00ff88',
    fontFamily: 'Inter',
    backgroundColor: '#00ff88',
    color: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  disconnectButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  disconnectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  disconnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disconnectedText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});
