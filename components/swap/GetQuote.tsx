import { Asset } from '../../types/garden';
import { request } from '../../utils/request';

// Types for Cross-Chain Swap API
interface QuoteResult {
  solver_id: string;
  estimated_time: number;
  source: Asset;
  destination: Asset;
  slippage: number;
}

interface QuoteResponse {
  status: 'Ok' | 'Error';
  error: string | null;
  result: QuoteResult[];
}

interface QuoteParams {
  url: string;
  fromAsset: string;
  toAsset: string;
  fromAmount?: string;
  toAmount?: string;
  affiliateFee?: number;
  slippage?: number;
  apiKey: string;
}

/**
 * Get a quote for swapping assets using Cross-Chain Swap API
 * @param params - Quote parameters
 * @returns Promise<QuoteResult[]>
 */
export const getQuote = async (params: QuoteParams): Promise<QuoteResult[]> => {
  const {
    url,
    fromAsset,
    toAsset,
    fromAmount,
    toAmount,
    affiliateFee,
    slippage,
    apiKey,
  } = params;

  // Debug: Print API key and request details
  console.log('🔑 API Key:', apiKey);
  console.log('🌐 Quote URL:', url);
  console.log('📊 Request params:', { fromAsset, toAsset, fromAmount, toAmount, affiliateFee, slippage });

  // Build query parameters
  const queryParams: Record<string, any> = {
    from: fromAsset,
    to: toAsset,
  };

  if (fromAmount) queryParams.from_amount = fromAmount;
  if (toAmount) queryParams.to_amount = toAmount;
  if (affiliateFee !== undefined) queryParams.affiliate_fee = affiliateFee;
  if (slippage !== undefined) queryParams.slippage = slippage;

  console.log('🔍 Final query params:', queryParams);
  console.log('📤 Request headers:', { 'garden-app-id': apiKey });

  const response = await request<QuoteResponse>(url, {
    method: 'GET',
    headers: {
      'garden-app-id': apiKey,
    },
    params: queryParams,
  });

  console.log('📥 Quote response:', response);

  if (response.status === 'Error') {
    throw new Error(response.error || 'Unknown API error');
  }

  return response.result;
};