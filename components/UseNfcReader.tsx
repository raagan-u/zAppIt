import { useCallback, useState } from 'react';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

interface UseNFCReaderReturn {
  startListening: (onMessage: (message: string) => void) => Promise<void>;
  stopListening: () => Promise<void>;
  isListening: boolean;
  isLoading: boolean;
  lastMessage: string | null;
}

export const useNFCReader = (): UseNFCReaderReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const startListening = useCallback(async (onMessageReceived: (message: string) => void) => {
    setIsLoading(true);
    
    try {
      // Initialize NFC Manager
      await NfcManager.start();
      
      // Check NFC status
      const isSupported = await NfcManager.isSupported();
      const isEnabled = await NfcManager.isEnabled();
      
      if (!isSupported) {
        throw new Error('NFC is not supported on this device');
      }
      
      if (!isEnabled) {
        throw new Error('NFC is not enabled. Please enable NFC in device settings.');
      }
      
      setIsListening(true);
      
      try {
        // Add a timeout to prevent infinite waiting
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('NFC request timeout - no tag detected in 15 seconds')), 15000);
        });
        
        const nfcPromise = NfcManager.requestTechnology(NfcTech.Ndef);
        
        await Promise.race([nfcPromise, timeoutPromise]);
      
        // the resolved tag object will contain `ndefMessage` property
        const tag = await NfcManager.getTag();
        
        // Process the tag data
        if (tag && tag.ndefMessage && tag.ndefMessage.length > 0) {
          for (let i = 0; i < tag.ndefMessage.length; i++) {
            const record = tag.ndefMessage[i];
            
            if (record.type && record.payload) {
              try {
                // Convert payload to string (skip first 3 bytes which are encoding info for text records)
                const payloadString = String.fromCharCode.apply(null, Array.from(record.payload.slice(3)));
                
                setLastMessage(payloadString);
                onMessageReceived(payloadString);
              } catch (parseError) {
                console.error(`Failed to parse NDEF record ${i + 1}: ${(parseError as Error).message}`);
              }
            }
          }
        }
        
        // Cancel the technology request
        await NfcManager.cancelTechnologyRequest();
        
      } catch (tagError) {
        console.error(`Error reading NFC tag: ${(tagError as Error).message}`);
        throw tagError;
      } finally {
        setIsListening(false);
      }
    } catch (error) {
      console.error(`Failed to start NFC listening: ${(error as Error).message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopListening = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Cancel any pending technology request
      await NfcManager.cancelTechnologyRequest();
      
      setIsListening(false);
    } catch (error) {
      console.error(`Error stopping NFC listener: ${(error as Error).message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    startListening,
    stopListening,
    isListening,
    isLoading,
    lastMessage,
  };
};
