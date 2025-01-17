import axios from "axios";

const API = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true, 
});

const generateNonce = async () => {
  try {
    const response = await API.get('/nonce/');
    return response.data.nonce;
  } catch (error) {
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
    const response = await API.post(
      '/wallet/',
      { address, userId },
      {
        headers: {
          'x-nonce': nonce,
        },
      }
    );
    return response.data;
  } catch (error) {
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
    const response = await API.post(
      `/wallet/${address}`,
      {},
      {
        headers: {
          'x-nonce': nonce,
        },
      }
    );
    return response.data;
  } catch (error) {
    return Promise.reject(error);
  }
};

  export const findSymbolPriceHistory = async (symbol: string) => {
    try {
      const response = await API.get(`/pricehistory/${symbol}`);
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  };

  export const findSymbolCurrentPrice = async (symbol: string) => {
    try {
      const response = await API.get(`/pricehistory/current/${symbol}`);
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  };
  
  
API.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => Promise.reject(error)
);

API.interceptors.response.use(
    (response) => {
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
                const { data } = await axios.post(
                    `${API.defaults.baseURL}/auth/refresh`,
                    {}, // No need to send data, cookies handle the refreshToken
                    { withCredentials: true } // Ensure cookies are sent
                );

                const { accessToken } = data;

                API.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
                onRefreshed(accessToken);

                isRefreshing = false;

                return API(originalRequest);
            } catch (err: any) {
                console.error("Token refresh failed:", err.message);

                isRefreshing = false;

                // wait for 15 seconds 
                await new Promise((resolve) => setTimeout(resolve, 25000));
                window.location.href = "/auth/login";
            }
        }

        return Promise.reject(error);
    }
);

export default API;
