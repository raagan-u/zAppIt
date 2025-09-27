import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface PaymentInfo {
  recipientAddress: string;
  amount?: string;
  tokenAddress?: string;
  chainId?: number;
}

interface QRProps {
  onPaymentInfoReceived: (paymentInfo: PaymentInfo) => void;
  onClose: () => void;
}

export const QR: React.FC<QRProps> = ({ onPaymentInfoReceived, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const getPaymentInfo = (qrData: string): PaymentInfo | null => {
    try {
      // Parse QR code data - this could be in various formats:
      // 1. Simple address: "0x..."
      // 2. EIP-681 format: "ethereum:0x...@1/transfer?address=0x...&uint256=1000000000000000000"
      // 3. Custom format: JSON with payment details
      
      // Try to parse as JSON first
      try {
        const jsonData = JSON.parse(qrData);
        if (jsonData.address || jsonData.recipientAddress) {
          return {
            recipientAddress: jsonData.address || jsonData.recipientAddress,
            amount: jsonData.amount,
            tokenAddress: jsonData.tokenAddress,
            chainId: jsonData.chainId,
          };
        }
      } catch {
        // Not JSON, continue with other parsing methods
        console.warn("Not JSON, continuing with other parsing methods");
      }

      // Try EIP-681 format
      if (qrData.startsWith('ethereum:')) {
        const url = new URL(qrData);
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
      if (qrData.startsWith('0x') && qrData.length === 42) {
        return {
          recipientAddress: qrData,
        };
      }

      // If none of the above, return null
      return null;
    } catch (error) {
      console.error('Error parsing QR code:', error);
      return null;
    }
  };

  const handleQRScan = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission', 'Camera permission is required to scan QR codes.');
        return;
      }
    }
    setIsScanning(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!isScanning) return;

    console.log("QR got scanned"); 
    
    setIsScanning(false);
    const paymentInfo = getPaymentInfo(data);
    
    if (paymentInfo) {
      onPaymentInfoReceived(paymentInfo);
      onClose();
    } else {
      Alert.alert('Invalid QR Code', 'The scanned QR code does not contain valid payment information.');
    }
  };

  if (!permission) {
    // Camera permissions are still loading
    return (
      <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Scan QR Code</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading camera...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Scan QR Code</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <View style={styles.permissionContainer}>
            <Ionicons name="camera-outline" size={64} color="#666666" />
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionText}>
              We need access to your camera to scan QR codes for payment information.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={handleQRScan}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
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
            <Text style={styles.title}>Scan QR Code</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {!isScanning ? (
            <View style={styles.content}>
              <View style={styles.scannerArea}>
                <Ionicons name="qr-code-outline" size={64} color="#666666" />
                <Text style={styles.scannerText}>
                  Ready to scan QR code
                </Text>
                <Text style={styles.scannerSubtext}>
                  Tap the button below to start scanning
                </Text>
                
                <TouchableOpacity style={styles.scanButton} onPress={handleQRScan}>
                  <Ionicons name="camera" size={20} color="#000000" />
                  <Text style={styles.scanButtonText}>Start Scanning</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Supported QR Formats:</Text>
                <Text style={styles.infoText}>• Simple address: 0x...</Text>
                <Text style={styles.infoText}>• JSON format: {"{address, amount, tokenAddress}"}</Text>
                <Text style={styles.infoText}>• EIP-681 format: ethereum:0x...@chainId/transfer</Text>
              </View>
            </View>
          ) : (
            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={handleBarcodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
              />
              
              <View style={styles.cameraOverlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanInstruction}>
                  Position the QR code within the frame
                </Text>
              </View>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scannerArea: {
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
  scannerText: {
    fontSize: 18,
    color: '#ffffff',
    fontFamily: 'Inter',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  scannerSubtext: {
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Inter',
    marginBottom: 30,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
    marginLeft: 8,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#00ff88',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanInstruction: {
    position: 'absolute',
    bottom: 100,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  infoSection: {
    marginTop: 30,
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
});
