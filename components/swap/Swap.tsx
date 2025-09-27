import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getChainConfig } from '../../constants/config';
import { useWallet } from '../../contexts/WalletContext';
import { OrderAsset, QuoteResult } from '../../types/garden';
import { createOrder } from './CreateOrder';
import { getQuote } from './GetQuote';
import { initiateSwap } from './InitiateSwap';

interface SwapState {
  sourceAsset: string;
  destinationAsset: string;
  sourceAmount: string;
  destinationAmount: string;
  sourceOwner: string;
  destinationOwner: string;
}

interface SwapProps {
  apiKey: string;
}

const Swap: React.FC<SwapProps> = ({ apiKey }) => {
  const { wallet, isConnected, currentChain } = useWallet();
  
  // Get URLs from environment and chain config
  const quoteUrl = process.env.EXPO_PUBLIC_QUOTE_URL || 'https://mainnet.garden.finance/v2/quote';
  const orderUrl = process.env.EXPO_PUBLIC_ORDER_URL || 'https://mainnet.garden.finance/v2/orders';
  const chainConfig = getChainConfig(currentChain);
  const rpcUrl = chainConfig.rpcUrl;
  
  const [swapState, setSwapState] = useState<SwapState>({
    sourceAsset: '',
    destinationAsset: '',
    sourceAmount: '',
    destinationAmount: '',
    sourceOwner: '',
    destinationOwner: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'quote' | 'orderCreated' | 'executing' | 'complete'>('input');
  const [quote, setQuote] = useState<QuoteResult[] | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuoteResult | null>(null);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [swapResult, setSwapResult] = useState<any>(null);

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

      setOrderResult(result);
      setStep('orderCreated');
      Alert.alert('Success', 'Order created successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isConnected, wallet, swapState, orderUrl, apiKey]);

  const handleExecuteSwap = useCallback(async () => {
    if (!orderResult || !wallet) {
      Alert.alert('Error', 'Order data or wallet not available');
      return;
    }

    try {
      setLoading(true);
      setStep('executing');

      const swapExecutionResult = await initiateSwap({
        swapData: orderResult as any,
        signer: wallet,
      });

      setSwapResult(swapExecutionResult);
      setStep('complete');
      Alert.alert('Success', `Swap executed! Order ID: ${swapExecutionResult.orderId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to execute swap';
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

  const renderInputForm = () => (
    <>
      <Text style={styles.sectionTitle}>Source Asset</Text>
      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          placeholder="Source Asset (e.g., arbitrum:ibtc)"
          placeholderTextColor="#666666"
          value={swapState.sourceAsset}
          onChangeText={(text) => updateSwapState('sourceAsset', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Amount"
          placeholderTextColor="#666666"
          value={swapState.sourceAmount}
          onChangeText={(text) => updateSwapState('sourceAmount', text)}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Owner Address"
          placeholderTextColor="#666666"
          value={swapState.sourceOwner}
          onChangeText={(text) => updateSwapState('sourceOwner', text)}
        />
      </View>

      <Text style={styles.sectionTitle}>Destination Asset</Text>
      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          placeholder="Destination Asset (e.g., bitcoin:btc)"
          placeholderTextColor="#666666"
          value={swapState.destinationAsset}
          onChangeText={(text) => updateSwapState('destinationAsset', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Recipient Address"
          placeholderTextColor="#666666"
          value={swapState.destinationOwner}
          onChangeText={(text) => updateSwapState('destinationOwner', text)}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, (!isFormValid || loading) && styles.buttonDisabled]}
        onPress={handleGetQuote}
        disabled={!isFormValid || loading}
      >
        {loading ? (
          <ActivityIndicator color="#000000" />
        ) : (
          <Text style={[styles.buttonText, (!isFormValid || loading) && styles.buttonTextDisabled]}>Get Quote</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderQuotes = () => (
    <>
      <Text style={styles.sectionTitle}>Available Quotes</Text>
      {quote?.map((q, index) => (
        <View key={index} style={styles.quoteCard}>
          <View style={styles.quoteInfo}>
            <Text style={styles.quoteText}>Solver: {q.solver_id}</Text>
            <Text style={styles.quoteText}>Time: {q.estimated_time}s</Text>
            <Text style={styles.quoteText}>
              From: {q.source.display} {q.source.asset}
            </Text>
            <Text style={styles.quoteText}>
              To: {q.destination.display} {q.destination.asset}
            </Text>
            <Text style={styles.quoteHighlight}>
              You will receive: {q.destination.display} {q.destination.asset.split(':')[1]?.toUpperCase()}
            </Text>
            <Text style={styles.quoteText}>Slippage: {q.slippage} bips</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.createOrderButton, loading && styles.buttonDisabled]}
            onPress={() => handleCreateOrder(q)}
            disabled={loading || !isConnected}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={[styles.buttonText, (loading || !isConnected) && styles.buttonTextDisabled]}>
                Create Order
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ))}
    </>
  );

  const renderOrderCreated = () => (
    <>
      <Text style={styles.sectionTitle}>Order Created Successfully!</Text>
      
      {selectedQuote && (
        <View style={styles.selectedQuoteCard}>
          <Text style={styles.quoteTitle}>Selected Quote:</Text>
          <Text style={styles.quoteText}>Solver: {selectedQuote.solver_id}</Text>
          <Text style={styles.quoteText}>Time: {selectedQuote.estimated_time}s</Text>
          <Text style={styles.quoteText}>
            From: {selectedQuote.source.display} {selectedQuote.source.asset}
          </Text>
          <Text style={styles.quoteText}>
            To: {selectedQuote.destination.display} {selectedQuote.destination.asset}
          </Text>
        </View>
      )}

      <View style={styles.orderResultCard}>
        <Text style={styles.orderResultTitle}>Order Details:</Text>
        <Text style={styles.orderResultText}>Order ID: {orderResult?.order_id}</Text>
        {orderResult?.approval_transaction && (
          <View style={styles.transactionInfo}>
            <Text style={styles.orderResultText}>Approval Required:</Text>
            <Text style={styles.transactionText}>To: {orderResult.approval_transaction.to}</Text>
            <Text style={styles.transactionText}>Gas Limit: {orderResult.approval_transaction.gas_limit}</Text>
          </View>
        )}
        <View style={styles.transactionInfo}>
          <Text style={styles.orderResultText}>Initiate Transaction:</Text>
          <Text style={styles.transactionText}>To: {orderResult?.initiate_transaction?.to}</Text>
          <Text style={styles.transactionText}>Gas Limit: {orderResult?.initiate_transaction?.gas_limit}</Text>
          <Text style={styles.transactionText}>Chain ID: {orderResult?.initiate_transaction?.chain_id}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleExecuteSwap}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000000" />
        ) : (
          <Text style={styles.buttonText}>Execute Swap</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderComplete = () => (
    <>
      <Text style={styles.sectionTitle}>Swap Complete!</Text>
      <View style={styles.resultCard}>
        <Text style={styles.resultText}>Order ID: {swapResult?.orderId}</Text>
        {swapResult?.approvalTxHash && (
          <Text style={styles.resultText}>Approval TX: {swapResult.approvalTxHash}</Text>
        )}
        <Text style={styles.resultText}>Initiate TX: {swapResult?.initiateTxHash}</Text>
      </View>
      
      <TouchableOpacity style={styles.button} onPress={handleStartOver}>
        <Text style={styles.buttonText}>Start New Swap</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Cross-Chain Swap</Text>
      
      {!isConnected && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>Please connect your wallet to continue</Text>
        </View>
      )}

      {step === 'input' && renderInputForm()}
      {step === 'quote' && renderQuotes()}
      {step === 'orderCreated' && renderOrderCreated()}
      {step === 'executing' && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff88" />
          <Text style={styles.loadingText}>Executing swap transactions...</Text>
        </View>
      )}
      {step === 'complete' && renderComplete()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    marginTop: 20,
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  inputGroup: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#222222',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  inputDisabled: {
    backgroundColor: '#191919',
    color: '#999999',
    borderColor: '#444444',
  },
  button: {
    backgroundColor: '#00ff88',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  buttonDisabled: {
    backgroundColor: '#333333',
    borderColor: '#555555',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  buttonTextDisabled: {
    color: '#ffffff',
  },
  quoteCard: {
    backgroundColor: '#111111',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  quoteInfo: {
    marginBottom: 15,
  },
  createOrderButton: {
    backgroundColor: '#00ff88',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  selectedQuoteCard: {
    backgroundColor: '#0a1a0f',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#00ff88',
    fontFamily: 'Inter',
  },
  orderResultCard: {
    backgroundColor: '#111111',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  orderResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  orderResultText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#00ff88',
    fontFamily: 'monospace',
  },
  transactionInfo: {
    backgroundColor: '#222222',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  transactionText: {
    fontSize: 12,
    marginBottom: 4,
    color: '#cccccc',
    fontFamily: 'monospace',
  },
  quoteText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  quoteHighlight: {
    fontSize: 14,
    marginBottom: 5,
    color: '#00ff88',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  warningCard: {
    backgroundColor: '#2a1f00',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    borderWidth: 1,
    borderColor: '#3a2f00',
  },
  warningText: {
    color: '#ffc107',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  resultCard: {
    backgroundColor: '#0a2a0f',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#00ff88',
    borderWidth: 1,
    borderColor: '#1a3a1f',
  },
  resultText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#00ff88',
    fontFamily: 'monospace',
  },
});

export default Swap;