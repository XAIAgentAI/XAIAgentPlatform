const isTestEnv = process.env.NEXT_PUBLIC_IS_TEST_ENV === 'true';

export const API_CONFIG = {
  DBCSCAN: {
    BASE_URL: isTestEnv 
      ? 'https://test.dbcscan.io/api/v2'
      : 'https://www.dbcscan.io/api/v2',
    ENDPOINTS: {
      TOKENS: '/tokens',
      TOKEN_HOLDERS: (tokenAddress: string) => `/tokens/${tokenAddress}/holders`,
      TOKEN_DETAIL: (tokenAddress: string) => `/tokens/${tokenAddress}`,
    },
  },
} as const; 