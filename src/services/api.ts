import axios from 'axios';
import { toast } from 'sonner';

const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.ordereasy.win/api/'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/');
// const BASE_URL = 'http://127.0.0.1:8000/api/';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

export const setAuthToken = (token: string, refreshToken?: string) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    }
  } else {
    delete api.defaults.headers.common['Authorization'];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
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

    // Check if error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop if refresh itself fails
      if (originalRequest.url?.includes('auth/token/refresh/')) {
        if (typeof window !== 'undefined') {
          setAuthToken('');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
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
          setAuthToken(access, refresh);

          // Update header and retry original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          if (typeof window !== 'undefined') {
            setAuthToken('');
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available
        if (typeof window !== 'undefined') {
          setAuthToken('');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      }
    }

    // Global Error Toasting
    if (typeof window !== 'undefined' && error.response && error.response.status >= 400 && error.response.status !== 401) {
      const errorMsg = error.response.data?.error || error.response.data?.detail || "An error occurred";
      toast.error(errorMsg);
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: (data: any) => api.post('auth/retailer/login/', data),
  signup: (data: any) => api.post('auth/retailer/signup/', data),
  fetchProfile: () => api.get('retailer/profile/'),
  registerDeviceToken: (token: string) => api.post('auth/device/register/', {
    registration_id: token,
    type: 'web',
    name: 'retailer_web'
  }),
  updateProfile: (data: any) => {
    // Determine content type based on data (FormData vs JSON)
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    return api.patch('retailer/profile/update/', data, { headers });
  },
  fetchRetailerCategories: () => api.get('retailer/categories/'),
  fetchStats: (params?: any) => api.get('orders/stats/', { params }),
  verifyPhoneWithFirebase: async (phone: string, token: string) => {
    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
    return api.post('auth/customer/verify-otp/', {
      phone_number: formattedPhone,
      firebase_token: token
    });
  },
};

export const reviewsService = {
  fetchCustomerReviews: (params?: any) => api.get('customer/reviews/', { params }),
  createReview: (data: any) => api.post('customer/reviews/', data),
};

export const operatingHoursService = {
  getOperatingHours: () => api.get('retailer/operating-hours/'),
  updateOperatingHours: (data: { operating_hours: any[] }) => api.post('retailer/operating-hours/', data),
};

export const orderService = {
  fetchOrders: (params?: any) => api.get('orders/history/', { params }),
  fetchOrderDetails: (id: number) => api.get(`orders/${id}/`),
  updateStatus: (id: number, status: string, preparation_time_minutes?: number) =>
    api.patch(`orders/${id}/status/`, { status, preparation_time_minutes }),
  updateEstimatedTime: (id: number, preparation_time_minutes: number) =>
    api.patch(`orders/${id}/estimated-time/`, { preparation_time_minutes }),
  modifyOrder: (id: number, data: any) => api.post(`orders/${id}/modify/`, data),
  cancelOrder: (id: number, reason?: string) => api.post(`orders/${id}/cancel/`, { reason }),

  // Chat
  fetchOrderChat: (id: number) => api.get(`orders/${id}/chat/`),
  sendChatMessage: (id: number, message: string) => api.post(`orders/${id}/chat/send/`, { message }),
  markChatRead: (id: number) => api.post(`orders/${id}/chat/read/`),

  // Reviews
  getRetailerReviews: (params?: any) => api.get('orders/retailer-reviews/', { params }),

  // Payment Verification
  verifyOrderPayment: (id: number, action: 'verify' | 'fail') => api.post(`orders/${id}/verify_payment/`, { action }),
};

export const productService = {
  fetchProducts: (params?: any) => api.get('products/', { params }),
  fetchDemandInsights: () => api.get('products/demand-insights/'),
  searchProducts: (query: string) => api.get('products/search/', { params: { search: query } }),
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
  fetchAllCategories: (query?: string) => api.get('products/categories/all/', { params: { search: query } }),
  fetchProductGroups: (query?: string) => api.get('products/product-groups/', { params: { search: query } }),
  fetchProductDetails: (id: number) => api.get(`products/${id}/`),
  bulkUpdateProducts: (items: any[]) => api.patch('products/bulk-update/', { items }),
  searchMasterProduct: (barcode: string) => api.get('products/master/search/', { params: { barcode } }),
  updateCategory: (id: number, data: any) => {
    return api.patch(`products/categories/${id}/update/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteCategory: (id: number) => api.delete(`products/categories/${id}/delete/`),
  createCategory: (data: any) => api.post('products/categories/create/', data),

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
  deleteSessionItem: (itemId: number) =>
    api.delete(`products/upload/session/item/${itemId}/delete/`),
  commitSession: (sessionId: number) =>
    api.post('products/upload/session/commit/', { session_id: sessionId }),
};

export const customerService = {
  getRetailerCustomers: () => api.get('customer/retailer/list/'),
  getRetailerCustomerDetail: (customerId: number) => api.get(`customer/retailer/details/${customerId}/`),
  updateRetailerCustomerMapping: (customerId: number, data: { nickname?: string; notes?: string }) => 
    api.patch(`customer/retailer/update/${customerId}/`, data),
  toggleRetailerBlacklist: (customerId: number, action: string, reason?: string) =>
    api.post('customer/retailer/blacklist/toggle/', { customer_id: customerId, action, reason }),
  rateCustomer: (orderId: number, rating: number, comment?: string) =>
    api.post(`orders/${orderId}/rate-customer/`, { rating, comment }),
};

export const rewardService = {
  getRewardConfig: () => api.get('retailer/reward-config/'),
  updateRewardConfig: (data: any) => api.put('retailer/reward-config/', data),
};

export const offerService = {
  fetchOffers: () => api.get('offers/'),
  fetchOfferDetails: (id: string | number) => api.get(`offers/${id}/`),
  createOffer: (data: any) => api.post('offers/', data),
  updateOffer: (id: string | number, data: any) => api.put(`offers/${id}/`, data),
};

export default api;
