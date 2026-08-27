import { api } from './api';

export const adminService = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard').then(res => res.data),
  
  // Customers
  getCustomers: (params?: any) => api.get('/admin/customers', { params }).then(res => res.data),
  getCustomerById: (id: string) => api.get(`/admin/customers/${id}`).then(res => res.data),
  updateCustomerStatus: (id: string, status: string) => api.patch(`/admin/customers/${id}/status`, { status }).then(res => res.data),

  // Professionals
  getProfessionals: (params?: any) => api.get('/admin/professionals', { params }).then(res => res.data),
  getProfessionalById: (id: string) => api.get(`/admin/professionals/${id}`).then(res => res.data),
  updateProfessionalStatus: (id: string, status: string) => api.patch(`/admin/professionals/${id}/status`, { status }).then(res => res.data),
  updateKycStatus: (id: string, status: string, reason?: string) => api.patch(`/admin/professionals/kyc/${id}`, { status, reason }).then(res => res.data),

  // Categories
  getCategories: () => api.get('/category').then(res => res.data),
  getAllCategories: () => api.get('/category/admin/all').then(res => res.data),
  createCategory: (data: any) => api.post('/category', data).then(res => res.data),
  updateCategory: (id: string, data: any) => api.patch(`/category/${id}`, data).then(res => res.data),
  deleteCategory: (id: string) => api.delete(`/category/${id}`).then(res => res.data),

  // Services
  getServices: (params?: any) => api.get('/admin/services', { params }).then(res => res.data),
  getServiceById: (id: string) => api.get(`/admin/services/${id}`).then(res => res.data),
  createService: (data: any) => api.post('/admin/services', data).then(res => res.data),
  updateService: (id: string, data: any) => api.patch(`/admin/services/${id}`, data).then(res => res.data),
  updateServiceStatus: (id: string, status: string) => api.patch(`/admin/services/${id}/status`, { status }).then(res => res.data),

  // Bookings
  getBookings: (params?: any) => api.get('/admin/bookings', { params }).then(res => res.data),
  getBookingById: (id: string) => api.get(`/admin/bookings/${id}`).then(res => res.data),
  assignBooking: (id: string, professionalId: string) => api.patch(`/admin/bookings/${id}/assign`, { professionalId }).then(res => res.data),
  cancelBooking: (id: string, reason: string) => api.patch(`/admin/bookings/${id}/cancel`, { reason }).then(res => res.data),

  // Complaints
  getComplaints: (params?: any) => api.get('/admin/complaints', { params }).then(res => res.data),
  getComplaintById: (id: string) => api.get(`/admin/complaints/${id}`).then(res => res.data),
  updateComplaint: (id: string, data: any) => api.patch(`/admin/complaints/${id}`, data).then(res => res.data),

  // Payments
  getPayments: (params?: any) => api.get('/admin/payments', { params }).then(res => res.data),

  // Commissions
  getCommissions: (params?: any) => api.get('/admin/commissions', { params }).then(res => res.data),

  // Reviews
  getReviews: (params?: any) => api.get('/admin/reviews', { params }).then(res => res.data),

  // Reports
  getOverviewReport: (params?: any) => api.get('/admin/reports/overview', { params }).then(res => res.data),
  getRevenueReport: (params?: any) => api.get('/admin/reports/revenue', { params }).then(res => res.data),
  getTopServicesReport: (params?: any) => api.get('/admin/reports/top-services', { params }).then(res => res.data),
};
