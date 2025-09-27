// import { chainConfig } from '@/lib/chainConfig';
// import { bridge } from '@/lib/walletFeatures/wallet';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNFCReader } from './UseNfcReader';
import { useSimpleHCE } from './UseSimpleHCE';

interface PaymentData {
  address: string;
  amount: string;
  chain_id: string;
  asset: string;
  chain: string;
  timestamp?: number;
}

export default function NFCGifScreen() {
  const { flow, walletAddress, amount, recipient, chain, asset } = useLocalSearchParams<{
    flow: 'send' | 'receive';
    walletAddress?: string;
    amount?: string;
    recipient?: string;
    chain?: string;
    asset?: string;
  }>();

  const [nfcStatus, setNfcStatus] = useState<'idle' | 'active' | 'success' | 'error'>('idle');
  const [nfcMessage, setNfcMessage] = useState<string>('');
  const [receivedPaymentData, setReceivedPaymentData] = useState<PaymentData | null>(null);

  // NFC Hooks
  const { sendMessage, stopSession, isEnabled, isLoading: hceLoading } = useSimpleHCE();
  const {
    startListening,
    stopListening,
    isListening,
    isLoading: readerLoading,
    lastMessage,
  } = useNFCReader();

  useEffect(() => {
    console.log('NFC GIF screen opened for flow:', flow);

    // Log only relevant parameters based on flow
    if (flow === 'send') {
      console.log('NFC parameters:', { flow, amount, recipient, chain, asset });
    } else {
      console.log('NFC parameters:', { flow, walletAddress, amount, chain, asset });
    }

    // Start NFC process based on flow
    if (flow === 'send') {
      // When flow is 'send', we want to RECEIVE payment data from another device
      startNFCReceive();
    } else {
      // When flow is 'receive', we want to SEND payment data to another device
      startNFCSend();
    }

    // Cleanup on unmount
    return () => {
      if (flow === 'send') {
        stopListening();
      } else {
        stopSession();
      }
    };
  }, [flow]);

  const startNFCSend = async () => {
    try {
      setNfcStatus('active');

      // Prepare payment data
      const paymentData: PaymentData = {
        address: walletAddress || '0x0000000000000000000000000000000000000000',
        amount: amount || '0',
        chain_id: getChainIdFromName(chain || 'sepolia'),
        asset: asset || 'ETH',
        chain: chain || 'sepolia',
        timestamp: Date.now(),
      };

      console.log('Sending payment data via NFC:', paymentData);
      await sendMessage(paymentData);
      setNfcStatus('success');
      
      // Navigate back to receive page with success after delay
      setTimeout(() => {
        router.back();
      }, 2000);
      
    } catch (error) {
      console.error('Error in NFC send:', error);
      setNfcStatus('error');
      
      // Provide more specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (errorMessage.includes('not supported')) {
        Alert.alert('NFC Not Supported', 'NFC is not supported on this device.');
      } else if (errorMessage.includes('not enabled')) {
        Alert.alert('NFC Disabled', 'Please enable NFC in your device settings and try again.');
      } else {
        Alert.alert('NFC Error', `Failed to start NFC send: ${errorMessage}`);
      }
    }
  };

  const startNFCReceive = async () => {
    try {
      setNfcStatus('active');

      await startListening((message: string) => {
        console.log('Received NFC message:', message);
        setNfcMessage(message);
        setNfcStatus('success');

        try {
          // Parse the received payment data
          const paymentData: PaymentData = JSON.parse(message);
          console.log('Parsed payment data:', paymentData);
          setReceivedPaymentData(paymentData);

          // Check if we need to bridge between different chains
          if (paymentData.chain !== chain) {
            console.log('Different chains detected, initiating bridge...');
            initiateBridge(paymentData);
          }

          // Navigate back to send page with the received payment data
          setTimeout(() => {
            router.back();
          }, 2000);
        } catch (parseError) {
          console.error('Error parsing NFC message:', parseError);
          setNfcStatus('error');
          Alert.alert('Parse Error', 'Failed to parse received payment data.');
        }
      });
    } catch (error) {
      console.error('Error in NFC receive:', error);
      setNfcStatus('error');
      
      // Provide more specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (errorMessage.includes('not supported')) {
        Alert.alert('NFC Not Supported', 'NFC is not supported on this device.');
      } else if (errorMessage.includes('not enabled')) {
        Alert.alert('NFC Disabled', 'Please enable NFC in your device settings and try again.');
      } else if (errorMessage.includes('timeout')) {
        Alert.alert('NFC Timeout', 'No NFC tag detected. Please try again.');
      } else {
        Alert.alert('NFC Error', `Failed to start NFC receive: ${errorMessage}`);
      }
    }
  };

  const initiateBridge = (paymentData: PaymentData) => {
    try {
      console.log('Bridge functionality would be initiated here with:', {
        sourceChain: chain,
        destChain: paymentData.chain,
        sourceAmount: amount,
        destAmount: paymentData.amount,
        recipient: paymentData.address,
      });
      
      // TODO: Implement bridge functionality when chainConfig and bridge are available
      // const sourceChainConfig = Object.values(chainConfig).find((c) => c.name === chain);
      // const destChainConfig = Object.values(chainConfig).find((c) => c.name === paymentData.chain);
      // ... rest of bridge logic
      
    } catch (error) {
      console.error('Error initiating bridge:', error);
      Alert.alert('Bridge Error', 'Failed to initiate cross-chain bridge.');
    }
  };

  const getChainIdFromName = (chainName: string): string => {
    const chainMap: Record<string, string> = {
      'sepolia': '11155111',
      'polygon': '137',
      'base_sepolia': '84532',
      'arbitrum_sepolia': '421614',
    };
    return chainMap[chainName] || '11155111';
  };

  const handleCancel = async () => {
    console.log('NFC process cancelled by user');

    // Stop NFC operations
    if (flow === 'send') {
      await stopListening();
    } else {
      await stopSession();
    }

    router.back();
  };

  const getStatusText = () => {
    switch (nfcStatus) {
      case 'active':
        return flow === 'send' 
          ? 'Listening for Payment Data...' 
          : 'Broadcasting Payment Data...';
      case 'success':
        return flow === 'send' 
          ? 'Payment Data Received!' 
          : 'Payment Data Sent!';
      case 'error':
        return 'NFC Error';
      case 'idle':
      default:
        return flow === 'send' 
          ? 'Preparing to Receive...' 
          : 'Preparing to Send...';
    }
  };

  const getSubStatusText = () => {
    switch (nfcStatus) {
      case 'active':
        return flow === 'send'
          ? 'Keep devices close to receive payment data'
          : 'Keep devices close to send payment data';
      case 'success':
        return flow === 'send'
          ? 'Payment data has been received successfully'
          : 'Payment data has been sent successfully';
      case 'error':
        return 'Something went wrong with the NFC operation';
      case 'idle':
      default:
        return 'Initializing NFC...';
    }
  };

  return (
    <SafeAreaView className="bg-dark-bg flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity
          onPress={handleCancel}
          className="h-10 w-10 items-center justify-center rounded-full bg-gray-800">
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text className="font-mono text-xl font-bold text-white">
          {flow === 'send' ? 'NFC Receive' : 'NFC Send'}
        </Text>
        <View className="h-10 w-10" />
      </View>

      {/* Content */}
      <View className="flex-1 items-center justify-center px-6">
        {/* NFC GIF */}
        <View className="mb-8 rounded-2xl bg-gray-800 p-8">
          <Image
            source={require('../assets/nfc.gif')}
            style={{ width: 200, height: 200 }}
            contentFit="contain"
          />
        </View>

        {/* Status Text */}
        <Text className="mb-4 text-center font-sans text-lg font-semibold text-white">
          {getStatusText()}
        </Text>
        <Text className="text-center font-sans text-sm text-gray-400">
          {getSubStatusText()}
        </Text>

        {/* Loading indicator */}
        {(hceLoading || readerLoading) && (
          <View className="mt-4">
            <Text className="text-center font-sans text-sm text-gray-400">
              {flow === 'send' ? 'Initializing NFC reader...' : 'Setting up HCE...'}
            </Text>
          </View>
        )}

        {/* NFC Status indicators */}
        {flow === 'send' && (
          <View className="mt-4">
            <Text className="text-center font-sans text-sm text-gray-400">
              Reader Status: {isListening ? 'Listening' : 'Stopped'}
            </Text>
          </View>
        )}

        {flow === 'receive' && (
          <View className="mt-4">
            <Text className="text-center font-sans text-sm text-gray-400">
              HCE Status: {isEnabled ? 'Active' : 'Inactive'}
            </Text>
          </View>
        )}

        {/* Received Payment Data Display */}
        {receivedPaymentData && (
          <View className="mt-6 w-full rounded-xl bg-gray-800 p-4">
            <Text className="mb-2 font-sans text-sm font-semibold text-white">
              Received Payment Data:
            </Text>
            <Text className="font-sans text-xs text-gray-400">
              Address: {receivedPaymentData.address.slice(0, 10)}...{receivedPaymentData.address.slice(-8)}
            </Text>
            <Text className="font-sans text-xs text-gray-400">
              Amount: {receivedPaymentData.amount} {receivedPaymentData.asset}
            </Text>
            <Text className="font-sans text-xs text-gray-400">
              Chain: {receivedPaymentData.chain}
            </Text>
          </View>
        )}

        {/* Cancel Button */}
        <TouchableOpacity onPress={handleCancel} className="mt-8 rounded-xl bg-gray-700 px-8 py-3">
          <Text className="font-sans text-base font-semibold text-white">Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
