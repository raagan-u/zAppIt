import { useCallback, useState } from 'react';
import { HCESession, NFCTagType4, NFCTagType4NDEFContentType } from 'react-native-hce';

interface UseSimpleHCEReturn {
  sendMessage: (data?: any) => Promise<void>;
  stopSession: () => Promise<void>;
  isEnabled: boolean;
  isLoading: boolean;
}

export const useSimpleHCE = (): UseSimpleHCEReturn => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (paymentData?: any) => {
    setIsLoading(true);
    console.info('Starting HCE send process...');
    
    try {
      // Create default payment data if none provided
      const defaultPaymentData = {
        address: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
        amount: "0.001",
        chain_id: "11155111", // Sepolia testnet
        asset: "ETH",
        chain: "sepolia",
        token_address: null // null means primary/ETH transfer
      };
      
      const dataToSend = paymentData || defaultPaymentData;
      const jsonMessage = JSON.stringify(dataToSend);
      
      console.debug(`Creating NFC tag with payment data: ${jsonMessage}`);
      
      // Create NFC Type 4 tag with the JSON payment data
      const tag = new NFCTagType4({
        type: NFCTagType4NDEFContentType.Text,
        content: jsonMessage,
        writable: false,
      });
      
      console.debug('NFC tag created successfully');
      
      let session = await HCESession.getInstance();
      console.debug('HCE session instance obtained');
      
      console.info('Setting tag as HCE application...');
      
      // Set the tag as the HCE application
      await session.setApplication(tag);
      console.info('Tag set as HCE application');
      
      console.info('Enabling HCE session...');
      // Enable the HCE session
      await session.setEnabled(true);
      setIsEnabled(true);
      
      // Verify HCE is enabled
      console.debug(`HCE enabled status: ${session.enabled}`);
      
      console.info(`HCE enabled - payment data is now available for reading`);
      console.info(`Payment data: ${jsonMessage}`);
      
      // Set up event listeners for debugging (with error handling)
      try {
        const removeReadListener = session.on(HCESession.Events.HCE_STATE_READ, () => {
          console.info('HCE tag was read by another device!');
        });
        
        const removeWriteListener = session.on(HCESession.Events.HCE_STATE_WRITE_FULL, () => {
          console.info('HCE state write full event received');
        });
        
        // Store listeners for cleanup
        (session as any)._removeListeners = [removeReadListener, removeWriteListener];
      } catch (listenerError) {
        console.warn('Could not set up HCE event listeners:', listenerError);
      }
      
      // Add periodic status check (with error handling)
      try {
        const statusInterval = setInterval(() => {
          try {
            const isStillEnabled = session.enabled;
            console.debug(`HCE status check: ${isStillEnabled ? 'ENABLED' : 'DISABLED'}`);
            if (!isStillEnabled) {
              console.error('HCE session was unexpectedly disabled!');
              clearInterval(statusInterval);
            }
          } catch (statusError) {
            console.warn('Error checking HCE status:', statusError);
            clearInterval(statusInterval);
          }
        }, 5000);
        
        // Store interval for cleanup
        (session as any)._statusInterval = statusInterval;
      } catch (intervalError) {
        console.warn('Could not set up HCE status interval:', intervalError);
      }
      
    } catch (error) {
      console.error(`Error sending message via HCE: ${(error as Error).message}`);
      console.error('Full error:', error);
      setIsEnabled(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopSession = useCallback(async (): Promise<void> => {
    try {
      let session = await HCESession.getInstance();
      await session.setEnabled(false);
      setIsEnabled(false);
      
      // Clean up listeners and intervals
      if ((session as any)._removeListeners) {
        (session as any)._removeListeners.forEach((removeListener: () => void) => removeListener());
      }
      
      if ((session as any)._statusInterval) {
        clearInterval((session as any)._statusInterval);
      }
      
      console.log('HCE session stopped and cleaned up');
    } catch (error) {
      console.error('Error stopping HCE session:', error);
      throw error;
    }
  }, []);

  return {
    sendMessage,
    stopSession,
    isEnabled,
    isLoading,
  };
};
