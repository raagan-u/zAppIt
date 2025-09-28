import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { getAvailableChains, getChainConfig } from '../../constants/config';
import { useWallet } from '../../contexts/WalletContext';
import { useSimpleHCE } from '../UseSimpleHCE';

interface ReceiveProps {
  isVisible: boolean;
  onClose: () => void;
  address: string;
}

export const Receive: React.FC<ReceiveProps> = ({ isVisible, onClose, address }) => {
  const { currentChain } = useWallet();
  const availableChains = getAvailableChains();
  const [selectedChain, setSelectedChain] = useState(currentChain || availableChains[0]);
  const [selectedToken, setSelectedToken] = useState<'native' | string>('native');
  const [amount, setAmount] = useState('');
  const [qrData, setQrData] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showNFC, setShowNFC] = useState(false);
  
  // NFC Hook
  const { sendMessage, stopSession, isEnabled, isLoading: hceLoading } = useSimpleHCE();
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = isDark ? '#0F0F0F' : '#FAFAFA';
  const surfaceColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDark ? '#F9FAFB' : '#1F2937';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  useEffect(() => {
    if (isVisible) {
      generateQRData();
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, selectedChain, selectedToken, amount, address]);

  useEffect(() => {
    if (currentChain && availableChains.includes(currentChain)) {
      setSelectedChain(currentChain);
    }
  }, [currentChain, availableChains]);

  const generateQRData = () => {
    if (!address || !selectedChain) {
      console.log('Cannot generate QR: address or chain missing');
      return;
    }

    try {
      const chainConfig = getChainConfig(selectedChain);
      
      const paymentInfo = {
        address: address,
        chainId: chainConfig.chainId,
        chainName: chainConfig.name,
        tokenAddress: selectedToken === 'native' ? 'native' : selectedToken,
        tokenSymbol: selectedToken === 'native' 
          ? chainConfig.nativeCurrency.symbol 
          : 'TOKEN',
        amount: amount || undefined,
        timestamp: Date.now(),
      };

      // Use comprehensive JSON format
      const qrDataToSet = JSON.stringify(paymentInfo);
      setQrData(qrDataToSet);
    } catch (error) {
      console.error('Error generating QR data:', error);
      setQrData(address);
    }
  };

  const copyAddress = async () => {
    if (address) {
      await Clipboard.setStringAsync(address);
      Alert.alert('Copied!', 'Wallet address copied to clipboard');
    }
  };

  const copyQRData = async () => {
    if (qrData) {
      await Clipboard.setStringAsync(qrData);
      Alert.alert('Copied!', 'Payment information copied to clipboard');
    }
  };

  const handleNFCSend = async () => {
    console.log('=== RECEIVE: Starting NFC send (broadcasting payment data) ===');
    setShowNFC(true);
    
    try {
      const chainConfig = getChainConfig(selectedChain);
      
      const paymentData = {
        address: address,
        amount: amount || '0',
        chain_id: chainConfig.chainId.toString(),
        asset: selectedToken === 'native' ? chainConfig.nativeCurrency.symbol : 'TOKEN',
        chain: selectedChain,
        token_address: selectedToken === 'native' ? null : selectedToken
      };

      console.log('=== RECEIVE: Payment data to send ===', paymentData);
      
      await sendMessage(paymentData);
      
      Alert.alert(
        'NFC Payment Request Active',
        'Your payment request is now being broadcast via NFC. Other devices can tap to receive the payment details.',
        [
          {
            text: 'Stop NFC',
            onPress: () => {
              stopSession();
              setShowNFC(false);
            }
          },
          {
            text: 'Keep Active',
            style: 'default'
          }
        ]
      );
    } catch (error) {
      console.error('=== RECEIVE: Error in NFC send ===', error);
      setShowNFC(false);
      Alert.alert('NFC Error', 'Failed to start NFC send. Please try again.');
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getTokenSymbol = () => {
    if (selectedToken === 'native') {
      return getChainConfig(selectedChain).nativeCurrency.symbol;
    }
    return 'TOKEN';
  };

  const handleClose = () => {
    // Stop NFC operations when closing
    if (showNFC) {
      stopSession();
      setShowNFC(false);
    }
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  if (!isVisible) return null;

  if (!address) {
    return (
      <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.container, { backgroundColor }]}>
          <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={backgroundColor} />
          
          <View style={styles.centerContainer}>
            <View style={[styles.errorCard, { backgroundColor: surfaceColor, borderColor }]}>
              <Ionicons name="wallet-outline" size={48} color={textSecondary} />
              <Text style={[styles.errorTitle, { color: textPrimary }]}>
                No Wallet Connected
              </Text>
              <Text style={[styles.errorText, { color: textSecondary }]}>
                Please connect your wallet first to generate receive QR codes
              </Text>
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: '#2563EB' }]}
                onPress={handleClose}
              >
                <Text style={styles.primaryButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={backgroundColor} />
        
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: surfaceColor, borderBottomColor: borderColor }]}>
            <View style={styles.headerContent}>
              <View style={{ width: 40 }} />
              <Text style={[styles.headerTitle, { color: textPrimary }]}>Receive</Text>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close" size={24} color={textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* QR Code Section */}
            <View style={[styles.qrSection, { backgroundColor: surfaceColor, borderColor }]}>
              <View style={styles.qrContainer}>
                <View style={styles.qrCard}>
                  {qrData ? (
                    <QRCode 
                      value={qrData} 
                      size={200} 
                      color={isDark ? '#2563EB' : '#1F2937'}
                      backgroundColor={isDark ? '#F9FAFB' : '#FFFFFF'}
                      logoSize={30}
                      logoBackgroundColor="transparent"
                    />
                  ) : (
                    <View style={styles.qrPlaceholder}>
                      <Ionicons name="qr-code-outline" size={64} color={textSecondary} />
                      <Text style={[styles.qrPlaceholderText, { color: textSecondary }]}>
                        Generating QR Code...
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.qrInfo}>
                  <Text style={[styles.qrTitle, { color: textPrimary }]}>
                    Payment QR Code
                  </Text>
                  <Text style={[styles.qrSubtitle, { color: textSecondary }]}>
                    Scan to send {getTokenSymbol()} on {getChainConfig(selectedChain).name}
                  </Text>
                </View>
              </View>
            </View>

            {/* Address Section */}
            <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="wallet-outline" size={20} color="#2563EB" />
                <Text style={[styles.sectionTitle, { color: textPrimary }]}>Wallet Address</Text>
              </View>
              
              <View style={[styles.addressCard, { 
                backgroundColor: isDark ? '#111827' : '#F9FAFB',
                borderColor 
              }]}>
                <Text style={[styles.addressText, { color: textPrimary }]}>
                  {address}
                </Text>
                <TouchableOpacity onPress={copyAddress} style={styles.copyButton}>
                  <Ionicons name="copy-outline" size={16} color="#2563EB" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Network Selection */}
            <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="globe-outline" size={20} color="#10B981" />
                <Text style={[styles.sectionTitle, { color: textPrimary }]}>Network</Text>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.optionsScroll}
              >
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
                          borderColor: isActive ? '#10B981' : borderColor,
                          borderWidth: isActive ? 2 : 1
                        }
                      ]}
                      onPress={() => setSelectedChain(chain)}
                    >
                      <View style={[
                        styles.optionIcon,
                        { backgroundColor: isActive ? '#10B981' : isDark ? '#374151' : '#E5E7EB' }
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
                        { color: isActive ? '#10B981' : textPrimary }
                      ]}>
                        {config.name}
                      </Text>
                      <Text style={[styles.optionSubtext, { color: textSecondary }]}>
                        ID: {config.chainId}
                      </Text>
                      {isActive && (
                        <View style={styles.activeIndicator}>
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Token Selection */}
            <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="layers-outline" size={20} color="#F59E0B" />
                <Text style={[styles.sectionTitle, { color: textPrimary }]}>Token</Text>
              </View>
              
              <TouchableOpacity
                style={[
                  styles.tokenCard,
                  { 
                    backgroundColor: isDark ? '#111827' : '#F9FAFB',
                    borderColor: selectedToken === 'native' ? '#F59E0B' : borderColor,
                    borderWidth: selectedToken === 'native' ? 2 : 1
                  }
                ]}
                onPress={() => setSelectedToken('native')}
              >
                <View style={[
                  styles.tokenIcon,
                  { backgroundColor: selectedToken === 'native' ? '#F59E0B' : isDark ? '#374151' : '#E5E7EB' }
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
                    { color: selectedToken === 'native' ? '#F59E0B' : textPrimary }
                  ]}>
                    {getChainConfig(selectedChain).nativeCurrency.symbol}
                  </Text>
                  <Text style={[styles.tokenLabel, { color: textSecondary }]}>
                    Native Token
                  </Text>
                </View>
                {selectedToken === 'native' && (
                  <Ionicons name="checkmark-circle" size={20} color="#F59E0B" />
                )}
              </TouchableOpacity>
            </View>

            {/* Amount Section (Optional) */}
            <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calculator-outline" size={20} color="#6366F1" />
                <Text style={[styles.sectionTitle, { color: textPrimary }]}>Amount (Optional)</Text>
              </View>
              
              <View style={[styles.amountContainer, { 
                backgroundColor: isDark ? '#111827' : '#F9FAFB',
                borderColor 
              }]}>
                <TextInput
                  style={[styles.amountInput, { color: textPrimary }]}
                  placeholder="0.0"
                  placeholderTextColor={textSecondary}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
                <Text style={[styles.amountSymbol, { color: textSecondary }]}>
                  {getTokenSymbol()}
                </Text>
              </View>
              <Text style={[styles.amountHint, { color: textSecondary }]}>
                Leave empty to receive any amount
              </Text>
            </View>

            {/* Payment Summary */}
            <View style={[styles.summarySection, { backgroundColor: surfaceColor, borderColor }]}>
              <Text style={[styles.summaryTitle, { color: textPrimary }]}>
                Payment Information
              </Text>
              
              <View style={styles.summaryContent}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: textSecondary }]}>Network</Text>
                  <Text style={[styles.summaryValue, { color: textPrimary }]}>
                    {getChainConfig(selectedChain).name}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: textSecondary }]}>Token</Text>
                  <Text style={[styles.summaryValue, { color: textPrimary }]}>
                    {getTokenSymbol()}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: textSecondary }]}>Address</Text>
                  <Text style={[styles.summaryValue, { color: textPrimary }]}>
                    {formatAddress(address)}
                  </Text>
                </View>
                {amount && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: textSecondary }]}>Amount</Text>
                    <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                      {amount} {getTokenSymbol()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={[styles.actionButtons, { backgroundColor: surfaceColor, borderTopColor: borderColor }]}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
              onPress={copyAddress}
            >
              <Ionicons name="copy-outline" size={20} color={textPrimary} />
              <Text style={[styles.actionButtonText, { color: textPrimary }]}>
                Copy Address
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryActionButton, { backgroundColor: '#2563EB' }]}
              onPress={copyQRData}
            >
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                Share QR
              </Text>
            </TouchableOpacity>
          </View>

          {/* NFC Button */}
          <View style={styles.nfcButtonContainer}>
            <TouchableOpacity 
              style={styles.nfcButton} 
              onPress={handleNFCSend}
            >
              <Ionicons name="phone-portrait-outline" size={20} color="#ffffff" />
              <Text style={styles.nfcButtonText}>📱 Create Payment Request</Text>
            </TouchableOpacity>
          </View>

          {/* NFC Status */}
          {showNFC && (
            <View style={[styles.nfcStatusContainer, { backgroundColor: surfaceColor, borderColor }]}>
              <View style={styles.nfcStatusHeader}>
                <Ionicons name="phone-portrait" size={20} color="#10B981" />
                <Text style={[styles.nfcStatusTitle, { color: textPrimary }]}>
                  NFC Broadcasting
                </Text>
              </View>
              <Text style={[styles.nfcStatusText, { color: textSecondary }]}>
                {isEnabled ? 'Payment request is being broadcast...' : 'Initializing...'}
              </Text>
              <TouchableOpacity 
                style={[styles.nfcStopButton, { backgroundColor: '#EF4444' }]}
                onPress={() => {
                  stopSession();
                  setShowNFC(false);
                }}
              >
                <Text style={styles.nfcStopButtonText}>Stop NFC</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
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
  
  // Error State
  errorCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 300,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
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
  
  // QR Section
  qrSection: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
    minWidth: 240,
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  qrPlaceholderText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  qrInfo: {
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  qrSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  
  // Address
  addressCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  copyButton: {
    padding: 8,
    marginLeft: 8,
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
    minWidth: 100,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
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
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  optionSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  
  // Token
  tokenCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tokenIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  tokenLabel: {
    fontSize: 14,
  },
  
  // Amount
  amountContainer: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
  },
  amountSymbol: {
    fontSize: 16,
    marginLeft: 8,
  },
  amountHint: {
    fontSize: 12,
    marginTop: 8,
  },
  
  // Summary
  summarySection: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryContent: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 0.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryActionButton: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Primary Button
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nfcButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nfcButton: {
    backgroundColor: '#333333',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#555555',
  },
  nfcButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    marginLeft: 8,
  },
  
  // NFC Status
  nfcStatusContainer: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  nfcStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nfcStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  nfcStatusText: {
    fontSize: 14,
    marginBottom: 16,
  },
  nfcStopButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  nfcStopButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
