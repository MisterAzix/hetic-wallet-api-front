import axios from "axios";

const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    withCredentials: true, 
});

const generateNonce = async () => {
  try {
    console.log(`Requesting nonce from: ${API.defaults.baseURL}/nonce/`);
    const response = await API.get('/nonce/');
    console.log(`Nonce received: ${response.data.nonce}`);
    return response.data.nonce;
  } catch (error) {
    console.error(`Error generating nonce: ${error}`);
    return Promise.reject(error);
  }
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
};


export const createWallet = async (address: string, userId: string) => {
  try {
    const nonce = await generateNonce();
    console.log(`Creating wallet with address: ${address}, userId: ${userId}`);
    const response = await API.post(
      '/wallet/',
      { address, userId },
      {
        headers: {
          'x-nonce': nonce,
        },
      }
    );
    console.log(`Wallet created: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    console.error(`Error creating wallet: ${error}`);
    return Promise.reject(error);
  }
};

export const getWalletByAddress = async (address: string) => {
  try {
    const response = await API.get(`/wallet/${address}`);
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

export const updateTransactions = async (address: string) => {
  try {
    const nonce = await generateNonce();
    console.log(`Updating transactions for wallet address: ${address}`);
    const response = await API.post(
      `/wallet/${address}`,
      {},
      {
        headers: {
          'x-nonce': nonce,
        },
      }
    );
    console.log(`Transactions updated: ${JSON.stringify(response.data)}`);
    return response.data;
  } catch (error) {
    console.error(`Error updating transactions: ${error}`);
    return Promise.reject(error);
  }
};

  export const findSymbolPriceHistory = async (symbol: string) => {
    try {
      console.log(`Fetching price history for symbol: ${symbol}`);
      const response = await API.get(`/pricehistory/${symbol}`);
      console.log(`Price history data: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching price history: ${error}`);
      return Promise.reject(error);
    }
  };

  export const findSymbolCurrentPrice = async (symbol: string) => {
    try {
      console.log(`Fetching current price for symbol: ${symbol}`);
      const response = await API.get(`/pricehistory/current/${symbol}`);
      console.log(`Current price data: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching current price: ${error}`);
      return Promise.reject(error);
    }
  };
  
  
API.interceptors.request.use(
    (config) => {
        console.log(`Making request to: ${config.url}`);
        return config;
    },
    (error) => {
        console.error(`Request error: ${error}`);
        return Promise.reject(error);
    }
);

API.interceptors.response.use(
    (response) => {
        console.log(`Response received from: ${response.config.url}`);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            if (isRefreshing) {
                return new Promise((resolve) => {
                    addRefreshSubscriber((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(API(originalRequest));
                    });
                });
            }

            isRefreshing = true;

            try {
                console.log(`Refreshing token...`);
                const { data } = await axios.post(
                    `${API.defaults.baseURL}/auth/refresh-token`,
                    {}, // No need to send data, cookies handle the refreshToken
                    { withCredentials: true } // Ensure cookies are sent
                );

                const { accessToken } = data;
                console.log(`New access token received: ${accessToken}`);

                API.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
                onRefreshed(accessToken);

                isRefreshing = false;

                return API(originalRequest);
            } catch (err: any) {
                console.error(`Token refresh failed: ${err.message}`);

                isRefreshing = false;

                // wait for 15 seconds 
                await new Promise((resolve) => setTimeout(resolve, 25000));
                window.location.href = "/auth/login";
            }
        }

        console.error(`Response error: ${error}`);
        return Promise.reject(error);
    }
);

export default API;
