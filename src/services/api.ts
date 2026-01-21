import axios from 'axios';

// const BASE_URL = 'https://api.ordereasy.win/api/';
const BASE_URL = 'http://127.0.0.1:8000/api/';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Skip token for specific endpoints if needed (e.g. login/refresh might not need it initially)
    // But login doesn't have token yet.
    // Refresh endpoint logic should be handled carefully.
    if (config.url?.includes('auth/token/refresh/')) {
      return config;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log("API Error Interceptor:", error.response?.status, error.config?.url);

    // Check if error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("401 detected, attempting refresh...");
      // Avoid infinite loop if refresh itself fails
      if (originalRequest.url?.includes('auth/token/refresh/')) {
        console.log("Refresh token endpoint invalid, logging out.");
        // Refresh failed, logout
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // window.location.href = '/login';
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          console.error("401 Refresh failed. Token invalid. Please manually logout.");
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

      if (refreshToken) {
        try {
          const response = await axios.post(`${BASE_URL}auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access, refresh } = response.data;
          console.log("Token refreshed successfully.");

          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', access);
            if (refresh) localStorage.setItem('refresh_token', refresh);
          }

          // Update header and retry original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          // Refresh failed
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            // window.location.href = '/login';
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            console.error("401 Refresh failed. Please manually logout.");
          }
          return Promise.reject(refreshError);
        }
      } else {
        console.log("No refresh token found, logging out.");
        // No refresh token available
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          // window.location.href = '/login';
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          console.error("401 No refresh token. Please manually logout.");
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (data: any) => api.post('auth/retailer/login/', data),
  signup: (data: any) => api.post('auth/retailer/signup/', data),
  fetchProfile: () => api.get('auth/profile/'),
  fetchStats: () => api.get('orders/stats/'),
};

export const orderService = {
  fetchOrders: (params?: any) => api.get('orders/history/', { params }),
  fetchOrderDetails: (id: number) => api.get(`orders/${id}/`),
  updateStatus: (id: number, status: string) => api.patch(`orders/${id}/status/`, { status }),
};

export const productService = {
  fetchProducts: (params?: any) => api.get('products/', { params }),
  addProduct: (data: any) => {
    return api.post('products/create/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateProduct: (id: number, data: any) => {
    return api.patch(`products/${id}/update/`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteProduct: (id: number) => api.delete(`products/${id}/delete/`),
  fetchCategories: () => api.get('products/categories/'),
  fetchBrands: (query?: string) => api.get('products/brands/', { params: { search: query } }),
  fetchProductDetails: (id: number) => api.get(`products/${id}/`),

  // Bulk Upload (Excel)
  checkBulkUpload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('products/upload/check/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  completeBulkUpload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('products/upload/complete/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  downloadTemplate: () => api.get('products/bulk-template/', { responseType: 'blob' }),

  // Scanner Sessions
  getActiveSessions: () => api.get('products/upload/session/active/'),
  getSessionDetails: (id: number) => api.get(`products/upload/session/${id}/`),
  updateSessionItems: (sessionId: number, items: any[]) =>
    api.post('products/upload/session/update-items/', { session_id: sessionId, items }),
  commitSession: (sessionId: number) =>
    api.post('products/upload/session/commit/', { session_id: sessionId }),
};

export const customerService = {
  getRetailerCustomers: () => api.get('customer/retailer/list/'),
  getRetailerCustomerDetail: (customerId: number) => api.get(`customer/retailer/details/${customerId}/`),
  toggleRetailerBlacklist: (customerId: number, action: string, reason?: string) =>
    api.post('customer/retailer/blacklist/toggle/', { customer_id: customerId, action, reason }),
  rateCustomer: (orderId: number, rating: number, comment?: string) =>
    api.post(`orders/${orderId}/rate-customer/`, { rating, comment }),
};

export default api;
