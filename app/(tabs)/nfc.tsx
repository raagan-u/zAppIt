import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNFCReader } from '../../components/UseNfcReader';
import { useSimpleHCE } from '../../components/UseSimpleHCE';

export default function NFCScreen() {
  console.log('=== NFCScreen rendered ===');
  
  const { flow, walletAddress, amount, recipient, chain, asset } = useLocalSearchParams<{
    flow?: 'send' | 'receive';
    walletAddress?: string;
    amount?: string;
    recipient?: string;
    chain?: string;
    asset?: string;
  }>();

  console.log('=== NFC Parameters ===', { flow, walletAddress, amount, recipient, chain, asset });

  const [nfcStatus, setNfcStatus] = useState<'idle' | 'active' | 'success' | 'error'>('idle');
  const [nfcMessage, setNfcMessage] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  // NFC Hooks
  const { sendMessage, stopSession, isEnabled, isLoading: hceLoading } = useSimpleHCE();
  const { startListening, stopListening, isListening, isLoading: readerLoading, lastMessage } = useNFCReader();

  // Add log function
  const addLog = (message: string) => {
    console.log('=== NFC LOG ===', message);
    setLogs(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const initializeNFC = async () => {
      try {
        addLog(`NFC screen opened for flow: ${flow || 'unknown'}`);
        
        // Only start NFC if we have a valid flow
        if (flow === 'send') {
          addLog('Starting NFC receive (listening for payment data)');
          await startNFCReceive();
        } else if (flow === 'receive') {
          addLog('Starting NFC send (broadcasting payment data)');
          await startNFCSend();
        } else {
          addLog('No valid flow specified, staying idle');
        }
      } catch (error) {
        addLog(`Error initializing NFC: ${error}`);
        console.error('Error initializing NFC:', error);
        setNfcStatus('error');
      }
    };

    initializeNFC();

    // Cleanup on unmount
    return () => {
      try {
        addLog('Cleaning up NFC operations');
        if (flow === 'send') {
          stopListening();
        } else if (flow === 'receive') {
          stopSession();
        }
      } catch (cleanupError) {
        console.error('Error during NFC cleanup:', cleanupError);
      }
    };
  }, [flow]);

  const startNFCSend = async () => {
    try {
      addLog('Preparing payment data for NFC send');
      setNfcStatus('active');
      
      const paymentData = {
        address: walletAddress || '0x0000000000000000000000000000000000000000',
        amount: amount || '0',
        chain_id: '11155111',
        asset: asset || 'ETH',
        chain: chain || 'sepolia',
        token_address: null
      };

      addLog(`Payment data: ${JSON.stringify(paymentData)}`);
      
      try {
        await sendMessage(paymentData);
        addLog('NFC send successful');
        setNfcStatus('success');
      } catch (sendError) {
        addLog(`Error in sendMessage: ${sendError}`);
        console.error('Error in sendMessage:', sendError);
        setNfcStatus('error');
        Alert.alert('NFC Error', `Failed to start NFC send: ${sendError}`);
      }
      
    } catch (error) {
      addLog(`Error in NFC send: ${error}`);
      console.error('Error in NFC send:', error);
      setNfcStatus('error');
      Alert.alert('NFC Error', 'Failed to start NFC send. Please try again.');
    }
  };

  const startNFCReceive = async () => {
    try {
      addLog('Starting NFC receive (listening)');
      setNfcStatus('active');
      
      await startListening((message: string) => {
        addLog(`Received NFC message: ${message}`);
        setNfcMessage(message);
        setNfcStatus('success');
        
        try {
          const paymentData = JSON.parse(message);
          addLog(`Parsed payment data: ${JSON.stringify(paymentData)}`);
          
          // Navigate back to wallet page with received data
          setTimeout(() => {
            router.push({
              pathname: '/(tabs)/wallet',
              params: {
                nfcData: 'true',
                recipient: paymentData.address,
                amount: paymentData.amount,
                chain: paymentData.chain || 'sepolia',
                asset: paymentData.asset || 'ETH',
              },
            } as any);
          }, 2000);
          
        } catch (parseError) {
          addLog(`Error parsing NFC message: ${parseError}`);
          console.error('Error parsing NFC message:', parseError);
          setNfcStatus('error');
          Alert.alert('Parse Error', 'Failed to parse received payment data.');
        }
      });
      
    } catch (error) {
      addLog(`Error in NFC receive: ${error}`);
      console.error('Error in NFC receive:', error);
      setNfcStatus('error');
      Alert.alert('NFC Error', 'Failed to start NFC receive. Please try again.');
    }
  };

  const handleCancel = async () => {
    addLog('NFC process cancelled by user');
    
    // Stop NFC operations
    if (flow === 'send') {
      await stopListening();
    } else if (flow === 'receive') {
      await stopSession();
    }
    
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16 }}>
        <TouchableOpacity 
          onPress={handleCancel}
          style={{ height: 40, width: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: '#333333' }}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
          {flow === 'send' ? 'NFC Send' : flow === 'receive' ? 'NFC Receive' : 'NFC'}
        </Text>
        
        <View style={{ height: 40, width: 40 }} />
      </View>

      {/* Content */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        {/* Status */}
        <View style={{ marginBottom: 32, padding: 32, borderRadius: 16, backgroundColor: '#333333' }}>
          <Text style={{ color: 'white', fontSize: 48, textAlign: 'center' }}>📱</Text>
        </View>

        <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', marginBottom: 16, textAlign: 'center' }}>
          {nfcStatus === 'active' && (flow === 'send' ? 'Broadcasting Payment Data...' : 'Listening for Payment...')}
          {nfcStatus === 'success' && (flow === 'send' ? 'Payment Request Sent!' : 'Payment Request Received!')}
          {nfcStatus === 'error' && 'NFC Error'}
          {nfcStatus === 'idle' && (flow === 'send' ? 'Preparing to Send...' : flow === 'receive' ? 'Preparing to Receive...' : 'Ready')}
        </Text>

        <Text style={{ color: '#999999', fontSize: 14, textAlign: 'center', marginBottom: 32 }}>
          {nfcStatus === 'active' && 'Keep devices close together'}
          {nfcStatus === 'success' && 'Operation completed successfully'}
          {nfcStatus === 'error' && 'Something went wrong'}
          {nfcStatus === 'idle' && 'Initializing...'}
        </Text>

        {/* Loading indicators */}
        {(hceLoading || readerLoading) && (
          <Text style={{ color: '#999999', fontSize: 12, marginBottom: 16 }}>
            {flow === 'send' ? 'Setting up HCE...' : 'Initializing NFC reader...'}
          </Text>
        )}

        {/* Status indicators */}
        {flow === 'send' && (
          <Text style={{ color: '#999999', fontSize: 12, marginBottom: 16 }}>
            HCE Status: {isEnabled ? 'Active' : 'Inactive'}
          </Text>
        )}

        {flow === 'receive' && (
          <Text style={{ color: '#999999', fontSize: 12, marginBottom: 16 }}>
            Reader Status: {isListening ? 'Listening' : 'Stopped'}
          </Text>
        )}

        {/* Cancel Button */}
        <TouchableOpacity 
          onPress={handleCancel}
          style={{ backgroundColor: '#666666', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 }}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Debug Logs */}
      <View style={{ backgroundColor: '#111111', padding: 16, maxHeight: 200 }}>
        <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Debug Logs:</Text>
        <ScrollView style={{ maxHeight: 150 }}>
          {logs.map((log, index) => (
            <Text key={index} style={{ color: '#00ff88', fontSize: 10, fontFamily: 'monospace' }}>
              {log}
            </Text>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
