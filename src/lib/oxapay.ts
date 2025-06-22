// OxaPay Payment Gateway Integration - Updated with correct API
const OXAPAY_API_KEY = import.meta.env.VITE_OXAPAY_API_KEY || 'GLGU8D-6FD093-EWMFM1-56WU1T';
const OXAPAY_BASE_URL = 'https://api.oxapay.com/v1';

export interface OxaPayPaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  callbackUrl?: string;
  returnUrl?: string;
  email?: string;
}

export interface OxaPayPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  trackId?: string;
  error?: string;
}

export const createOxaPayPayment = async (
  paymentData: OxaPayPaymentRequest
): Promise<OxaPayPaymentResponse> => {
  try {
    // Check if API key is configured
    if (!OXAPAY_API_KEY) {
      return {
        success: false,
        error: 'OxaPay API key is not configured. Please contact support.',
      };
    }

    console.log('Creating OxaPay payment with data:', paymentData);

    // Use the correct OxaPay API endpoint for invoice generation
    const response = await fetch(`${OXAPAY_BASE_URL}/payment/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant_api_key': OXAPAY_API_KEY,
      },
      body: JSON.stringify({
        amount: paymentData.amount,
        currency: paymentData.currency.toUpperCase(),
        lifetime: 30, // 30 minutes lifetime
        fee_paid_by_payer: 1, // Fee paid by payer
        under_paid_coverage: 2.5, // 2.5% underpaid coverage
        callback_url: paymentData.callbackUrl || '',
        return_url: paymentData.returnUrl || '',
        description: paymentData.description,
        order_id: paymentData.orderId,
        email: paymentData.email || '',
        sandbox: false, // Use live environment
      }),
    });

    const data = await response.json();
    
    console.log('OxaPay API Response:', data);

    // Check for successful response
    if (data.status === 200 && data.data && data.data.payment_url) {
      return {
        success: true,
        paymentUrl: data.data.payment_url,
        trackId: data.data.track_id,
      };
    } else {
      // Handle error responses
      let errorMessage = 'Payment creation failed';
      
      if (data.error && data.error.message) {
        errorMessage = data.error.message;
      } else if (data.message) {
        errorMessage = data.message;
      }
      
      // Handle specific error cases
      if (errorMessage.includes('Invalid API key') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'Invalid merchant API key. Please verify your OxaPay credentials.';
      } else if (errorMessage.includes('Invalid amount')) {
        errorMessage = 'Invalid payment amount. Please check the amount and try again.';
      } else if (errorMessage.includes('Invalid currency')) {
        errorMessage = 'Invalid currency. Please use a supported currency.';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  } catch (error) {
    console.error('OxaPay payment creation error:', error);
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error: Unable to connect to OxaPay servers. Please check your internet connection.',
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred while creating the payment.',
    };
  }
};

// All supported cryptocurrencies by OxaPay
export const getSupportedCryptoCurrencies = () => [
  'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'ADA', 'DOT', 'LINK', 'LTC', 'BCH',
  'XRP', 'DOGE', 'MATIC', 'AVAX', 'SOL', 'TRX', 'SHIB', 'UNI', 'ATOM', 'FTM',
  'NEAR', 'ALGO', 'XLM', 'VET', 'ICP', 'THETA', 'FIL', 'ETC', 'XMR', 'AAVE',
  'MKR', 'COMP', 'SNX', 'YFI', 'SUSHI', 'CRV', 'BAL', 'REN', 'KNC', 'ZRX',
  'OMG', 'LRC', 'ENJ', 'MANA', 'SAND', 'AXS', 'CHZ', 'BAT', 'ZIL', 'HOT'
];

// All supported fiat currencies by OxaPay
export const getSupportedFiatCurrencies = () => [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD',
  'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR', 'KRW'
];

// Get currency info for display
export const getCurrencyInfo = (symbol: string) => {
  const currencies: Record<string, { name: string; network?: string }> = {
    'BTC': { name: 'Bitcoin' },
    'ETH': { name: 'Ethereum' },
    'USDT': { name: 'Tether', network: 'ERC-20/TRC-20/BEP-20' },
    'USDC': { name: 'USD Coin', network: 'ERC-20/BEP-20' },
    'BNB': { name: 'Binance Coin' },
    'ADA': { name: 'Cardano' },
    'DOT': { name: 'Polkadot' },
    'LINK': { name: 'Chainlink' },
    'LTC': { name: 'Litecoin' },
    'BCH': { name: 'Bitcoin Cash' },
    'XRP': { name: 'Ripple' },
    'DOGE': { name: 'Dogecoin' },
    'MATIC': { name: 'Polygon' },
    'AVAX': { name: 'Avalanche' },
    'SOL': { name: 'Solana' },
    'TRX': { name: 'TRON' },
    'SHIB': { name: 'Shiba Inu' },
    'UNI': { name: 'Uniswap' },
    'ATOM': { name: 'Cosmos' },
    'FTM': { name: 'Fantom' },
    'USD': { name: 'US Dollar' },
    'EUR': { name: 'Euro' },
    'GBP': { name: 'British Pound' },
    'INR': { name: 'Indian Rupee' },
  };
  
  return currencies[symbol] || { name: symbol };
};