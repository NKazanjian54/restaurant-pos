const authService = require("../services/authService");

const VALID_REGISTERS = ["REG01", "REG02", "REG03", "REG04"];

const validateRegisterId = (registerId) => {
  return VALID_REGISTERS.includes(registerId);
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { employeeId, pin, registerId } = req.body;

    // Validate input
    if (!employeeId || !pin || !registerId) {
      return res.status(400).json({
        success: false,
        error: "MISSING_CREDENTIALS",
        message: "Employee ID, PIN, and Register ID are required",
      });
    }

    if (!/^\d{7}$/.test(employeeId)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_EMPLOYEE_ID",
        message: "Employee ID must be 7 digits",
      });
    }

    if (!/^\d{4,7}$/.test(pin)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_PIN",
        message: "PIN must be 4-7 digits",
      });
    }

    if (!validateRegisterId(registerId)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_REGISTER",
        message: "Register ID must be one of: REG01, REG02, REG03, REG04",
      });
    }

    const result = await authService.authenticateUser(
      employeeId,
      pin,
      registerId
    );

    if (result.success) {
      res.cookie("session_token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
      });

      return res.status(200).json({
        success: true,
        user: result.user,
        terminal: result.terminal,
        loginTime: result.loginTime,
        message: result.message,
      });
    } else {
      let statusCode = 401;

      switch (result.error) {
        case "EMPLOYEE_NOT_FOUND":
        case "INVALID_PIN":
          statusCode = 401;
          break;
        case "ACCOUNT_LOCKED":
          statusCode = 423;
          break;
        case "ALREADY_LOGGED_IN":
          statusCode = 409;
          break;
        default:
          statusCode = 500;
      }

      return res.status(statusCode).json({
        success: false,
        error: result.error,
        message: result.message,
        conflictingTerminal: result.conflictingTerminal,
      });
    }
  } catch (error) {
    console.error("Login controller error:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Internal server error",
    });
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    const sessionToken = req.cookies.session_token;

    if (sessionToken) {
      await authService.logoutUser(sessionToken);
    }

    res.clearCookie("session_token");

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout controller error:", error);
    return res.status(500).json({
      success: false,
      error: "LOGOUT_ERROR",
      message: "Error during logout",
    });
  }
};

/**
 * GET /api/auth/validate
 */
const validateSession = async (req, res) => {
  try {
    const sessionToken = req.cookies.session_token;

    if (!sessionToken) {
      return res.status(401).json({
        valid: false,
        error: "NO_SESSION",
        message: "No session token found",
      });
    }

    const validation = await authService.validateSession(sessionToken);

    if (validation.valid) {
      return res.status(200).json({
        valid: true,
        user: validation.user,
      });
    } else {
      res.clearCookie("session_token");

      return res.status(401).json({
        valid: false,
        error: validation.error,
        message: "Session invalid",
      });
    }
  } catch (error) {
    console.error("Session validation error:", error);
    return res.status(500).json({
      valid: false,
      error: "VALIDATION_ERROR",
      message: "Error validating session",
    });
  }
};

/**
 * POST /api/auth/heartbeat
 */
const heartbeat = async (req, res) => {
  try {
    const sessionToken = req.cookies.session_token;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: "NO_SESSION",
      });
    }

    await authService.updateLastActivity(sessionToken);

    return res.status(200).json({
      success: true,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return res.status(500).json({
      success: false,
      error: "HEARTBEAT_ERROR",
    });
  }
};

module.exports = {
  login,
  logout,
  validateSession,
  heartbeat,
};
