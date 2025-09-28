import { ethers } from 'ethers';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAvailableChains, getChainConfig } from '../constants/config';
import { useWallet } from '../contexts/WalletContext';
import { getMultipleTokenBalances, getNativeBalance, TokenBalance } from '../utils/tokenUtils';
import { Receive } from './ui/Receive';
import { Send } from './ui/Send';

interface WalletBalanceProps {
  chainName?: string;
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({ 
  chainName = 'sepolia' 
}) => {
  const { wallet, provider, isConnected } = useWallet();
  const { nfcData, recipient, amount: nfcAmount, chain: nfcChain, asset: nfcAsset } = useLocalSearchParams<{
    nfcData?: string;
    recipient?: string;
    amount?: string;
    chain?: string;
    asset?: string;
  }>();
  
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChain, setCurrentChain] = useState(chainName);
  const [availableChains] = useState(getAvailableChains());
  const [showTokens, setShowTokens] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [nfcPaymentData, setNfcPaymentData] = useState<{
    recipient?: string;
    amount?: string;
    chain?: string;
    asset?: string;
  } | null>(null);

  const loadBalance = async () => {
    if (!wallet || !isConnected) {
      setNativeBalance('0');
      setTokenBalances([]);
      return;
    }

    try {
      setIsLoading(true);
      const chainConfig = getChainConfig(currentChain);
      
      // Create a new provider for the selected chain
      const chainProvider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
      
      // Load native balance
      const nativeBal = await getNativeBalance(chainProvider, wallet.address);
      setNativeBalance(parseFloat(nativeBal).toFixed(6));
      
      // Load token balances if tokens are configured for this chain
      if (chainConfig.tokens && chainConfig.tokens.length > 0) {
        console.log('Loading token balances for tokens:', chainConfig.tokens);
        const tokenBals = await getMultipleTokenBalances(
          chainProvider, 
          wallet.address, 
          chainConfig.tokens
        );
        console.log('Token balances loaded:', tokenBals);
        setTokenBalances(tokenBals);
      } else {
        console.log('No tokens configured for chain:', currentChain);
        setTokenBalances([]);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
      setNativeBalance('Error');
      setTokenBalances([]);
      Alert.alert('Error', 'Failed to load balance for this chain');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, [wallet, isConnected, currentChain]);

  // Handle NFC data when component loads
  useEffect(() => {
    if (nfcData === 'true' && recipient && nfcAmount) {
      console.log('=== WALLET: NFC data received ===', { recipient, nfcAmount, nfcChain, nfcAsset });
      
      // Store NFC payment data
      setNfcPaymentData({
        recipient,
        amount: nfcAmount,
        chain: nfcChain,
        asset: nfcAsset,
      });
      
      // Set chain if provided
      if (nfcChain) {
        setCurrentChain(nfcChain);
      }
      
      // Show success message and open Send modal
      Alert.alert(
        'NFC Payment Request Received',
        `Payment request received:\nRecipient: ${recipient}\nAmount: ${nfcAmount} ${nfcAsset || 'ETH'}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Open Send',
            onPress: () => setShowSendModal(true),
          },
        ]
      );
    }
  }, [nfcData, recipient, nfcAmount, nfcChain, nfcAsset]);

  const switchChain = (newChain: string) => {
    setCurrentChain(newChain);
  };

  const copyAddress = () => {
    if (wallet) {
      // In a real app, you'd use a clipboard library
      Alert.alert('Address Copied', wallet.address);
    }
  };

  const handleSend = () => {
    if (wallet) {
      setShowSendModal(true);
    } else {
      Alert.alert('Wallet Not Connected', 'Please connect your wallet to send');
    }
  };

  const handleReceive = () => {
    if (isConnected && wallet) {
      setShowReceiveModal(true);
    } else {
      Alert.alert('Wallet Not Connected', 'Please connect your wallet to receive');
    }
  };

  const handleSubscribe = () => {
    Alert.alert('Subscribe', 'Subscribe functionality will be implemented here');
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
            <View style={styles.balanceSection}>
              <Text style={styles.balance}>
                {nativeBalance} {chainConfig.nativeCurrency.symbol}
              </Text>
              <Text style={styles.balanceLabel}>Native Balance</Text>
            </View>
          )}
        </View>

        {(tokenBalances.length > 0 || (chainConfig.tokens && chainConfig.tokens.length > 0)) && (
          <View style={styles.tokenSection}>
            <TouchableOpacity 
              style={styles.tokenToggle}
              onPress={() => setShowTokens(!showTokens)}
            >
              <Text style={styles.tokenToggleText}>
                {showTokens ? 'Hide' : 'Show'} Tokens ({tokenBalances.length || chainConfig.tokens?.length || 0})
              </Text>
            </TouchableOpacity>
            
            {showTokens && (
              <ScrollView style={styles.tokenList} showsVerticalScrollIndicator={false}>
                {tokenBalances.length > 0 ? (
                  tokenBalances.map((tokenBalance, index) => (
                    <View key={index} style={styles.tokenItem}>
                      <View style={styles.tokenInfo}>
                        <Text style={styles.tokenSymbol}>{tokenBalance.token.symbol}</Text>
                        <Text style={styles.tokenName}>{tokenBalance.token.name}</Text>
                      </View>
                      <View style={styles.tokenBalance}>
                        <Text style={styles.tokenBalanceText}>
                          {tokenBalance.formattedBalance}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.noTokensContainer}>
                    <Text style={styles.noTokensText}>No token balances loaded</Text>
                    <Text style={styles.noTokensSubtext}>Check console for errors</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        )}

        {/* Debug info - remove this later */}
        <View style={styles.debugSection}>
          <Text style={styles.debugText}>
            Debug: Chain: {currentChain}, Tokens: {tokenBalances.length}
          </Text>
          {chainConfig.tokens && (
            <Text style={styles.debugText}>
              Configured tokens: {chainConfig.tokens.length}
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

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
            <Text style={styles.actionButtonText}>Send</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleReceive}>
            <Text style={styles.actionButtonText}>Receive</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleSubscribe}>
            <Text style={styles.actionButtonText}>Subscribe</Text>
          </TouchableOpacity>
        </View>

        {/* Send Modal */}
        {showSendModal && (
          <Send 
            onClose={() => {
              setShowSendModal(false);
              setNfcPaymentData(null); // Clear NFC data when modal closes
            }} 
            nfcData={nfcPaymentData}
          />
        )}

        {/* Receive Modal */}
        {showReceiveModal && (
          <Receive onClose={() => setShowReceiveModal(false)} />
        )}
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
  balanceSection: {
    alignItems: 'center',
  },
  balance: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  tokenSection: {
    marginBottom: 20,
  },
  tokenToggle: {
    backgroundColor: '#333333',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555555',
  },
  tokenToggleText: {
    color: '#00ff88',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  tokenList: {
    maxHeight: 200,
    marginTop: 12,
  },
  tokenItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  tokenName: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  tokenBalanceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#00ff88',
    fontFamily: 'Inter',
  },
  debugSection: {
    backgroundColor: '#1a1a1a',
    padding: 8,
    borderRadius: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  debugText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  noTokensContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noTokensText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  noTokensSubtext: {
    fontSize: 14,
    color: '#666666',
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
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#00ff88',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  actionButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
