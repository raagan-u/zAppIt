import { Ionicons } from '@expo/vector-icons';
import { ethers } from 'ethers';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAvailableChains, getChainConfig } from '../../constants/config';
import { useWallet } from '../../contexts/WalletContext';

interface ReceiveProps {
  onClose: () => void;
}

export const Receive: React.FC<ReceiveProps> = ({ onClose }) => {
  const { wallet, currentChain, switchChain, isLoading } = useWallet();
  const availableChains = getAvailableChains();
  const [selectedChain, setSelectedChain] = useState(currentChain || availableChains[0]);
  const [selectedToken, setSelectedToken] = useState<'native' | string>('native');
  const [amount, setAmount] = useState('');
  const [qrData, setQrData] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    generateQRData();
  }, [selectedChain, selectedToken, amount, wallet]);

  // Update selected chain when currentChain changes
  useEffect(() => {
    if (currentChain && availableChains.includes(currentChain)) {
      setSelectedChain(currentChain);
    }
  }, [currentChain, availableChains]);

  const generateQRData = () => {
    if (!wallet || !selectedChain) {
      console.log('Cannot generate QR: wallet or chain missing', { wallet: !!wallet, selectedChain });
      return;
    }

    try {
      const chainConfig = getChainConfig(selectedChain);
      
      // Create comprehensive payment info
      const paymentInfo = {
        address: wallet.address,
        chainId: chainConfig.chainId,
        chainName: chainConfig.name,
        tokenAddress: selectedToken === 'native' ? 'native' : selectedToken,
        tokenSymbol: selectedToken === 'native' 
          ? chainConfig.nativeCurrency.symbol 
          : 'TOKEN',
        amount: amount || undefined,
        timestamp: Date.now(),
      };

      // Generate QR data in multiple formats
      const qrFormats = {
        // Simple address format
        simple: wallet.address,
        
        // JSON format with all payment info
        json: JSON.stringify(paymentInfo),
        
        // EIP-681 format for Ethereum payments
        eip681: amount && amount !== '' && !isNaN(parseFloat(amount))
          ? `ethereum:${wallet.address}@${chainConfig.chainId}/transfer?uint256=${ethers.parseEther(amount).toString()}`
          : `ethereum:${wallet.address}@${chainConfig.chainId}`,
      };

      // Use JSON format as default (most comprehensive)
      const qrDataToSet = qrFormats.json;
      console.log('Generated QR data:', qrDataToSet);
      setQrData(qrDataToSet);
    } catch (error) {
      console.error('Error generating QR data:', error);
      // Fallback to simple address
      setQrData(wallet.address);
    }
  };

  const copyAddress = async () => {
    if (wallet?.address) {
      await Clipboard.setStringAsync(wallet.address);
      Alert.alert('Copied!', 'Wallet address copied to clipboard');
    }
  };

  const copyQRData = async () => {
    if (qrData) {
      await Clipboard.setStringAsync(qrData);
      Alert.alert('Copied!', 'QR code data copied to clipboard');
    }
  };

  const handleChainSwitch = async (chainName: string) => {
    if (chainName === selectedChain || isLoading) {
      return; // Don't switch if already selected or if switching is in progress
    }

    try {
      await switchChain(chainName);
      setSelectedChain(chainName);
    } catch (error) {
      console.error('Error switching chain:', error);
      Alert.alert('Error', 'Failed to switch chain. Please try again.');
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getTokenSymbol = () => {
    if (selectedToken === 'native') {
      return getChainConfig(selectedChain).nativeCurrency.symbol;
    }
    // In a real app, you'd get this from token config
    return 'TOKEN';
  };

  if (!wallet) {
    return (
      <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Receive</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <Ionicons name="wallet-outline" size={64} color="#666666" />
            <Text style={styles.errorTitle}>No Wallet Connected</Text>
            <Text style={styles.errorText}>
              Please connect your wallet first to generate receive QR codes
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.title}>Receive</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* QR Code Display */}
            <View style={styles.qrContainer}>
              <View style={styles.qrCard}>
                {qrData ? (
                  <QRCode 
                    value={qrData} 
                    size={200} 
                    color="#00ff88" 
                    backgroundColor="white"
                  />
                ) : (
                  <View style={styles.qrPlaceholder}>
                    <Ionicons name="qr-code-outline" size={64} color="#666666" />
                    <Text style={styles.qrPlaceholderText}>Generating QR Code...</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.qrInfo}>
                <Text style={styles.qrTitle}>Payment QR Code</Text>
                <Text style={styles.qrSubtitle}>
                  {qrData ? 'Contains wallet address and payment details' : 'Loading payment information...'}
                </Text>
              </View>
            </View>

            {/* Address Display */}
            <View style={styles.addressContainer}>
              <Text style={styles.addressLabel}>Wallet Address</Text>
              <View style={styles.addressCard}>
                <Text style={styles.addressText}>{wallet.address}</Text>
                <TouchableOpacity onPress={copyAddress} style={styles.addressCopyButton}>
                  <Ionicons name="copy-outline" size={16} color="#00ff88" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Chain Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chain</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chainScroll}>
                {availableChains.map((chain) => (
                  <TouchableOpacity
                    key={chain}
                    style={[
                      styles.chainButton,
                      selectedChain === chain && styles.selectedChainButton,
                      isLoading && styles.chainButtonDisabled
                    ]}
                    onPress={() => handleChainSwitch(chain)}
                    disabled={isLoading}
                  >
                    <Text style={[
                      styles.chainButtonText,
                      selectedChain === chain && styles.selectedChainButtonText,
                      isLoading && styles.chainButtonTextDisabled
                    ]}>
                      {getChainConfig(chain).name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Token Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Token</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tokenScroll}>
                <TouchableOpacity
                  style={[
                    styles.tokenButton,
                    selectedToken === 'native' && styles.selectedTokenButton
                  ]}
                  onPress={() => setSelectedToken('native')}
                >
                  <Text style={[
                    styles.tokenButtonText,
                    selectedToken === 'native' && styles.selectedTokenButtonText
                  ]}>
                    {getChainConfig(selectedChain).nativeCurrency.symbol}
                  </Text>
                  <Text style={styles.tokenLabel}>Native</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Amount Input (Optional) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Amount (Optional)</Text>
              <View style={styles.amountContainer}>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.0"
                  placeholderTextColor="#666666"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.amountSymbol}>{getTokenSymbol()}</Text>
              </View>
              <Text style={styles.amountHint}>
                Leave empty to receive any amount
              </Text>
            </View>

            {/* Payment Info Summary */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Payment Information</Text>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Chain:</Text>
                <Text style={styles.summaryValue}>{getChainConfig(selectedChain).name}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Token:</Text>
                <Text style={styles.summaryValue}>{getTokenSymbol()}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Address:</Text>
                <Text style={styles.summaryValue}>{formatAddress(wallet.address)}</Text>
              </View>
              {amount && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Amount:</Text>
                  <Text style={styles.summaryValue}>{amount} {getTokenSymbol()}</Text>
                </View>
              )}
            </View>

            {/* Debug Info */}
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug Info</Text>
              <Text style={styles.debugText}>Wallet: {wallet ? 'Connected' : 'Not connected'}</Text>
              <Text style={styles.debugText}>Selected Chain: {selectedChain}</Text>
              <Text style={styles.debugText}>QR Data Length: {qrData.length}</Text>
              <Text style={styles.debugText}>Available Chains: {availableChains.join(', ')}</Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.copyButton} onPress={copyQRData}>
              <Ionicons name="copy-outline" size={20} color="#000000" />
              <Text style={styles.copyButtonText}>Copy QR Data</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.shareButton} 
              onPress={() => setShowQRModal(true)}
            >
              <Ionicons name="share-outline" size={20} color="#ffffff" />
              <Text style={styles.shareButtonText}>Share QR</Text>
            </TouchableOpacity>
          </View>

          {/* NFC Button */}
          <View style={styles.nfcButtonContainer}>
            <TouchableOpacity 
              style={styles.nfcButton} 
              onPress={() => {
                alert('NFC Button Clicked!');
                console.log('=== RECEIVE: NFC button clicked ===');
                console.log('=== RECEIVE: Navigating to NFC screen ===');
                try {
                  router.push({
                    pathname: '/(tabs)/nfc',
                    params: {
                      flow: 'receive',
                      walletAddress: wallet?.address,
                      amount: amount,
                      chain: selectedChain,
                      asset: selectedToken === 'native' ? getChainConfig(selectedChain).nativeCurrency.symbol : 'TOKEN',
                    },
                  } as any);
                  console.log('=== RECEIVE: Navigation call completed ===');
                } catch (error) {
                  console.error('=== RECEIVE: Navigation error ===', error);
                }
              }}
            >
              <Ionicons name="phone-portrait-outline" size={20} color="#ffffff" />
              <Text style={styles.nfcButtonText}>📱 Create Payment Request</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  qrCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  qrPlaceholderText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter',
    marginTop: 12,
    textAlign: 'center',
  },
  qrInfo: {
    alignItems: 'center',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  addressContainer: {
    marginBottom: 24,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  addressCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  addressCopyButton: {
    padding: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  chainScroll: {
    flexDirection: 'row',
  },
  chainButton: {
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  selectedChainButton: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  chainButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  selectedChainButtonText: {
    color: '#000000',
  },
  chainButtonDisabled: {
    opacity: 0.5,
  },
  chainButtonTextDisabled: {
    color: '#666666',
  },
  tokenScroll: {
    flexDirection: 'row',
  },
  tokenButton: {
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    minWidth: 80,
  },
  selectedTokenButton: {
    backgroundColor: '#00ff88',
    borderColor: '#00ff88',
  },
  tokenButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  selectedTokenButtonText: {
    color: '#000000',
  },
  tokenLabel: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  amountContainer: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  amountSymbol: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Inter',
    marginLeft: 8,
  },
  amountHint: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter',
    marginTop: 8,
  },
  summaryContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter',
  },
  summaryValue: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  copyButton: {
    flex: 1,
    backgroundColor: '#00ff88',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    marginLeft: 8,
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#333333',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#555555',
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    marginLeft: 8,
  },
  debugContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#444444',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00ff88',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#cccccc',
    fontFamily: 'Inter',
    marginBottom: 4,
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
});
