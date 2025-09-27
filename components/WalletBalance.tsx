import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAvailableChains, getChainConfig } from '../constants/config';
import { useWallet } from '../contexts/WalletContext';

interface WalletBalanceProps {
  chainName?: string;
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({ 
  chainName = 'sepolia' 
}) => {
  const { wallet, provider, isConnected } = useWallet();
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChain, setCurrentChain] = useState(chainName);
  const [availableChains] = useState(getAvailableChains());

  const loadBalance = async () => {
    if (!wallet || !isConnected) {
      setBalance('0');
      return;
    }

    try {
      setIsLoading(true);
      const chainConfig = getChainConfig(currentChain);
      
      // Create a new provider for the selected chain
      const chainProvider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
      const chainWallet = new ethers.Wallet(wallet.privateKey, chainProvider);
      
      const balanceWei = await chainProvider.getBalance(wallet.address);
      const balanceEth = ethers.formatEther(balanceWei);
      
      // Format balance to show appropriate decimal places
      const formattedBalance = parseFloat(balanceEth).toFixed(6);
      setBalance(formattedBalance);
    } catch (error) {
      console.error('Error loading balance:', error);
      setBalance('Error');
      Alert.alert('Error', 'Failed to load balance for this chain');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, [wallet, isConnected, currentChain]);

  const switchChain = (newChain: string) => {
    setCurrentChain(newChain);
  };

  const copyAddress = () => {
    if (wallet) {
      // In a real app, you'd use a clipboard library
      Alert.alert('Address Copied', wallet.address);
    }
  };

  if (!isConnected || !wallet) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Wallet Not Connected</Text>
          <Text style={styles.subtitle}>Connect your wallet to view balance</Text>
        </View>
      </View>
    );
  }

  const chainConfig = getChainConfig(currentChain);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Wallet Balance</Text>
          <TouchableOpacity onPress={copyAddress} style={styles.copyButton}>
            <Text style={styles.copyText}>Copy Address</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.addressContainer}>
          <Text style={styles.address} numberOfLines={1} ellipsizeMode="middle">
            {wallet.address}
          </Text>
        </View>

        <View style={styles.balanceContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#00ff88" />
          ) : (
            <Text style={styles.balance}>
              {balance} {chainConfig.nativeCurrency.symbol}
            </Text>
          )}
        </View>

        <View style={styles.chainInfo}>
          <Text style={styles.chainName}>{chainConfig.name}</Text>
          <Text style={styles.chainId}>Chain ID: {chainConfig.chainId}</Text>
        </View>

        <View style={styles.chainSelector}>
          <Text style={styles.selectorTitle}>Switch Chain:</Text>
          <View style={styles.chainButtons}>
            {availableChains.map((chain) => (
              <TouchableOpacity
                key={chain}
                style={[
                  styles.chainButton,
                  currentChain === chain && styles.activeChainButton
                ]}
                onPress={() => switchChain(chain)}
              >
                <Text style={[
                  styles.chainButtonText,
                  currentChain === chain && styles.activeChainButtonText
                ]}>
                  {getChainConfig(chain).name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity onPress={loadBalance} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh Balance</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#000000',
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 8,
  },
  copyButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  addressContainer: {
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  address: {
    color: '#00ff88',
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 60,
    justifyContent: 'center',
  },
  balance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  chainInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  chainName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00ff88',
    fontFamily: 'Inter',
  },
  chainId: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  chainSelector: {
    marginBottom: 20,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  chainButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chainButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555555',
  },
  activeChainButton: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  chainButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  activeChainButtonText: {
    color: '#000000',
  },
  refreshButton: {
    backgroundColor: '#333333',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555555',
  },
  refreshText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
