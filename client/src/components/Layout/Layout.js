import React from "react";
import { ShoppingCart, Home, History, Settings, User } from "lucide-react";
import "./Layout.css";

const Layout = ({ children, currentPage = "pos" }) => {
  return (
    <div className="pos-layout">
      {/* Header */}
      <header className="pos-header">
        <div className="header-left">
          <h1 className="restaurant-name">QuickServe POS</h1>
          <span className="current-time">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
        <div className="header-right">
          <div className="user-info">
            <User size={20} />
            <span>John Doe - Cashier</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pos-main">{children}</main>

      {/* Navigation Footer */}
      <nav className="pos-nav">
        <button
          className={`nav-button ${currentPage === "pos" ? "active" : ""}`}
        >
          <Home size={24} />
          <span>POS</span>
        </button>
        <button
          className={`nav-button ${currentPage === "orders" ? "active" : ""}`}
        >
          <History size={24} />
          <span>Orders</span>
        </button>
        <button
          className={`nav-button ${currentPage === "settings" ? "active" : ""}`}
        >
          <Settings size={24} />
          <span>Settings</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;
