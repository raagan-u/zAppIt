import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';

interface WalletContextType {
  wallet: ethers.Wallet | null;
  provider: ethers.JsonRpcProvider | null;
  isConnected: boolean;
  connectWallet: (privateKey: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [provider, setProvider] = useState<ethers.JsonRpcProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple RPC URL for testing (Ethereum Sepolia testnet)
  const getRpcUrl = (): string => {
    const alchemyApiKey = process.env.EXPO_PUBLIC_ALCHEMY_API_KEY;
    return alchemyApiKey
      ? `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`
      : 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161';
  };

  // Load stored wallet on app start
  useEffect(() => {
    const loadStoredWallet = async () => {
      try {
        setError(null);
        const storedPrivateKey = await AsyncStorage.getItem('wallet_private_key');
        if (storedPrivateKey) {
          const rpcUrl = getRpcUrl();
          console.log('Loading stored wallet...');
          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const wallet = new ethers.Wallet(storedPrivateKey, provider);
          setWallet(wallet);
          setProvider(provider);
          setIsConnected(true);
          console.log('Wallet loaded successfully');
        }
      } catch (error) {
        console.error('Error loading stored wallet:', error);
        setError(error instanceof Error ? error.message : 'Failed to load wallet');
      }
    };

    loadStoredWallet();
  }, []);

  const connectWallet = async (privateKey: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const rpcUrl = getRpcUrl();
      console.log('Connecting wallet...');
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);

      // Verify the wallet is valid by getting the address
      const address = await wallet.getAddress();
      console.log('Wallet connected:', address);

      setWallet(wallet);
      setProvider(provider);
      setIsConnected(true);

      // Store the private key securely
      await AsyncStorage.setItem('wallet_private_key', privateKey);
      console.log('Wallet connected and stored successfully');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      console.log('Disconnecting wallet...');
      await AsyncStorage.removeItem('wallet_private_key');
      setWallet(null);
      setProvider(null);
      setIsConnected(false);
      setError(null);
      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: WalletContextType = {
    wallet,
    provider,
    isConnected,
    connectWallet,
    disconnectWallet,
    isLoading,
    error,
    clearError,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
