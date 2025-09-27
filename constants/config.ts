export interface TokenConfig {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

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
  tokens?: TokenConfig[];
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
    tokens: [
      {
        address: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9', // PayPal USD
        name: 'PayPal USD',
        symbol: 'PAYPALUSD',
        decimals: 6,
      },
    ],
  },
  polygon: {
    name: 'Polygon',
    chainId: 137,
    rpcUrl:  'https://rpc-amoy.polygon.technology/',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
    tokens: [
      {
        address: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582', // USDC
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
      }
    ],
  },
};

export const DEFAULT_CHAIN = process.env.EXPO_PUBLIC_DEFAULT_CHAIN || 'sepolia';

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
