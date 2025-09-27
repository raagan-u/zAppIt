import { ethers } from 'ethers';
import { TokenConfig } from '../constants/config';

// ERC-20 ABI for balanceOf function
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
];

export interface TokenBalance {
  token: TokenConfig;
  balance: string;
  formattedBalance: string;
}

export const getTokenBalance = async (
  provider: ethers.JsonRpcProvider,
  tokenAddress: string,
  walletAddress: string,
  tokenConfig: TokenConfig
): Promise<TokenBalance> => {
  try {
    console.log(`Fetching balance for ${tokenConfig.symbol} at ${tokenAddress} for wallet ${walletAddress}`);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await contract.balanceOf(walletAddress);
    
    // Format balance based on token decimals
    const formattedBalance = ethers.formatUnits(balance, tokenConfig.decimals);
    
    console.log(`Balance for ${tokenConfig.symbol}: ${balance.toString()}, formatted: ${formattedBalance}`);
    
    return {
      token: tokenConfig,
      balance: balance.toString(),
      formattedBalance: parseFloat(formattedBalance).toFixed(6),
    };
  } catch (error) {
    console.error(`Error fetching balance for token ${tokenConfig.symbol}:`, error);
    return {
      token: tokenConfig,
      balance: '0',
      formattedBalance: '0.000000',
    };
  }
};

export const getMultipleTokenBalances = async (
  provider: ethers.JsonRpcProvider,
  walletAddress: string,
  tokens: TokenConfig[]
): Promise<TokenBalance[]> => {
  const balancePromises = tokens.map(token => 
    getTokenBalance(provider, token.address, walletAddress, token)
  );
  
  return Promise.all(balancePromises);
};

export const getNativeBalance = async (
  provider: ethers.JsonRpcProvider,
  walletAddress: string
): Promise<string> => {
  try {
    const balance = await provider.getBalance(walletAddress);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error fetching native balance:', error);
    return '0';
  }
};
