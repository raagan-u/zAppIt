import { ethers } from 'ethers';
import { InitiateSwapResult, Transaction } from '../../types/garden';

export interface InitiateSwapParams {
  swapData: InitiateSwapResult;
  signer: ethers.Wallet; // ethers signer or wallet interface
}

export interface SwapExecutionResult {
  approvalTxHash?: string;
  initiateTxHash: string;
  orderId: string;
}

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  totalCost: bigint;
  balance: bigint;
  hasEnoughBalance: boolean;
}

/**
 * Check if wallet has enough balance for gas fees
 * @param signer - Ethers signer
 * @param transaction - Transaction to estimate
 * @returns Promise<GasEstimate>
 */
export const checkGasBalance = async (signer: ethers.Wallet, transaction: Transaction): Promise<GasEstimate> => {
  const provider = signer.provider;
  if (!provider) {
    throw new Error('Signer must have a provider');
  }

  // Get current balance
  const balance = await provider.getBalance(signer.address);
  
  // Get current gas price
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei'); // fallback
  
  // Use provided gas limit or estimate
  let gasLimit: bigint;
  try {
    gasLimit = BigInt(transaction.gas_limit);
  } catch {
    // If gas limit parsing fails, estimate it
    const txRequest = {
      to: transaction.to,
      data: transaction.data,
      value: transaction.value,
    };
    gasLimit = await provider.estimateGas(txRequest);
  }

  const totalCost = gasLimit * gasPrice + BigInt(transaction.value || '0');
  const hasEnoughBalance = balance >= totalCost;

  console.log('💰 Gas Check:', {
    balance: ethers.formatEther(balance),
    gasLimit: gasLimit.toString(),
    gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
    totalCost: ethers.formatEther(totalCost),
    hasEnoughBalance
  });

  return {
    gasLimit,
    gasPrice,
    totalCost,
    balance,
    hasEnoughBalance
  };
};

/**
 * Initiate a swap by executing the required transactions
 * @param params - Swap initiation parameters
 * @returns Promise<SwapExecutionResult>
 */
export const initiateSwap = async (params: InitiateSwapParams): Promise<SwapExecutionResult> => {
  const { swapData, signer } = params;
  const { approval_transaction, initiate_transaction, order_id } = swapData;

  console.log('🚀 Starting swap initiation for order:', order_id);
  console.log('📋 Swap data:', swapData);

  let approvalTxHash: string | undefined;

  try {
    // Check network and signer
    if (!signer.provider) {
      throw new Error('Signer must have a provider connected');
    }

    const network = await signer.provider.getNetwork();
    console.log('🌐 Connected to network:', network.name, 'Chain ID:', network.chainId);

    // Execute approval transaction if required
    if (approval_transaction) {
      console.log('💼 Checking approval transaction gas...');
      const approvalGasCheck = await checkGasBalance(signer, approval_transaction);
      
      if (!approvalGasCheck.hasEnoughBalance) {
        throw new Error(
          `Insufficient ETH for approval transaction. Need: ${ethers.formatEther(approvalGasCheck.totalCost)} ETH, Have: ${ethers.formatEther(approvalGasCheck.balance)} ETH`
        );
      }

      console.log('✅ Executing approval transaction...');
      const approvalTx = await executeTransactionWithRetry(approval_transaction, signer);
      approvalTxHash = approvalTx.hash;
      console.log('📤 Approval transaction sent:', approvalTxHash);
      
      // Wait for approval transaction to be mined
      console.log('⏳ Waiting for approval confirmation...');
      await approvalTx.wait();
      console.log('✅ Approval transaction confirmed');
    }

    // Check gas for initiate transaction
    console.log('💼 Checking initiate transaction gas...');
    const initiateGasCheck = await checkGasBalance(signer, initiate_transaction);
    
    if (!initiateGasCheck.hasEnoughBalance) {
      throw new Error(
        `Insufficient ETH for initiate transaction. Need: ${ethers.formatEther(initiateGasCheck.totalCost)} ETH, Have: ${ethers.formatEther(initiateGasCheck.balance)} ETH`
      );
    }

    // Execute initiate transaction
    console.log('✅ Executing initiate transaction...');
    const initiateTx = await executeTransactionWithRetry(initiate_transaction, signer);
    const initiateTxHash = initiateTx.hash;
    console.log('📤 Initiate transaction sent:', initiateTxHash);

    // Wait for initiate transaction to be mined
    console.log('⏳ Waiting for initiate confirmation...');
    await initiateTx.wait();
    console.log('✅ Initiate transaction confirmed');

    console.log('🎉 Swap completed successfully!');
    return {
      approvalTxHash,
      initiateTxHash,
      orderId: order_id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to initiate swap';
    console.error('❌ Swap initiation error:', errorMessage);
    
    // Provide more helpful error messages
    if (errorMessage.includes('insufficient funds')) {
      throw new Error(`Insufficient ETH balance for gas fees. Please add ETH to your wallet and try again. Original error: ${errorMessage}`);
    }
    if (errorMessage.includes('user rejected')) {
      throw new Error('Transaction was rejected by user');
    }
    if (errorMessage.includes('network')) {
      throw new Error(`Network error: ${errorMessage}`);
    }
    
    throw new Error(`Swap initiation failed: ${errorMessage}`);
  }
};

/**
 * Execute a transaction with retry logic and better error handling
 * @param transaction - Transaction data from Garden Finance API
 * @param signer - Ethers signer
 * @returns Promise<any> - Transaction response
 */
const executeTransactionWithRetry = async (transaction: Transaction, signer: ethers.Wallet, maxRetries = 3): Promise<any> => {
  console.log('🔄 Executing transaction to:', transaction.to);
  console.log('💾 Transaction data:', transaction.data);
  console.log('💰 Transaction value:', transaction.value);
  console.log('⛽ Gas limit:', transaction.gas_limit);

  const provider = signer.provider;
  if (!provider) {
    throw new Error('Signer must have a provider');
  }

  // Get fresh fee data
  const feeData = await provider.getFeeData();
  console.log('💡 Current fee data:', {
    gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : 'unknown',
    maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : 'unknown',
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : 'unknown'
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Prepare transaction request
      const txRequest: any = {
        to: transaction.to,
        data: transaction.data,
        value: transaction.value || '0x0',
      };

      // Handle gas pricing
      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        // EIP-1559 transaction
        txRequest.maxFeePerGas = feeData.maxFeePerGas;
        txRequest.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      } else if (feeData.gasPrice) {
        // Legacy transaction
        txRequest.gasPrice = feeData.gasPrice;
      }

      // Set gas limit
      try {
        txRequest.gasLimit = BigInt(transaction.gas_limit);
      } catch {
        // If provided gas limit is invalid, estimate it
        console.log('⚠️ Invalid gas limit, estimating...');
        txRequest.gasLimit = await provider.estimateGas({
          to: transaction.to,
          data: transaction.data,
          value: transaction.value || '0x0',
        });
        console.log('📊 Estimated gas limit:', txRequest.gasLimit.toString());
      }

      console.log(`🚀 Attempt ${attempt}/${maxRetries} - Sending transaction...`);
      console.log('📋 Final transaction request:', {
        to: txRequest.to,
        value: txRequest.value,
        gasLimit: txRequest.gasLimit.toString(),
        gasPrice: txRequest.gasPrice ? ethers.formatUnits(txRequest.gasPrice, 'gwei') : undefined,
        maxFeePerGas: txRequest.maxFeePerGas ? ethers.formatUnits(txRequest.maxFeePerGas, 'gwei') : undefined,
      });

      // Send the transaction
      const tx = await signer.sendTransaction(txRequest);
      console.log('✅ Transaction sent successfully:', tx.hash);
      return tx;

    } catch (error) {
      console.error(`❌ Attempt ${attempt}/${maxRetries} failed:`, error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Don't retry for certain errors
      if (errorMessage.includes('user rejected') || 
          errorMessage.includes('User denied') ||
          errorMessage.includes('insufficient funds')) {
        throw error;
      }
      
      // Retry for network or temporary errors
      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in 2 seconds... (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      // Final attempt failed
      throw error;
    }
  }
  
  throw new Error('All transaction attempts failed');
};

/**
 * Sign typed data for EIP-712 if needed (for future use)
 * @param signer - Ethers signer with _signTypedData method
 * @param typedData - EIP-712 typed data from Garden Finance API
 * @returns Promise<string> - Signature
 */
export const signTypedData = async (signer: any, typedData: any): Promise<string> => {
  if (!signer._signTypedData) {
    throw new Error('Signer does not support typed data signing');
  }

  const { domain, types, message } = typedData;
  const signature = await signer._signTypedData(domain, types, message);
  return signature;
};