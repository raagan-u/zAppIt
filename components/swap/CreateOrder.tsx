import { OrderAsset } from '../../types/garden';
import { request } from '../../utils/request';

// Types for Cross-Chain Swap Create Order API
interface CreateOrderRequest {
  source: OrderAsset;
  destination: OrderAsset;
}

interface CreateOrderResult {
  order_id: string;
  to: string;
  amount: number;
}

interface CreateOrderResponse {
  status: 'Ok' | 'Error';
  error: string | null;
  result: CreateOrderResult;
}

interface CreateOrderParams {
  url: string;
  source: OrderAsset;
  destination: OrderAsset;
  apiKey: string;
}

/**
 * Create an order using Cross-Chain Swap API
 * @param params - Create order parameters
 * @returns Promise<CreateOrderResult>
 */
export const createOrder = async (params: CreateOrderParams): Promise<CreateOrderResult> => {
  const {
    url,
    source,
    destination,
    apiKey,
  } = params;

  // Debug: Print API key and request details
  console.log('🔑 Create Order API Key:', apiKey);
  console.log('🌐 Create Order URL:', url);
  console.log('📊 Order source:', source);
  console.log('📊 Order destination:', destination);

  const requestBody: CreateOrderRequest = {
    source,
    destination,
  };

  console.log('📤 Create Order request body:', requestBody);
  console.log('📤 Create Order headers:', { 'garden-app-id': apiKey });

  const response = await request<CreateOrderResponse>(url, {
    method: 'POST',
    headers: {
      'garden-app-id': apiKey,
    },
    data: requestBody,
  });

  console.log('📥 Create Order response:', response);

  if (response.status === 'Error') {
    throw new Error(response.error || 'Unknown API error');
  }

  return response.result;
};