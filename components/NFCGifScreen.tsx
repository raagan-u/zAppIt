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


export default function NFCGifScreen() {
  console.log('=== NFCGifScreen component rendered ===');
  console.log('=== NFCGifScreen component rendered ===');
  console.log('=== NFCGifScreen component rendered ===');
  
  const { flow, walletAddress, amount, recipient, chain, asset } = useLocalSearchParams<{
    flow: 'send' | 'receive';
    walletAddress?: string;
    amount?: string;
    recipient?: string;
    chain?: string;
    asset?: string;
  }>();

  console.log('NFCGifScreen params:', { flow, walletAddress, amount, recipient, chain, asset });
  console.log('NFCGifScreen params:', { flow, walletAddress, amount, recipient, chain, asset });
  console.log('NFCGifScreen params:', { flow, walletAddress, amount, recipient, chain, asset });

  const [nfcStatus, setNfcStatus] = useState<'idle' | 'active' | 'success' | 'error'>('idle');
  const [nfcMessage, setNfcMessage] = useState<string>('');

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

    // Add a small delay to prevent immediate execution
    const timer = setTimeout(() => {
      console.log('Starting NFC process after delay...');
      // Start NFC process based on flow
      if (flow === 'send') {
        // when flow is send, NFC should be listening for the payment data
        startNFCReceive();
      } else {
        // when flow is receive, NFC should be sending the payment data
        startNFCSend();
      }
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      if (flow === 'send') {
        stopListening();
      } else {
        stopSession();
      }
    };
  }, [flow]);


  const startNFCSend = async () => {
    try {
      console.log('Starting NFC send process...');
      setNfcStatus('active');

      // Prepare payment data
      const paymentData = {
        address: walletAddress || '0x0000000000000000000000000000000000000000',
        amount: amount || '0',
        chain_id: '11155111', // Sepolia testnet - you might want to map this from chain name
        asset: asset || 'ETH',
        chain: chain || 'base_sepolia',
      };

      console.log('Payment data prepared:', paymentData);
      console.log('Calling sendMessage...');
      await sendMessage(paymentData);
      console.log('sendMessage completed successfully');
      setNfcStatus('success');
      // Navigate back after success
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error) {
      console.error('Error in NFC send:', error);
      setNfcStatus('error');
      Alert.alert('NFC Error', 'Failed to start NFC send. Please try again.');
    }
  };

  const startNFCReceive = async () => {
    try {
      console.log('Starting NFC receive process...');
      setNfcStatus('active');

      console.log('Calling startListening...');
      await startListening((message: string) => {
        console.log('Received NFC message:', message);
        setNfcMessage(message);
        setNfcStatus('success');

        try {
          // Parse the received payment data
          const paymentData = JSON.parse(message);
          console.log('Parsed payment data:', paymentData);

          // Navigate back to previous page with the received payment data
          setTimeout(() => {
            router.back();
          }, 2000);
        } catch (parseError) {
          console.error('Error parsing NFC message:', parseError);
          setNfcStatus('error');
          Alert.alert('Parse Error', 'Failed to parse received payment data.');
        }
      });
      console.log('startListening completed successfully');
    } catch (error) {
      console.error('Error in NFC receive:', error);
      setNfcStatus('error');
      Alert.alert('NFC Error', 'Failed to start NFC receive. Please try again.');
    }
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
          {nfcStatus === 'active' &&
            (flow === 'send' ? 'Broadcasting Payment Data...' : 'Listening for Payment...')}
          {nfcStatus === 'success' &&
            (flow === 'send' ? 'Payment Request Received!' : 'Payment Request Sent!')}
          {nfcStatus === 'error' && 'NFC Error'}
          {nfcStatus === 'idle' &&
            (flow === 'send' ? 'Preparing to Send...' : 'Preparing to Receive...')}
        </Text>
        <Text className="text-center font-sans text-sm text-gray-400">
          {nfcStatus === 'active' &&
            (flow === 'send'
              ? 'Keep devices close to send transaction data'
              : 'Keep devices close to receive payment data')}
          {nfcStatus === 'success' &&
            (flow === 'send'
              ? 'Payment request has been received successfully'
              : 'Payment request has been sent successfully')}
          {nfcStatus === 'error' && 'Something went wrong with the NFC operation'}
          {nfcStatus === 'idle' && 'Initializing NFC...'}
        </Text>

        {/* Loading indicator */}
        {(hceLoading || readerLoading) && (
          <View className="mt-4">
            <Text className="text-center font-sans text-sm text-gray-400">
              {flow === 'send' ? 'Setting up HCE...' : 'Initializing NFC reader...'}
            </Text>
          </View>
        )}

        {/* NFC Status indicators */}
        {flow === 'send' && (
          <View className="mt-4">
            <Text className="text-center font-sans text-sm text-gray-400">
              HCE Status: {isEnabled ? 'Active' : 'Inactive'}
            </Text>
          </View>
        )}

        {flow === 'receive' && (
          <View className="mt-4">
            <Text className="text-center font-sans text-sm text-gray-400">
              Reader Status: {isListening ? 'Listening' : 'Stopped'}
            </Text>
          </View>
        )}

        {/* Manual Start Button for Testing */}
        <TouchableOpacity 
          onPress={() => {
            console.log('Manual start button pressed');
            if (flow === 'send') {
              startNFCReceive();
            } else {
              startNFCSend();
            }
          }} 
          className="mt-4 rounded-xl bg-green-600 px-8 py-3"
        >
          <Text className="font-sans text-base font-semibold text-white">Start NFC (Manual)</Text>
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity onPress={handleCancel} className="mt-4 rounded-xl bg-gray-700 px-8 py-3">
          <Text className="font-sans text-base font-semibold text-white">Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
