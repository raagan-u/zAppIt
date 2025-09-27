import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { getAvailableChains, getChainConfig } from '../../constants/config';
import { useWallet } from '../../contexts/WalletContext';
import { getMultipleTokenBalances, getNativeBalance, TokenBalance } from '../../utils/tokenUtils';
import { NFC } from '../impls/NFC';
import { PaymentInfo, QR } from '../impls/QR';

interface SendProps {
  onClose: () => void;
}

export const Send: React.FC<SendProps> = ({ onClose }) => {
  const { wallet, provider, currentChain } = useWallet();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState(currentChain);
  const [selectedToken, setSelectedToken] = useState<'native' | string>('native');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<TokenBalance[]>([]);
  const [nativeBalance, setNativeBalance] = useState('0');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showNFC, setShowNFC] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<string>('');
  const [estimatedFee, setEstimatedFee] = useState<string>('');
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  const availableChains = getAvailableChains();

  useEffect(() => {
    loadBalances();
  }, [selectedChain]);

  const loadBalances = async () => {
    if (!wallet || !provider) return;

    try {
      const chainConfig = getChainConfig(selectedChain);
      const chainProvider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
      
      // Load native balance
      const nativeBal = await getNativeBalance(chainProvider, wallet.address);
      setNativeBalance(parseFloat(nativeBal).toFixed(6));

      // Load token balances
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
        balance: nativeBalance,
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

  const estimateGasAndFee = async () => {
    if (!wallet || !provider || !recipientAddress || !amount) {
      setGasEstimate('');
      setEstimatedFee('');
      return;
    }

    try {
      const chainConfig = getChainConfig(selectedChain);
      const chainProvider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
      const chainWallet = new ethers.Wallet(wallet.privateKey, chainProvider);

      let gasEstimate: bigint;
      let gasPrice: bigint;

      if (selectedToken === 'native') {
        // Estimate gas for native transfer
        gasEstimate = await chainProvider.estimateGas({
          from: wallet.address,
          to: recipientAddress,
          value: ethers.parseEther(amount),
        });
        gasPrice = await chainProvider.getFeeData().then(feeData => feeData.gasPrice || BigInt(0));
      } else {
        // Estimate gas for ERC-20 transfer
        const token = availableTokens.find(t => t.token.address === selectedToken);
        if (!token) return;

        const ERC20_ABI = [
          'function transfer(address to, uint256 amount) returns (bool)',
        ];

        const contract = new ethers.Contract(token.token.address, ERC20_ABI, chainWallet);
        const amountWei = ethers.parseUnits(amount, token.token.decimals);
        
        gasEstimate = await contract.transfer.estimateGas(recipientAddress, amountWei);
        gasPrice = await chainProvider.getFeeData().then(feeData => feeData.gasPrice || BigInt(0));
      }

      const fee = gasEstimate * gasPrice;
      setGasEstimate(gasEstimate.toString());
      setEstimatedFee(ethers.formatEther(fee));
    } catch (error) {
      console.error('Gas estimation error:', error);
      setGasEstimate('');
      setEstimatedFee('');
    }
  };

  // Estimate gas when inputs change
  useEffect(() => {
    const timeoutId = setTimeout(estimateGasAndFee, 500);
    return () => clearTimeout(timeoutId);
  }, [recipientAddress, amount, selectedToken, selectedChain]);

  const handleTransfer = async () => {
    if (!wallet || !provider) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    if (!recipientAddress || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!ethers.isAddress(recipientAddress)) {
      Alert.alert('Error', 'Invalid recipient address');
      return;
    }

    const tokenInfo = getSelectedTokenInfo();
    if (!tokenInfo) {
      Alert.alert('Error', 'Invalid token selection');
      return;
    }

    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amountFloat > parseFloat(tokenInfo.balance)) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    // Check if recipient is the same as sender
    if (recipientAddress.toLowerCase() === wallet.address.toLowerCase()) {
      Alert.alert('Error', 'Cannot send to yourself');
      return;
    }

    try {
      setIsLoading(true);
      const chainConfig = getChainConfig(selectedChain);
      const chainProvider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
      const chainWallet = new ethers.Wallet(wallet.privateKey, chainProvider);

      let tx: any;
      let transactionType: string;

      if (selectedToken === 'native') {
        // Send native currency
        transactionType = 'Native Transfer';
        tx = await chainWallet.sendTransaction({
          to: recipientAddress,
          value: ethers.parseEther(amount),
        });
      } else {
        // Send ERC-20 token
        const token = availableTokens.find(t => t.token.address === selectedToken);
        if (!token) {
          Alert.alert('Error', 'Token not found');
          return;
        }

        transactionType = 'ERC-20 Transfer';
        const ERC20_ABI = [
          'function transfer(address to, uint256 amount) returns (bool)',
          'function decimals() view returns (uint8)',
          'function symbol() view returns (string)',
        ];

        const contract = new ethers.Contract(token.token.address, ERC20_ABI, chainWallet);
        const amountWei = ethers.parseUnits(amount, token.token.decimals);
        
        tx = await contract.transfer(recipientAddress, amountWei);
      }

      // Store transaction details
      const transactionDetails = {
        hash: tx.hash,
        type: transactionType,
        from: wallet.address,
        to: recipientAddress,
        amount: amount,
        token: tokenInfo.symbol,
        chain: chainConfig.name,
        timestamp: new Date().toISOString(),
      };
      setLastTransaction(transactionDetails);

      // Wait for transaction confirmation
      Alert.alert(
        'Transaction Sent!', 
        `Transaction hash: ${tx.hash}\n\nWaiting for confirmation...`,
        [
          {
            text: 'View Details',
            onPress: () => {
              // You could navigate to a transaction details screen here
              console.log('Transaction details:', transactionDetails);
            }
          },
          {
            text: 'OK',
            onPress: () => {
              // Reset form and close
              setRecipientAddress('');
              setAmount('');
              setGasEstimate('');
              setEstimatedFee('');
              onClose();
            }
          }
        ]
      );

      // Wait for transaction receipt
      try {
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt);
        
        // Reload balances after successful transaction
        await loadBalances();
        
        Alert.alert(
          'Transaction Confirmed!',
          `Transaction ${tx.hash} has been confirmed in block ${receipt.blockNumber}`
        );
      } catch (receiptError) {
        console.error('Transaction failed:', receiptError);
        Alert.alert(
          'Transaction Failed',
          `Transaction ${tx.hash} failed to confirm. Please check the transaction status.`
        );
      }

    } catch (error) {
      console.error('Transfer error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for gas fee';
        } else if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction rejected by user';
        } else if (error.message.includes('gas')) {
          errorMessage = 'Gas estimation failed or insufficient gas';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Transfer Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQRScan = () => {
    setShowQRScanner(true);
  };

  const handleNFC = () => {
    setShowNFC(true);
  };

  const handlePaymentInfoReceived = (paymentInfo: PaymentInfo) => {
    // Auto-fill form with payment info from QR/NFC
    setRecipientAddress(paymentInfo.recipientAddress);
    
    if (paymentInfo.amount) {
      setAmount(paymentInfo.amount);
    }
    
    if (paymentInfo.chainId) {
      // Find chain by chainId
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

  const tokenInfo = getSelectedTokenInfo();

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Send</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Recipient Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recipient Address</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="0x..."
                placeholderTextColor="#666666"
                value={recipientAddress}
                onChangeText={setRecipientAddress}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.qrButton} onPress={handleQRScan}>
                <Text style={styles.qrButtonText}>QR</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Chain Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Chain</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chainScroll}>
              {availableChains.map((chain) => (
                <TouchableOpacity
                  key={chain}
                  style={[
                    styles.chainButton,
                    selectedChain === chain && styles.selectedChainButton
                  ]}
                  onPress={() => setSelectedChain(chain)}
                >
                  <Text style={[
                    styles.chainButtonText,
                    selectedChain === chain && styles.selectedChainButtonText
                  ]}>
                    {getChainConfig(chain).name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Token Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Token</Text>
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
                <Text style={styles.tokenBalance}>
                  {nativeBalance}
                </Text>
              </TouchableOpacity>
              
              {availableTokens.map((token) => (
                <TouchableOpacity
                  key={token.token.address}
                  style={[
                    styles.tokenButton,
                    selectedToken === token.token.address && styles.selectedTokenButton
                  ]}
                  onPress={() => setSelectedToken(token.token.address)}
                >
                  <Text style={[
                    styles.tokenButtonText,
                    selectedToken === token.token.address && styles.selectedTokenButtonText
                  ]}>
                    {token.token.symbol}
                  </Text>
                  <Text style={styles.tokenBalance}>
                    {token.formattedBalance}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="0.0"
              placeholderTextColor="#666666"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            {tokenInfo && (
              <Text style={styles.balanceText}>
                Balance: {tokenInfo.balance} {tokenInfo.symbol}
              </Text>
            )}
          </View>

          {/* Gas Estimation */}
          {gasEstimate && estimatedFee && (
            <View style={styles.gasInfoContainer}>
              <Text style={styles.gasInfoTitle}>Transaction Fee</Text>
              <View style={styles.gasInfoRow}>
                <Text style={styles.gasInfoLabel}>Gas Limit:</Text>
                <Text style={styles.gasInfoValue}>{gasEstimate}</Text>
              </View>
              <View style={styles.gasInfoRow}>
                <Text style={styles.gasInfoLabel}>Estimated Fee:</Text>
                <Text style={styles.gasInfoValue}>{parseFloat(estimatedFee).toFixed(6)} {getChainConfig(selectedChain).nativeCurrency.symbol}</Text>
              </View>
            </View>
          )}

          {/* Transfer Button */}
          <TouchableOpacity
            style={[styles.transferButton, isLoading && styles.disabledButton]}
            onPress={handleTransfer}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.transferButtonText}>Transfer</Text>
            )}
          </TouchableOpacity>

          {/* NFC Button */}
          <TouchableOpacity style={styles.nfcButton} onPress={handleNFC}>
            <Text style={styles.nfcButtonText}>📱 NFC Transfer</Text>
          </TouchableOpacity>
        </ScrollView>

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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
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
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter',
  },
  qrButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  qrButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
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
  tokenBalance: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  balanceText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter',
    marginTop: 8,
  },
  transferButton: {
    backgroundColor: '#00ff88',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  transferButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  nfcButton: {
    backgroundColor: '#333333',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555555',
  },
  nfcButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  gasInfoContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  gasInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  gasInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gasInfoLabel: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter',
  },
  gasInfoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
});