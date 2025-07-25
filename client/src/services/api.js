const API_BASE_URL = "https://restaurant-pos-06rx.onrender.com/api"; // Your Render URL

class APIService {
  // Generic fetch wrapper
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", // Important for session cookies
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication API calls
  async login(employeeId, pin, registerId) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ employeeId, pin, registerId }),
    });
  }

  async logout() {
    return this.request("/auth/logout", {
      method: "POST",
    });
  }

  async validateSession() {
    return this.request("/auth/validate");
  }

  // Existing methods...
  async getProducts() {
    return this.request("/products");
  }

  async getCategories() {
    return this.request("/categories");
  }

  async createOrder(orderData) {
    return this.request("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    });
  }

  // ... rest of your existing methods
}

export default new APIService();
