import React, { useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export interface PaymentInfo {
  recipientAddress: string;
  amount?: string;
  tokenAddress?: string;
  chainId?: number;
}

interface NFCProps {
  onPaymentInfoReceived: (paymentInfo: PaymentInfo) => void;
  onClose: () => void;
}

export const NFC: React.FC<NFCProps> = ({ onPaymentInfoReceived, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);

  const getPaymentInfo = (nfcData: string): PaymentInfo | null => {
    try {
      // Parse NFC data - similar to QR but might have different formats
      // NFC can contain NDEF (NFC Data Exchange Format) messages
      
      // Try to parse as JSON first
      try {
        const jsonData = JSON.parse(nfcData);
        if (jsonData.address || jsonData.recipientAddress) {
          return {
            recipientAddress: jsonData.address || jsonData.recipientAddress,
            amount: jsonData.amount,
            tokenAddress: jsonData.tokenAddress,
            chainId: jsonData.chainId || jsonData.chain_id,
          };
        }
      } catch {
        // Not JSON, continue with other parsing methods
      }

      // Try EIP-681 format
      if (nfcData.startsWith('ethereum:')) {
        const url = new URL(nfcData);
        const address = url.pathname.split('@')[0];
        const params = new URLSearchParams(url.search);
        
        return {
          recipientAddress: address,
          amount: params.get('uint256') || undefined,
          tokenAddress: params.get('address') || undefined,
          chainId: parseInt(url.pathname.split('@')[1]?.split('/')[0] || '1'),
        };
      }

      // Try simple address format
      if (nfcData.startsWith('0x') && nfcData.length === 42) {
        return {
          recipientAddress: nfcData,
        };
      }

      // Try NDEF format (simplified)
      if (nfcData.includes('ndef:')) {
        const payload = nfcData.split('ndef:')[1];
        try {
          const decoded = JSON.parse(payload);
          return {
            recipientAddress: decoded.address || decoded.recipientAddress,
            amount: decoded.amount,
            tokenAddress: decoded.tokenAddress,
            chainId: decoded.chainId || decoded.chain_id,
          };
        } catch {
          return null;
        }
      }

      // If none of the above, return null
      return null;
    } catch (error) {
      console.error('Error parsing NFC data:', error);
      return null;
    }
  };

  const handleNFCScan = () => {
    setIsScanning(true);
    
    // Simulate NFC scanning - in a real app, you'd use NFC libraries
    // For demo purposes, we'll simulate scanning an NFC tag
    setTimeout(() => {
      setIsScanning(false);
      
      // Simulate different NFC data formats
      const sampleNFCData = [
        '0xe62a2b235f7bB86C1122313153824D54E6137e77', // Simple address
        JSON.stringify({
          address: '0xe62a2b235f7bB86C1122313153824D54E6137e77',
          amount: '0.05',
          tokenAddress: 'native',
          chainId: 11155111,
        }), // JSON format
        'ethereum:0xe62a2b235f7bB86C1122313153824D54E6137e77@11155111/transfer?uint256=50000000000000000', // EIP-681
        'ndef:' + JSON.stringify({
          address: '0xe62a2b235f7bB86C1122313153824D54E6137e77',
          amount: '0.025',
          tokenAddress: 'native',
          chainId: 11155111,
        }), // NDEF format
      ];
      
      const randomNFC = sampleNFCData[Math.floor(Math.random() * sampleNFCData.length)];
      const paymentInfo = getPaymentInfo(randomNFC);
      
      if (paymentInfo) {
        onPaymentInfoReceived(paymentInfo);
        onClose();
      } else {
        Alert.alert('Invalid NFC Tag', 'The scanned NFC tag does not contain valid payment information.');
      }
    }, 1500);
  };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>NFC Transfer</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.nfcArea}>
            <Text style={styles.nfcText}>
              {isScanning ? 'Scanning NFC...' : 'Hold device near NFC tag'}
            </Text>
            
            {!isScanning && (
              <TouchableOpacity style={styles.scanButton} onPress={handleNFCScan}>
                <Text style={styles.scanButtonText}>📱 Start NFC Scan</Text>
              </TouchableOpacity>
            )}
            
            {isScanning && (
              <View style={styles.scanningIndicator}>
                <Text style={styles.scanningText}>📡 Scanning NFC...</Text>
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>NFC Transfer Features:</Text>
            <Text style={styles.infoText}>• Contactless payment information</Text>
            <Text style={styles.infoText}>• Supports multiple data formats</Text>
            <Text style={styles.infoText}>• Fast and secure transfers</Text>
            <Text style={styles.infoText}>• Works with NFC-enabled devices</Text>
          </View>

          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>How to use:</Text>
            <Text style={styles.instructionsText}>1. Ensure NFC is enabled on your device</Text>
            <Text style={styles.instructionsText}>2. Hold your device close to the NFC tag</Text>
            <Text style={styles.instructionsText}>3. Wait for the scan to complete</Text>
            <Text style={styles.instructionsText}>4. Review and confirm payment details</Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  nfcArea: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#333333',
    borderStyle: 'dashed',
  },
  nfcText: {
    fontSize: 18,
    color: '#ffffff',
    fontFamily: 'Inter',
    marginBottom: 20,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  scanButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  scanningIndicator: {
    backgroundColor: '#333333',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  scanningText: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  infoSection: {
    marginTop: 20,
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  instructionsSection: {
    marginTop: 16,
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
});
