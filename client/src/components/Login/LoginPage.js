import React, { useState, useEffect } from "react";
import "./LoginPage.css";

// Register utility functions (included directly)
const VALID_REGISTERS = ["REG01", "REG02", "REG03", "REG04"];

const getRegisterId = () => {
  try {
    // First priority: URL parameter (?register=REG01)
    const urlParams = new URLSearchParams(window.location.search);
    const registerFromUrl = urlParams.get("register");

    if (
      registerFromUrl &&
      VALID_REGISTERS.includes(registerFromUrl.toUpperCase())
    ) {
      const registerId = registerFromUrl.toUpperCase();
      // Save to localStorage for future sessions
      localStorage.setItem("registerId", registerId);
      return registerId;
    }

    // Second priority: localStorage (remembers last used register)
    const savedRegister = localStorage.getItem("registerId");
    if (savedRegister && VALID_REGISTERS.includes(savedRegister)) {
      return savedRegister;
    }

    // Final fallback: Default to REG01
    const defaultRegister = "REG01";
    localStorage.setItem("registerId", defaultRegister);
    return defaultRegister;
  } catch (error) {
    console.error("Error detecting register ID:", error);
    return "REG01"; // Safe fallback
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

const isRegisterFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const registerFromUrl = urlParams.get("register");
  return (
    registerFromUrl && VALID_REGISTERS.includes(registerFromUrl.toUpperCase())
  );
};

const setRegisterIdUtil = (registerId) => {
  if (!VALID_REGISTERS.includes(registerId)) {
    throw new Error(`Invalid register ID: ${registerId}`);
  }

  localStorage.setItem("registerId", registerId);

  // Optionally update URL without page reload
  const url = new URL(window.location);
  url.searchParams.set("register", registerId);
  window.history.replaceState({}, "", url);
};

const getAvailableRegisters = () => {
  return VALID_REGISTERS.map((id) => ({
    id: id,
    name: getRegisterDisplayName(id),
  }));
};

const LoginPage = ({ onLoginSuccess }) => {
  // Register detection and management
  const [registerId, setCurrentRegisterId] = useState(() => getRegisterId());
  const [showRegisterSelect, setShowRegisterSelect] = useState(false);

  // Login form state
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize register selection visibility
  useEffect(() => {
    // Only show register selection if not specified in URL
    setShowRegisterSelect(!isRegisterFromUrl());
  }, []);

  // Handle register change
  const handleRegisterChange = (newRegisterId) => {
    setCurrentRegisterId(newRegisterId);
    setRegisterIdUtil(newRegisterId);
    setError(""); // Clear any previous errors
  };

  // PIN number pad functionality
  const handlePinInput = (digit) => {
    if (pin.length < 7) {
      // Max 7 digits
      setPin((prev) => prev + digit);
    }
  };

  const clearPin = () => {
    setPin("");
  };

  const backspacePin = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  // Handle login submission
  const handleLogin = async () => {
    // Validation
    if (!employeeId.trim()) {
      setError("Please enter your Employee ID");
      return;
    }

    if (!pin.trim()) {
      setError("Please enter your PIN");
      return;
    }

    if (!/^\d{7}$/.test(employeeId)) {
      setError("Employee ID must be 7 digits");
      return;
    }

    if (!/^\d{4,7}$/.test(pin)) {
      setError("PIN must be 4-7 digits");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for session
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          pin: pin.trim(),
          registerId: registerId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Login successful
        onLoginSuccess(result.user, result.terminal);
      } else {
        // Handle specific error cases
        switch (result.error) {
          case "EMPLOYEE_NOT_FOUND":
            setError("Employee ID not found");
            break;
          case "INVALID_PIN":
            setError("Invalid PIN entered");
            setPin(""); // Clear PIN on failure
            break;
          case "ACCOUNT_LOCKED":
            setError(`Account temporarily locked. ${result.message}`);
            break;
          case "ALREADY_LOGGED_IN":
            setError(
              `You are already logged into ${result.conflictingTerminal}. Please log out there first.`
            );
            break;
          default:
            setError(result.message || "Login failed");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key for form submission
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Header with register identification */}
        <div className="login-header">
          <h1>QuickServe POS</h1>
          <div className="register-info">
            <span className="register-label">Terminal:</span>
            <span className="register-id">
              {getRegisterDisplayName(registerId)}
            </span>
          </div>
        </div>

        {/* Register selection (only if not from URL) */}
        {showRegisterSelect && (
          <div className="register-selection">
            <label htmlFor="register-select">Select Register:</label>
            <select
              id="register-select"
              value={registerId}
              onChange={(e) => handleRegisterChange(e.target.value)}
              className="register-dropdown"
            >
              {getAvailableRegisters().map((register) => (
                <option key={register.id} value={register.id}>
                  {register.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Login inputs */}
        <div className="login-inputs">
          {/* Employee ID input */}
          <div className="input-group">
            <label htmlFor="employee-id">Employee ID</label>
            <input
              id="employee-id"
              type="text"
              value={employeeId}
              onChange={(e) =>
                setEmployeeId(e.target.value.replace(/\D/g, "").slice(0, 7))
              }
              onKeyPress={handleKeyPress}
              placeholder="1234567"
              className="employee-input"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* PIN input with number pad */}
          <div className="input-group">
            <label htmlFor="pin">PIN</label>
            <div className="pin-section">
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 7))
                }
                onKeyPress={handleKeyPress}
                placeholder="Enter PIN"
                className="pin-input"
                disabled={isLoading}
                readOnly
              />

              {/* Number pad */}
              <div className="number-pad">
                <div className="number-row">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className="number-btn"
                      onClick={() => handlePinInput(num.toString())}
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
                      onClick={() => handlePinInput(num.toString())}
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
                      onClick={() => handlePinInput(num.toString())}
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
                    onClick={clearPin}
                    disabled={isLoading}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="number-btn"
                    onClick={() => handlePinInput("0")}
                    disabled={isLoading}
                  >
                    0
                  </button>
                  <button
                    type="button"
                    className="number-btn backspace-btn"
                    onClick={backspacePin}
                    disabled={isLoading}
                  >
                    ←
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error display */}
          {error && <div className="error-message">{error}</div>}

          {/* Login button */}
          <button
            type="button"
            className="login-btn"
            onClick={handleLogin}
            disabled={isLoading || !employeeId || !pin}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </div>

        {/* Development helper (only show in development) */}
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
