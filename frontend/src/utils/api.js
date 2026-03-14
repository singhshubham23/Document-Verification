import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

// ── Request Interceptor ─────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hb_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor ────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Prevent redirect loop if already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('hb_token');
        localStorage.removeItem('hb_user');
        window.location.href = '/login';
      }
    }

    const message =
      err.response?.data?.message || err.message || 'Request failed';
    err.message = message;
    err.normalizedMessage = message;
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)        => api.post('/auth/register', data),
  verifyOTP: (data)       => api.post('/auth/verify-otp', data),
  login: (data)           => api.post('/auth/login', data),
  getMe: ()               => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data)   => api.post('/auth/reset-password', data),
};

// ── Certificates ─────────────────────────────────────────────────────
export const certAPI = {
  getAll: (params)    => api.get('/certificates', { params }),
  getOne: (id)        => api.get(`/certificates/${id}`),
  upload: (formData)  => api.post('/certificates', formData), // fixed
  bulkUpload: (certs) => api.post('/certificates/bulk', { certificates: certs }),
  revoke: (id, reason)=> api.patch(`/certificates/${id}/revoke`, { reason }),
};

// ── Verification ─────────────────────────────────────────────────────
export const verifyAPI = {
  byId: (certificateId) => api.post('/verification/by-id', { certificateId }),
  byUpload: (formData)  => api.post('/verification/by-upload', formData), // fixed
  byQR: (qrPayload)     => api.post('/verification/by-qr', { qrPayload }),
  getHistory: (params)  => api.get('/verification/history', { params }),
  getLog: (logId)       => api.get(`/verification/${logId}`),
};

// ── Institutions ─────────────────────────────────────────────────────
export const institutionAPI = {
  getAll: (params)   => api.get('/institutions', { params }),
  getOne: (id)       => api.get(`/institutions/${id}`),
  create: (data)     => api.post('/institutions', data),
  update: (id, data) => api.put(`/institutions/${id}`, data),
  regenKey: (id)     => api.post(`/institutions/${id}/regenerate-key`),
};

// ── Admin ────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: ()                        => api.get('/admin/stats'),
  getUsers: (params)                  => api.get('/admin/users', { params }),
  toggleUser: (id)                    => api.patch(`/admin/users/${id}/toggle`),
  blacklistInstitution: (id, reason)  =>
    api.patch(`/admin/institutions/${id}/blacklist`, { reason }),
  getFraudReports: (params)           => api.get('/admin/fraud', { params }),
  updateFraud: (id, data)             => api.patch(`/admin/fraud/${id}`, data),
  getLogs: (params)                   => api.get('/admin/logs', { params }),
};

// ── Fraud ────────────────────────────────────────────────────────────
export const fraudAPI = {
  report: (data) => api.post('/fraud', data),
  myReports: ()  => api.get('/fraud/my-reports'),
};

export default api;
