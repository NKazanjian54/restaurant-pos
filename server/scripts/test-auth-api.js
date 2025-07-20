const fetch = require("node-fetch");

const testAuth = async () => {
  try {
    console.log("🧪 Testing authentication API...");

    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId: "1234567", // Admin from database
        pin: "1234", // Need to set up PIN hash
        registerId: "REG01",
      }),
    });

    const result = await response.json();
    console.log("Login test result:", result);
  } catch (error) {
    console.error("Auth test failed:", error.message);
  }
};

testAuth();
