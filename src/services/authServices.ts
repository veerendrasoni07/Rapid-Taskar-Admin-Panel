import { api } from './api';

export const authService = {
  sendOtp: (phoneOrEmail: string) => 
    api.post('/auth/send-otp', { 
      // Based on input, send either phone or email. 
      // Simple heuristic: if it contains '@', treat as email
      ...(phoneOrEmail.includes('@') ? { email: phoneOrEmail } : { phone: phoneOrEmail })
    }).then(res => res.data),

  verifyOtp: (phoneOrEmail: string, otp: string) => 
    api.post('/auth/verify-otp', {
      ...(phoneOrEmail.includes('@') ? { email: phoneOrEmail } : { phone: phoneOrEmail }),
      otp,
      role: 'ADMIN'
    }).then(res => res.data),
    
  getCurrentUser: () => api.get('/auth/me').then(res => res.data)
};
