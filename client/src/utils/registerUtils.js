/**
 * Register detection and management utility
 * Handles automatic register identification for POS terminals
 */
const VALID_REGISTERS = ["REG01", "REG02", "REG03", "REG04"];

/**
 * Get the current register ID using smart detection
 * Priority: URL parameter > localStorage > default (REG01)
 */
export const getRegisterId = () => {
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

/**
 * Get register display name for UI
 */
export const getRegisterDisplayName = (registerId) => {
  const registerMap = {
    REG01: "Register 1",
    REG02: "Register 2",
    REG03: "Register 3",
    REG04: "Register 4",
  };

  return registerMap[registerId] || "Unknown Register";
};

/**
 * Check if register ID came from URL parameter
 * Used to determine if we should show register selection option
 */
export const isRegisterFromUrl = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const registerFromUrl = urlParams.get("register");
  return (
    registerFromUrl && VALID_REGISTERS.includes(registerFromUrl.toUpperCase())
  );
};

/**
 * Update current register and persist to localStorage
 * Used when user manually selects a different register
 */
export const setRegisterId = (registerId) => {
  if (!VALID_REGISTERS.includes(registerId)) {
    throw new Error(`Invalid register ID: ${registerId}`);
  }

  localStorage.setItem("registerId", registerId);

  // Optionally update URL without page reload
  const url = new URL(window.location);
  url.searchParams.set("register", registerId);
  window.history.replaceState({}, "", url);
};

/**
 * Get all available registers for selection dropdown
 */
export const getAvailableRegisters = () => {
  return VALID_REGISTERS.map((id) => ({
    id: id,
    name: getRegisterDisplayName(id),
  }));
};

/**
 * Generate URLs for testing multiple registers
 * Useful for development and demos
 */
export const getRegisterTestUrls = () => {
  const baseUrl = window.location.origin + window.location.pathname;

  return VALID_REGISTERS.map((registerId) => ({
    registerId,
    name: getRegisterDisplayName(registerId),
    url: `${baseUrl}?register=${registerId}`,
  }));
};
