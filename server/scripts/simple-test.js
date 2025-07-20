const { Client } = require("pg");

async function testBasicConnection() {
  console.log("🧪 Testing multiple connection methods...\n");

  // Test 1: Session Pooler (from your screenshot)
  console.log("Test 1: Session Pooler Connection");
  const poolerClient = new Client({
    host: "aws-0-us-east-2.pooler.supabase.com",
    port: 5432,
    user: "postgres.zroyslglclzgexunbbie",
    password: "#BakedPotatoes54",
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });

  try {
    await poolerClient.connect();
    console.log("✅ Session pooler connection successful!");

    const result = await poolerClient.query("SELECT NOW(), version()");
    console.log("Time:", result.rows[0].now);
    console.log("Version:", result.rows[0].version);

    const tables = await poolerClient.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log(
      "Tables:",
      tables.rows.map((r) => r.table_name)
    );

    const users = await poolerClient.query(
      "SELECT employee_id, username, role FROM users"
    );
    console.log("Users:", users.rows);

    await poolerClient.end();
    return; // Success, exit
  } catch (error) {
    console.error("❌ Session pooler failed:", error.message);
  }

  // Test 2: Session Pooler with Connection String
  console.log("\nTest 2: Session Pooler Connection String");
  const poolerStringClient = new Client({
    connectionString:
      "postgresql://postgres.zroyslglclzgexunbbie:%23BakedPotatoes54@aws-0-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require",
  });

  try {
    await poolerStringClient.connect();
    console.log("✅ Session pooler string connection successful!");

    const result = await poolerStringClient.query("SELECT NOW()");
    console.log("Time:", result.rows[0].now);

    await poolerStringClient.end();
    return; // Success, exit
  } catch (error) {
    console.error("❌ Session pooler string failed:", error.message);
  }

  // Test 3: Check current Supabase connection details
  console.log("\n❌ All connections failed. Please check:");
  console.log("1. Is your Supabase project still active?");
  console.log("2. Have the connection details changed?");
  console.log("3. Is your internet connection working?");
}

testBasicConnection();
