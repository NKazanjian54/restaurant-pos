const db = require("../config/database");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const findUserByEmployeeID = async (employeeID) => {
  try {
    const user = await db("users")
      .where("employee_id", employeeID)
      .where("is_active", true)
      .first();

    return user;
  } catch (error) {
    console.error("Database error in findUserByEmployeeID:", error);
    throw new Error("Database error during user lookup.");
  }
};

const checkUserLockout = async (user) => {
  if (!user.locked_until) {
    return { isLocked: false };
  }

  const now = new Date();
  const lockoutExpiry = new Date(user.locked_until);
  if (now > lockoutExpiry) {
    await clearUserLockout(user.employee_id);
    return { isLocked: false };
  }

  const remainingTime = Math.ceil((lockoutExpiry - now) / 1000 / 60);
  return {
    isLocked: true,
    remainingTime: remainingTime,
  };
};

const clearUserLockout = async (employeeID) => {
  await db("users").where("employee_id", employeeID).update({
    locked_until: null,
    failed_login_attempts: 0,
  });
};

const validatePIN = async (user, inputPin) => {
  try {
    const isValidPIN = await bcrypt.compare(inputPin, user.pin_hash);

    if (isValidPIN) {
      await resetFailedAttempts(user.employee_id);
      return { isValid: true };
    } else {
      await handleFailedAttempts(user);
      return { isValid: false };
    }
  } catch (error) {
    console.error("Error validating PIN:", error);
    throw new Error("Error validating PIN.");
  }
};

const resetFailedAttempts = async (employeeId) => {
  await db("users")
    .where("employee_id", employeeId)
    .update({ failed_login_attempts: 0 });
};

const handleFailedAttempts = async (user) => {
  const newAttemptCount = user.failed_login_attempts + 1;

  if (newAttemptCount >= 4 && user.role !== "admin") {
    const lockUntil = new Date(Date.now() + 15 * 60 * 1000);

    await db("users").where("employee_id", user.employee_id).update({
      failed_login_attempts: newAttemptCount,
      locked_until: lockUntil,
    });
  } else {
    await db("users")
      .where("employee_id", user.employee_id)
      .update({ failed_login_attempts: newAttemptCount });
  }
};

const checkSessionConflict = async (user, requestedTerminal) => {
  if (!user.current_session_token || !user.logged_in_terminal) {
    return { canLogin: true };
  }

  if (user.logged_in_terminal === requestedTerminal) {
    return { canLogin: true, sessionRefresh: true };
  }

  const isSessionAlive = await checkSessionAlive(user.current_session_token);

  if (!isSessionAlive) {
    await clearUserSession(user.employee_id);
    return { canLogin: true };
  }

  return {
    canLogin: false,
    conflictingTerminal: user.logged_in_terminal,
  };
};

const checkSessionAlive = async (sessionToken) => {
  try {
    const user = await db("users")
      .where("current_session_token", sessionToken)
      .first();

    if (!user || !user.last_activity) {
      return false;
    }

    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
    const lastActivity = new Date(user.last_activity);

    return lastActivity > sixMinutesAgo;
  } catch (error) {
    console.error("Error checking session alive:", error);
    return false;
  }
};

const clearUserSession = async (employeeID) => {
  await db("users").where("employee_id", employeeID).update({
    current_session_token: null,
    logged_in_terminal: null,
    last_activity: null,
  });
};

const generateSessionToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const createUserSession = async (user, terminal) => {
  const sessionToken = generateSessionToken();
  const now = new Date();

  await db("users").where("employee_id", user.employee_id).update({
    current_session_token: sessionToken,
    logged_in_terminal: terminal,
    last_activity: now,
  });

  return {
    token: sessionToken,
    user: {
      employeeId: user.employee_id,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    },
    terminal: terminal,
    loginTime: now,
  };
};

const authenticateUser = async (employeeID, pin, requestedTerminal) => {
  try {
    const user = await findUserByEmployeeID(employeeID);
    if (!user) {
      return {
        success: false,
        error: "EMPLOYEE_NOT_FOUND",
        message: "Employee not found",
      };
    }

    const lockStatus = await checkUserLockout(user);
    if (lockStatus.isLocked) {
      return {
        success: false,
        error: "ACCOUNT_LOCKED",
        message: `Account locked for ${lockStatus.remainingTime} more minutes`,
      };
    }

    const pinValidation = await validatePIN(user, pin);
    if (!pinValidation.isValid) {
      return {
        success: false,
        error: "INVALID_PIN",
        message: "Invalid PIN",
      };
    }

    const sessionCheck = await checkSessionConflict(user, requestedTerminal);
    if (!sessionCheck.canLogin) {
      return {
        success: false,
        error: "ALREADY_LOGGED_IN",
        message: `Already logged into ${sessionCheck.conflictingTerminal}`,
        conflictingTerminal: sessionCheck.conflictingTerminal,
      };
    }

    const sessionData = await createUserSession(user, requestedTerminal);

    return {
      success: true,
      ...sessionData,
      message: "Login successful",
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      error: "AUTHENTICATION_ERROR",
      message: "Login system error",
    };
  }
};

const updateLastActivity = async (sessionToken) => {
  try {
    await db("users")
      .where("current_session_token", sessionToken)
      .update({ last_activity: new Date() });
  } catch (error) {
    console.error("Error updating last activity:", error);
  }
};

const validateSession = async (sessionToken) => {
  try {
    const user = await db("users")
      .where("current_session_token", sessionToken)
      .where("is_active", true)
      .first();

    if (!user) {
      return { valid: false, error: "SESSION_NOT_FOUND" };
    }

    const isAlive = await checkSessionAlive(sessionToken);
    if (!isAlive) {
      await clearUserSession(user.employee_id);
      return { valid: false, error: "SESSION_EXPIRED" };
    }

    await updateLastActivity(sessionToken);

    return {
      valid: true,
      user: {
        employeeId: user.employee_id,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        terminal: user.logged_in_terminal,
      },
    };
  } catch (error) {
    console.error("Session validation error:", error);
    return { valid: false, error: "VALIDATION_ERROR" };
  }
};

const logoutUser = async (sessionToken) => {
  try {
    const user = await db("users")
      .where("current_session_token", sessionToken)
      .first();
    if (user) {
      await clearUserSession(user.employee_id);
    }
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: "LOGOUT_ERROR" };
  }
};

module.exports = {
  authenticateUser,
  validateSession,
  updateLastActivity,
  logoutUser,
  clearUserSession,
};
