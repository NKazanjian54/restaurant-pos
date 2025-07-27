import React, { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  ShoppingCart,
  CreditCard,
  LogOut,
  User,
  Monitor,
  Search,
  X,
  DollarSign,
} from "lucide-react";
import APIService from "../../services/api";
import "./POSInterface.css";

const POSInterface = ({ user, terminal, onLogout }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch products and categories on component mount
  useEffect(() => {
    console.log("🔄 POSInterface mounted, fetching data...");
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      console.log("📦 Fetching products...");
      const data = await APIService.getProducts();
      console.log("✅ Products loaded:", data);
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching products:", error);
      setError("Failed to load products");
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log("📂 Fetching categories...");
      const data = await APIService.getCategories();
      console.log("✅ Categories loaded:", data);
      setCategories(data);
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
      setError("Failed to load categories");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await APIService.logout();
      onLogout();
    } catch (error) {
      console.error("Logout error:", error);
      onLogout(); // Force logout even if API call fails
    }
  };

  // Filter products by category and search
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "all" || product.category_id === activeCategory;
    const matchesSearch =
      searchTerm === "" ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Add item to cart
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return prevCart.filter((item) => item.id !== productId);
      }
    });
  };

  // Remove item completely from cart
  const removeItemCompletely = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setCustomerName("");
  };

  // Process order
  const processOrder = async () => {
    if (cart.length === 0) return;

    const orderData = {
      customer_name: customerName || "Walk-in Customer",
      items: cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      const result = await APIService.createOrder(orderData);
      alert(`Order #${result.order_number} created successfully!`);
      clearCart();
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Error creating order");
    }
  };

  if (loading) {
    return (
      <div className="pos-loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading POS System...</div>
        <div className="loading-details">
          <div>
            User: {user?.firstName} {user?.lastName}
          </div>
          <div>Terminal: {terminal}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pos-error">
        <h2>Error Loading POS System</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button
            onClick={() => window.location.reload()}
            className="retry-btn"
          >
            Retry
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pos-interface">
      {/* Enhanced Header */}
      <header className="pos-header">
        <div className="header-left">
          <h1 className="pos-title">QuickServe POS</h1>
          <div className="header-info">
            <div className="info-item">
              <User size={16} />
              <span>
                {user?.firstName} {user?.lastName}
              </span>
            </div>
            <div className="info-item">
              <Monitor size={16} />
              <span>{terminal}</span>
            </div>
            <div className="info-item role-badge">
              <span>{user?.role}</span>
            </div>
          </div>
        </div>
        <div className="header-right">
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="pos-main">
        {/* Products Section */}
        <div className="products-section">
          {/* Search and Filters */}
          <div className="products-header">
            <div className="search-container">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="clear-search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="category-filter">
            <button
              className={`category-btn ${
                activeCategory === "all" ? "active" : ""
              }`}
              onClick={() => setActiveCategory("all")}
            >
              All Items
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-btn ${
                  activeCategory === category.id ? "active" : ""
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="products-grid">
            {filteredProducts.length === 0 ? (
              <div className="no-products">
                <p>No products found</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="clear-search-btn"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="product-card"
                  onClick={() => addToCart(product)}
                >
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-description">{product.description}</p>
                    <div className="product-price">
                      <DollarSign size={16} />
                      {product.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="add-button">
                    <Plus size={20} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Enhanced Cart Section */}
        <div className="cart-section">
          <div className="cart-header">
            <ShoppingCart size={24} />
            <h2>Current Order</h2>
            <div className="cart-count">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items
            </div>
          </div>

          <div className="customer-input">
            <input
              type="text"
              placeholder="Customer name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="customer-name-input"
            />
          </div>

          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <ShoppingCart size={48} />
                <p>No items in cart</p>
                <span>Add items from the menu to get started</span>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p>${item.price.toFixed(2)} each</p>
                  </div>
                  <div className="item-controls">
                    <div className="quantity-controls">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="qty-btn"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="qty-btn"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="item-total">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                    <button
                      onClick={() => removeItemCompletely(item.id)}
                      className="remove-item"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <>
              <div className="cart-totals">
                <div className="total-line">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="total-line">
                  <span>Tax (8%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="total-line total">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="cart-actions">
                <button className="clear-btn" onClick={clearCart}>
                  Clear Cart
                </button>
                <button className="checkout-btn" onClick={processOrder}>
                  <CreditCard size={18} />
                  Process Order
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default POSInterface;
