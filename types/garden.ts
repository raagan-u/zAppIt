// Shared types for Cross-Chain Swap API

export interface Asset {
  asset: string;
  amount: string;
  display: string;
  value: string;
}

export interface OrderAsset {
  asset: string;
  owner: string;
  amount: string;
}

// Quote types
export interface QuoteResult {
  solver_id: string;
  estimated_time: number;
  source: Asset;
  destination: Asset;
  slippage: number;
}

export interface QuoteResponse {
  status: "Ok" | "Error";
  error: string | null;
  result: QuoteResult[];
}

// Types for swap initiation
export interface Transaction {
  chain_id: number;
  data: string;
  gas_limit: string;
  to: string;
  value: string;
}

export interface EIP712Field {
  name: string;
  type: string;
}

export interface EIP712Types {
  EIP712Domain: EIP712Field[];
  Initiate: EIP712Field[];
}

export interface EIP712Domain {
  chainId: string;
  name: string;
  verifyingContract: string;
  version: string;
}

export interface InitiateMessage {
  amount: string;
  redeemer: string;
  secretHash: string;
  timelock: string;
}

export interface TypedData {
  domain: EIP712Domain;
  message: InitiateMessage;
  primaryType: string;
  types: EIP712Types;
}

export interface InitiateSwapResult {
  approval_transaction: Transaction | null;
  initiate_transaction: Transaction;
  order_id: string;
  typed_data: TypedData;
}

export interface InitiateSwapResponse {
  status: "Ok" | "Error";
  error?: string;
  result: InitiateSwapResult;
}
