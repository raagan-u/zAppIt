import { Ionicons } from '@expo/vector-icons';
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
import { useWallet } from '../../contexts/WalletContext';

interface SwapProps {
  apiKey: string;
}

interface SwapState {
  sourceAsset: string;
  sourceAmount: string;
  sourceOwner: string;
  destinationAsset: string;
  destinationOwner: string;
}

interface Quote {
  id: string;
  sourceAmount: string;
  destinationAmount: string;
  fee: string;
  estimatedTime: string;
  provider: string;
}

interface SwapOrder {
  id: string;
  status: string;
  sourceAsset: string;
  destinationAsset: string;
  sourceAmount: string;
  destinationAmount: string;
}

type SwapStep = 'input' | 'quote' | 'confirm' | 'executing' | 'complete';

const Swap: React.FC<SwapProps> = ({ apiKey }) => {
  const { isConnected } = useWallet();
  const [step, setStep] = useState<SwapStep>('input');
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [swapOrder, setSwapOrder] = useState<SwapOrder | null>(null);
  const [swapResult, setSwapResult] = useState<any>(null);
  const [fadeAnim] = useState(new Animated.Value(1));
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [swapState, setSwapState] = useState<SwapState>({
    sourceAsset: '',
    sourceAmount: '',
    sourceOwner: '',
    destinationAsset: '',
    destinationOwner: '',
  });

  const updateSwapState = useCallback((field: keyof SwapState, value: string) => {
    setSwapState(prev => ({ ...prev, [field]: value }));
  }, []);

  const isFormValid = useMemo(() => {
    return swapState.sourceAsset && 
           swapState.sourceAmount && 
           swapState.sourceOwner && 
           swapState.destinationAsset && 
           swapState.destinationOwner;
  }, [swapState]);

  const backgroundColor = isDark ? '#0F0F0F' : '#FAFAFA';
  const surfaceColor = isDark ? '#1A1A1A' : '#FFFFFF';
  const textPrimary = isDark ? '#F9FAFB' : '#1F2937';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const handleGetQuote = async () => {
    if (!isFormValid) return;
    
    setLoading(true);
    try {
      // Mock quotes for demo
      const mockQuotes: Quote[] = [
        {
          id: '1',
          sourceAmount: swapState.sourceAmount,
          destinationAmount: (parseFloat(swapState.sourceAmount) * 0.98).toFixed(6),
          fee: '0.02 ETH',
          estimatedTime: '5-10 minutes',
          provider: 'UniSwap V3'
        },
        {
          id: '2',
          sourceAmount: swapState.sourceAmount,
          destinationAmount: (parseFloat(swapState.sourceAmount) * 0.97).toFixed(6),
          fee: '0.03 ETH',
          estimatedTime: '3-7 minutes',
          provider: 'SushiSwap'
        }
      ];
      
      setQuotes(mockQuotes);
      setStep('quote');
    } catch (error) {
      Alert.alert('Error', 'Failed to get quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteSelect = (quote: Quote) => {
    setSelectedQuote(quote);
    setStep('confirm');
  };

  const handleConfirmSwap = async () => {
    if (!selectedQuote) return;
    
    setLoading(true);
    setStep('executing');
    
    try {
      // Mock swap execution
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockResult = {
        transactionHash: '0x123...abc',
        status: 'completed',
        sourceAmount: swapState.sourceAmount,
        destinationAmount: selectedQuote.destinationAmount
      };
      
      setSwapResult(mockResult);
      setStep('complete');
    } catch (error) {
      Alert.alert('Error', 'Failed to execute swap');
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOver = () => {
    setStep('input');
    setQuotes([]);
    setSelectedQuote(null);
    setSwapOrder(null);
    setSwapResult(null);
    setSwapState({
      sourceAsset: '',
      sourceAmount: '',
      sourceOwner: '',
      destinationAsset: '',
      destinationOwner: '',
    });
  };

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
            else if (step === 'confirm') setStep('quote');
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
        Available Quotes ({quotes.length})
      </Text>
      
      <View style={styles.quotesList}>
        {quotes.map((quote, index) => (
          <TouchableOpacity
            key={quote.id}
            style={[
              styles.quoteCard,
              { 
                backgroundColor: surfaceColor,
                borderColor: selectedQuote?.id === quote.id ? '#2563EB' : borderColor,
                borderWidth: selectedQuote?.id === quote.id ? 2 : 1
              }
            ]}
            onPress={() => handleQuoteSelect(quote)}
          >
            <View style={styles.quoteHeader}>
              <Text style={[styles.providerName, { color: textPrimary }]}>
                {quote.provider}
              </Text>
              <View style={[styles.ratingBadge, { backgroundColor: '#10B981' }]}>
                <Text style={styles.ratingText}>Best</Text>
              </View>
            </View>
            
            <View style={styles.quoteDetails}>
              <View style={styles.quoteRow}>
                <Text style={[styles.quoteLabel, { color: textSecondary }]}>You get</Text>
                <Text style={[styles.quoteValue, { color: '#10B981' }]}>
                  {quote.destinationAmount}
                </Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={[styles.quoteLabel, { color: textSecondary }]}>Fee</Text>
                <Text style={[styles.quoteValue, { color: textPrimary }]}>
                  {quote.fee}
                </Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={[styles.quoteLabel, { color: textSecondary }]}>Time</Text>
                <Text style={[styles.quoteValue, { color: textPrimary }]}>
                  {quote.estimatedTime}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderConfirm = () => (
    <View style={styles.confirmContainer}>
      <View style={[styles.confirmCard, { backgroundColor: surfaceColor, borderColor }]}>
        <Text style={[styles.confirmTitle, { color: textPrimary }]}>Confirm Swap</Text>
        
        <View style={styles.confirmDetails}>
          <View style={styles.confirmRow}>
            <Text style={[styles.confirmLabel, { color: textSecondary }]}>From</Text>
            <Text style={[styles.confirmValue, { color: textPrimary }]}>
              {swapState.sourceAmount} {swapState.sourceAsset}
            </Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={[styles.confirmLabel, { color: textSecondary }]}>To</Text>
            <Text style={[styles.confirmValue, { color: textPrimary }]}>
              {selectedQuote?.destinationAmount} {swapState.destinationAsset}
            </Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={[styles.confirmLabel, { color: textSecondary }]}>Provider</Text>
            <Text style={[styles.confirmValue, { color: textPrimary }]}>
              {selectedQuote?.provider}
            </Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={[styles.confirmLabel, { color: textSecondary }]}>Fee</Text>
            <Text style={[styles.confirmValue, { color: textPrimary }]}>
              {selectedQuote?.fee}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: '#2563EB' }]}
          onPress={handleConfirmSwap}
          disabled={loading}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Confirm Swap</Text>
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

        <View style={styles.resultDetails}>
          <View style={styles.resultRow}>
            <Text style={[styles.resultLabel, { color: textSecondary }]}>Transaction</Text>
            <Text style={[styles.resultValue, { color: '#2563EB' }]}>
              {swapResult?.transactionHash}
            </Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={[styles.resultLabel, { color: textSecondary }]}>Amount Received</Text>
            <Text style={[styles.resultValue, { color: textPrimary }]}>
              {swapResult?.destinationAmount} {swapState.destinationAsset}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: '#2563EB' }]}
          onPress={handleStartOver}
        >
          <Text style={styles.primaryButtonText}>Start New Swap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!isConnected) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.centerContainer}>
          <View style={[styles.warningCard, { backgroundColor: surfaceColor, borderColor }]}>
            <Ionicons name="wallet-outline" size={48} color="#F59E0B" />
            <Text style={[styles.warningTitle, { color: textPrimary }]}>
              Wallet Not Connected
            </Text>
            <Text style={[styles.warningText, { color: textSecondary }]}>
              Please connect your wallet to start swapping
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {renderHeader()}
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {step === 'input' && renderInputForm()}
          {step === 'quote' && renderQuotes()}
          {step === 'confirm' && renderConfirm()}
          {step === 'executing' && renderExecuting()}
          {step === 'complete' && renderComplete()}
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
});

export default Swap;