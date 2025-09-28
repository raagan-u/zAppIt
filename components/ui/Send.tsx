import { Ionicons } from '@expo/vector-icons';
import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { getAvailableChains, getChainConfig } from '../../constants/config';
import { useWallet } from '../../contexts/WalletContext';
import { getMultipleTokenBalances, getNativeBalance, TokenBalance } from '../../utils/tokenUtils';
import { NFC } from '../impls/NFC';
import { PaymentInfo, QR } from '../impls/QR';

interface SendProps {
  isVisible: boolean;
  onClose: () => void;
  nativeBalance: string;
  tokenBalances: TokenBalance[];
}

type SendStep = 'form' | 'confirm' | 'sending' | 'success';

export const Send: React.FC<SendProps> = ({ isVisible, onClose, nativeBalance, tokenBalances }) => {
  const { wallet, provider, currentChain } = useWallet();
  const [step, setStep] = useState<SendStep>('form');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState(currentChain);
  const [selectedToken, setSelectedToken] = useState<'native' | string>('native');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<TokenBalance[]>([]);
  const [chainNativeBalance, setChainNativeBalance] = useState('0');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showNFC, setShowNFC] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = isDark ? '#0F0F0F' : '#FAFAFA';
  const surfaceColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDark ? '#F9FAFB' : '#1F2937';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const availableChains = getAvailableChains();

  useEffect(() => {
    if (isVisible) {
      setStep('form');
      setRecipientAddress('');
      setAmount('');
      setTransactionHash('');
      loadBalances();
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, selectedChain]);

  const loadBalances = async () => {
    if (!wallet || !provider) return;

    try {
      const chainConfig = getChainConfig(selectedChain);
      const chainProvider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
      
      // Load native balance for selected chain
      const nativeBal = await getNativeBalance(chainProvider, wallet.address);
      setChainNativeBalance(parseFloat(nativeBal).toFixed(6));

      // Load token balances if tokens are defined for this chain
      if (chainConfig.tokens && chainConfig.tokens.length > 0) {
        const tokenBals = await getMultipleTokenBalances(
          chainProvider,
          wallet.address,
          chainConfig.tokens
        );
        setAvailableTokens(tokenBals);
      } else {
        setAvailableTokens([]);
      }
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const getSelectedTokenInfo = () => {
    if (selectedToken === 'native') {
      const chainConfig = getChainConfig(selectedChain);
      return {
        symbol: chainConfig.nativeCurrency.symbol,
        decimals: chainConfig.nativeCurrency.decimals,
        balance: chainNativeBalance,
      };
    } else {
      const token = availableTokens.find(t => t.token.address === selectedToken);
      return token ? {
        symbol: token.token.symbol,
        decimals: token.token.decimals,
        balance: token.formattedBalance,
      } : null;
    }
  };

  const validateForm = () => {
    if (!recipientAddress || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (!ethers.isAddress(recipientAddress)) {
      Alert.alert('Error', 'Invalid recipient address');
      return false;
    }

    const tokenInfo = getSelectedTokenInfo();
    if (!tokenInfo) {
      Alert.alert('Error', 'Invalid token selection');
      return false;
    }

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }

    if (amountFloat > parseFloat(tokenInfo.balance)) {
      Alert.alert('Error', 'Insufficient balance');
      return false;
    }

    return true;
  };

  const handleContinue = () => {
    if (validateForm()) {
      setStep('confirm');
    }
  };

  const handleConfirmTransfer = async () => {
    if (!wallet || !provider) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    try {
      setStep('sending');
      const chainConfig = getChainConfig(selectedChain);
      const chainProvider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
      const chainWallet = new ethers.Wallet(wallet.privateKey, chainProvider);

      let tx;
      if (selectedToken === 'native') {
        // Send native currency
        tx = await chainWallet.sendTransaction({
          to: recipientAddress,
          value: ethers.parseEther(amount),
        });
      } else {
        // Send ERC-20 token
        const token = availableTokens.find(t => t.token.address === selectedToken);
        if (!token) {
          throw new Error('Token not found');
        }

        let transactionType = 'ERC-20 Transfer';
        const ERC20_ABI = [
          'function transfer(address to, uint256 amount) returns (bool)',
          'function decimals() view returns (uint8)',
          'function symbol() view returns (string)',
        ];

        const contract = new ethers.Contract(token.token.address, ERC20_ABI, chainWallet);
        const amountWei = ethers.parseUnits(amount, token.token.decimals);
        
        tx = await contract.transfer(recipientAddress, amountWei);
      }

      setTransactionHash(tx.hash);
      setStep('success');
    } catch (error) {
      console.error('Transfer error:', error);
      Alert.alert('Error', `Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStep('confirm');
    }
  };

  const handlePaymentInfoReceived = (paymentInfo: PaymentInfo) => {
    setRecipientAddress(paymentInfo.recipientAddress);
    
    if (paymentInfo.amount) {
      setAmount(paymentInfo.amount);
    }
    
    if (paymentInfo.chainId) {
      const chain = availableChains.find(chainName => {
        const config = getChainConfig(chainName);
        return config.chainId === paymentInfo.chainId;
      });
      if (chain) {
        setSelectedChain(chain);
      }
    }
    
    if (paymentInfo.tokenAddress && paymentInfo.tokenAddress !== 'native') {
      setSelectedToken(paymentInfo.tokenAddress);
    }
  };

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: surfaceColor, borderBottomColor: borderColor }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={step === 'form' ? handleClose : () => setStep('form')}
        >
          <Ionicons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>
          {step === 'form' ? 'Send' : step === 'confirm' ? 'Confirm' : step === 'sending' ? 'Sending' : 'Success'}
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color={textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderForm = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      {/* Recipient Section */}
      <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={20} color="#2563EB" />
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Recipient</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: textSecondary }]}>Wallet Address</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.textInput, { 
                backgroundColor: isDark ? '#111827' : '#F9FAFB',
                borderColor,
                color: textPrimary 
              }]}
              placeholder="0x..."
              placeholderTextColor={textSecondary}
              value={recipientAddress}
              onChangeText={setRecipientAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              style={[styles.scanButton, { backgroundColor: '#2563EB' }]}
              onPress={() => setShowQRScanner(true)}
            >
              <Ionicons name="qr-code" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Asset Section */}
      <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="layers-outline" size={20} color="#10B981" />
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Asset</Text>
        </View>

        {/* Chain Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: textSecondary }]}>Network</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionsScroll}>
            {availableChains.map((chain) => {
              const config = getChainConfig(chain);
              const isActive = selectedChain === chain;
              
              return (
                <TouchableOpacity
                  key={chain}
                  style={[
                    styles.optionCard,
                    { 
                      backgroundColor: isDark ? '#111827' : '#F9FAFB',
                      borderColor: isActive ? '#2563EB' : borderColor,
                      borderWidth: isActive ? 2 : 1
                    }
                  ]}
                  onPress={() => setSelectedChain(chain)}
                >
                  <View style={[
                    styles.optionIcon,
                    { backgroundColor: isActive ? '#2563EB' : isDark ? '#374151' : '#E5E7EB' }
                  ]}>
                    <Text style={[
                      styles.optionIconText,
                      { color: isActive ? '#FFFFFF' : textSecondary }
                    ]}>
                      {config.name.charAt(0)}
                    </Text>
                  </View>
                  <Text style={[
                    styles.optionText,
                    { color: isActive ? '#2563EB' : textPrimary }
                  ]}>
                    {config.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Token Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: textSecondary }]}>Token</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionsScroll}>
            {/* Native Token */}
            <TouchableOpacity
              style={[
                styles.tokenCard,
                { 
                  backgroundColor: isDark ? '#111827' : '#F9FAFB',
                  borderColor: selectedToken === 'native' ? '#10B981' : borderColor,
                  borderWidth: selectedToken === 'native' ? 2 : 1
                }
              ]}
              onPress={() => setSelectedToken('native')}
            >
              <View style={[
                styles.tokenIcon,
                { backgroundColor: selectedToken === 'native' ? '#10B981' : isDark ? '#374151' : '#E5E7EB' }
              ]}>
                <Text style={[
                  styles.tokenIconText,
                  { color: selectedToken === 'native' ? '#FFFFFF' : textSecondary }
                ]}>
                  {getChainConfig(selectedChain).nativeCurrency.symbol.charAt(0)}
                </Text>
              </View>
              <View style={styles.tokenInfo}>
                <Text style={[
                  styles.tokenSymbol,
                  { color: selectedToken === 'native' ? '#10B981' : textPrimary }
                ]}>
                  {getChainConfig(selectedChain).nativeCurrency.symbol}
                </Text>
                <Text style={[styles.tokenBalance, { color: textSecondary }]}>
                  {chainNativeBalance}
                </Text>
              </View>
            </TouchableOpacity>
            
            {/* ERC-20 Tokens */}
            {availableTokens.map((token) => (
              <TouchableOpacity
                key={token.token.address}
                style={[
                  styles.tokenCard,
                  { 
                    backgroundColor: isDark ? '#111827' : '#F9FAFB',
                    borderColor: selectedToken === token.token.address ? '#10B981' : borderColor,
                    borderWidth: selectedToken === token.token.address ? 2 : 1
                  }
                ]}
                onPress={() => setSelectedToken(token.token.address)}
              >
                <View style={[
                  styles.tokenIcon,
                  { backgroundColor: selectedToken === token.token.address ? '#10B981' : isDark ? '#374151' : '#E5E7EB' }
                ]}>
                  <Text style={[
                    styles.tokenIconText,
                    { color: selectedToken === token.token.address ? '#FFFFFF' : textSecondary }
                  ]}>
                    {token.token.symbol.charAt(0)}
                  </Text>
                </View>
                <View style={styles.tokenInfo}>
                  <Text style={[
                    styles.tokenSymbol,
                    { color: selectedToken === token.token.address ? '#10B981' : textPrimary }
                  ]}>
                    {token.token.symbol}
                  </Text>
                  <Text style={[styles.tokenBalance, { color: textSecondary }]}>
                    {token.formattedBalance}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Amount Section */}
      <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calculator-outline" size={20} color="#F59E0B" />
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>Amount</Text>
        </View>
        
        <View style={styles.amountContainer}>
          <TextInput
            style={[styles.amountInput, { color: textPrimary }]}
            placeholder="0.0"
            placeholderTextColor={textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          <TouchableOpacity 
            style={[styles.maxButton, { backgroundColor: '#F59E0B' }]}
            onPress={() => {
              const tokenInfo = getSelectedTokenInfo();
              if (tokenInfo) {
                setAmount(tokenInfo.balance);
              }
            }}
          >
            <Text style={styles.maxButtonText}>MAX</Text>
          </TouchableOpacity>
        </View>
        
        {(() => {
          const tokenInfo = getSelectedTokenInfo();
          return tokenInfo && (
            <Text style={[styles.balanceText, { color: textSecondary }]}>
              Available: {tokenInfo.balance} {tokenInfo.symbol}
            </Text>
          );
        })()}
      </View>

      {/* Continue Button */}
      <TouchableOpacity 
        style={[styles.primaryButton, { backgroundColor: '#2563EB' }]}
        onPress={handleContinue}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderConfirm = () => {
    const tokenInfo = getSelectedTokenInfo();
    const chainConfig = getChainConfig(selectedChain);
    
    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.confirmCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.confirmHeader}>
            <View style={[styles.confirmIcon, { backgroundColor: '#2563EB' }]}>
              <Ionicons name="send" size={32} color="#FFFFFF" />
            </View>
            <Text style={[styles.confirmTitle, { color: textPrimary }]}>
              Confirm Transaction
            </Text>
            <Text style={[styles.confirmSubtitle, { color: textSecondary }]}>
              Please review the details before sending
            </Text>
          </View>

          <View style={styles.confirmDetails}>
            <View style={styles.confirmRow}>
              <Text style={[styles.confirmLabel, { color: textSecondary }]}>To</Text>
              <Text style={[styles.confirmValue, { color: textPrimary }]} numberOfLines={1}>
                {recipientAddress}
              </Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={[styles.confirmLabel, { color: textSecondary }]}>Amount</Text>
              <Text style={[styles.confirmValue, { color: textPrimary }]}>
                {amount} {tokenInfo?.symbol}
              </Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={[styles.confirmLabel, { color: textSecondary }]}>Network</Text>
              <Text style={[styles.confirmValue, { color: textPrimary }]}>
                {chainConfig.name}
              </Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={[styles.confirmLabel, { color: textSecondary }]}>Gas Fee</Text>
              <Text style={[styles.confirmValue, { color: textSecondary }]}>
                ~0.001 {chainConfig.nativeCurrency.symbol}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: '#2563EB' }]}
            onPress={handleConfirmTransfer}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Send Transaction</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  const renderSending = () => (
    <View style={styles.centerContainer}>
      <View style={[styles.loadingCard, { backgroundColor: surfaceColor }]}>
        <View style={[styles.loadingIcon, { backgroundColor: '#2563EB' }]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
        <Text style={[styles.loadingTitle, { color: textPrimary }]}>
          Sending Transaction
        </Text>
        <Text style={[styles.loadingText, { color: textSecondary }]}>
          Please wait while your transaction is being processed...
        </Text>
      </View>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.centerContainer}>
      <View style={[styles.successCard, { backgroundColor: surfaceColor, borderColor }]}>
        <View style={[styles.successIcon, { backgroundColor: '#10B981' }]}>
          <Ionicons name="checkmark" size={32} color="#FFFFFF" />
        </View>
        <Text style={[styles.successTitle, { color: textPrimary }]}>
          Transaction Sent!
        </Text>
        <Text style={[styles.successText, { color: textSecondary }]}>
          Your transaction has been successfully submitted to the network
        </Text>

        <View style={styles.transactionInfo}>
          <View style={styles.transactionRow}>
            <Text style={[styles.transactionLabel, { color: textSecondary }]}>Hash</Text>
            <Text style={[styles.transactionValue, { color: '#2563EB' }]} numberOfLines={1}>
              {transactionHash}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: '#10B981' }]}
          onPress={handleClose}
        >
          <Text style={styles.primaryButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!isVisible) return null;

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={backgroundColor} />
        
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {renderHeader()}
          
          <KeyboardAvoidingView 
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {step === 'form' && renderForm()}
            {step === 'confirm' && renderConfirm()}
            {step === 'sending' && renderSending()}
            {step === 'success' && renderSuccess()}
          </KeyboardAvoidingView>
        </Animated.View>

        {/* QR Scanner Modal */}
        {showQRScanner && (
          <QR
            onPaymentInfoReceived={handlePaymentInfoReceived}
            onClose={() => setShowQRScanner(false)}
          />
        )}

        {/* NFC Scanner Modal */}
        {showNFC && (
          <NFC
            onPaymentInfoReceived={handlePaymentInfoReceived}
            onClose={() => setShowNFC(false)}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  
  // Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20,
  },
  
  // Sections
  section: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  
  // Input Groups
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Options
  optionsScroll: {
    paddingRight: 20,
  },
  optionCard: {
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
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionIconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Token Cards
  tokenCard: {
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 120,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tokenIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tokenIconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tokenInfo: {
    alignItems: 'center',
  },
  tokenSymbol: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  tokenBalance: {
    fontSize: 12,
  },
  
  // Amount
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
  },
  maxButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  maxButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceText: {
    fontSize: 14,
    marginTop: 8,
  },
  
  // Primary Button
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Confirm
  confirmCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  confirmIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  confirmDetails: {
    gap: 16,
    marginBottom: 24,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmLabel: {
    fontSize: 16,
  },
  confirmValue: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  
  // Loading
  loadingCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 300,
  },
  loadingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Success
  successCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 350,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  transactionInfo: {
    width: '100%',
    marginBottom: 24,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLabel: {
    fontSize: 14,
  },
  transactionValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right',
  },
});