import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';
import { DEFAULT_CHAIN, getChainConfig } from '../constants/config';

interface WalletContextType {
  wallet: ethers.Wallet | null;
  provider: ethers.JsonRpcProvider | null;
  isConnected: boolean;
  currentChain: string;
  connectWallet: (privateKey: string, chainName?: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchChain: (chainName: string) => Promise<void>;
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
  const [currentChain, setCurrentChain] = useState(DEFAULT_CHAIN);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get RPC URL for a specific chain
  const getRpcUrl = (chainName: string): string => {
    const chainConfig = getChainConfig(chainName);
    return chainConfig.rpcUrl;
  };

  // Load stored wallet on app start
  useEffect(() => {
    const loadStoredWallet = async () => {
      try {
        setError(null);
        const storedPrivateKey = await AsyncStorage.getItem('wallet_private_key');
        const storedChain = await AsyncStorage.getItem('wallet_chain');
        
        if (storedPrivateKey) {
          const chainName = storedChain || DEFAULT_CHAIN;
          const rpcUrl = getRpcUrl(chainName);
          console.log('Loading stored wallet...');
          const provider = new ethers.JsonRpcProvider(rpcUrl);
          const wallet = new ethers.Wallet(storedPrivateKey, provider);
          setWallet(wallet);
          setProvider(provider);
          setCurrentChain(chainName);
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

  const connectWallet = async (privateKey: string, chainName: string = currentChain) => {
    try {
      setIsLoading(true);
      setError(null);

      const rpcUrl = getRpcUrl(chainName);
      console.log('Connecting wallet...');
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);

      // Verify the wallet is valid by getting the address
      const address = await wallet.getAddress();
      console.log('Wallet connected:', address);

      setWallet(wallet);
      setProvider(provider);
      setCurrentChain(chainName);
      setIsConnected(true);

      // Store the private key and chain securely
      await AsyncStorage.setItem('wallet_private_key', privateKey);
      await AsyncStorage.setItem('wallet_chain', chainName);
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
      await AsyncStorage.removeItem('wallet_chain');
      setWallet(null);
      setProvider(null);
      setCurrentChain(DEFAULT_CHAIN);
      setIsConnected(false);
      setError(null);
      console.log('Wallet disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      throw error;
    }
  };

  const switchChain = async (chainName: string) => {
    if (!wallet) {
      throw new Error('No wallet connected');
    }

    try {
      setIsLoading(true);
      setError(null);

      const rpcUrl = getRpcUrl(chainName);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const newWallet = new ethers.Wallet(wallet.privateKey, provider);

      setProvider(provider);
      setWallet(newWallet);
      setCurrentChain(chainName);

      // Update stored chain
      await AsyncStorage.setItem('wallet_chain', chainName);
      console.log('Chain switched to:', chainName);
    } catch (error) {
      console.error('Error switching chain:', error);
      setError(error instanceof Error ? error.message : 'Failed to switch chain');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: WalletContextType = {
    wallet,
    provider,
    isConnected,
    currentChain,
    connectWallet,
    disconnectWallet,
    switchChain,
    isLoading,
    error,
    clearError,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
