# Cross-Chain Swap Components

This folder contains all the components and utilities for cross-chain asset swapping functionality.

## 📁 File Structure

```
swap/
├── README.md           # This documentation
├── Swap.tsx           # Main swap component with UI
├── GetQuote.tsx       # Quote fetching functionality
├── CreateOrder.tsx    # Order creation functionality
└── InitiateSwap.tsx   # Swap initiation and execution
```

## 🔧 Components

### `Swap.tsx`

Main React Native component that provides the complete swap interface.

**Features:**

- Multi-step swap flow (Input → Quote → Order → Complete)
- Source and destination asset input fields
- Quote selection interface
- Dark theme UI matching app design
- Wallet integration for transaction signing
- Loading states and error handling

**Props:**

```typescript
interface SwapProps {
  apiKey: string; // API key for swap service
}
```

**Usage:**

```tsx
<Swap apiKey="your-api-key" />
```

**Configuration:**

- Quote and order URLs are loaded from environment variables
- RPC URL is automatically loaded from the current chain configuration
- Chain selection is managed by the WalletContext

### `GetQuote.tsx`

Utility function for fetching swap quotes.

**Function:**

```typescript
export const getQuote = async (params: QuoteParams): Promise<QuoteResult[]>
```

**Parameters:**

- `url`: Quote API endpoint
- `fromAsset`: Source asset identifier
- `toAsset`: Destination asset identifier
- `fromAmount`: Amount to swap (optional)
- `toAmount`: Expected receive amount (optional)
- `affiliateFee`: Fee in BIPS (optional)
- `slippage`: Slippage tolerance in BIPS (optional)
- `apiKey`: API authentication key

### `CreateOrder.tsx`

Utility function for creating swap orders.

**Function:**

```typescript
export const createOrder = async (params: CreateOrderParams): Promise<CreateOrderResult>
```

**Parameters:**

- `url`: Order creation API endpoint
- `source`: Source asset details (asset, owner, amount)
- `destination`: Destination asset details (asset, owner, amount)
- `apiKey`: API authentication key

### `InitiateSwap.tsx`

Utility functions for executing blockchain transactions.

**Main Function:**

```typescript
export const initiateSwap = async (params: InitiateSwapParams): Promise<SwapExecutionResult>
```

**Features:**

- Executes approval transactions (if required)
- Executes initiate transactions
- Waits for transaction confirmations
- Returns transaction hashes and order ID

**Additional Function:**

```typescript
export const signTypedData = async (signer: any, typedData: any): Promise<string>
```

## 🔄 Complete Swap Flow

1. **Input Phase**: User enters source/destination assets and amounts
2. **Quote Phase**: Fetch available quotes from the API
3. **Selection Phase**: User selects preferred quote
4. **Order Phase**: Create order and execute blockchain transactions
5. **Complete Phase**: Display transaction results and order ID

## 🎨 UI/UX Features

- **Dark Theme**: Matches app's black background (#000000)
- **Brand Colors**: Uses signature green (#00ff88) for primary actions
- **Typography**: Inter font family throughout
- **Responsive**: Scrollable interface for mobile devices
- **Loading States**: Activity indicators during API calls
- **Error Handling**: User-friendly error messages
- **Validation**: Form validation for required fields

## 🔧 Dependencies

### Internal Dependencies

- `../../contexts/WalletContext` - Wallet connection, signing, and current chain
- `../../constants/config` - Chain configuration and RPC URLs
- `../../types/garden` - TypeScript type definitions
- `../../utils/request` - HTTP request utility

### External Dependencies

- `react-native` - Core React Native components
- `ethers` - Ethereum library for transaction signing

## 📡 API Integration

The swap components integrate with a RESTful API for:

### Quote Endpoint

```
GET /v2/quote
Headers: garden-app-id: <api-key>
Query Params: from, to, from_amount, to_amount, affiliate_fee, slippage
```

### Order Endpoint

```
POST /v2/orders
Headers: garden-app-id: <api-key>
Body: { source: {...}, destination: {...} }
```

## 🛡️ Error Handling

- Network request failures
- API error responses
- Transaction failures
- Wallet connection issues
- Form validation errors

## 🚀 Usage in App

The swap functionality is integrated into the app navigation:

```typescript
// app/(tabs)/swap.tsx
import Swap from "../../components/swap/Swap";

export default function SwapScreen() {
  return (
    <View style={styles.container}>
      <Swap
        apiKey={process.env.EXPO_PUBLIC_SWAP_API_KEY || "your-api-key-here"}
      />
    </View>
  );
}
```

## 🔐 Environment Variables

Add to your `.env` file:

```
# Swap API Configuration
EXPO_PUBLIC_SWAP_API_KEY=your-actual-api-key
EXPO_PUBLIC_QUOTE_URL=https://mainnet.garden.finance/v2/quote
EXPO_PUBLIC_ORDER_URL=https://mainnet.garden.finance/v2/orders

# Chain Configuration (optional - defaults to 'sepolia')
EXPO_PUBLIC_DEFAULT_CHAIN=sepolia
```

**RPC URLs**: Automatically loaded from `constants/config.ts` based on the current chain selected in WalletContext.

**Supported Chains**:

- `sepolia` - Sepolia Testnet
- `polygon` - Polygon Mainnet

_Chain configurations can be extended in `constants/config.ts`_

## 🎯 Key Benefits

- **Modular Design**: Each function has a single responsibility
- **Type Safety**: Full TypeScript support with proper interfaces
- **Reusable**: Functions can be used independently
- **Testable**: Pure functions easy to unit test
- **Maintainable**: Clear separation of concerns
- **User-Friendly**: Intuitive step-by-step interface

## 📝 Notes

- All components use the shared request utility for HTTP calls
- Type definitions are centralized in `types/garden.ts`
- Wallet integration requires user to connect wallet first
- All API responses include proper error handling
- Transaction execution includes gas estimation and confirmation waiting
