import { api } from './api';

export const authService = {
  sendOtp: (phone: string) => 
    api.post('/auth/send-otp', { 
      phone: phone.trim()
    }).then(res => res.data),

  verifyOtp: (phone: string, otp: string) => 
    api.post('/auth/verify-otp', {
      phone: phone.trim(),
      otp,
      role: 'ADMIN'
    }).then(res => res.data),

  verifyFirebaseOtp: (idToken: string, phone?: string) =>
    api.post('/auth/verify-firebase-otp', {
      idToken,
      phone,
      role: 'ADMIN'
    }).then(res => res.data),
    
  getCurrentUser: () => api.get('/auth/me').then(res => res.data)
};
