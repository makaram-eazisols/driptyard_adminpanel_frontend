import axios from "axios";

// Configure your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://d1q0u57nt27d02.cloudfront.net";

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        // Only access localStorage on client side
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("access_token");
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Prevent infinite loops: don't retry if this is already a refresh request or logout
        const isRefreshRequest = originalRequest.url?.includes("/auth/refresh");
        const isLogoutRequest = originalRequest.url?.includes("/auth/logout");
        const isLoginRequest = originalRequest.url?.includes("/auth/login");
        const isPasswordResetVerify = originalRequest.url?.includes("/auth/password-reset/verify");

        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !isRefreshRequest &&
          !isLogoutRequest &&
          !isLoginRequest &&
          !isPasswordResetVerify &&
          typeof window !== "undefined"
        ) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem("refresh_token");
            if (refreshToken) {
              // Create a new axios instance for refresh to avoid interceptors
              const refreshClient = axios.create({
                baseURL: API_BASE_URL,
                headers: {
                  "Content-Type": "application/json",
                },
              });

              const response = await refreshClient.post("/auth/refresh", {
                refresh_token: refreshToken,
              });
              const { access_token } = response.data;

              localStorage.setItem("access_token", access_token);
              originalRequest.headers.Authorization = `Bearer ${access_token}`;

              return this.client(originalRequest);
            } else {
              // No refresh token available, clear everything and redirect
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              if (typeof window !== "undefined") {
                window.location.href = "/admin/login";
              }
              return Promise.reject(error);
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            if (typeof window !== "undefined") {
              window.location.href = "/admin/login";
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // ============ AUTH ENDPOINTS ============
  async login(email, password) {
    const response = await this.client.post("/auth/login", { email, password });
    return response.data;
  }

  async logout() {
    try {
      const response = await this.client.post("/auth/logout");
      return response.data;
    } catch (error) {
      // Handle 403 or other errors gracefully - logout should succeed even if API call fails
      // 403 might mean token is already invalid, which is fine for logout
      if (error.response?.status === 403 || error.response?.status === 401) {
        // Token is invalid/expired, but logout should still proceed
        return { success: true, message: "Logged out successfully" };
      }
      // For other errors, still allow logout to proceed
      throw error;
    }
  }

  async register(data) {
    const response = await this.client.post("/auth/register", data);
    return response.data;
  }

  async verifyEmail(code) {
    const response = await this.client.post("/auth/verify-email", { code });
    return response.data;
  }

  async resendVerification(email) {
    const response = await this.client.post("/auth/resend-verification", { email });
    return response.data;
  }

  async requestPasswordReset(email) {
    const response = await this.client.post("/auth/password-reset/request", { email });
    return response.data;
  }

  async verifyPasswordReset(code, new_password) {
    const response = await this.client.post("/auth/password-reset/verify", {
      code,
      new_password,
    });
    return response.data;
  }

  async verifyPasswordResetAdmin(email, new_password, current_password) {
    const response = await this.client.post("/auth/password-reset/verify", {
      email,
      reset_token: null,
      new_password,
      is_admin: true,
      current_password: current_password || null,
    });
    return response.data;
  }

  async refreshToken() {
    const response = await this.client.post("/auth/refresh");
    return response.data;
  }

  // ============ USER ENDPOINTS ============
  async getCurrentUser() {
    const response = await this.client.get("/users/me");
    return response.data;
  }

  async updateProfile(data) {
    const response = await this.client.patch("/users/me", data);
    return response.data;
  }

  async updateProfileWithAvatar(formData) {
    const response = await this.client.put("/users/me", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  async changePassword(currentPassword, newPassword) {
    const response = await this.client.post("/users/me/change-password", {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  }

  // ============ PRODUCT ENDPOINTS ============
  async getFeaturedProducts(page = 1, pageSize = 10) {
    const response = await this.client.get("/products/featured", {
      params: { page, page_size: pageSize },
    });
    return response.data;
  }

  async getRecommendedProducts(page = 1, pageSize = 10) {
    const response = await this.client.get("/products/recommended", {
      params: { page, page_size: pageSize },
    });
    return response.data;
  }

  async getMyListings(page = 1, pageSize = 10, status, search) {
    const response = await this.client.get("/products/my-listings", {
      params: { page, page_size: pageSize, status, search },
    });
    return response.data;
  }

  async getProducts(params) {
    const response = await this.client.get("/products/", { params });
    return response.data;
  }

  async getProduct(productId) {
    const response = await this.client.get(`/products/${productId}`);
    return response.data;
  }

  async createProduct(formData) {
    const response = await this.client.post("/products/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  async updateProduct(productId, data) {
    const response = await this.client.put(`/products/${productId}`, data);
    return response.data;
  }

  async addProductImages(productId, formData) {
    const response = await this.client.post(`/products/${productId}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  async sendProductVerification(productId) {
    const response = await this.client.post(`/products/${productId}/verification/send`);
    return response.data;
  }

  async verifyProduct(productId, code) {
    const response = await this.client.post(`/products/${productId}/verification`, { code });
    return response.data;
  }

  async deleteProduct(productId) {
    const response = await this.client.delete(`/products/${productId}`);
    return response.data;
  }

  // ============ ADMIN ENDPOINTS ============
  async getAdminStatsOverview() {
    const response = await this.client.get("/admin/stats/overview");
    return response.data;
  }

  async getAdminProducts(params) {
    const response = await this.client.get("/admin/products", { params });
    return response.data;
  }

  async updateAdminProduct(productId, data) {
    const response = await this.client.put(`/admin/products/${productId}`, data);
    return response.data;
  }

  async deleteAdminProduct(productId) {
    const response = await this.client.delete(`/admin/products/${productId}`);
    return response.data;
  }

  async addProductToSpotlight(productId, data) {
    const response = await this.client.post(`/admin/products/${productId}/spotlight`, data);
    return response.data;
  }

  async getProductSpotlight(productId) {
    const response = await this.client.get(`/products/${productId}/spotlight`);
    return response.data;
  }

  async removeProductSpotlight(productId) {
    const response = await this.client.delete(`/admin/products/${productId}/spotlight`);
    return response.data;
  }

  async getSpotlightHistory(params) {
    const response = await this.client.get("/admin/spotlight/history", { params });
    return response.data;
  }

  // ============ ADMIN USER ENDPOINTS ============
  async getAdminUsers(params) {
    const response = await this.client.get("/admin/users", { params });
    return response.data;
  }

  async updateAdminUser(userId, data) {
    const response = await this.client.put(`/admin/users/${userId}`, data);
    return response.data;
  }

  async banAdminUser(userId) {
    const response = await this.client.post(`/admin/users/${userId}/ban`);
    return response.data;
  }

  async unbanAdminUser(userId) {
    const response = await this.client.post(`/admin/users/${userId}/unban`);
    return response.data;
  }

  async createAdminUser(data) {
    const response = await this.client.post("/admin/users/create", data);
    return response.data;
  }

  async deleteAdminUser(userId) {
    const response = await this.client.delete(`/admin/users/${userId}`);
    return response.data;
  }

  async suspendAdminUser(userId) {
    const response = await this.client.post(`/admin/users/${userId}/suspend`);
    return response.data;
  }

  async unsuspendAdminUser(userId) {
    const response = await this.client.post(`/admin/users/${userId}/unsuspend`);
    return response.data;
  }

  async resetUserPassword(userId, newPassword) {
    const response = await this.client.post(`/admin/users/${userId}/reset-password`, {
      new_password: newPassword
    });
    return response.data;
  }

  async getUserDetails(userId) {
    const response = await this.client.get(`/admin/users/${userId}`);
    return response.data;
  }

  // ============ ADMIN REPORTS ENDPOINTS ============
  async getAdminReports(params) {
    const response = await this.client.get("/admin/reports", { params });
    return response.data;
  }

  async rejectReport(reportId) {
    const response = await this.client.post(`/admin/reports/${reportId}/reject`);
    return response.data;
  }

  async approveReport(reportId) {
    const response = await this.client.post(`/admin/reports/${reportId}/approve`);
    return response.data;
  }

  async reviewReport(reportId) {
    const response = await this.client.post(`/admin/reports/${reportId}/review`);
    return response.data;
  }

  // ============ MODERATORS ENDPOINTS ============
  async getModerators(params) {
    const response = await this.client.get("/moderators", { params });
    // Backend returns: { moderators, total, page, page_size, total_pages }
    return response.data;
  }

  async getModeratorPermissions(moderatorId) {
    const response = await this.client.get(`/moderators/${moderatorId}/permissions`);
    return response.data;
  }

  async updateModeratorPermissions(moderatorId, data) {
    const response = await this.client.put(`/moderators/${moderatorId}/permissions`, data);
    return response.data;
  }
}

export const apiClient = new ApiClient();

// ============ PLACEHOLDER API FUNCTIONS ============
// User Management
export const banUser = async (userId) => {
  // TODO: Implement API call
  return { success: true };
};

export const verifyUser = async (userId) => {
  // TODO: Implement API call
  return { success: true };
};

export const updateUser = async (userId, data) => {
  // TODO: Implement API call
  return { success: true };
};

export const getUsers = async () => {
  // TODO: Implement API call
  return [];
};

// Product Listing Management
export const getProducts = async () => {
  // TODO: Implement API call
  return [];
};

export const approveProduct = async (productId) => {
  // TODO: Implement API call
  return { success: true };
};

export const rejectProduct = async (productId, reason) => {
  // TODO: Implement API call
  return { success: true };
};

export const hideProduct = async (productId) => {
  // TODO: Implement API call
  return { success: true };
};

// Flagged Content
export const getFlaggedContent = async () => {
  // TODO: Implement API call
  return [];
};

export const reviewFlaggedContent = async (flagId, action) => {
  // TODO: Implement API call
  return { success: true };
};

// Authentication Rejection Appeals
export const getAppeals = async () => {
  // TODO: Implement API call
  return [];
};

export const approveAppeal = async (appealId) => {
  // TODO: Implement API call
  return { success: true };
};

export const rejectAppeal = async (appealId, reason) => {
  // TODO: Implement API call
  return { success: true };
};

// Admin Spotlight
export const getSpotlightProducts = async () => {
  // TODO: Implement API call
  return [];
};

export const addToSpotlight = async (productId, duration) => {
  // TODO: Implement API call
  return { success: true };
};

export const removeFromSpotlight = async (productId) => {
  // TODO: Implement API call
  return { success: true };
};

// Manual Payout Approval
export const getPayoutRequests = async () => {
  // TODO: Implement API call
  return [];
};

export const approvePayout = async (payoutId) => {
  // TODO: Implement API call
  return { success: true };
};

export const rejectPayout = async (payoutId, reason) => {
  // TODO: Implement API call
  return { success: true };
};

// Business Verification
export const getBusinessVerifications = async () => {
  // TODO: Implement API call
  return [];
};

export const approveBusinessVerification = async (verificationId) => {
  // TODO: Implement API call
  return { success: true };
};

export const rejectBusinessVerification = async (verificationId, reason) => {
  // TODO: Implement API call
  return { success: true };
};

// Analytics
export const getAnalytics = async () => {
  // TODO: Implement API call
  return {
    users: { total: 0, active: 0, new: 0 },
    listings: { total: 0, active: 0, pending: 0 },
    sales: { total: 0, revenue: 0, commission: 0 },
  };
};
