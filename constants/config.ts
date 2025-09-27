export interface ChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  blockExplorer?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const CHAIN_CONFIGS: Record<string, ChainConfig> = {
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl:  'https://eth-sepolia.public.blastapi.io',
    blockExplorer: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    rpcUrl: process.env.EXPO_PUBLIC_POLYGON_RPC_URL || 'https://polygon.drpc.org',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
};

export const DEFAULT_CHAIN = process.env.EXPO_PUBLIC_DEFAULT_CHAIN || 'ethereum';

export const getChainConfig = (chainName: string): ChainConfig => {
  const config = CHAIN_CONFIGS[chainName];
  if (!config) {
    throw new Error(`Chain configuration not found for: ${chainName}`);
  }
  return config;
};

export const getAvailableChains = (): string[] => {
  return Object.keys(CHAIN_CONFIGS);
};
