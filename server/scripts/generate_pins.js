const bcrypt = require("bcrypt");

const generatePinHash = async (pin) => {
  return await bcrypt.hash(pin, 10);
};

// Generate hashes for your test PINs
const createTestHashes = async () => {
  const adminPin = await generatePinHash("1234");
  const cashierPin = await generatePinHash("5678");

  console.log("Admin PIN hash:", adminPin);
  console.log("Cashier PIN hash:", cashierPin);
};

createTestHashes();
