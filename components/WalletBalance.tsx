import { Ionicons } from '@expo/vector-icons';
import { ethers } from 'ethers';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
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
  const [fadeAnim] = useState(new Animated.Value(0));
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const loadBalance = async () => {
    if (!wallet || !isConnected) {
      setNativeBalance('0');
      setTokenBalances([]);
      return;
    }

    setIsLoading(true);
    try {
      const chainConfig = getChainConfig(currentChain);
      const chainProvider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
      
      // Load native balance
      const nativeBalance = await getNativeBalance(chainProvider, wallet.address);
      setNativeBalance(nativeBalance);

      // Load token balances if tokens are defined for this chain
      if (chainConfig.tokens && chainConfig.tokens.length > 0) {
        const tokenBalances = await getMultipleTokenBalances(
          chainProvider,
          wallet.address,
          chainConfig.tokens
        );
        setTokenBalances(tokenBalances);
      } else {
        setTokenBalances([]);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
      Alert.alert('Error', 'Failed to load balance');
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

  const switchChain = async (newChain: string) => {
    if (newChain === currentChain) return;
    
    try {
      setCurrentChain(newChain);
      await loadBalance();
    } catch (error) {
      console.error('Error switching chain:', error);
      Alert.alert('Error', 'Failed to switch chain');
    }
  };

  const copyAddress = async () => {
    if (!wallet) return;
    
    try {
      await navigator.clipboard.writeText(wallet.address);
      Alert.alert('Copied', 'Address copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy address');
    }
  };

  const handleSend = () => {
    setShowSendModal(true);
  };

  const handleReceive = () => {
    setShowReceiveModal(true);
  };

  const handleSubscribe = () => {
    Alert.alert('Subscribe', 'Subscribe functionality will be implemented here');
  };

  useEffect(() => {
    loadBalance();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentChain, isConnected]);

  const backgroundColor = isDark ? '#0F0F0F' : '#FAFAFA';
  const surfaceColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDark ? '#F9FAFB' : '#1F2937';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadBalance();
    setIsRefreshing(false);
  };

  if (!isConnected || !wallet) {
    return (
      <View style={[styles.disconnectedContainer, { backgroundColor }]}>
        <View style={[styles.disconnectedCard, { backgroundColor: surfaceColor, borderColor }]}>
          <Ionicons name="wallet-outline" size={48} color={textSecondary} />
          <Text style={[styles.disconnectedText, { color: textSecondary }]}>
            Connect your wallet to view balance
          </Text>
        </View>
      </View>
    );
  }

  const chainConfig = getChainConfig(currentChain);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#9CA3AF' : '#6B7280'}
            colors={['#2563EB']}
          />
        }
      >
        {/* Balance Overview */}
        <Animated.View style={[styles.balanceCard, { backgroundColor: surfaceColor, borderColor, opacity: fadeAnim }]}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceInfo}>
              <Text style={[styles.balanceLabel, { color: textSecondary }]}>
                Total Balance
              </Text>
              {isLoading ? (
                <ActivityIndicator size="small" color="#2563EB" style={styles.loadingIndicator} />
              ) : (
                <Text style={[styles.balance, { color: textPrimary }]}>
                  {nativeBalance} {chainConfig.nativeCurrency.symbol}
                </Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={[styles.actionButtonSmall, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
              onPress={copyAddress}
            >
              <Ionicons name="copy-outline" size={16} color={textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.addressSection}>
            <Text style={[styles.addressLabel, { color: textSecondary }]}>Wallet Address</Text>
            <Text style={[styles.address, { color: textPrimary }]} numberOfLines={1} ellipsizeMode="middle">
              {wallet.address}
            </Text>
          </View>

          <View style={[styles.networkBadge, { backgroundColor: isDark ? '#1E40AF' : '#DBEAFE' }]}>
            <View style={styles.networkDot} />
            <Text style={[styles.networkText, { color: '#2563EB' }]}>
              {chainConfig.name}
            </Text>
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: surfaceColor, borderColor }]}
              onPress={handleSend}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.actionLabel, { color: textPrimary }]}>Send</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: surfaceColor, borderColor }]}
              onPress={handleReceive}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
                <Ionicons name="arrow-down" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.actionLabel, { color: textPrimary }]}>Receive</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: surfaceColor, borderColor }]}
              onPress={handleSubscribe}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="notifications" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.actionLabel, { color: textPrimary }]}>Subscribe</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: surfaceColor, borderColor }]}
              onPress={loadBalance}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#6366F1' }]}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.actionLabel, { color: textPrimary }]}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Network Selector */}
        <View style={styles.networkSection}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Networks</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.networkScroll}
          >
            {availableChains.map((chain) => {
              const isActive = currentChain === chain;
              const config = getChainConfig(chain);
              
              return (
                <TouchableOpacity
                  key={chain}
                  style={[
                    styles.networkCard,
                    { 
                      backgroundColor: surfaceColor,
                      borderColor: isActive ? '#2563EB' : borderColor,
                      borderWidth: isActive ? 2 : 1
                    }
                  ]}
                  onPress={() => switchChain(chain)}
                >
                  <View style={[
                    styles.networkIconContainer,
                    { backgroundColor: isActive ? '#2563EB' : isDark ? '#374151' : '#F3F4F6' }
                  ]}>
                    <Text style={[
                      styles.networkIcon,
                      { color: isActive ? '#FFFFFF' : textSecondary }
                    ]}>
                      {config.name.charAt(0)}
                    </Text>
                  </View>
                  <Text style={[
                    styles.networkName,
                    { color: isActive ? '#2563EB' : textPrimary }
                  ]}>
                    {config.name}
                  </Text>
                  {isActive && (
                    <Ionicons name="checkmark-circle" size={16} color="#2563EB" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tokens Section */}
        <View style={styles.tokensSection}>
          <TouchableOpacity 
            style={styles.tokensHeader}
            onPress={() => setShowTokens(!showTokens)}
          >
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>
              Tokens ({tokenBalances.length})
            </Text>
            <Ionicons 
              name={showTokens ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={textSecondary}
            />
          </TouchableOpacity>
          
          {showTokens && (
            <View style={styles.tokensList}>
              {tokenBalances.length > 0 ? (
                tokenBalances.map((tokenBalance, index) => (
                  <View 
                    key={index}
                    style={[styles.tokenItem, { backgroundColor: surfaceColor, borderColor }]}
                  >
                    <View style={[styles.tokenIconContainer, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                      <Text style={[styles.tokenSymbol, { color: textPrimary }]}>
                        {tokenBalance.token.symbol.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.tokenDetails}>
                      <Text style={[styles.tokenName, { color: textPrimary }]}>
                        {tokenBalance.token.symbol}
                      </Text>
                      <Text style={[styles.tokenFullName, { color: textSecondary }]}>
                        {tokenBalance.token.name}
                      </Text>
                    </View>
                    <View style={styles.tokenBalanceContainer}>
                      <Text style={[styles.tokenBalanceText, { color: textPrimary }]}>
                        {tokenBalance.formattedBalance}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyTokens}>
                  <Ionicons name="layers-outline" size={32} color={textSecondary} />
                  <Text style={[styles.emptyTokensText, { color: textSecondary }]}>
                    No tokens found
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      {showSendModal && (
        <Send
          isVisible={showSendModal}
          onClose={() => setShowSendModal(false)}
          nativeBalance={nativeBalance}
          tokenBalances={tokenBalances}
        />
      )}

      {/* Send Modal */}
      {showSendModal && (
        <Send 
          isVisible={showSendModal}
          onClose={() => {
            setShowSendModal(false);
            setNfcPaymentData(null); // Clear NFC data when modal closes
          }} 
          nfcData={nfcPaymentData}
          nativeBalance={nativeBalance}
          tokenBalances={tokenBalances}
        />
      )}

      {/* Receive Modal */}
      {showReceiveModal && (
        <Receive
          isVisible={showReceiveModal}
          onClose={() => setShowReceiveModal(false)}
          address={wallet.address}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Disconnected State
  disconnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  disconnectedCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  disconnectedText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  
  // Connected State
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },
  
  // Balance Card
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  balance: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  loadingIndicator: {
    marginTop: 8,
  },
  actionButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Address Section
  addressSection: {
    marginBottom: 20,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  
  // Network Badge
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  networkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Actions Section
  actionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Network Section
  networkSection: {
    marginBottom: 24,
  },
  networkScroll: {
    paddingRight: 20,
  },
  networkCard: {
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  networkIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  networkIcon: {
    fontSize: 14,
    fontWeight: '700',
  },
  networkName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Tokens Section
  tokensSection: {
    marginBottom: 24,
  },
  tokensHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tokensList: {
    gap: 8,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  tokenIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tokenSymbol: {
    fontSize: 14,
    fontWeight: '700',
  },
  tokenDetails: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  tokenFullName: {
    fontSize: 14,
  },
  tokenBalanceContainer: {
    alignItems: 'flex-end',
  },
  tokenBalanceText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Empty States
  emptyTokens: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTokensText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});