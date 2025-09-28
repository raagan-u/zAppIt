import { Ionicons } from '@expo/vector-icons';
import { ethers } from 'ethers';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme
} from 'react-native';
import { getChainConfig } from '../../constants/config';
import { useWallet } from '../../contexts/WalletContext';
import { OrderAsset, QuoteResult } from '../../types/garden';
import { createOrder } from './CreateOrder';
import { getQuote } from './GetQuote';

interface SwapProps {
  apiKey: string;
}

interface SwapState {
  sourceAsset: string;
  destinationAsset: string;
  sourceAmount: string;
  destinationAmount: string;
  sourceOwner: string;
  destinationOwner: string;
}

const Swap: React.FC<SwapProps> = ({ apiKey }) => {
  const { wallet, isConnected, currentChain } = useWallet();
  
  // Get URLs from environment and chain config
  const quoteUrl = process.env.EXPO_PUBLIC_QUOTE_URL || 'https://mainnet.garden.finance/v2/quote';
  const orderUrl = process.env.EXPO_PUBLIC_ORDER_URL || 'https://mainnet.garden.finance/v2/orders';
  const chainConfig = getChainConfig(currentChain);
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'quote' | 'orderCreated' | 'executing' | 'complete'>('input');
  const [quote, setQuote] = useState<QuoteResult[] | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuoteResult | null>(null);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [swapResult, setSwapResult] = useState<any>(null);
  const [fadeAnim] = useState(new Animated.Value(1));
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [swapState, setSwapState] = useState<SwapState>({
    sourceAsset: '',
    destinationAsset: '',
    sourceAmount: '',
    destinationAmount: '',
    sourceOwner: '',
    destinationOwner: '',
  });

  const updateSwapState = useCallback((field: keyof SwapState, value: string) => {
    setSwapState(prev => ({ ...prev, [field]: value }));
  }, []);

  const isFormValid = useMemo(() => {
    return (
      swapState.sourceAsset &&
      swapState.destinationAsset &&
      swapState.sourceAmount &&
      swapState.sourceOwner &&
      swapState.destinationOwner
    );
  }, [swapState]);

  const backgroundColor = isDark ? '#0F0F0F' : '#FAFAFA';
  const surfaceColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDark ? '#F9FAFB' : '#1F2937';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const handleGetQuote = useCallback(async () => {
    if (!isFormValid) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setStep('quote');
      
      const quotes = await getQuote({
        url: quoteUrl,
        fromAsset: swapState.sourceAsset,
        toAsset: swapState.destinationAsset,
        fromAmount: swapState.sourceAmount,
        apiKey,
      });

      setQuote(quotes);
      Alert.alert('Success', `Found ${quotes.length} quote(s)`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get quote';
      Alert.alert('Error', errorMessage);
      setStep('input');
    } finally {
      setLoading(false);
    }
  }, [isFormValid, swapState, quoteUrl, apiKey]);

  const handleSelectQuote = useCallback((selectedQuote: QuoteResult) => {
    setSelectedQuote(selectedQuote);
    // Update destination amount based on selected quote
    updateSwapState('destinationAmount', selectedQuote.destination.amount);
  }, [updateSwapState]);

  const handleCreateOrder = useCallback(async (selectedQuoteForOrder: QuoteResult) => {
    if (!isConnected || !wallet) {
      Alert.alert('Error', 'Please connect wallet to continue');
      return;
    }

    try {
      setLoading(true);
      setSelectedQuote(selectedQuoteForOrder);
      
      // Auto-fill destination amount from the selected quote
      updateSwapState('destinationAmount', selectedQuoteForOrder.destination.amount);

      const source: OrderAsset = {
        asset: swapState.sourceAsset,
        owner: swapState.sourceOwner,
        amount: swapState.sourceAmount,
      };

      const destination: OrderAsset = {
        asset: swapState.destinationAsset,
        owner: swapState.destinationOwner,
        amount: selectedQuoteForOrder.destination.amount, // Use quote's destination amount
      };

      const result = await createOrder({
        url: orderUrl,
        source,
        destination,
        apiKey,
      });

      console.log('🎯 Create Order Response:', JSON.stringify(result, null, 2));
      setOrderResult(result);
      setStep('orderCreated');
      Alert.alert('Success', 'Order created successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isConnected, wallet, swapState, orderUrl, apiKey, updateSwapState]);

  const handleExecuteSwap = useCallback(async () => {
    if (!orderResult || !wallet) {
      Alert.alert('Error', 'Order data or wallet not available');
      return;
    }

    try {
      setLoading(true);
      setStep('executing');

      console.log('🚀 Starting swap execution with order:', orderResult.order_id);
      console.log('💰 Wallet address:', wallet.address);
      console.log('🔗 Transaction chain ID:', orderResult.initiate_transaction.chain_id);
      
      // Log swap details
      console.log('📊 SWAP DETAILS:');
      console.log('  From:', swapState.sourceAsset, '→ Amount:', swapState.sourceAmount);
      console.log('  To:', swapState.destinationAsset, '→ Amount:', swapState.destinationAmount);
      console.log('  Source Owner:', swapState.sourceOwner);
      console.log('  Destination Owner:', swapState.destinationOwner);

      // Use the chain ID from the transaction to determine the correct RPC URL
      let rpcUrl;
      if (orderResult.initiate_transaction.chain_id === 421614) {
        // Arbitrum Sepolia
        rpcUrl = process.env.EXPO_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
      } else if (orderResult.initiate_transaction.chain_id === 11155111) {
        // Ethereum Sepolia
        rpcUrl = process.env.EXPO_PUBLIC_SEPOLIA_RPC_URL || 'https://eth-sepolia.public.blastapi.io';
      } else if (orderResult.initiate_transaction.chain_id === 137) {
        // Polygon
        rpcUrl = process.env.EXPO_PUBLIC_POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology/';
      } else {
        throw new Error(`Unsupported chain ID: ${orderResult.initiate_transaction.chain_id}`);
      }

      console.log('🌐 Using RPC URL:', rpcUrl);

      // Create provider for the correct chain
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const nativeBalance = await provider.getBalance(wallet.address);
      console.log('💳 Native ETH balance on target chain:', ethers.formatEther(nativeBalance), 'ETH');
      
      // Check source token balance
      console.log('🔍 CHECKING SOURCE TOKEN BALANCE:');
      const sourceAssetParts = swapState.sourceAsset.split(':');
      const sourceChain = sourceAssetParts[0];
      const sourceToken = sourceAssetParts[1];
      
      console.log('  Source chain:', sourceChain);
      console.log('  Source token:', sourceToken);
      
      try {
        // Get the source chain RPC URL
        let sourceRpcUrl;
        if (sourceChain === 'arbitrum_sepolia') {
          sourceRpcUrl = process.env.EXPO_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc';
        } else if (sourceChain === 'ethereum_sepolia') {
          sourceRpcUrl = process.env.EXPO_PUBLIC_SEPOLIA_RPC_URL || 'https://eth-sepolia.public.blastapi.io';
        } else if (sourceChain === 'polygon') {
          sourceRpcUrl = process.env.EXPO_PUBLIC_POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology/';
        } else {
          console.log('  ⚠️ Unknown source chain, skipping balance check');
          sourceRpcUrl = null;
        }
        
        if (sourceRpcUrl) {
          const sourceProvider = new ethers.JsonRpcProvider(sourceRpcUrl);
          const sourceNativeBalance = await sourceProvider.getBalance(wallet.address);
          console.log('  💰 Native balance on source chain:', ethers.formatEther(sourceNativeBalance), 'ETH');
          
          // If it's a token (not native), check token balance
          if (sourceToken && sourceToken.toLowerCase() !== 'eth' && sourceToken.toLowerCase() !== 'matic') {
            console.log('  🪙 Checking ERC-20 token balance for:', sourceToken);
            // Note: We'd need the token contract address to check ERC-20 balance
            // For now, just log that we're trying to swap a token
            console.log('  ℹ️ Token balance check requires contract address (not available in current format)');
          }
        }
      } catch (error) {
        console.log('  ❌ Error checking source balance:', error instanceof Error ? error.message : 'Unknown error');
      }

      // Get gas price with proper minimum for Arbitrum Sepolia
      const feeData = await provider.getFeeData();
      let gasPrice = feeData.gasPrice || ethers.parseUnits('25', 'gwei');
      
      // Ensure minimum gas price for Arbitrum Sepolia (25 gwei)
      const minGasPrice = ethers.parseUnits('25', 'gwei');
      if (gasPrice < minGasPrice) {
        gasPrice = minGasPrice;
        console.log('⚠️ Gas price too low, using minimum:', ethers.formatUnits(gasPrice, 'gwei'), 'gwei');
      } else {
        console.log('⛽ Current gas price:', ethers.formatUnits(gasPrice, 'gwei'), 'gwei');
      }

      // Check if we have enough balance for gas
      const gasLimit = BigInt(orderResult.initiate_transaction.gas_limit);
      const totalCost = gasLimit * gasPrice;
      console.log('💸 Estimated gas cost:', ethers.formatEther(totalCost), 'ETH');

      if (nativeBalance < totalCost) {
        throw new Error(
          `❌ Insufficient ETH balance on target chain!\n\n` +
          `💰 Your wallet: ${wallet.address}\n` +
          `💳 Current balance: ${ethers.formatEther(nativeBalance)} ETH\n` +
          `💸 Required for gas: ${ethers.formatEther(totalCost)} ETH\n\n` +
          `🔗 You need to bridge ETH to the target chain:\n` +
          `• Use Arbitrum Bridge: https://bridge.arbitrum.io\n` +
          `• Or get testnet ETH from: https://faucet.quicknode.com/arbitrum/sepolia`
        );
      }

      // Create a new wallet instance with the correct provider for this transaction
      console.log('🔧 Creating wallet with correct provider...');
      const transactionWallet = new ethers.Wallet(wallet.privateKey, provider);
      console.log('  Transaction wallet address:', transactionWallet.address);
      console.log('  Transaction wallet provider RPC:', rpcUrl);
      
      // Double-check balance with the correct provider
      const finalBalance = await provider.getBalance(transactionWallet.address);
      console.log('  Final balance check:', ethers.formatEther(finalBalance), 'ETH');
      
      // Execute the transaction with the correctly connected wallet
      const txRequest = {
        to: orderResult.initiate_transaction.to,
        data: orderResult.initiate_transaction.data,
        value: orderResult.initiate_transaction.value || '0x0',
        gasLimit: gasLimit,
        gasPrice: gasPrice,
      };

      console.log('📤 Sending transaction:', txRequest);
      const tx = await transactionWallet.sendTransaction(txRequest);
      console.log('✅ Transaction sent:', tx.hash);

      // Wait for confirmation
      console.log('⏳ Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('🎉 Transaction confirmed:', receipt);

      const swapExecutionResult = {
        orderId: orderResult.order_id,
        initiateTxHash: tx.hash,
        approvalTxHash: null, // No approval needed in this case
      };

      setSwapResult(swapExecutionResult);
      setStep('complete');
      Alert.alert('Success', `Swap executed! TX: ${tx.hash.slice(0, 10)}...`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to execute swap';
      console.error('❌ Swap execution error:', errorMessage);
      Alert.alert('Error', errorMessage);
      setStep('orderCreated');
    } finally {
      setLoading(false);
    }
  }, [orderResult, wallet]);

  const handleStartOver = useCallback(() => {
    setStep('input');
    setQuote(null);
    setSelectedQuote(null);
    setOrderResult(null);
    setSwapResult(null);
    setSwapState({
      sourceAsset: '',
      destinationAsset: '',
      sourceAmount: '',
      destinationAmount: '', // Will be set by selected quote
      sourceOwner: '',
      destinationOwner: '',
    });
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={[styles.title, { color: textPrimary }]}>Cross-Chain Swap</Text>
        <Text style={[styles.subtitle, { color: textSecondary }]}>
          Exchange assets across different blockchains
        </Text>
      </View>
      {step !== 'input' && (
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
          onPress={() => {
            if (step === 'quote') setStep('input');
            else if (step === 'orderCreated') setStep('quote');
            else handleStartOver();
          }}
        >
          <Ionicons name="arrow-back" size={20} color={textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderInputForm = () => (
    <View style={styles.formContainer}>
      {/* From Section */}
      <View style={[styles.inputCard, { backgroundColor: surfaceColor, borderColor }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="arrow-up-circle" size={24} color="#EF4444" />
          <Text style={[styles.cardTitle, { color: textPrimary }]}>From</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: textSecondary }]}>Asset</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: isDark ? '#111827' : '#F9FAFB',
              borderColor,
              color: textPrimary 
            }]}
            placeholder="e.g., arbitrum:ibtc"
            placeholderTextColor={textSecondary}
            value={swapState.sourceAsset}
            onChangeText={(text) => updateSwapState('sourceAsset', text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: textSecondary }]}>Amount</Text>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={[styles.textInput, styles.amountInput, { 
                backgroundColor: isDark ? '#111827' : '#F9FAFB',
                borderColor,
                color: textPrimary 
              }]}
              placeholder="0.0"
              placeholderTextColor={textSecondary}
              value={swapState.sourceAmount}
              onChangeText={(text) => updateSwapState('sourceAmount', text)}
              keyboardType="numeric"
            />
            <TouchableOpacity style={[styles.maxButton, { backgroundColor: '#2563EB' }]}>
              <Text style={styles.maxButtonText}>MAX</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: textSecondary }]}>Owner Address</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: isDark ? '#111827' : '#F9FAFB',
              borderColor,
              color: textPrimary 
            }]}
            placeholder="0x..."
            placeholderTextColor={textSecondary}
            value={swapState.sourceOwner}
            onChangeText={(text) => updateSwapState('sourceOwner', text)}
          />
        </View>
      </View>

      {/* Swap Icon */}
      <View style={styles.swapIconContainer}>
        <View style={[styles.swapIcon, { backgroundColor: '#2563EB' }]}>
          <Ionicons name="swap-vertical" size={24} color="#FFFFFF" />
        </View>
      </View>

      {/* To Section */}
      <View style={[styles.inputCard, { backgroundColor: surfaceColor, borderColor }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="arrow-down-circle" size={24} color="#10B981" />
          <Text style={[styles.cardTitle, { color: textPrimary }]}>To</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: textSecondary }]}>Asset</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: isDark ? '#111827' : '#F9FAFB',
              borderColor,
              color: textPrimary 
            }]}
            placeholder="e.g., bitcoin:btc"
            placeholderTextColor={textSecondary}
            value={swapState.destinationAsset}
            onChangeText={(text) => updateSwapState('destinationAsset', text)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: textSecondary }]}>Owner Address</Text>
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: isDark ? '#111827' : '#F9FAFB',
              borderColor,
              color: textPrimary 
            }]}
            placeholder="bc1..."
            placeholderTextColor={textSecondary}
            value={swapState.destinationOwner}
            onChangeText={(text) => updateSwapState('destinationOwner', text)}
          />
        </View>
      </View>

      {/* Get Quote Button */}
      <TouchableOpacity 
        style={[
          styles.primaryButton,
          { backgroundColor: isFormValid ? '#2563EB' : isDark ? '#374151' : '#E5E7EB' }
        ]}
        onPress={handleGetQuote}
        disabled={!isFormValid || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="flash" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Get Best Quote</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderQuotes = () => (
    <View style={styles.quotesContainer}>
      <Text style={[styles.sectionTitle, { color: textPrimary }]}>
        Available Quotes ({quote?.length || 0})
      </Text>
      
      <View style={styles.quotesList}>
        {quote?.map((q, index) => (
          <View key={index} style={[styles.quoteCard, { backgroundColor: surfaceColor, borderColor }]}>
            <View style={styles.quoteHeader}>
              <Text style={[styles.providerName, { color: textPrimary }]}>
                Solver: {q.solver_id}
              </Text>
              <View style={[styles.ratingBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.ratingText}>Best</Text>
              </View>
            </View>
            
            <View style={styles.quoteDetails}>
              <View style={styles.quoteRow}>
                <Text style={[styles.quoteLabel, { color: textSecondary }]}>Time</Text>
                <Text style={[styles.quoteValue, { color: textPrimary }]}>
                  {q.estimated_time}s
                </Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={[styles.quoteLabel, { color: textSecondary }]}>From</Text>
                <Text style={[styles.quoteValue, { color: textPrimary }]}>
                  {q.source.display} {q.source.asset}
                </Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={[styles.quoteLabel, { color: textSecondary }]}>To</Text>
                <Text style={[styles.quoteValue, { color: '#10B981' }]}>
                  {q.destination.display} {q.destination.asset}
                </Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={[styles.quoteLabel, { color: textSecondary }]}>You will receive</Text>
                <Text style={[styles.quoteValue, { color: '#10B981', fontWeight: '700' }]}>
                  {q.destination.display} {q.destination.asset.split(':')[1]?.toUpperCase()}
                </Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={[styles.quoteLabel, { color: textSecondary }]}>Slippage</Text>
                <Text style={[styles.quoteValue, { color: textPrimary }]}>
                  {q.slippage} bips
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: '#2563EB', marginTop: 16 }]}
              onPress={() => handleCreateOrder(q)}
              disabled={loading || !isConnected}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryButtonText}>Create Order</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderOrderCreated = () => (
    <View style={styles.confirmContainer}>
      <View style={[styles.confirmCard, { backgroundColor: surfaceColor, borderColor }]}>
        <Text style={[styles.confirmTitle, { color: textPrimary }]}>Order Created Successfully!</Text>
        
        {selectedQuote && (
          <View style={[styles.selectedQuoteCard, { backgroundColor: isDark ? '#0a1a0f' : '#f0f9ff', borderColor: '#2563EB' }]}>
            <Text style={[styles.quoteTitle, { color: '#2563EB' }]}>Selected Quote:</Text>
            <Text style={[styles.quoteText, { color: textPrimary }]}>Solver: {selectedQuote.solver_id}</Text>
            <Text style={[styles.quoteText, { color: textPrimary }]}>Time: {selectedQuote.estimated_time}s</Text>
            <Text style={[styles.quoteText, { color: textPrimary }]}>
              From: {selectedQuote.source.display} {selectedQuote.source.asset}
            </Text>
            <Text style={[styles.quoteText, { color: textPrimary }]}>
              To: {selectedQuote.destination.display} {selectedQuote.destination.asset}
            </Text>
          </View>
        )}

        <View style={[styles.orderResultCard, { backgroundColor: isDark ? '#111827' : '#f9fafb', borderColor }]}>
          <Text style={[styles.orderResultTitle, { color: textPrimary }]}>Order Details:</Text>
          <Text style={[styles.orderResultText, { color: '#2563EB' }]}>Order ID: {orderResult?.order_id}</Text>
          <Text style={[styles.orderResultText, { color: textPrimary }]}>Chain: {chainConfig.name} (ID: {chainConfig.chainId})</Text>
          <Text style={[styles.orderResultText, { color: textPrimary }]}>Required Chain: {orderResult?.initiate_transaction?.chain_id}</Text>
          {orderResult?.approval_transaction && (
            <View style={[styles.transactionInfo, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
              <Text style={[styles.orderResultText, { color: textPrimary }]}>Approval Required:</Text>
              <Text style={[styles.transactionText, { color: textSecondary }]}>To: {orderResult.approval_transaction.to}</Text>
              <Text style={[styles.transactionText, { color: textSecondary }]}>Gas Limit: {orderResult.approval_transaction.gas_limit}</Text>
            </View>
          )}
          <View style={[styles.transactionInfo, { backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }]}>
            <Text style={[styles.orderResultText, { color: textPrimary }]}>Initiate Transaction:</Text>
            <Text style={[styles.transactionText, { color: textSecondary }]}>To: {orderResult?.initiate_transaction?.to}</Text>
            <Text style={[styles.transactionText, { color: textSecondary }]}>Gas Limit: {orderResult?.initiate_transaction?.gas_limit}</Text>
            <Text style={[styles.transactionText, { color: textSecondary }]}>Chain ID: {orderResult?.initiate_transaction?.chain_id}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: '#2563EB' }]}
          onPress={handleExecuteSwap}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="rocket" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Execute Swap</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderExecuting = () => (
    <View style={styles.loadingContainer}>
      <View style={[styles.loadingCard, { backgroundColor: surfaceColor }]}>
        <View style={[styles.loadingIcon, { backgroundColor: '#2563EB' }]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
        <Text style={[styles.loadingTitle, { color: textPrimary }]}>
          Executing Swap
        </Text>
        <Text style={[styles.loadingText, { color: textSecondary }]}>
          Please wait while your swap is being processed...
        </Text>
      </View>
    </View>
  );

  const renderComplete = () => (
    <View style={styles.completeContainer}>
      <View style={[styles.completeCard, { backgroundColor: surfaceColor, borderColor }]}>
        <View style={[styles.successIcon, { backgroundColor: '#10B981' }]}>
          <Ionicons name="checkmark" size={32} color="#FFFFFF" />
        </View>
        
        <Text style={[styles.successTitle, { color: textPrimary }]}>
          Swap Completed!
        </Text>
        <Text style={[styles.successText, { color: textSecondary }]}>
          Your cross-chain swap has been successfully executed
        </Text>

        <View style={[styles.resultCard, { backgroundColor: isDark ? '#0a2a0f' : '#f0fdf4', borderColor: '#10B981' }]}>
          <Text style={[styles.resultText, { color: '#10B981' }]}>Order ID: {swapResult?.orderId}</Text>
          {swapResult?.approvalTxHash && (
            <Text style={[styles.resultText, { color: '#10B981' }]}>Approval TX: {swapResult.approvalTxHash}</Text>
          )}
          <Text style={[styles.resultText, { color: '#10B981' }]}>Initiate TX: {swapResult?.initiateTxHash}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: '#2563EB' }]}
          onPress={handleStartOver}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Start New Swap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {renderHeader()}
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!apiKey || apiKey === 'your-api-key-here' ? (
            <View style={[styles.warningCard, { backgroundColor: surfaceColor, borderColor, marginTop: 20 }]}>
              <Ionicons name="warning" size={48} color="#F59E0B" />
              <Text style={[styles.warningTitle, { color: textPrimary }]}>
                API Key Required
              </Text>
              <Text style={[styles.warningText, { color: textSecondary }]}>
                ⚠️ Garden Finance API key not configured. Please add EXPO_PUBLIC_SWAP_API_KEY to your environment variables.
              </Text>
            </View>
          ) : !isConnected ? (
            <View style={[styles.warningCard, { backgroundColor: surfaceColor, borderColor, marginTop: 20 }]}>
              <Ionicons name="wallet-outline" size={48} color="#F59E0B" />
              <Text style={[styles.warningTitle, { color: textPrimary }]}>
                Wallet Not Connected
              </Text>
              <Text style={[styles.warningText, { color: textSecondary }]}>
                Please connect your wallet to start swapping
              </Text>
            </View>
          ) : (
            <>
              {step === 'input' && renderInputForm()}
              {step === 'quote' && renderQuotes()}
              {step === 'orderCreated' && renderOrderCreated()}
              {step === 'executing' && renderExecuting()}
              {step === 'complete' && renderComplete()}
            </>
          )}
        </ScrollView>
      </Animated.View>
    </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  backButton: {
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
    paddingBottom: 120,
  },
  
  // Warning Card
  warningCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 300,
    borderWidth: 1,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Form
  formContainer: {
    gap: 20,
  },
  inputCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  amountInput: {
    flex: 1,
  },
  maxButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maxButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Swap Icon
  swapIconContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  swapIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  
  // Primary Button
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Quotes
  quotesContainer: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  quotesList: {
    gap: 12,
  },
  quoteCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '700',
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  quoteDetails: {
    gap: 8,
  },
  quoteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteLabel: {
    fontSize: 14,
  },
  quoteValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Confirm
  confirmContainer: {
    flex: 1,
  },
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
  confirmTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmDetails: {
    gap: 16,
    marginBottom: 24,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  confirmLabel: {
    fontSize: 16,
  },
  confirmValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    maxWidth: 300,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  
  // Complete
  completeContainer: {
    flex: 1,
  },
  completeCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  resultDetails: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultLabel: {
    fontSize: 14,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  
  // Additional styles for API integration
  selectedQuoteCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 14,
    marginBottom: 4,
  },
  orderResultCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  orderResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  orderResultText: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  transactionInfo: {
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  transactionText: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  resultCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
});

export default Swap;