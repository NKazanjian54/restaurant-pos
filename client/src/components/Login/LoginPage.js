import React, { useState, useEffect } from "react";
import APIService from "../../services/api";
import "./LoginPage.css";

// Register utility functions (simplified - no dropdown)
const VALID_REGISTERS = ["REG01", "REG02", "REG03", "REG04"];

const getRegisterId = () => {
  try {
    // Priority 1: URL parameter (?register=REG01)
    const urlParams = new URLSearchParams(window.location.search);
    const registerFromUrl = urlParams.get("register");

    if (
      registerFromUrl &&
      VALID_REGISTERS.includes(registerFromUrl.toUpperCase())
    ) {
      return registerFromUrl.toUpperCase();
    }

    // Priority 2: localStorage (remembers last used register)
    const savedRegister = localStorage.getItem("registerId");
    if (savedRegister && VALID_REGISTERS.includes(savedRegister)) {
      return savedRegister;
    }

    // Default fallback
    return "REG01";
  } catch (error) {
    console.error("Error detecting register ID:", error);
    return "REG01";
  }
};

const getRegisterDisplayName = (registerId) => {
  const registerMap = {
    REG01: "Register 1",
    REG02: "Register 2",
    REG03: "Register 3",
    REG04: "Register 4",
  };
  return registerMap[registerId] || "Unknown Register";
};

const LoginPage = ({ onLoginSuccess }) => {
  // Login flow state
  const [currentScreen, setCurrentScreen] = useState("employee_id"); // "employee_id" or "pin"
  const [registerId] = useState(() => getRegisterId());

  // Form data
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Save register ID to localStorage
  useEffect(() => {
    localStorage.setItem("registerId", registerId);
  }, [registerId]);

  // Employee ID screen numpad
  const handleEmployeeIdInput = (digit) => {
    if (employeeId.length < 7) {
      setEmployeeId((prev) => prev + digit);
    }
  };

  const clearEmployeeId = () => {
    setEmployeeId("");
  };

  const backspaceEmployeeId = () => {
    setEmployeeId((prev) => prev.slice(0, -1));
  };

  // PIN screen numpad
  const handlePinInput = (digit) => {
    if (pin.length < 7) {
      setPin((prev) => prev + digit);
    }
  };

  const clearPin = () => {
    setPin("");
  };

  const backspacePin = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  // Navigation between screens
  const proceedToPin = () => {
    if (!/^\d{7}$/.test(employeeId)) {
      setError("Employee ID must be 7 digits");
      return;
    }
    setError("");
    setCurrentScreen("pin");
  };

  const backToEmployeeId = () => {
    setCurrentScreen("employee_id");
    setPin("");
    setError("");
  };

  // Final login submission
  const handleLogin = async () => {
    if (!/^\d{4,7}$/.test(pin)) {
      setError("PIN must be 4-7 digits");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await APIService.login(
        employeeId.trim(),
        pin.trim(),
        registerId
      );

      if (result.success) {
        onLoginSuccess(result.user, result.terminal);
      } else {
        switch (result.error) {
          case "EMPLOYEE_NOT_FOUND":
            setError("Employee ID not found");
            break;
          case "INVALID_PIN":
            setError("Invalid PIN entered");
            setPin("");
            break;
          case "ACCOUNT_LOCKED":
            setError(`Account locked. ${result.message}`);
            break;
          case "ALREADY_LOGGED_IN":
            setError(`Already logged into ${result.conflictingTerminal}`);
            break;
          default:
            setError(result.message || "Login failed");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please check connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (currentScreen === "employee_id") {
        proceedToPin();
      } else {
        handleLogin();
      }
    }
  };

  // Render number pad
  const renderNumberPad = (onInput, onClear, onBackspace) => (
    <div className="number-pad">
      <div className="number-row">
        {[1, 2, 3].map((num) => (
          <button
            key={num}
            type="button"
            className="number-btn"
            onClick={() => onInput(num.toString())}
            disabled={isLoading}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="number-row">
        {[4, 5, 6].map((num) => (
          <button
            key={num}
            type="button"
            className="number-btn"
            onClick={() => onInput(num.toString())}
            disabled={isLoading}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="number-row">
        {[7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            className="number-btn"
            onClick={() => onInput(num.toString())}
            disabled={isLoading}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="number-row">
        <button
          type="button"
          className="number-btn clear-btn"
          onClick={onClear}
          disabled={isLoading}
        >
          Clear
        </button>
        <button
          type="button"
          className="number-btn"
          onClick={() => onInput("0")}
          disabled={isLoading}
        >
          0
        </button>
        <button
          type="button"
          className="number-btn backspace-btn"
          onClick={onBackspace}
          disabled={isLoading}
        >
          ←
        </button>
      </div>
    </div>
  );

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <h1>QuickServe POS</h1>
          <div className="register-info">
            <span className="register-label">Terminal:</span>
            <span className="register-id">
              {getRegisterDisplayName(registerId)}
            </span>
          </div>

          {/* Progress indicator */}
          <div className="login-progress">
            <div
              className={`progress-step ${
                currentScreen === "employee_id" ? "active" : "completed"
              }`}
            >
              <span className="step-number">1</span>
              <span className="step-label">Employee ID</span>
            </div>
            <div className="progress-line"></div>
            <div
              className={`progress-step ${
                currentScreen === "pin" ? "active" : ""
              }`}
            >
              <span className="step-number">2</span>
              <span className="step-label">PIN</span>
            </div>
          </div>
        </div>

        {/* Employee ID Screen */}
        {currentScreen === "employee_id" && (
          <div className="screen-content">
            <div className="input-section">
              <h2>Enter Employee ID</h2>
              <input
                type="text"
                value={employeeId}
                onChange={(e) =>
                  setEmployeeId(e.target.value.replace(/\D/g, "").slice(0, 7))
                }
                onKeyPress={handleKeyPress}
                placeholder="1234567"
                className="main-input employee-input"
                disabled={isLoading}
                autoFocus
                readOnly
              />
            </div>

            {renderNumberPad(
              handleEmployeeIdInput,
              clearEmployeeId,
              backspaceEmployeeId
            )}

            {error && <div className="error-message">{error}</div>}

            <button
              type="button"
              className="proceed-btn"
              onClick={proceedToPin}
              disabled={isLoading || !employeeId || employeeId.length !== 7}
            >
              Continue to PIN →
            </button>
          </div>
        )}

        {/* PIN Screen */}
        {currentScreen === "pin" && (
          <div className="screen-content">
            <div className="input-section">
              <h2>Enter PIN</h2>
              <div className="employee-reminder">Employee: {employeeId}</div>
              <input
                type="password"
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 7))
                }
                onKeyPress={handleKeyPress}
                placeholder="Enter PIN"
                className="main-input pin-input"
                disabled={isLoading}
                autoFocus
                readOnly
              />
            </div>

            {renderNumberPad(handlePinInput, clearPin, backspacePin)}

            {error && <div className="error-message">{error}</div>}

            <div className="pin-actions">
              <button
                type="button"
                className="back-btn"
                onClick={backToEmployeeId}
                disabled={isLoading}
              >
                ← Back
              </button>
              <button
                type="button"
                className="login-btn"
                onClick={handleLogin}
                disabled={isLoading || !pin || pin.length < 4}
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>
            </div>
          </div>
        )}

        {/* Development helper */}
        {process.env.NODE_ENV === "development" && (
          <div className="dev-helper">
            <p>Development Mode - Test Users:</p>
            <p>Admin: ID=1234567, PIN=1234</p>
            <p>Cashier: ID=2345678, PIN=5678</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
